import type Stripe from 'stripe'
import { getDb, queryOne } from '@/lib/db/client'
import { upsertCustomer } from '@/lib/customers'
import { grantEntitlement } from '@/lib/entitlements'
import { LIAP_BOOK, LIAP_ENTITLEMENT } from './product'

// ---------------------------------------------------------------------------
// What a completed preorder actually does. §8.
//
// The required flow is Stripe → order → order item → entitlement grant →
// assessment authorization, and it is written out longhand here rather than
// collapsed into a single grant, because the order record is what makes a
// refund, a dispute or a "what did I actually buy" question answerable later.
//
// Kept out of the webhook route so that the retailer-verification path can
// grant the same entitlement through a different door without duplicating the
// logic — and so both doors are tested by the same tests.
// ---------------------------------------------------------------------------

export interface PreorderInput {
  email: string
  name?: string | null
  stripeCustomerId?: string | null
  /** Checkout session or payment intent id — whatever a refund will reference. */
  sourceId: string
  /** Stripe event id, so a replayed webhook cannot grant twice. */
  idempotencyKey: string
  amount?: number | null
}

export interface PreorderResult {
  customerId: string
  orderId: string | null
  entitlementCreated: boolean
}

async function liapProductId(): Promise<string | null> {
  const row = await queryOne<{ id: string }>(`SELECT id FROM products WHERE product_key = $1`, [
    LIAP_BOOK.productKey,
  ])
  return row?.id ?? null
}

/**
 * Records the preorder and grants the assessment.
 *
 * Idempotent at two levels, deliberately. The order is keyed on the Stripe
 * checkout session so a replay updates rather than duplicates; the entitlement
 * is keyed on the event id so a replay grants nothing. Either alone would
 * cover the common case — together they also cover a grant arriving from a
 * different event, which is the one that produces a duplicate nobody notices.
 */
export async function fulfilPreorder(input: PreorderInput): Promise<PreorderResult> {
  const db = getDb()
  const customer = await upsertCustomer({
    email: input.email,
    name: input.name ?? null,
    stripeCustomerId: input.stripeCustomerId ?? null,
  })

  let orderId: string | null = null
  const productId = await liapProductId()

  if (productId) {
    const orders = await db.query<{ id: string }>(
      // The WHERE clause is required, not decorative: orders_checkout_session_key
      // is a PARTIAL index (…WHERE stripe_checkout_session_id IS NOT NULL), and
      // Postgres cannot infer a partial index from the column list alone. Without
      // it this raises "no unique or exclusion constraint matching the ON CONFLICT
      // specification" — at which point a paying customer's webhook throws.
      `INSERT INTO orders (customer_id, stripe_checkout_session_id, status, amount, currency)
       VALUES ($1, $2, 'paid', $3, $4)
       ON CONFLICT (stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL
       DO UPDATE SET status = 'paid'
       RETURNING id`,
      [customer.id, input.sourceId, input.amount ?? LIAP_BOOK.amount, LIAP_BOOK.currency]
    )
    orderId = orders[0]?.id ?? null

    if (orderId) {
      // No unique constraint on order_items, so re-running the same order must
      // not stack rows. Checked rather than blindly inserted.
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM order_items WHERE order_id = $1 AND product_id = $2`,
        [orderId, productId]
      )
      if (!existing) {
        await db.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_amount)
           VALUES ($1, $2, 1, $3)`,
          [orderId, productId, input.amount ?? LIAP_BOOK.amount]
        )
      }
    }
  } else {
    // The product row is seeded by migration 0004. If it is missing the
    // customer has still paid, so the entitlement is granted anyway and the
    // gap is logged — refusing access to someone who paid because a seed row
    // is absent would be the wrong failure.
    console.error(
      `[liap/fulfilment] product ${LIAP_BOOK.productKey} is not seeded; granting entitlement without an order record`
    )
  }

  const grant = await grantEntitlement({
    customerId: customer.id,
    entitlementKey: LIAP_ENTITLEMENT,
    sourceType: 'order',
    sourceId: input.sourceId,
    idempotencyKey: input.idempotencyKey,
  })

  return { customerId: customer.id, orderId, entitlementCreated: grant.created }
}

/** True when a Stripe object carries this product's marker. */
export function isLiapPreorder(metadata: Stripe.Metadata | null | undefined): boolean {
  return metadata?.product === LIAP_BOOK.metadataKey
}

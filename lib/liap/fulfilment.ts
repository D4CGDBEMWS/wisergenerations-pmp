import type Stripe from 'stripe'
import { getDb, queryOne } from '@/lib/db/client'
import { upsertCustomer } from '@/lib/customers'
import { recordAuditEvent } from '@/lib/audit'
import { LIAP_BOOK } from './product'

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
  /** Checkout session id. This is what the entitlement records as its source. */
  sourceId: string
  /**
   * The payment intent behind the session, when Stripe supplies one.
   *
   * Recorded so a refund can find its way back. A refund event carries the
   * payment intent, the entitlement records the checkout session, and before
   * this the two never met — so `charge.refunded` revoked nothing and a
   * refunded reader kept the assessment. This column is the join.
   */
  paymentIntentId?: string | null
  /** Stripe event id, so a replayed webhook cannot grant twice. */
  idempotencyKey: string
  amount?: number | null
}

export interface PreorderResult {
  customerId: string
  orderId: string | null
  /**
   * Always false since the 4 September 2026 owner decision.
   *
   * Kept on the result rather than deleted because the webhook and the tests
   * both assert on it, and a field that is always false is a louder statement
   * than a field that disappeared: paying records a purchase and grants no
   * assessment.
   */
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
      `INSERT INTO orders
         (customer_id, stripe_checkout_session_id, stripe_payment_intent_id, status, amount, currency)
       VALUES ($1, $2, $3, 'paid', $4, $5)
       ON CONFLICT (stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL
       DO UPDATE SET status = 'paid',
                     stripe_payment_intent_id =
                       COALESCE(EXCLUDED.stripe_payment_intent_id, orders.stripe_payment_intent_id)
       RETURNING id`,
      [
        customer.id,
        input.sourceId,
        input.paymentIntentId ?? null,
        input.amount ?? LIAP_BOOK.amount,
        LIAP_BOOK.currency,
      ]
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

  // ── AND IT STOPS HERE ────────────────────────────────────────────────────
  //
  // Owner decision, 4 September 2026 (D1): the automatic entitlement granted
  // from a purchaser's checkout email is retired for coded books. The unique
  // code printed inside the copy is now the normal source of activation,
  // whoever bought it and however it was bought.
  //
  // The arithmetic is the whole argument. Every printed copy carries one code.
  // If paying ALSO granted access, one book would produce two registrations —
  // the buyer's automatic one, and whoever later found the untouched card. So
  // payment records a purchase and nothing more, and the card in the book is
  // the single thing that opens an assessment.
  //
  // That also makes the gift rule true by construction rather than by a flag
  // somebody has to remember to tick: a buyer holds no entitlement to give
  // away, so the recipient's code is always theirs to register.
  //
  // Everything a refund, a dispute or a support question needs still exists —
  // the customer, the order, the line item. What is not created is access.
  await recordAuditEvent({
    eventType: 'liap.purchase_awaiting_code_registration',
    customerId: customer.id,
    metadata: { source_type: 'order', product_key: LIAP_BOOK.productKey },
  })

  return { customerId: customer.id, orderId, entitlementCreated: false }
}

/** True when a Stripe object carries this product's marker. */
export function isLiapPreorder(metadata: Stripe.Metadata | null | undefined): boolean {
  return metadata?.product === LIAP_BOOK.metadataKey
}

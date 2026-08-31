import type Stripe from 'stripe'
import { getDb, queryOne } from '@/lib/db/client'
import { upsertCustomer } from '@/lib/customers'
import { grantEntitlement } from '@/lib/entitlements'
import { LIAP_ASSESSMENT, LIAP_BOOK, LIAP_ENTITLEMENT } from './product'
import { tagLiapContact } from './crm'

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
  /**
   * Structured name, when the capture point collected one.
   *
   * Stripe gives a single `name` string, so the book checkout still supplies
   * `name` and these are absent. They exist for the LIAP capture points that
   * ask for first and last separately, so the CRM merge fields get what the
   * customer actually typed rather than a guess made by splitting on a space.
   */
  firstName?: string | null
  lastName?: string | null
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

  const grant = await grantEntitlement({
    customerId: customer.id,
    entitlementKey: LIAP_ENTITLEMENT,
    sourceType: 'order',
    sourceId: input.sourceId,
    idempotencyKey: input.idempotencyKey,
  })

  // ── CRM, AND ONLY AFTER THE GRANT ────────────────────────────────────────
  //
  // This is the authoritative seam: it is reached only when Stripe reported a
  // paid session AND the entitlement was written. Nothing upstream of this —
  // an interest form, a click, a self-reported preorder — can arrive here, so
  // nothing upstream can produce a purchaser tag.
  //
  // Deliberately last, and deliberately unable to throw: `tagLiapContact`
  // returns a result and records a replayable `crm.sync_failed` row rather
  // than raising, so a Mailchimp outage cannot roll back an order, withhold an
  // entitlement, or make the webhook return non-2xx and have Stripe retry a
  // fulfilment that already succeeded.
  //
  // It grants no marketing consent: the contact is created `pending`, and no
  // `marketing` row is written. Buying a book is not asking to be emailed.
  await syncPurchaserTags(customer.id, input)

  return { customerId: customer.id, orderId, entitlementCreated: grant.created }
}

/** Book Purchaser + Assessment Access, pushed to the CRM. Never throws. */
async function syncPurchaserTags(customerId: string, input: PreorderInput): Promise<void> {
  const names = structuredName(input)
  await tagLiapContact(
    input.email,
    ['liap_book_preorder', 'liap_assessment_entitled'],
    { customerId, ...names }
  ).catch((err) => {
    // Belt and braces. tagLiapContact already swallows its own failures; this
    // exists so that a future change there can never reach a paying customer.
    console.error('[liap/fulfilment] CRM sync threw despite its own guard:', err)
  })
}

/**
 * First and last name, preferring what the customer typed.
 *
 * Falls back to splitting Stripe's single `name` string only when no
 * structured name was captured, because that is all Stripe supplies. The
 * split is a fallback, never the design: "Maria de la Cruz" becomes
 * FNAME="Maria" / LNAME="de la Cruz", which is acceptable for a merge field
 * and is exactly why the capture points now ask for the two separately.
 */
function structuredName(input: {
  firstName?: string | null
  lastName?: string | null
  name?: string | null
}): { firstName?: string; lastName?: string } {
  if (input.firstName?.trim() || input.lastName?.trim()) {
    return {
      firstName: input.firstName?.trim() || '',
      lastName: input.lastName?.trim() || '',
    }
  }
  const full = (input.name ?? '').trim()
  if (!full) return {}
  const space = full.indexOf(' ')
  return space === -1
    ? { firstName: full, lastName: '' }
    : { firstName: full.slice(0, space), lastName: full.slice(space + 1) }
}

/**
 * A standalone assessment purchase. $29, no book.
 *
 * Grants the SAME entitlement the book grants, because it is the same
 * assessment — but records its own order against its own product, so "what
 * did this person actually buy" stays answerable, and tags only Assessment
 * Access. A standalone buyer is not a Book Purchaser and must never be
 * segmented as one.
 */
export async function fulfilStandaloneAssessment(input: PreorderInput): Promise<PreorderResult> {
  const db = getDb()
  const customer = await upsertCustomer({
    email: input.email,
    name: input.name ?? null,
    stripeCustomerId: input.stripeCustomerId ?? null,
  })

  let orderId: string | null = null
  const productId = await queryOne<{ id: string }>(
    `SELECT id FROM products WHERE product_key = $1`,
    [LIAP_ASSESSMENT.productKey]
  )

  if (productId) {
    const orders = await db.query<{ id: string }>(
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
        input.amount ?? LIAP_ASSESSMENT.amount,
        LIAP_ASSESSMENT.currency,
      ]
    )
    orderId = orders[0]?.id ?? null

    if (orderId) {
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM order_items WHERE order_id = $1 AND product_id = $2`,
        [orderId, productId.id]
      )
      if (!existing) {
        await db.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_amount)
           VALUES ($1, $2, 1, $3)`,
          [orderId, productId.id, input.amount ?? LIAP_ASSESSMENT.amount]
        )
      }
    }
  } else {
    // Same reasoning as the book: the customer has paid, so access is granted
    // and the missing seed row is logged rather than costing them the product.
    console.error(
      `[liap/fulfilment] product ${LIAP_ASSESSMENT.productKey} is not seeded; granting entitlement without an order record`
    )
  }

  const grant = await grantEntitlement({
    customerId: customer.id,
    entitlementKey: LIAP_ENTITLEMENT,
    sourceType: 'order',
    sourceId: input.sourceId,
    idempotencyKey: input.idempotencyKey,
  })

  // Assessment Access only. No book tag: they did not buy the book.
  await tagLiapContact(input.email, ['liap_assessment_entitled'], {
    customerId: customer.id,
    ...structuredName(input),
  }).catch((err) => {
    console.error('[liap/fulfilment] CRM sync threw despite its own guard:', err)
  })

  return { customerId: customer.id, orderId, entitlementCreated: grant.created }
}

/** True when a Stripe object carries this product's marker. */
export function isLiapPreorder(metadata: Stripe.Metadata | null | undefined): boolean {
  return metadata?.product === LIAP_BOOK.metadataKey
}

/** True when a Stripe object carries the standalone assessment's marker. */
export function isLiapStandaloneAssessment(
  metadata: Stripe.Metadata | null | undefined
): boolean {
  return metadata?.product === LIAP_ASSESSMENT.metadataKey
}

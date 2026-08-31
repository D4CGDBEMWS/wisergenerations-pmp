import { cookies } from 'next/headers'
import { SESSION_COOKIE, validateSession, type SessionCustomer } from '@/lib/auth/session'
import { hasEntitlement } from '@/lib/entitlements'
import { queryOne } from '@/lib/db/client'

// ---------------------------------------------------------------------------
// Living Is a Project access.
//
// Its own key, its own module, deliberately. §8 of the Phase I brief: do not
// reuse PMP product ids, membership permissions or business logic merely
// because they already exist. Study Access and the assessment answer different
// questions and will diverge — one is a monthly subscription that lapses, the
// other is a bonus attached to a one-time purchase that does not.
//
// What IS shared is the infrastructure: the same session validation, the same
// entitlement table, the same audit trail. Sharing plumbing is not coupling.
// ---------------------------------------------------------------------------

/** Granted by preordering the book, however the preorder was made. */
export const LIAP_ASSESSMENT_ACCESS = 'LIAP_ASSESSMENT_ACCESS'

export const LIAP_BOOK_PREORDER = 'LIAP_BOOK_PREORDER'

export interface LiapAccess {
  session: SessionCustomer
  entitled: boolean
}

/**
 * Reads the caller's LIAP standing without deciding what to do about it.
 *
 * Route handlers and pages differ in how they should respond — a page
 * redirects, an API returns a status — so this reports and lets the caller
 * choose. What it does NOT do is let a component ask "did they pay?": the
 * question is always "are they entitled?", which is the whole point of
 * keeping payment and access separate.
 */
/**
 * Whether the purchase behind a Stripe checkout session has been fulfilled.
 *
 * ── THE SESSION ID IS A LOOKUP KEY, NOT A CLAIM ────────────────────────────
 *
 * A checkout session id arrives on the URL after Stripe redirects. Anyone can
 * type one, and it proves nothing on its own — so nothing here believes it.
 * What it does is name a row: the `orders` record that the WEBHOOK wrote,
 * after Stripe reported the session paid, in the same transaction that granted
 * the entitlement.
 *
 * So the answer comes from the order and the entitlement, both written
 * server-side by verified fulfilment. An id with no paid order behind it
 * returns false, and an id somebody invented returns false. Nothing is
 * granted, created or inferred here — this function only reads.
 *
 * It exists because the standalone purchaser may have no session cookie at
 * all: they bought without signing in, so `readLiapAccess` has nobody to ask.
 */
export async function fulfilledForCheckoutSession(
  checkoutSessionId: string
): Promise<boolean> {
  if (!checkoutSessionId) return false
  const row = await queryOne<{ customer_id: string }>(
    `SELECT customer_id FROM orders
      WHERE stripe_checkout_session_id = $1 AND status = 'paid'`,
    [checkoutSessionId]
  )
  if (!row) return false
  return hasEntitlement(row.customer_id, LIAP_ASSESSMENT_ACCESS)
}

export async function readLiapAccess(): Promise<LiapAccess | null> {
  const store = await cookies()
  const session = await validateSession(store.get(SESSION_COOKIE)?.value)
  if (!session) return null

  return {
    session,
    entitled: await hasEntitlement(session.customerId, LIAP_ASSESSMENT_ACCESS),
  }
}

import { cookies } from 'next/headers'
import { SESSION_COOKIE, validateSession, type SessionCustomer } from '@/lib/auth/session'
import { hasEntitlement } from '@/lib/entitlements'

// ---------------------------------------------------------------------------
// Living Is a Project...Are You Ready?™ access.
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
export async function readLiapAccess(): Promise<LiapAccess | null> {
  const store = await cookies()
  const session = await validateSession(store.get(SESSION_COOKIE)?.value)
  if (!session) return null

  return {
    session,
    entitled: await hasEntitlement(session.customerId, LIAP_ASSESSMENT_ACCESS),
  }
}

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, validateSession, type SessionCustomer } from '@/lib/auth/session'
import { hasEntitlement } from '@/lib/entitlements'

// ---------------------------------------------------------------------------
// guard — the server-side authorization boundary for paid routes.
//
// middleware.ts still redirects visitors with no session cookie, but that is a
// UX affordance, not the security control: it cannot see the database and it
// cannot tell a real session from a forged one. THIS module is the control.
// Every protected route renders behind requireEntitlement().
// ---------------------------------------------------------------------------

export async function getCurrentSession(): Promise<SessionCustomer | null> {
  const store = await cookies()
  return validateSession(store.get(SESSION_COOKIE)?.value)
}

/**
 * Renders the route only for a customer with a live session AND a live
 * entitlement. Anything else redirects to /access.
 *
 * The two failures are deliberately indistinguishable to the visitor — a
 * signed-out customer and a signed-in customer without the entitlement both
 * land on /access. Leaking "your session is fine, you just haven't paid" tells
 * a prober which half to attack.
 */
export async function requireEntitlement(entitlementKey: string): Promise<SessionCustomer> {
  const session = await getCurrentSession()
  if (!session) redirect('/access')

  const entitled = await hasEntitlement(session.customerId, entitlementKey)
  if (!entitled) redirect('/access')

  return session
}

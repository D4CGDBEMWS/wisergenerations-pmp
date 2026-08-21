import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { NextResponse } from 'next/server'
import { isEnabled } from '@/lib/flags'
import {
  STAFF_SESSION_COOKIE,
  validateStaffSession,
  type StaffSession,
} from '@/lib/staff/session'
import { roleCan, type Permission } from '@/lib/staff/roles'

// ---------------------------------------------------------------------------
// The admin authorization boundary.
//
// Every admin page and every admin route goes through here. Nothing reads the
// staff cookie directly, and nothing checks a role by comparing strings.
//
// ── WHY EVERYTHING IS A 404 ────────────────────────────────────────────────
//
// A signed-out visitor, a customer who found the URL, a staff member without
// the permission, and a suspended account all get the same answer: this page
// does not exist. Same pattern as the rest of the site, for the same reason —
// a 403 confirms that an admin area is there and that the prober has found
// the right address. Nothing about the admin surface should be discoverable
// by trying URLs.
//
// The one exception is the sign-in flow itself, which has to exist to be
// usable, and which reveals nothing beyond "this business has staff".
// ---------------------------------------------------------------------------

/** The current staff session, or null. Never redirects, never throws. */
export async function readStaffSession(): Promise<StaffSession | null> {
  if (!isEnabled('LIAP_ADMIN')) return null
  const store = await cookies()
  return validateStaffSession(store.get(STAFF_SESSION_COOKIE)?.value)
}

/**
 * For pages. Renders only for a staff member holding the permission.
 *
 * Everything else is a 404 — including a valid staff session whose role does
 * not carry the permission, because "you are staff but not allowed here" is
 * still a fact worth not confirming to whoever is holding that cookie.
 */
export async function requireStaff(permission: Permission): Promise<StaffSession> {
  const session = await readStaffSession()
  if (!session) notFound()
  if (!roleCan(session.role, permission)) notFound()
  return session
}

/**
 * For API routes. Returns the session, or the response to send instead.
 *
 * Routes destructure this rather than catching a redirect, because an API
 * that redirects on an authorization failure produces a 200 with a login page
 * in it — which a fetch() will happily treat as success.
 */
export async function requireStaffApi(
  permission: Permission
): Promise<{ session: StaffSession; denied: null } | { session: null; denied: NextResponse }> {
  const session = await readStaffSession()

  if (!session || !roleCan(session.role, permission)) {
    return {
      session: null,
      denied: NextResponse.json({ error: 'Not found.' }, { status: 404 }),
    }
  }
  return { session, denied: null }
}

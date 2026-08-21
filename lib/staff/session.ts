import { getDb, queryOne } from '@/lib/db/client'
import { generateToken, hashToken, hashIdentifier } from '@/lib/auth/crypto'

// ---------------------------------------------------------------------------
// Staff sessions.
//
// Structurally the same as customer sessions — an opaque random token, hashed
// at rest, validated by database lookup — and deliberately NOT the same code
// path. Four differences, each with a reason:
//
//   Its own cookie name.  A browser holding a customer session must fail the
//                         staff check rather than be examined for it. There is
//                         no code anywhere that upgrades one into the other.
//
//   Its own table.        A bug in customer session handling must not be
//                         reachable from the admin surface.
//
//   Eight hours, no renewal on use. A customer session renewing quietly for a
//                         month is a convenience. An admin session doing the
//                         same on a laptop in a coffee shop is a liability, so
//                         staff sign in again at the start of the day.
//
//   Two factors.          A session exists between the magic link being
//                         consumed and the authenticator code being accepted,
//                         and during that window it authorises NOTHING.
//
// That last one is the load-bearing property of this file. `second_factor_at`
// is checked by validateStaffSession, not by the caller, so a route cannot
// forget to ask.
// ---------------------------------------------------------------------------

export const STAFF_SESSION_COOKIE = 'wg_staff'

const SESSION_TTL_HOURS = 8
export const STAFF_SESSION_MAX_AGE_SECONDS = SESSION_TTL_HOURS * 60 * 60

/** The first factor is good for ten minutes: staff are at the screen. */
const LOGIN_TOKEN_TTL_MINUTES = 10

export type StaffRole = 'owner' | 'event_staff' | 'read_only'

export interface StaffSession {
  staffUserId: string
  email: string
  name: string | null
  role: StaffRole
  sessionId: string
}

export function staffCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // 'lax' because the magic link arrives as a top-level navigation from an
    // email client, and 'strict' would drop the cookie on that first arrival.
    sameSite: 'lax' as const,
    // Scoped to the admin area, so the cookie is not attached to any
    // customer-facing request at all.
    path: '/admin',
    maxAge: maxAgeSeconds,
  }
}

// ---------------------------------------------------------------------------
// First factor
// ---------------------------------------------------------------------------

/**
 * Issues a single-use sign-in token for a staff member.
 *
 * Returns null for an unknown or suspended account — and the caller must
 * respond identically either way, so that requesting a link cannot be used to
 * discover who has staff access.
 */
export async function issueStaffLoginToken(email: string): Promise<{
  token: string
  staffUserId: string
  email: string
} | null> {
  const staff = await queryOne<{ id: string; email: string }>(
    `SELECT id, email FROM staff_users
      WHERE lower(email) = lower($1) AND status <> 'suspended'`,
    [email.trim()]
  )
  if (!staff) return null

  const token = generateToken()
  await getDb().query(
    `INSERT INTO staff_login_tokens (staff_user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3 || ' minutes')::interval)`,
    [staff.id, hashToken(token), String(LOGIN_TOKEN_TTL_MINUTES)]
  )

  return { token, staffUserId: staff.id, email: staff.email }
}

/**
 * Consumes a sign-in token and opens a session that is not yet usable.
 *
 * The returned session carries the first factor only. Every guard refuses it
 * until the authenticator code is accepted, so a stolen mailbox on its own
 * buys an attacker a session that can do nothing.
 *
 * The UPDATE ... WHERE consumed_at IS NULL is the single-use guarantee, and it
 * is atomic: two simultaneous redemptions of the same link cannot both win.
 */
export async function consumeStaffLoginToken(
  token: string | undefined,
  context: { userAgent?: string | null; ip?: string | null } = {}
): Promise<{ token: string; staffUserId: string; needsEnrolment: boolean } | null> {
  if (!token) return null

  const claimed = await queryOne<{ staff_user_id: string }>(
    `UPDATE staff_login_tokens
        SET consumed_at = now()
      WHERE token_hash = $1
        AND consumed_at IS NULL
        AND expires_at > now()
      RETURNING staff_user_id`,
    [hashToken(token)]
  )
  if (!claimed) return null

  const staff = await queryOne<{ id: string; status: string; totp_secret: string | null }>(
    `SELECT id, status, totp_secret FROM staff_users WHERE id = $1`,
    [claimed.staff_user_id]
  )
  // Suspended between the link being sent and clicked. Rare, and exactly the
  // case where checking once at sign-in would be wrong.
  if (!staff || staff.status === 'suspended') return null

  const sessionToken = generateToken()
  await getDb().query(
    `INSERT INTO staff_sessions (staff_user_id, token_hash, expires_at, user_agent, ip_hash)
     VALUES ($1, $2, now() + ($3 || ' seconds')::interval, $4, $5)`,
    [
      staff.id,
      hashToken(sessionToken),
      String(STAFF_SESSION_MAX_AGE_SECONDS),
      context.userAgent ?? null,
      context.ip ? hashIdentifier(context.ip) : null,
    ]
  )

  return {
    token: sessionToken,
    staffUserId: staff.id,
    // No authenticator enrolled yet: the only thing this session may do is
    // finish enrolling one.
    needsEnrolment: !staff.totp_secret,
  }
}

// ---------------------------------------------------------------------------
// Second factor
// ---------------------------------------------------------------------------

/** Marks a session as having passed both factors. */
export async function completeSecondFactor(sessionToken: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `UPDATE staff_sessions
        SET second_factor_at = now()
      WHERE token_hash = $1
        AND revoked_at IS NULL
        AND expires_at > now()
        AND second_factor_at IS NULL
      RETURNING id`,
    [hashToken(sessionToken)]
  )
  return row !== null
}

/**
 * The half-authenticated session, for the enrolment and code-entry screens
 * only.
 *
 * Named awkwardly on purpose. Anything that is not the second-factor flow
 * itself must call validateStaffSession instead, and the name should make a
 * misuse obvious in review.
 */
export async function readPendingStaffSession(token: string | undefined): Promise<{
  staffUserId: string
  email: string
  sessionId: string
  secondFactorDone: boolean
  totpSecret: string | null
  totpLastCounter: number | null
} | null> {
  if (!token) return null

  const row = await queryOne<{
    id: string
    staff_user_id: string
    email: string
    second_factor_at: string | null
    totp_secret: string | null
    totp_last_counter: string | null
  }>(
    `SELECT s.id, s.staff_user_id, u.email, s.second_factor_at,
            u.totp_secret, u.totp_last_counter
       FROM staff_sessions s
       JOIN staff_users u ON u.id = s.staff_user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND u.status <> 'suspended'`,
    [hashToken(token)]
  )
  if (!row) return null

  return {
    staffUserId: row.staff_user_id,
    email: row.email,
    sessionId: row.id,
    secondFactorDone: row.second_factor_at !== null,
    totpSecret: row.totp_secret,
    totpLastCounter: row.totp_last_counter === null ? null : Number(row.totp_last_counter),
  }
}

// ---------------------------------------------------------------------------
// The real check
// ---------------------------------------------------------------------------

/**
 * The staff session behind a cookie, or null.
 *
 * Returns null unless ALL of these hold, and the checks live here rather than
 * in callers so no route can forget one:
 *
 *   the token matches a session row
 *   the session is not revoked and not expired
 *   BOTH factors were completed
 *   the account is 'active' — not 'invited', not 'suspended'
 *
 * The status check runs on every request rather than at sign-in, so
 * suspending somebody takes effect on their next click rather than in eight
 * hours' time.
 */
export async function validateStaffSession(
  token: string | undefined
): Promise<StaffSession | null> {
  if (!token) return null

  const row = await queryOne<{
    id: string
    staff_user_id: string
    email: string
    name: string | null
    role: StaffRole
  }>(
    `SELECT s.id, s.staff_user_id, u.email, u.name, u.role
       FROM staff_sessions s
       JOIN staff_users u ON u.id = s.staff_user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND s.second_factor_at IS NOT NULL
        AND u.status = 'active'`,
    [hashToken(token)]
  )
  if (!row) return null

  await getDb().query(
    `UPDATE staff_sessions SET last_seen_at = now() WHERE id = $1`,
    [row.id]
  )

  return {
    staffUserId: row.staff_user_id,
    email: row.email,
    name: row.name,
    role: row.role,
    sessionId: row.id,
  }
}

/** Signs a staff member out of one session. */
export async function revokeStaffSession(token: string | undefined): Promise<void> {
  if (!token) return
  await getDb().query(
    `UPDATE staff_sessions SET revoked_at = now()
      WHERE token_hash = $1 AND revoked_at IS NULL`,
    [hashToken(token)]
  )
}

/** Signs a staff member out everywhere. Used when suspending an account. */
export async function revokeAllStaffSessions(staffUserId: string): Promise<number> {
  const rows = await getDb().query<{ id: string }>(
    `UPDATE staff_sessions SET revoked_at = now()
      WHERE staff_user_id = $1 AND revoked_at IS NULL
      RETURNING id`,
    [staffUserId]
  )
  return rows.length
}

import { getDb, queryOne } from '@/lib/db/client'
import { generateToken, hashToken, hashIdentifier } from '@/lib/auth/crypto'
import { recordAuditEvent } from '@/lib/audit'

// ---------------------------------------------------------------------------
// sessions — opaque, server-validated, revocable.
//
// The cookie holds a random token and nothing else. It carries no email, no
// customer id, no claim of any kind, so there is nothing in it for a client to
// forge into a truth. Authorization is a database lookup on the token's hash.
//
// This deliberately replaces the previous scheme, where the cookie's own
// contents were the authorization decision. That is why the cookie NAME
// changes: any browser still holding the legacy `wg_study_access` cookie must
// fail the new check rather than be honoured, because legacy values are
// forgeable by construction. See MIGRATION in docs/PHASE-0.5-FOUNDATION.md —
// affected customers re-authenticate with a magic link to the address they
// purchased with, and nobody is permanently locked out.
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = 'wg_session'
export const LEGACY_COOKIE = 'wg_study_access'

const SESSION_TTL_DAYS = 30
/** Past this fraction of its life, a session renews on use. */
const RENEW_AFTER = 0.5

export interface SessionCustomer {
  customerId: string
  email: string
  sessionId: string
}

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // 'lax' rather than 'strict': the magic-link flow is a top-level
    // navigation from an email client, and 'strict' would drop the cookie on
    // that first arrival.
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}

export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60

/** Creates a session and returns the raw token — the only time it exists. */
export async function createSession(input: {
  customerId: string
  userAgent?: string | null
  ip?: string | null
}): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)

  await getDb().query(
    `INSERT INTO sessions (customer_id, token_hash, expires_at, user_agent, ip_hash)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      input.customerId,
      hashToken(token),
      expiresAt.toISOString(),
      input.userAgent?.slice(0, 300) ?? null,
      input.ip ? hashIdentifier(input.ip) : null,
    ]
  )

  return { token, expiresAt }
}

/**
 * Validates a session token.
 *
 * Returns null for absent, unknown, expired and revoked alike — the caller
 * gets no signal about which, so a probe cannot distinguish "no such session"
 * from "revoked session".
 */
export async function validateSession(token: string | undefined | null): Promise<SessionCustomer | null> {
  if (!token) return null

  const row = await queryOne<{
    id: string
    customer_id: string
    email: string
    expires_at: string
    created_at: string
  }>(
    `SELECT s.id, s.customer_id, c.email, s.expires_at, s.created_at
       FROM sessions s
       JOIN customers c ON c.id = s.customer_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
      LIMIT 1`,
    [hashToken(token)]
  )

  if (!row) return null

  // Rolling renewal, but only past the halfway point — otherwise every request
  // on a busy page writes to the sessions table for no benefit.
  const created = new Date(row.created_at).getTime()
  const expires = new Date(row.expires_at).getTime()
  if (Date.now() > created + (expires - created) * RENEW_AFTER) {
    const nextExpiry = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
    await getDb().query(
      `UPDATE sessions SET last_seen_at = now(), expires_at = $2 WHERE id = $1`,
      [row.id, nextExpiry.toISOString()]
    )
  } else {
    await getDb().query(`UPDATE sessions SET last_seen_at = now() WHERE id = $1`, [row.id])
  }

  return { customerId: row.customer_id, email: row.email, sessionId: row.id }
}

export async function revokeSession(token: string): Promise<boolean> {
  const rows = await getDb().query<{ id: string; customer_id: string }>(
    `UPDATE sessions SET revoked_at = now()
      WHERE token_hash = $1 AND revoked_at IS NULL
      RETURNING id, customer_id`,
    [hashToken(token)]
  )
  if (rows[0]) {
    await recordAuditEvent({
      eventType: 'session.revoked',
      customerId: rows[0].customer_id,
      metadata: { session_id: rows[0].id },
    })
    return true
  }
  return false
}

/** Used on refund, on password-equivalent changes, and by support. */
export async function revokeAllSessionsForCustomer(customerId: string): Promise<number> {
  const rows = await getDb().query<{ id: string }>(
    `UPDATE sessions SET revoked_at = now()
      WHERE customer_id = $1 AND revoked_at IS NULL
      RETURNING id`,
    [customerId]
  )
  if (rows.length) {
    await recordAuditEvent({
      eventType: 'session.revoked',
      customerId,
      metadata: { count: rows.length, reason: 'all_sessions_revoked' },
    })
  }
  return rows.length
}

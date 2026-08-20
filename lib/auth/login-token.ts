import { getDb, queryOne } from '@/lib/db/client'
import { generateToken, hashToken } from '@/lib/auth/crypto'
import { recordAuditEvent } from '@/lib/audit'

// ---------------------------------------------------------------------------
// login-token — magic links, replacing the in-memory Map.
//
// Why the database and not Redis: the token must be single-use, and "single
// use" is an atomic compare-and-set. Postgres gives that in one statement with
// UPDATE ... WHERE consumed_at IS NULL RETURNING, which either returns a row
// (this caller consumed it) or does not (someone else already did). Redis
// could do it with a Lua script, but the row is also the audit record — issued,
// consumed, expired — and Redis would need a second store for that anyway.
// Upstash stays where it is good: rate limiting.
//
// The open-redirect defence is structural rather than a validator:
// `redirect_to` is stored server-side against the token and never travels in
// the callback URL, so there is no attacker-controlled destination to smuggle.
// ---------------------------------------------------------------------------

const TOKEN_TTL_MINUTES = 15

/** Only these destinations may be stored. An unknown value falls back. */
const ALLOWED_REDIRECTS = new Set(['/exam-simulator', '/flashcards'])
const DEFAULT_REDIRECT = '/exam-simulator'

export function normalizeRedirect(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_REDIRECT
  return ALLOWED_REDIRECTS.has(raw) ? raw : DEFAULT_REDIRECT
}

export async function issueLoginToken(input: {
  email: string
  redirectTo?: string | null
}): Promise<{ token: string; expiresAt: Date }> {
  const email = input.email.trim().toLowerCase()
  const token = generateToken()
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000)

  await getDb().query(
    `INSERT INTO login_tokens (email, token_hash, expires_at, redirect_to)
     VALUES ($1, $2, $3, $4)`,
    [email, hashToken(token), expiresAt.toISOString(), normalizeRedirect(input.redirectTo)]
  )

  // The token itself is never logged, here or anywhere.
  await recordAuditEvent({ eventType: 'login.token_issued', metadata: { result: 'issued' } })

  return { token, expiresAt }
}

/**
 * Consumes a token, atomically.
 *
 * The UPDATE is the whole concurrency story: two simultaneous clicks on the
 * same link both run it, exactly one matches `consumed_at IS NULL`, and the
 * other gets no row. There is no read-then-write window to race.
 */
export async function consumeLoginToken(
  token: string
): Promise<{ email: string; redirectTo: string } | null> {
  if (!token) return null

  const row = await queryOne<{ email: string; redirect_to: string | null }>(
    `UPDATE login_tokens
        SET consumed_at = now()
      WHERE token_hash = $1
        AND consumed_at IS NULL
        AND expires_at > now()
      RETURNING email, redirect_to`,
    [hashToken(token)]
  )

  if (!row) return null
  return { email: row.email, redirectTo: normalizeRedirect(row.redirect_to) }
}

/** Housekeeping. Safe to run from a scheduled job later; not required for correctness. */
export async function purgeExpiredLoginTokens(): Promise<number> {
  const rows = await getDb().query<{ id: string }>(
    `DELETE FROM login_tokens
      WHERE expires_at < now() - interval '7 days'
      RETURNING id`
  )
  return rows.length
}

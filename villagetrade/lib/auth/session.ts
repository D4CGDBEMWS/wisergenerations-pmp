import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

// ---------------------------------------------------------------------------
// Session tokens.
//
// ── HASHED AT REST ─────────────────────────────────────────────────────────
//
// A session token is a bearer credential: whoever holds it is the user. So
// the database stores only its SHA-256, exactly as the sibling project does
// for sessions and magic links. A dump of the sessions table is then useless
// to an attacker, because the thing it contains cannot be presented.
//
// 256 bits from a CSPRNG. Not a UUID, not a timestamp, not anything an
// attacker can narrow by knowing when an account was created.
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = 'vt_session'
export const SESSION_TTL_DAYS = 14
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Constant-time comparison, for the one place a token is compared directly
 * rather than looked up by hash. A `===` here leaks length and prefix through
 * timing; the cost of doing it properly is nil.
 */
export function tokensMatch(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export function sessionCookieOptions(maxAgeSeconds = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    // Not readable by script, not sent cross-site, not sent over plain HTTP
    // in production. All three matter for a bearer credential.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}

export function isExpired(expiresAt: number, now = Date.now()): boolean {
  return expiresAt <= now
}

/** Half-life renewal: refresh only past the midpoint, not on every request. */
export function shouldRenew(
  issuedAt: number,
  expiresAt: number,
  now = Date.now()
): boolean {
  if (isExpired(expiresAt, now)) return false
  return now > issuedAt + (expiresAt - issuedAt) / 2
}

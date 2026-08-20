import { createHash, randomBytes } from 'crypto'

// ---------------------------------------------------------------------------
// Token generation and hashing, shared by sessions and magic links.
//
// Tokens are 256 bits of CSPRNG output. Only their SHA-256 hash is stored, so
// a database read — a backup, a log, a compromised replica — cannot be
// replayed as a login or a session.
//
// SHA-256 rather than a password hash is correct here: these are high-entropy
// random tokens, not user-chosen secrets, so there is no dictionary to slow
// an attacker down against. The lookup is also on the hot path of every
// authenticated request.
// ---------------------------------------------------------------------------

export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** One-way, salted with a server secret — used for IP addresses in audit rows. */
export function hashIdentifier(value: string): string {
  const salt = process.env.SESSION_SECRET ?? ''
  return createHash('sha256').update(salt + '|' + value).digest('hex').slice(0, 32)
}

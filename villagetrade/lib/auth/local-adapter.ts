import type { AuthAdapter, AuthResult, AuthSession } from './types'

// ---------------------------------------------------------------------------
// The local development adapter.
//
// In-memory, no network, no credential. It exists so the sign-in flow and
// every one of its refusals can be exercised before a Supabase project is
// authorised.
//
// It REFUSES to run outside development. A local adapter that silently
// accepted anybody in production would be the worst bug this codebase could
// ship, so it checks rather than trusting that nobody will wire it up.
// ---------------------------------------------------------------------------

interface PendingLink {
  readonly email: string
  readonly expiresAt: number
}

export class LocalAuthAdapter implements AuthAdapter {
  readonly name = 'local'
  private links = new Map<string, PendingLink>()
  private sessions = new Map<string, AuthSession>()
  private users = new Map<string, string>() // email -> userId

  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'LocalAuthAdapter must never run in production. Configure a real provider.'
      )
    }
  }

  async requestSignInLink(email: string): Promise<{ sent: boolean }> {
    const normalized = email.trim().toLowerCase()
    const token = `local-${Math.random().toString(36).slice(2)}`
    this.links.set(token, { email: normalized, expiresAt: Date.now() + 15 * 60_000 })
    // Always reports sent. Telling a caller whether an address is registered
    // turns sign-in into an account-enumeration oracle.
    return { sent: true }
  }

  /** Test seam: the token a real deployment would email. */
  peekLinkToken(email: string): string | null {
    const normalized = email.trim().toLowerCase()
    for (const [token, link] of this.links) {
      if (link.email === normalized) return token
    }
    return null
  }

  async verifySignInToken(token: string): Promise<AuthResult> {
    const link = this.links.get(token)
    if (!link) return { ok: false, reason: 'invalid_credentials' }
    if (link.expiresAt <= Date.now()) {
      this.links.delete(token)
      return { ok: false, reason: 'expired_link' }
    }
    // One-time use. A link that works twice is a link that works for whoever
    // finds it in a forwarded email.
    this.links.delete(token)

    let userId = this.users.get(link.email)
    if (!userId) {
      userId = crypto.randomUUID()
      this.users.set(link.email, userId)
    }
    return { ok: true, identity: { userId, email: link.email, emailVerified: true } }
  }

  async resolveSession(sessionToken: string): Promise<AuthSession | null> {
    const s = this.sessions.get(sessionToken)
    if (!s) return null
    if (s.expiresAt <= Date.now()) {
      this.sessions.delete(sessionToken)
      return null
    }
    return s
  }

  async revokeSession(sessionToken: string): Promise<void> {
    this.sessions.delete(sessionToken)
  }

  /** Test seam. */
  putSession(token: string, session: AuthSession): void {
    this.sessions.set(token, session)
  }
}

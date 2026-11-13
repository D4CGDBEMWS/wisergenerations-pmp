import type { AuthAdapter, AuthResult, AuthSession } from './types'

// ---------------------------------------------------------------------------
// The Supabase adapter.
//
// ── NOT WIRED, ON PURPOSE ──────────────────────────────────────────────────
//
// Phase 2B is authorised for local development. No Supabase project exists,
// `@supabase/supabase-js` is not installed, and creating either is a separate
// founder approval.
//
// So this file states its shape and refuses rather than pretending. Every
// method returns 'not_configured' until `configure()` is called with a real
// client. That is deliberately louder than a silent failure: a half-wired
// auth provider that returns null looks exactly like a signed-out user, and
// "everyone is signed out" is a bug people debug for a day.
//
// TO COMPLETE (after founder approval of a Supabase project):
//   npm i @supabase/supabase-js @supabase/ssr
//   then implement the four methods against the client, and delete the
//   guards. The interface does not change.
// ---------------------------------------------------------------------------

export interface SupabaseLike {
  auth: {
    signInWithOtp(args: { email: string }): Promise<{ error: unknown }>
    verifyOtp(args: { token_hash: string; type: 'magiclink' }): Promise<{
      data: { user: { id: string; email?: string; email_confirmed_at?: string | null } | null }
      error: unknown
    }>
  }
}

export class SupabaseAuthAdapter implements AuthAdapter {
  readonly name = 'supabase'
  private client: SupabaseLike | null = null

  configure(client: SupabaseLike): void {
    this.client = client
  }

  get configured(): boolean {
    return this.client !== null
  }

  async requestSignInLink(email: string): Promise<{ sent: boolean }> {
    if (!this.client) return { sent: false }
    const { error } = await this.client.auth.signInWithOtp({ email: email.trim().toLowerCase() })
    // Reports `sent` regardless of whether the address is registered, for the
    // same anti-enumeration reason as the local adapter.
    return { sent: !error }
  }

  async verifySignInToken(token: string): Promise<AuthResult> {
    if (!this.client) return { ok: false, reason: 'not_configured' }
    const { data, error } = await this.client.auth.verifyOtp({
      token_hash: token,
      type: 'magiclink',
    })
    if (error || !data.user) return { ok: false, reason: 'invalid_credentials' }
    if (!data.user.email) return { ok: false, reason: 'invalid_credentials' }
    if (!data.user.email_confirmed_at) return { ok: false, reason: 'email_not_verified' }
    return {
      ok: true,
      identity: {
        userId: data.user.id,
        email: data.user.email.toLowerCase(),
        emailVerified: true,
      },
    }
  }

  // Sessions are this application's own (see lib/auth/session.ts), stored
  // hashed in our database rather than delegated to the provider. The
  // adapter establishes IDENTITY; the session that follows is ours.
  async resolveSession(): Promise<AuthSession | null> {
    return null
  }

  async revokeSession(): Promise<void> {
    /* no-op: our sessions, our table */
  }
}

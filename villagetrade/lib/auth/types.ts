// ---------------------------------------------------------------------------
// The authentication seam.
//
// ── WHY AN INTERFACE AND NOT A DIRECT SUPABASE CALL ────────────────────────
//
// Two reasons, and neither is abstraction for its own sake.
//
// 1. Phase 2B is authorised for LOCAL development only. No Supabase project
//    exists, no credential is configured, and creating one is a separate
//    founder approval. An interface lets the whole sign-in flow — including
//    its refusals — be written and tested today against a local adapter.
//
// 2. The security-relevant logic (what a session means, when it expires, who
//    a request is acting as) belongs to this application, not to a vendor
//    SDK. Keeping it here means it is testable, reviewable, and survives a
//    change of provider.
//
// SupabaseAuthAdapter is the production implementation. It is deliberately
// thin: it moves tokens, and decides nothing.
// ---------------------------------------------------------------------------

export interface AuthIdentity {
  /** Stable id from the provider. Becomes profiles.id. */
  readonly userId: string
  readonly email: string
  readonly emailVerified: boolean
}

export interface AuthSession {
  readonly userId: string
  readonly email: string
  /** Epoch milliseconds. */
  readonly expiresAt: number
}

export type AuthResult =
  | { readonly ok: true; readonly identity: AuthIdentity }
  | { readonly ok: false; readonly reason: AuthFailure }

export type AuthFailure =
  | 'invalid_credentials'
  | 'email_not_verified'
  | 'rate_limited'
  | 'expired_link'
  | 'provider_unavailable'
  | 'not_configured'

export interface AuthAdapter {
  readonly name: string
  /** Sends a sign-in link. Never reveals whether the address is registered. */
  requestSignInLink(email: string): Promise<{ readonly sent: boolean }>
  /** Exchanges a one-time token for an identity. */
  verifySignInToken(token: string): Promise<AuthResult>
  /** Resolves a session token to an identity, or null. */
  resolveSession(sessionToken: string): Promise<AuthSession | null>
  revokeSession(sessionToken: string): Promise<void>
}

import { describe, it, expect } from 'vitest'
import {
  SESSION_COOKIE, SESSION_MAX_AGE_SECONDS,
  generateSessionToken, hashSessionToken, tokensMatch,
  sessionCookieOptions, isExpired, shouldRenew,
} from '@/lib/auth/session'
import { LocalAuthAdapter } from '@/lib/auth/local-adapter'
import { SupabaseAuthAdapter } from '@/lib/auth/supabase-adapter'

describe('session tokens are bearer credentials and are treated as such', () => {
  it('are 256 bits of CSPRNG output, never reused', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 500; i++) {
      const t = generateSessionToken()
      expect(Buffer.from(t, 'base64url')).toHaveLength(32)
      expect(seen.has(t), 'token repeated').toBe(false)
      seen.add(t)
    }
  })

  it('are stored only as a hash', () => {
    const t = generateSessionToken()
    const h = hashSessionToken(t)
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(h).not.toBe(t)
    expect(hashSessionToken(t)).toBe(h)
  })

  it('compare in constant time, and reject a length mismatch', () => {
    const a = generateSessionToken()
    expect(tokensMatch(a, a)).toBe(true)
    expect(tokensMatch(a, generateSessionToken())).toBe(false)
    expect(tokensMatch(a, a.slice(0, -1))).toBe(false)
  })
})

describe('the session cookie', () => {
  it('is httpOnly, lax and path-scoped', () => {
    const o = sessionCookieOptions()
    expect(o.httpOnly).toBe(true)
    expect(o.sameSite).toBe('lax')
    expect(o.path).toBe('/')
    expect(o.maxAge).toBe(SESSION_MAX_AGE_SECONDS)
  })
  it('is named distinctly from any sibling project cookie', () => {
    expect(SESSION_COOKIE).toBe('vt_session')
    expect(SESSION_COOKIE).not.toContain('wg')
  })
})

describe('expiry and renewal', () => {
  const now = 1_000_000
  it('treats the exact expiry instant as expired', () => {
    expect(isExpired(now, now)).toBe(true)
    expect(isExpired(now + 1, now)).toBe(false)
  })
  it('renews only past the half-life', () => {
    const issued = now
    const expires = now + 1000
    expect(shouldRenew(issued, expires, now + 400)).toBe(false)
    expect(shouldRenew(issued, expires, now + 600)).toBe(true)
  })
  it('never renews an already-expired session', () => {
    expect(shouldRenew(now, now + 1000, now + 2000)).toBe(false)
  })
})

describe('the local adapter', () => {
  it('never reveals whether an address is registered', async () => {
    const a = new LocalAuthAdapter()
    expect(await a.requestSignInLink('known@example.com')).toEqual({ sent: true })
    expect(await a.requestSignInLink('nobody@example.com')).toEqual({ sent: true })
  })

  it('accepts a link once and never again', async () => {
    const a = new LocalAuthAdapter()
    await a.requestSignInLink('alice@example.com')
    const token = a.peekLinkToken('alice@example.com')!
    const first = await a.verifySignInToken(token)
    expect(first.ok).toBe(true)
    const second = await a.verifySignInToken(token)
    expect(second).toEqual({ ok: false, reason: 'invalid_credentials' })
  })

  it('refuses an unknown token', async () => {
    const a = new LocalAuthAdapter()
    expect(await a.verifySignInToken('made-up')).toEqual({ ok: false, reason: 'invalid_credentials' })
  })

  it('gives the same user id for repeat sign-ins by one address', async () => {
    const a = new LocalAuthAdapter()
    await a.requestSignInLink('bob@example.com')
    const r1 = await a.verifySignInToken(a.peekLinkToken('bob@example.com')!)
    await a.requestSignInLink('BOB@example.com')
    const r2 = await a.verifySignInToken(a.peekLinkToken('bob@example.com')!)
    expect(r1.ok && r2.ok).toBe(true)
    if (r1.ok && r2.ok) expect(r1.identity.userId).toBe(r2.identity.userId)
  })

  it('refuses to exist in production', () => {
    const prev = process.env.NODE_ENV
    try {
      // @ts-expect-error -- writable at runtime
      process.env.NODE_ENV = 'production'
      expect(() => new LocalAuthAdapter()).toThrow(/never run in production/)
    } finally {
      // @ts-expect-error -- writable at runtime
      process.env.NODE_ENV = prev
    }
  })
})

describe('the Supabase adapter is present but deliberately unwired', () => {
  it('reports itself unconfigured rather than failing silently', async () => {
    const a = new SupabaseAuthAdapter()
    expect(a.configured).toBe(false)
    expect(await a.verifySignInToken('x')).toEqual({ ok: false, reason: 'not_configured' })
    expect(await a.requestSignInLink('a@b.com')).toEqual({ sent: false })
  })
})

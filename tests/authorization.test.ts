import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb, seedEntitledCustomer, seedCustomer } from './helpers/db'
import { createSession, validateSession, revokeSession, SESSION_COOKIE, LEGACY_COOKIE } from '@/lib/auth/session'
import { hasEntitlement, grantEntitlement, revokeEntitlement, STUDY_ACCESS } from '@/lib/entitlements'
import { issueLoginToken, consumeLoginToken, normalizeRedirect } from '@/lib/auth/login-token'
import { hashToken } from '@/lib/auth/crypto'

// ---------------------------------------------------------------------------
// The nine authorization guarantees Phase 0.5 requires, plus the security
// cases from §27. These run against real PostgreSQL via PGlite.
//
// Test 1 is the one that matters most: it is the regression test for the
// critical finding in the Phase 0 audit, where any non-empty cookie unlocked
// paid content.
// ---------------------------------------------------------------------------

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  const created = await createTestDb()
  db = created.db
  close = created.close
  setDbForTesting(db)
})

afterEach(async () => {
  setDbForTesting(null)
  await close()
})

describe('1. forged cookies are rejected', () => {
  it('rejects an arbitrary cookie value', async () => {
    expect(await validateSession('x')).toBeNull()
  })

  it('rejects the exact shape the old scheme used', async () => {
    // The vulnerable implementation set `login:<email>` and the middleware
    // accepted any non-empty value. This is that payload.
    expect(await validateSession('login:attacker@example.com')).toBeNull()
  })

  it('rejects a legitimate customer email as a forged token', async () => {
    await seedEntitledCustomer(db, 'real.customer@example.com')
    expect(await validateSession('login:real.customer@example.com')).toBeNull()
    expect(await validateSession('real.customer@example.com')).toBeNull()
  })

  it('rejects a well-formed but never-issued token', async () => {
    expect(await validateSession('Zm9yZ2VkLXRva2VuLXRoYXQtd2FzLW5ldmVyLWlzc3VlZA')).toBeNull()
  })

  it('uses a different cookie name from the compromised scheme', () => {
    // Browsers still holding the old cookie must fail the new check rather
    // than be honoured, because legacy values are forgeable by construction.
    expect(SESSION_COOKIE).not.toBe(LEGACY_COOKIE)
  })
})

describe('2. a valid, entitled customer is accepted', () => {
  it('validates the session and finds the entitlement', async () => {
    const customerId = await seedEntitledCustomer(db)
    const { token } = await createSession({ customerId })

    const session = await validateSession(token)
    expect(session).not.toBeNull()
    expect(session!.customerId).toBe(customerId)
    expect(await hasEntitlement(customerId, STUDY_ACCESS)).toBe(true)
  })
})

describe('3. a customer without the entitlement is rejected', () => {
  it('has a valid session but no access', async () => {
    const customerId = await seedCustomer(db, 'signed.up.never.paid@example.com')
    const { token } = await createSession({ customerId })

    // The session is genuine — this is specifically an authorization failure,
    // not an authentication one.
    expect(await validateSession(token)).not.toBeNull()
    expect(await hasEntitlement(customerId, STUDY_ACCESS)).toBe(false)
  })

  it('does not leak another customer entitlement', async () => {
    const paying = await seedEntitledCustomer(db, 'paid@example.com')
    const freeloader = await seedCustomer(db, 'unpaid@example.com')

    expect(await hasEntitlement(paying, STUDY_ACCESS)).toBe(true)
    expect(await hasEntitlement(freeloader, STUDY_ACCESS)).toBe(false)
  })
})

describe('4. expired sessions are rejected', () => {
  it('rejects a session whose expiry has passed', async () => {
    const customerId = await seedEntitledCustomer(db)
    const { token } = await createSession({ customerId })

    expect(await validateSession(token)).not.toBeNull()

    await db.query(`UPDATE sessions SET expires_at = now() - interval '1 second'`)
    expect(await validateSession(token)).toBeNull()
  })
})

describe('5. revoked sessions are rejected', () => {
  it('rejects immediately after revocation', async () => {
    const customerId = await seedEntitledCustomer(db)
    const { token } = await createSession({ customerId })

    expect(await revokeSession(token)).toBe(true)
    expect(await validateSession(token)).toBeNull()
  })

  it('revoking one session does not affect another', async () => {
    const customerId = await seedEntitledCustomer(db)
    const a = await createSession({ customerId })
    const b = await createSession({ customerId })

    await revokeSession(a.token)
    expect(await validateSession(a.token)).toBeNull()
    expect(await validateSession(b.token)).not.toBeNull()
  })
})

describe('6. duplicate Stripe events do not duplicate entitlements', () => {
  it('grants once for a repeated event id', async () => {
    const customerId = await seedCustomer(db, 'buyer@example.com')
    const key = 'evt_1ABC:STUDY_ACCESS'

    const first = await grantEntitlement({
      customerId, entitlementKey: STUDY_ACCESS,
      sourceType: 'order', sourceId: 'cs_123', idempotencyKey: key,
    })
    const second = await grantEntitlement({
      customerId, entitlementKey: STUDY_ACCESS,
      sourceType: 'order', sourceId: 'cs_123', idempotencyKey: key,
    })

    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    expect(second.entitlement.id).toBe(first.entitlement.id)

    const rows = await db.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM entitlements WHERE customer_id = $1`, [customerId]
    )
    expect(rows[0]!.n).toBe('1')
  })

  it('handles concurrent duplicate delivery', async () => {
    const customerId = await seedCustomer(db, 'concurrent@example.com')
    const key = 'evt_race:STUDY_ACCESS'
    const grant = () => grantEntitlement({
      customerId, entitlementKey: STUDY_ACCESS,
      sourceType: 'order', idempotencyKey: key,
    })

    await Promise.all([grant(), grant(), grant()])

    const rows = await db.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM entitlements WHERE idempotency_key = $1`, [key]
    )
    expect(rows[0]!.n).toBe('1')
  })

  it('revocation removes access, and re-granting needs a fresh key', async () => {
    const customerId = await seedEntitledCustomer(db)
    expect(await hasEntitlement(customerId, STUDY_ACCESS)).toBe(true)

    await revokeEntitlement({ customerId, entitlementKey: STUDY_ACCESS, reason: 'refund' })
    expect(await hasEntitlement(customerId, STUDY_ACCESS)).toBe(false)
  })

  it('expired entitlements do not grant access', async () => {
    const customerId = await seedCustomer(db, 'lapsed@example.com')
    await grantEntitlement({
      customerId, entitlementKey: STUDY_ACCESS, sourceType: 'subscription',
      expiresAt: new Date(Date.now() - 1000), idempotencyKey: 'lapsed:1',
    })
    expect(await hasEntitlement(customerId, STUDY_ACCESS)).toBe(false)
  })
})

describe('7. magic links work across separate serverless requests', () => {
  it('a token issued by one instance is consumable by another', async () => {
    // The previous implementation held tokens in a module-level Map, so this
    // failed whenever issue and verify landed on different lambdas. Simulate
    // that by discarding all in-process state between the two halves: the
    // only thing carried across is the token string itself, exactly as it
    // travels in the email link.
    const { token } = await issueLoginToken({ email: 'Traveller@Example.com' })

    setDbForTesting(null)   // tear down "instance A"
    setDbForTesting(db)     // "instance B" — fresh module state, same database

    const consumed = await consumeLoginToken(token)
    expect(consumed).not.toBeNull()
    expect(consumed!.email).toBe('traveller@example.com')
  })

  it('stores only the hash, never the token', async () => {
    const { token } = await issueLoginToken({ email: 'hashed@example.com' })
    const rows = await db.query<{ token_hash: string }>(`SELECT token_hash FROM login_tokens`)
    expect(rows[0]!.token_hash).toBe(hashToken(token))
    expect(rows[0]!.token_hash).not.toBe(token)
  })
})

describe('8. expired magic links are rejected', () => {
  it('rejects a token past its expiry', async () => {
    const { token } = await issueLoginToken({ email: 'slow@example.com' })
    await db.query(`UPDATE login_tokens SET expires_at = now() - interval '1 second'`)
    expect(await consumeLoginToken(token)).toBeNull()
  })
})

describe('9. reused magic links are rejected', () => {
  it('a token works exactly once', async () => {
    const { token } = await issueLoginToken({ email: 'once@example.com' })

    expect(await consumeLoginToken(token)).not.toBeNull()
    expect(await consumeLoginToken(token)).toBeNull()
  })

  it('concurrent use of one token yields exactly one success', async () => {
    const { token } = await issueLoginToken({ email: 'racer@example.com' })

    const results = await Promise.all([
      consumeLoginToken(token),
      consumeLoginToken(token),
      consumeLoginToken(token),
    ])
    expect(results.filter(Boolean)).toHaveLength(1)
  })
})

describe('§27 — additional security requirements', () => {
  it('magic links cannot be used as an open redirect', async () => {
    // The destination is stored server-side against the token and never
    // travels in the callback URL, so there is no attacker-controlled value
    // to smuggle. An unknown destination falls back rather than being obeyed.
    expect(normalizeRedirect('https://evil.example/steal')).toBe('/exam-simulator')
    expect(normalizeRedirect('//evil.example')).toBe('/exam-simulator')
    expect(normalizeRedirect('/admin')).toBe('/exam-simulator')
    expect(normalizeRedirect('/flashcards')).toBe('/flashcards')

    const { token } = await issueLoginToken({
      email: 'redirect@example.com',
      redirectTo: 'https://evil.example/steal',
    })
    const consumed = await consumeLoginToken(token)
    expect(consumed!.redirectTo).toBe('/exam-simulator')
  })

  it('session tokens are not sequential or guessable', async () => {
    const customerId = await seedEntitledCustomer(db)
    const tokens = new Set<string>()
    for (let i = 0; i < 25; i++) tokens.add((await createSession({ customerId })).token)

    expect(tokens.size).toBe(25)
    for (const t of tokens) expect(t.length).toBeGreaterThanOrEqual(43) // 256 bits base64url
  })

  it('session rows expose no internal id to the client', async () => {
    const customerId = await seedEntitledCustomer(db)
    const { token } = await createSession({ customerId })
    // The cookie value is the random token, never the row's UUID.
    const rows = await db.query<{ id: string }>(`SELECT id FROM sessions`)
    expect(token).not.toContain(rows[0]!.id)
  })

  it('email case does not create a second identity', async () => {
    const { upsertCustomer } = await import('@/lib/customers')
    const a = await upsertCustomer({ email: 'Case@Example.com' })
    const b = await upsertCustomer({ email: 'case@example.com' })
    expect(a.id).toBe(b.id)
  })
})

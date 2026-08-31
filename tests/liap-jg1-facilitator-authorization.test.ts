import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb, seedCustomer } from './helpers/db'
import {
  mayReceiveFacilitatorContent,
  confirmRetreatCompletion,
  grantFacilitatorCertification,
  setFacilitatorState,
  assignFacilitatorToRetreat,
  confirmSpiritualPreparation,
} from '@/lib/liap/facilitation'

// ---------------------------------------------------------------------------
// JG-1: the facilitator console is authorized server-side.
//
// The audit finding was that the feature flag was the only gate, so with the
// flag on anybody who typed the URL received the console and everything its
// bundle carries. These are the owner's ten required proofs.
//
// The route is exercised through the same guard the page calls, plus source
// assertions that the page actually calls it — a guard nothing invokes would
// pass every behavioural test in this file while protecting nothing.
// ---------------------------------------------------------------------------

const source = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const code = (p: string) =>
  source(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const CONSOLE_ROUTE = 'app/liap/journey/facilitator/[retreatId]/page.tsx'
const BARE_ROUTE = 'app/liap/journey/facilitator/page.tsx'

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

async function newRetreat(name = 'Retreat A'): Promise<string> {
  const rows = await db.query<{ id: string }>(
    `INSERT INTO retreats (name, status) VALUES ($1, 'planned') RETURNING id`,
    [name]
  )
  return rows[0]!.id
}

async function seedAdmin(): Promise<string> {
  const id = await seedCustomer(db, 'owner@example.com')
  await db.query(`INSERT INTO liap_authorities (customer_id, authority) VALUES ($1, 'admin')`, [id])
  return id
}

async function seedGraduate(email: string, admin: string): Promise<string> {
  const id = await seedCustomer(db, email)
  const r = await newRetreat(`Prior for ${email}`)
  await db.query(`INSERT INTO retreat_participants (retreat_id, customer_id) VALUES ($1, $2)`, [r, id])
  await confirmRetreatCompletion({ retreatId: r, customerId: id, actorId: admin })
  return id
}

async function seedCertified(email: string, admin: string): Promise<string> {
  const id = await seedGraduate(email, admin)
  const r = await grantFacilitatorCertification({ subjectId: id, actorId: admin })
  expect(r.ok).toBe(true)
  return id
}

// ── THE ROUTE ACTUALLY CALLS THE GUARD ──────────────────────────────────────

describe('the console route is guarded, not merely flagged', () => {
  it('authorizes server-side before rendering the console', () => {
    const c = code(CONSOLE_ROUTE)
    expect(c).toContain('mayReceiveFacilitatorContent')
    expect(c).toContain('validateSession')
    // The guard must run BEFORE the console is returned.
    const body = c.slice(c.indexOf('export default async function'))
    expect(body.indexOf('mayReceiveFacilitatorContent')).toBeLessThan(
      body.indexOf('<FacilitatorConsole')
    )
  })

  it('keeps the flag as a release control in front of authorization', () => {
    // Compared inside the component body, not across the whole file: the
    // import sits above everything and would win any file-wide comparison
    // while proving nothing about execution order.
    const c = code(CONSOLE_ROUTE)
    const body = c.slice(c.indexOf('export default async function'))
    expect(body).toContain("isEnabled('LIAP_JOURNEY')")
    expect(body.indexOf("isEnabled('LIAP_JOURNEY')")).toBeLessThan(
      body.indexOf('mayReceiveFacilitatorContent')
    )
  })

  it('answers an unauthorized request with notFound, never a 403', () => {
    const c = code(CONSOLE_ROUTE)
    expect(c).toContain('notFound()')
    // A 403 would confirm the Retreat exists; both answers must look alike.
    expect(c).not.toMatch(/403|Forbidden|status:\s*401/)
    // And the internal reason is never surfaced to the caller.
    expect(c).not.toContain('.reason')
  })

  it('the bare route serves no console and redirects nowhere', () => {
    const c = code(BARE_ROUTE)
    expect(c).not.toContain('FacilitatorConsole')
    expect(c).toContain('notFound()')
    // A redirect would have to guess a Retreat, which is how somebody ends up
    // in a session they were not assigned to.
    expect(c).not.toContain('redirect(')
  })

  it('the console component itself was not redesigned', () => {
    const c = source('components/liap/journey/FacilitatorConsole.tsx')
    expect(c.startsWith("'use client'")).toBe(true)
    expect(c).toContain('ROAD_EVENT_LIBRARY')
    expect(c).toContain('facilitatorClock')
  })
})

// ── THE ROUTE ITSELF, INVOKED ───────────────────────────────────────────────
//
// Added because a negative control got through: replacing the guard with
// `if (false && ...)` left every source assertion above still passing. The
// guard was present, imported, and correctly ordered — and did nothing.
//
// Source assertions prove a guard EXISTS. Only calling the component proves it
// STOPS anything, so these render the real page and expect it to refuse.

describe('the route refuses when it is actually invoked', () => {
  /**
   * Loads the route with a fresh module registry.
   *
   * `resetModules` discards the db client along with everything else, so the
   * test database has to be re-injected into the NEW instance — otherwise the
   * route reaches a real client, fails on a missing DATABASE_URL, and the
   * test passes for entirely the wrong reason.
   */
  async function loadRoute(sessionCustomerId: string | null) {
    vi.resetModules()
    vi.doMock('next/headers', () => ({
      cookies: async () => ({ get: () => ({ value: 'cookie' }) }),
    }))
    vi.doMock('@/lib/flags', () => ({ isEnabled: () => true }))
    vi.doMock('@/lib/auth/session', () => ({
      SESSION_COOKIE: 'wg_session',
      validateSession: async () =>
        sessionCustomerId ? { customerId: sessionCustomerId, email: 'x@example.com' } : null,
    }))
    const client = await import('@/lib/db/client')
    client.setDbForTesting(db)
    const mod = await import('@/app/liap/journey/facilitator/[retreatId]/page')
    return mod.default as (p: { params: Promise<{ retreatId: string }> }) => Promise<unknown>
  }

  afterEach(() => {
    vi.doUnmock('next/headers')
    vi.doUnmock('@/lib/flags')
    vi.doUnmock('@/lib/auth/session')
    vi.resetModules()
  })

  it('throws NEXT_NOT_FOUND for an unauthenticated caller, flag ON', async () => {
    const retreat = await newRetreat()
    const page = await loadRoute(null)
    await expect(page({ params: Promise.resolve({ retreatId: retreat }) })).rejects.toThrow(
      /NEXT_NOT_FOUND|NEXT_HTTP_ERROR/
    )
  })

  it('throws for a signed-in participant with no clearance, flag ON', async () => {
    const admin = await seedAdmin()
    const retreat = await newRetreat()
    const participant = await seedCustomer(db, 'invoked.participant@example.com')
    await db.query(
      `INSERT INTO retreat_participants (retreat_id, customer_id) VALUES ($1, $2)`,
      [retreat, participant]
    )
    const page = await loadRoute(participant)
    await expect(page({ params: Promise.resolve({ retreatId: retreat }) })).rejects.toThrow(
      /NEXT_NOT_FOUND|NEXT_HTTP_ERROR/
    )
    void admin
  })

  it('throws for a cleared facilitator asking for someone else’s Retreat', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertified('invoked.sideways@example.com', admin)
    const mine = await newRetreat('Mine')
    const theirs = await newRetreat('Theirs')
    await assignFacilitatorToRetreat({ retreatId: mine, facilitatorId: fac, actorId: admin })
    await confirmSpiritualPreparation({ retreatId: mine, facilitatorId: fac })

    const page = await loadRoute(fac)
    await expect(page({ params: Promise.resolve({ retreatId: theirs }) })).rejects.toThrow(
      /NEXT_NOT_FOUND|NEXT_HTTP_ERROR/
    )
  })

  it('and renders the console for a cleared facilitator', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertified('invoked.cleared@example.com', admin)
    const retreat = await newRetreat()
    await assignFacilitatorToRetreat({ retreatId: retreat, facilitatorId: fac, actorId: admin })
    await confirmSpiritualPreparation({ retreatId: retreat, facilitatorId: fac })

    const page = await loadRoute(fac)
    const out = await page({ params: Promise.resolve({ retreatId: retreat }) })
    expect(out).toBeTruthy()
  })
})

// ── THE OWNER'S TEN PROOFS ──────────────────────────────────────────────────

describe('JG-1 required proofs', () => {
  it('FLAG OFF → unavailable', () => {
    // The flag check is first and unconditional; nothing below it runs.
    const c = code(CONSOLE_ROUTE)
    expect(c).toMatch(/if \(!isEnabled\('LIAP_JOURNEY'\)\) notFound\(\)/)
  })

  it('FLAG ON + unauthenticated → unavailable', async () => {
    const retreat = await newRetreat()
    expect(await mayReceiveFacilitatorContent(null, retreat)).toBe(false)
    expect(await mayReceiveFacilitatorContent(undefined, retreat)).toBe(false)
  })

  it('FLAG ON + participant → unavailable', async () => {
    const admin = await seedAdmin()
    const retreat = await newRetreat()
    const participant = await seedCustomer(db, 'participant@example.com')
    await db.query(
      `INSERT INTO retreat_participants (retreat_id, customer_id) VALUES ($1, $2)`,
      [retreat, participant]
    )
    expect(await mayReceiveFacilitatorContent(participant, retreat)).toBe(false)
    void admin
  })

  it('FLAG ON + facilitator candidate → unavailable', async () => {
    const admin = await seedAdmin()
    const candidate = await seedGraduate('candidate@example.com', admin)
    await setFacilitatorState({ subjectId: candidate, actorId: admin, state: 'training_completed' })
    const retreat = await newRetreat()
    await assignFacilitatorToRetreat({ retreatId: retreat, facilitatorId: candidate, actorId: admin })
    await confirmSpiritualPreparation({ retreatId: retreat, facilitatorId: candidate })
    expect(await mayReceiveFacilitatorContent(candidate, retreat)).toBe(false)
  })

  it('FLAG ON + certified but not assigned → unavailable', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertified('unassigned@example.com', admin)
    const retreat = await newRetreat()
    expect(await mayReceiveFacilitatorContent(fac, retreat)).toBe(false)
  })

  it('FLAG ON + certified + assigned, preparation NOT confirmed → unavailable', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertified('unprepared@example.com', admin)
    const retreat = await newRetreat()
    await assignFacilitatorToRetreat({ retreatId: retreat, facilitatorId: fac, actorId: admin })
    expect(await mayReceiveFacilitatorContent(fac, retreat)).toBe(false)
  })

  it('FLAG ON + certified + active + assigned + confirmed → AVAILABLE', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertified('cleared@example.com', admin)
    const retreat = await newRetreat()
    await assignFacilitatorToRetreat({ retreatId: retreat, facilitatorId: fac, actorId: admin })
    await confirmSpiritualPreparation({ retreatId: retreat, facilitatorId: fac })
    expect(await mayReceiveFacilitatorContent(fac, retreat)).toBe(true)
  })

  it('SUSPEND that facilitator → next check denies', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertified('suspended@example.com', admin)
    const retreat = await newRetreat()
    await assignFacilitatorToRetreat({ retreatId: retreat, facilitatorId: fac, actorId: admin })
    await confirmSpiritualPreparation({ retreatId: retreat, facilitatorId: fac })
    expect(await mayReceiveFacilitatorContent(fac, retreat)).toBe(true)

    await setFacilitatorState({ subjectId: fac, actorId: admin, state: 'suspended' })
    // Nothing else was touched: still assigned, still confirmed.
    expect(await mayReceiveFacilitatorContent(fac, retreat)).toBe(false)
  })

  it('changing retreat_id → cannot reach another Retreat', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertified('sideways@example.com', admin)
    const mine = await newRetreat('Mine')
    const theirs = await newRetreat('Theirs')
    await assignFacilitatorToRetreat({ retreatId: mine, facilitatorId: fac, actorId: admin })
    await confirmSpiritualPreparation({ retreatId: mine, facilitatorId: fac })

    expect(await mayReceiveFacilitatorContent(fac, mine)).toBe(true)
    expect(await mayReceiveFacilitatorContent(fac, theirs)).toBe(false)
    // A made-up id is refused the same way, so probing distinguishes nothing.
    expect(
      await mayReceiveFacilitatorContent(fac, '00000000-0000-0000-0000-000000000000')
    ).toBe(false)
  })

  it('client-supplied role or state cannot grant access', () => {
    const c = code(CONSOLE_ROUTE)
    // The only things read from the request are the session cookie and the
    // path segment. No header, query parameter or body is consulted, so there
    // is nothing a caller could assert.
    expect(c).toContain('cookies()')
    expect(c).toContain('params')
    expect(c).not.toMatch(/searchParams|headers\(\)|req\.|request\./)
    // And the identity comes from a validated session, never from a claim.
    expect(c).toContain('validateSession')
    expect(c).not.toMatch(/customerId\s*=\s*(params|searchParams)/)
  })
})

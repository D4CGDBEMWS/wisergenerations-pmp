import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb, seedEntitledCustomer, seedCustomer } from './helpers/db'

// ---------------------------------------------------------------------------
// The studio is the paid product. These tests exist because closing the
// paywall on /exam-simulator did NOT close it on the studio: the route
// redirected correctly while the iframe it rendered pointed at a public static
// asset that every guard was blind to. Anyone could fetch
// /studio/pmp-practice-studio.html?full=1 and receive the whole bank.
//
// The regression these guard against is not "someone deletes the check" but
// the quieter one: someone drops the full studio back into public/ because it
// is convenient, and nothing anywhere complains.
// ---------------------------------------------------------------------------

const PUBLIC_STUDIO = join(process.cwd(), 'public', 'studio')
const FULL_STUDIO = join(process.cwd(), 'content', 'studio', 'pmp-practice-studio.html')
const FREE_STUDIO = join(PUBLIC_STUDIO, 'pmp-practice-free.html')

describe('the paid studio is not a public asset', () => {
  it('is stored outside the public directory', () => {
    expect(existsSync(FULL_STUDIO)).toBe(true)
    expect(existsSync(join(PUBLIC_STUDIO, 'pmp-practice-studio.html'))).toBe(false)
  })

  it('serves the free sample, and only the free sample, from public', () => {
    // Anything else appearing here is the regression: a second studio in
    // public/ is reachable without a session no matter what the routes do.
    const { readdirSync } = require('fs') as typeof import('fs')
    expect(readdirSync(PUBLIC_STUDIO).sort()).toEqual(['pmp-practice-free.html'])
  })

  it('the visitor-facing route loads the guarded path, with no query string', () => {
    // ?full=1 is read from location.search by the studio itself, so it is a
    // request from the browser, never a permission. Asserted against the src
    // attribute rather than the file text: the comment above that iframe
    // explains the attack and naturally contains the string.
    const page = readFileSync(join(process.cwd(), 'app', 'exam-simulator', 'page.tsx'), 'utf8')
    const src = page.match(/<iframe[\s\S]*?src="([^"]+)"/)?.[1]

    expect(src).toBe('/api/studio')
    expect(src).not.toContain('?')
  })
})

describe('the free sample does not contain the paid product', () => {
  const free = readFileSync(FREE_STUDIO, 'utf8')
  const full = readFileSync(FULL_STUDIO, 'utf8')

  function literal(source: string, marker: string, open: string, close: string): string {
    let i = source.indexOf(marker) + marker.length
    while (source[i] !== open) i++
    let depth = 0, inString = false, escaped = false
    for (let j = i; j < source.length; j++) {
      const c = source[j]
      if (inString) {
        if (escaped) escaped = false
        else if (c === '\\') escaped = true
        else if (c === '"') inString = false
        continue
      }
      if (c === '"') inString = true
      else if (c === open) depth++
      else if (c === close && --depth === 0) return source.slice(i, j + 1)
    }
    throw new Error('unbalanced')
  }

  const fullData = JSON.parse(literal(full, 'const DATA =', '{', '}'))
  const freeData = JSON.parse(literal(free, 'const DATA =', '{', '}'))

  it('carries a sample rather than the bank', () => {
    expect(fullData.questions.length).toBeGreaterThan(500)
    expect(freeData.questions.length).toBeLessThanOrEqual(12)
  })

  it('withholds every question it does not sample', () => {
    // The real test. The email gate is a variable in the visitor's browser, so
    // the only thing that actually withholds a question is its absence from
    // the file — View Source defeats anything else.
    const sampled = new Set(freeData.questions.map((q: { id: number }) => q.id))
    const withheld = fullData.questions.filter((q: { id: number }) => !sampled.has(q.id))

    const leaked = withheld.filter((q: { q: string }) => free.includes(q.q))
    expect(leaked).toHaveLength(0)
  })

  it('withholds the mock exam, the ITTO cards and the glossary', () => {
    expect(freeData.processes).toHaveLength(0)
    expect(freeData.glossary).toHaveLength(0)
    expect(JSON.parse(literal(free, 'const MOCK =', '[', ']'))).toHaveLength(0)

    const mock = JSON.parse(literal(full, 'const MOCK =', '[', ']'))
    expect(mock.length).toBeGreaterThan(100)
    expect(free.includes(mock[0].q)).toBe(false)
    expect(free.includes(fullData.glossary[0].term)).toBe(false)
  })

  it('is generated from the full studio, not hand-maintained', () => {
    // Same renderer, same styling, same gate — only the payload differs. If
    // these diverge, a rendering fix will land in one file and not the other.
    expect(free).toContain('FREE_LIMIT = 3')
    expect(free).toContain('PMP® <em>Practice</em> Studio')
  })
})

describe('entitlement decides who gets the full studio', () => {
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

  it('an entitled customer passes the check the route performs', async () => {
    const { hasEntitlement, STUDY_ACCESS } = await import('@/lib/entitlements')
    const customerId = await seedEntitledCustomer(db)
    expect(await hasEntitlement(customerId, STUDY_ACCESS)).toBe(true)
  })

  it('a signed-in customer who never paid does not', async () => {
    const { hasEntitlement, STUDY_ACCESS } = await import('@/lib/entitlements')
    const customerId = await seedCustomer(db, 'never.paid@example.com')
    expect(await hasEntitlement(customerId, STUDY_ACCESS)).toBe(false)
  })

  it('a refunded customer loses access to it', async () => {
    const { hasEntitlement, revokeEntitlement, STUDY_ACCESS } = await import('@/lib/entitlements')
    const customerId = await seedEntitledCustomer(db)

    await revokeEntitlement({ customerId, entitlementKey: STUDY_ACCESS, reason: 'refund' })
    expect(await hasEntitlement(customerId, STUDY_ACCESS)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// The route handler itself, against real PostgreSQL.
//
// Proving it returns 404 without a session is only half the claim, and the
// weaker half: a route that is simply broken also returns 404 to everyone. On
// a machine with no DATABASE_URL, every request fails closed and looks
// identical to a correctly-denied one. These exercise both directions with a
// genuine session and a genuine entitlement, so "blocked" is distinguishable
// from "dead".
// ---------------------------------------------------------------------------

let cookieValue: string | undefined

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'wg_session' && cookieValue ? { name, value: cookieValue } : undefined,
  }),
}))

describe('GET /api/studio', () => {
  let db: Db
  let close: () => Promise<void>

  beforeEach(async () => {
    const created = await createTestDb()
    db = created.db
    close = created.close
    setDbForTesting(db)
    cookieValue = undefined
  })

  afterEach(async () => {
    setDbForTesting(null)
    await close()
  })

  async function get() {
    const { GET } = await import('@/app/api/studio/route')
    return GET()
  }

  it('serves the full studio to an entitled customer', async () => {
    const { createSession } = await import('@/lib/auth/session')
    const customerId = await seedEntitledCustomer(db)
    cookieValue = (await createSession({ customerId })).token

    const res = await get()
    expect(res.status).toBe(200)

    const body = await res.text()
    // The real assertion: they get the questions, not just a 200.
    expect(body.length).toBeGreaterThan(900_000)
    expect(body).toContain('const DATA =')
    // Unlocked by who they are, not by what is in their address bar.
    expect(body).toContain('window.STUDENT_MODE=true')
  })

  it('never lets a shared cache keep that response', async () => {
    const { createSession } = await import('@/lib/auth/session')
    const customerId = await seedEntitledCustomer(db)
    cookieValue = (await createSession({ customerId })).token

    const res = await get()
    expect(res.headers.get('cache-control')).toContain('private')
    expect(res.headers.get('cache-control')).toContain('no-store')
  })

  it('refuses a visitor with no session', async () => {
    expect((await get()).status).toBe(404)
  })

  it('refuses a forged cookie', async () => {
    cookieValue = 'login:attacker@example.com'
    expect((await get()).status).toBe(404)
  })

  it('refuses a signed-in customer who never paid', async () => {
    const { createSession } = await import('@/lib/auth/session')
    const customerId = await seedCustomer(db, 'browsing@example.com')
    cookieValue = (await createSession({ customerId })).token

    expect((await get()).status).toBe(404)
  })

  it('refuses a customer whose entitlement was revoked', async () => {
    const { createSession } = await import('@/lib/auth/session')
    const { revokeEntitlement, STUDY_ACCESS } = await import('@/lib/entitlements')
    const customerId = await seedEntitledCustomer(db)
    cookieValue = (await createSession({ customerId })).token

    expect((await get()).status).toBe(200)

    await revokeEntitlement({ customerId, entitlementKey: STUDY_ACCESS, reason: 'refund' })
    expect((await get()).status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// One number, everywhere.
//
// The studio badge read 698 while /access advertised 694: 694 entries in
// DATA.questions plus 4 case-set and matching items merged into the pool at
// load. Both counts were honest on their own and disagreed in public, which is
// the worst combination for a number a business advertises.
//
// The advanced-format items now belong to the mock exam only. This guards the
// reconciliation rather than the mechanism — if someone merges them back into
// the practice pool, the marketing copy silently becomes wrong again.
// ---------------------------------------------------------------------------

const ADVERTISED_QUESTIONS = 694

describe('the question count agrees with itself', () => {
  const studio = readFileSync(FULL_STUDIO, 'utf8')

  it('the practice pool is not padded with the mock-exam formats', () => {
    // Q.length drives both the badge and the "N of N available" line.
    expect(studio).not.toMatch(/NEWFORMATS\.forEach[^)]*Q\.push/)
  })

  it('the studio holds exactly what the site advertises', () => {
    const data = JSON.parse(
      studio.slice(
        studio.indexOf('{', studio.indexOf('const DATA =')),
        studio.lastIndexOf('}', studio.indexOf('const MOCK =')) + 1
      )
    )
    expect(data.questions).toHaveLength(ADVERTISED_QUESTIONS)
  })

  it('every customer-facing page states the same number', () => {
    for (const page of ['app/access/page.tsx', 'app/exam-simulator/page.tsx']) {
      const source = readFileSync(join(process.cwd(), page), 'utf8')
      const counts = [...source.matchAll(/\b(6\d\d)\s+(?:PMP-style\s+)?practice questions/gi)]
        .map((m) => Number(m[1]))
      for (const n of counts) {
        expect(n, `${page} advertises ${n}`).toBe(ADVERTISED_QUESTIONS)
      }
    }
  })
})

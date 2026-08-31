import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb, seedCustomer } from './helpers/db'
import { hasEntitlement } from '@/lib/entitlements'
import { LIAP_ASSESSMENT_ACCESS } from '@/lib/liap/entitlements'
import { fulfilPreorder, fulfilStandaloneAssessment } from '@/lib/liap/fulfilment'
import { LIAP_BOOK, LIAP_ASSESSMENT } from '@/lib/liap/product'
import { LIAP_TAGS, LIAP_JOURNEY_NAMES, tagLiapContact, enrolLiapMarketing } from '@/lib/liap/crm'
import {
  recordMarketingConsent,
  hasMarketingConsent,
  hasMarketingConsentByEmail,
} from '@/lib/marketing-consent'

// ---------------------------------------------------------------------------
// The Mailchimp foundation, owner-approved 31 August 2026.
//
// The through-line of every test here is one rule: Mailchimp receives state,
// and never decides it. Payment, ownership, entitlement, completion and access
// are settled server-side before anything is sent, and nothing is read back.
// ---------------------------------------------------------------------------

const source = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const code = (p: string) =>
  source(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  const created = await createTestDb()
  db = created.db
  close = created.close
  setDbForTesting(db)
  // No Mailchimp credentials in tests: the client short-circuits to
  // {ok:true, skipped:true} rather than reaching the network.
  delete process.env.MAILCHIMP_API_KEY
  delete process.env.MAILCHIMP_AUDIENCE_ID
})

afterEach(async () => {
  setDbForTesting(null)
  await close()
  vi.restoreAllMocks()
})

// ── 1. A MAILCHIMP FAILURE CANNOT FAIL FULFILMENT ───────────────────────────

describe('a Mailchimp outage cannot cost somebody what they paid for', () => {
  it('1. book fulfilment completes when every Mailchimp call fails', async () => {
    process.env.MAILCHIMP_API_KEY = 'key-us1'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud'
    // A total outage: not a 500, but the connection failing outright.
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await fulfilPreorder({
      email: 'outage@example.com',
      name: 'Outage Reader',
      sourceId: 'cs_outage',
      idempotencyKey: 'evt_outage',
    })

    expect(result.entitlementCreated).toBe(true)
    expect(await hasEntitlement(result.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
  })

  it('records the failed sync so it can be replayed, rather than dropping it', async () => {
    process.env.MAILCHIMP_API_KEY = 'key-us1'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('nope', { status: 500 }) as never
    )

    const result = await fulfilPreorder({
      email: 'replay@example.com',
      sourceId: 'cs_replay',
      idempotencyKey: 'evt_replay',
    })

    const rows = await db.query<{ metadata: Record<string, unknown> }>(
      `SELECT metadata FROM audit_events
        WHERE event_type = 'crm.sync_failed' AND customer_id = $1`,
      [result.customerId]
    )
    expect(rows).toHaveLength(1)
    // Structural only: which tags, which operation. Never who they are.
    expect(String(rows[0]!.metadata.tags)).toContain('liap_book_preorder')
    expect(rows[0]!.metadata.operation).toBe('tag')
  })

  it('the grant happens before the sync, so an outage cannot pre-empt it', () => {
    const c = code('lib/liap/fulfilment.ts')
    expect(c.indexOf('grantEntitlement')).toBeLessThan(c.indexOf('syncPurchaserTags'))
  })

  it('the CRM layer itself returns a failure rather than throwing', async () => {
    // Asserted separately from the fulfilment test above, because fulfilment
    // ALSO wraps the call in its own catch. Two layers guard this, and a test
    // that only exercised the outer one would keep passing if the inner one
    // started throwing -- leaving a single point of failure that looks safe.
    process.env.MAILCHIMP_API_KEY = 'key-us1'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud'
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await tagLiapContact('inner@example.com', ['liap_interest'])
    expect(result.ok).toBe(false)
  })

  it('and so does the shared client underneath it', async () => {
    process.env.MAILCHIMP_API_KEY = 'key-us1'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud'
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'))
    const { upsertSubscriber } = await import('@/lib/mailchimp')
    const result = await upsertSubscriber({ email: 'c@example.com', tags: ['x'] })
    expect(result.ok).toBe(false)
  })
})

// ── 2, 3, 4. VERIFIED PURCHASE IS THE ONLY ROUTE TO PURCHASER ───────────────

describe('only a verified purchase produces purchaser state', () => {
  it('2. a verified purchase syncs the purchaser journey', async () => {
    const calls: string[] = []
    process.env.MAILCHIMP_API_KEY = 'key-us1'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud'
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      calls.push(`${url}::${String((init as RequestInit)?.body ?? '')}`)
      return new Response('{}', { status: 200 }) as never
    })

    await fulfilPreorder({
      email: 'buyer@example.com',
      name: 'Real Buyer',
      sourceId: 'cs_buy',
      idempotencyKey: 'evt_buy',
    })

    const tagCall = calls.find((c) => c.includes('/tags'))!
    expect(tagCall).toContain('liap_book_preorder')
    expect(tagCall).toContain('liap_assessment_entitled')
  })

  it('3. an unverified preorder verification cannot produce the purchaser tag', () => {
    // The route tags interest, never purchase. Asserted against the source
    // because the alternative — a self-reported form reaching the same
    // marketing state as a paid Stripe session — has no test that would fail
    // loudly at runtime.
    const c = code('app/api/liap/verify-preorder/route.ts')
    expect(c).toContain("['liap_interest']")
    expect(c).not.toContain('liap_book_preorder')
    expect(c).not.toContain('grantEntitlement')
  })

  it('and nothing outside fulfilment applies the purchaser tag at all', () => {
    const offenders: string[] = []
    for (const f of [
      'app/api/liap/verify-preorder/route.ts',
      'app/api/liap/interest/route.ts',
      'app/api/liap/results/email/route.ts',
      'app/api/liap/assessment/route.ts',
      'lib/liap/assessment-service.ts',
    ]) {
      if (code(f).includes('liap_book_preorder')) offenders.push(f)
    }
    expect(offenders).toEqual([])
  })

  it('4. a book purchase grants assessment access', async () => {
    const result = await fulfilPreorder({
      email: 'included@example.com',
      sourceId: 'cs_inc',
      idempotencyKey: 'evt_inc',
    })
    expect(await hasEntitlement(result.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
  })
})

// ── 5, 6, 7, 8. PRICING AND WHAT EACH PURCHASE BUYS ─────────────────────────

describe('the two prices and what each one grants', () => {
  it('7. the book is $24.99', () => {
    expect(LIAP_BOOK.amount).toBe(2499)
    expect(LIAP_BOOK.priceLabel).toBe('$24.99')
  })

  it('5. the standalone assessment is $29, server-side', () => {
    expect(LIAP_ASSESSMENT.amount).toBe(2900)
    expect(LIAP_ASSESSMENT.priceLabel).toBe('$29.00')
    const route = code('app/api/liap/assessment-checkout/route.ts')
    // The amount comes from the product module, and the request body is not
    // read at all -- the only way a client-supplied price is impossible is if
    // no code reads one.
    expect(route).toContain('unit_amount: LIAP_ASSESSMENT.amount')
    expect(route).not.toMatch(/req\.json\(\)|body\.amount|unit_amount:\s*\d/)
  })

  it('8. the book still includes the assessment', async () => {
    const result = await fulfilPreorder({
      email: 'bundle@example.com',
      sourceId: 'cs_bundle',
      idempotencyKey: 'evt_bundle',
    })
    expect(await hasEntitlement(result.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
  })

  it('6. the standalone assessment grants assessment access and nothing else', async () => {
    const result = await fulfilStandaloneAssessment({
      email: 'standalone@example.com',
      sourceId: 'cs_solo',
      idempotencyKey: 'evt_solo',
    })
    expect(await hasEntitlement(result.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
    // Not a book purchaser: they did not buy the book.
    expect(await hasEntitlement(result.customerId, 'LIAP_BOOK_PREORDER')).toBe(false)
  })

  it('and never tags a standalone buyer as a book purchaser', async () => {
    const calls: string[] = []
    process.env.MAILCHIMP_API_KEY = 'key-us1'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud'
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      calls.push(`${url}::${String((init as RequestInit)?.body ?? '')}`)
      return new Response('{}', { status: 200 }) as never
    })

    await fulfilStandaloneAssessment({
      email: 'solo.tags@example.com',
      sourceId: 'cs_solo2',
      idempotencyKey: 'evt_solo2',
    })

    const tagCall = calls.find((c) => c.includes('/tags'))!
    expect(tagCall).toContain('liap_assessment_entitled')
    expect(tagCall).not.toContain('liap_book_preorder')
  })

  it('the two products carry distinct Stripe markers', () => {
    expect(LIAP_ASSESSMENT.metadataKey).not.toBe(LIAP_BOOK.metadataKey)
  })
})

// ── 9, 10, 11, 12. WHAT MAY NEVER REACH MAILCHIMP ───────────────────────────

describe('assessment content and payment detail never reach Mailchimp', () => {
  it('9, 10, 11. the CRM module cannot carry answers, scores or urgency', () => {
    const c = code('lib/liap/crm.ts')
    // It sends tags. There is no parameter, field or merge shape through
    // which an answer, a score or an urgency flag could travel.
    expect(c).not.toMatch(/\banswers?\b/)
    expect(c).not.toMatch(/\bscores?\b/)
    expect(c).not.toMatch(/urgen/i)
    expect(c).not.toMatch(/narrative/i)
    expect(c).not.toMatch(/merge_fields/)
  })

  it('the only thing sent per contact is email, names and allow-listed tags', async () => {
    const bodies: string[] = []
    process.env.MAILCHIMP_API_KEY = 'key-us1'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud'
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      bodies.push(String((init as RequestInit)?.body ?? ''))
      return new Response('{}', { status: 200 }) as never
    })

    await tagLiapContact('minimal@example.com', ['liap_assessment_completed'], {
      firstName: 'Ada',
      lastName: 'Lovelace',
    })

    const member = JSON.parse(bodies[0]!)
    expect(Object.keys(member).sort()).toEqual(['email_address', 'merge_fields', 'status_if_new'])
    expect(Object.keys(member.merge_fields).sort()).toEqual(['FNAME', 'LNAME'])
  })

  it('12. no postal ADDRESS is sent by the LIAP flow', async () => {
    const bodies: string[] = []
    process.env.MAILCHIMP_API_KEY = 'key-us1'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud'
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      bodies.push(String((init as RequestInit)?.body ?? ''))
      return new Response('{}', { status: 200 }) as never
    })

    await fulfilPreorder({
      email: 'noaddress@example.com',
      name: 'No Address',
      sourceId: 'cs_addr',
      idempotencyKey: 'evt_addr',
    })

    for (const body of bodies) {
      expect(body).not.toContain('ADDRESS')
      expect(body).not.toContain('addr1')
    }
    // And structurally: the LIAP CRM has no parameter that could carry one.
    expect(code('lib/liap/crm.ts')).not.toMatch(/address/i)
  })

  it('the results-email path sends a position tag, never a score', () => {
    const c = code('app/api/liap/results/email/route.ts')
    expect(c).toContain('positionTag')
    expect(c).not.toMatch(/tagLiapContact\([^)]*(total|score|urgent)/)
  })
})

// ── 13. FIRST AND LAST NAME, DISTINCTLY ─────────────────────────────────────

describe('LIAP capture asks for first and last name separately', () => {
  it('13. the preorder verification route requires both', () => {
    const c = code('app/api/liap/verify-preorder/route.ts')
    expect(c).toContain('body.firstName')
    expect(c).toContain('body.lastName')
    expect(c).toMatch(/if \(!firstName \|\| !lastName\)/)
  })

  it('and the form collects them as two fields', () => {
    const c = code('components/liap/VerifyPreorderForm.tsx')
    expect(c).toContain('given-name')
    expect(c).toContain('family-name')
    expect(c).not.toContain('autoComplete="name"')
  })

  it('passes them to the CRM without splitting a single string', async () => {
    const bodies: string[] = []
    process.env.MAILCHIMP_API_KEY = 'key-us1'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud'
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      bodies.push(String((init as RequestInit)?.body ?? ''))
      return new Response('{}', { status: 200 }) as never
    })

    await tagLiapContact('twopart@example.com', ['liap_interest'], {
      firstName: 'Maria',
      lastName: 'de la Cruz',
    })

    const member = JSON.parse(bodies[0]!)
    expect(member.merge_fields.FNAME).toBe('Maria')
    // The exact failure a single "name" field causes: a surname with spaces.
    expect(member.merge_fields.LNAME).toBe('de la Cruz')
  })
})

// ── 14, 15, 16, 17. CONSENT ─────────────────────────────────────────────────

describe('marketing consent is given, never inferred', () => {
  it('14. enrolment without explicit consent contacts Mailchimp not at all', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    process.env.MAILCHIMP_API_KEY = 'key-us1'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud'

    const { enrolled } = await enrolLiapMarketing({
      email: 'refused@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      consentGranted: false,
      source: 'liap_book_interest',
      tags: ['liap_interest'],
    })

    expect(enrolled).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
    // The refusal is RECORDED. "They said no, on this date" is the answer to
    // a later complaint; an absence proves nothing.
    expect(await hasMarketingConsentByEmail('refused@example.com')).toBe(false)
    const rows = await db.query<{ granted: boolean }>(
      `SELECT c.granted FROM consents c JOIN customers cu ON cu.id = c.customer_id
        WHERE lower(cu.email) = 'refused@example.com' AND c.consent_type = 'marketing'`
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.granted).toBe(false)
  })

  it('records an explicit grant with a version, timestamp and source', async () => {
    await recordMarketingConsent({
      email: 'yes@example.com',
      granted: true,
      source: 'liap_book_interest',
      firstName: 'Grace',
      lastName: 'Hopper',
    })
    const rows = await db.query<{
      granted: boolean
      version: string
      source: string
      recorded_at: string
    }>(
      `SELECT c.granted, c.version, c.source, c.recorded_at FROM consents c
         JOIN customers cu ON cu.id = c.customer_id
        WHERE lower(cu.email) = 'yes@example.com'`
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.granted).toBe(true)
    expect(rows[0]!.version).toBe('2026-08-31')
    expect(rows[0]!.source).toBe('liap_book_interest')
    expect(rows[0]!.recorded_at).toBeTruthy()
    expect(await hasMarketingConsentByEmail('yes@example.com')).toBe(true)
  })

  it('an opt-out after an opt-in wins, because the latest row is the answer', async () => {
    await recordMarketingConsent({ email: 'mind@example.com', granted: true, source: 'form' })
    expect(await hasMarketingConsentByEmail('mind@example.com')).toBe(true)
    await recordMarketingConsent({ email: 'mind@example.com', granted: false, source: 'form' })
    expect(await hasMarketingConsentByEmail('mind@example.com')).toBe(false)
  })

  it('15. a purchase alone does not imply marketing consent', async () => {
    const result = await fulfilPreorder({
      email: 'quiet.buyer@example.com',
      name: 'Quiet Buyer',
      sourceId: 'cs_quiet',
      idempotencyKey: 'evt_quiet',
    })
    expect(await hasEntitlement(result.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
    // Bought the book. Did not ask to be emailed.
    expect(await hasMarketingConsent(result.customerId)).toBe(false)
  })

  it('16. assessment completion alone does not imply marketing consent', async () => {
    const customerId = await seedCustomer(db, 'finisher@example.com')
    await tagLiapContact('finisher@example.com', ['liap_assessment_completed'], { customerId })
    expect(await hasMarketingConsent(customerId)).toBe(false)
  })

  it('nothing outside the consent module writes a marketing consent row', () => {
    const offenders: string[] = []
    for (const f of [
      'lib/liap/fulfilment.ts',
      'lib/liap/crm.ts',
      'lib/liap/assessment-service.ts',
      'app/api/liap/verify-preorder/route.ts',
      'app/api/stripe/webhook/route.ts',
    ]) {
      if (/INSERT INTO consents/i.test(code(f))) offenders.push(f)
    }
    expect(offenders).toEqual([])
  })

  it('17. new marketing contacts are pending, so double opt-in still applies', async () => {
    const bodies: string[] = []
    process.env.MAILCHIMP_API_KEY = 'key-us1'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud'
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      bodies.push(String((init as RequestInit)?.body ?? ''))
      return new Response('{}', { status: 200 }) as never
    })

    await enrolLiapMarketing({
      email: 'optin@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      consentGranted: true,
      source: 'liap_book_interest',
      tags: ['liap_interest'],
    })

    expect(JSON.parse(bodies[0]!).status_if_new).toBe('pending')
    // And never a forced status, which Mailchimp rejects on existing members.
    expect(bodies[0]).not.toMatch(/"status":/)
  })

  it('every LIAP CRM path enrols as pending, not subscribed', () => {
    const c = code('lib/liap/crm.ts')
    expect(c).toContain("statusIfNew: 'pending'")
    expect(c).not.toContain("statusIfNew: 'subscribed'")
  })
})

// ── CONSOLIDATION AND TAGS ──────────────────────────────────────────────────

describe('there is one Mailchimp client', () => {
  it('the webhook no longer carries its own implementation', () => {
    const c = code('app/api/stripe/webhook/route.ts')
    expect(c).toContain("from '@/lib/mailchimp'")
    // The tells of the second implementation: its own URL construction and its
    // own subscriber hashing.
    expect(c).not.toContain('api.mailchimp.com')
    expect(c).not.toContain("createHash('md5')")
  })

  it('the shared client never throws, so no caller can be broken by it', () => {
    const c = code('lib/mailchimp.ts')
    expect(c).not.toMatch(/throw new Error\(\s*`Mailchimp/)
  })

  it('one audience id, read in one place', () => {
    const c = code('lib/mailchimp.ts')
    expect(c.match(/MAILCHIMP_AUDIENCE_ID/g)!.length).toBeGreaterThan(0)
    expect(code('app/api/stripe/webhook/route.ts')).not.toContain('MAILCHIMP_AUDIENCE_ID')
  })
})

describe('the journey tag allow-list', () => {
  it('covers every owner-facing journey name', () => {
    for (const [name, tag] of Object.entries(LIAP_JOURNEY_NAMES)) {
      expect(LIAP_TAGS as readonly string[], name).toContain(tag)
    }
    expect(Object.keys(LIAP_JOURNEY_NAMES)).toHaveLength(8)
  })

  it('keeps assessment access and completion as two different states', () => {
    expect(LIAP_TAGS as readonly string[]).toContain('liap_assessment_entitled')
    expect(LIAP_TAGS as readonly string[]).toContain('liap_assessment_completed')
    // Completion must not retire the fact of entitlement: nothing deactivates
    // the access tag, so a completed customer is still a customer who has it.
    expect(code('lib/liap/crm.ts')).not.toContain('deactivateTags')
  })

  it('refuses a tag outside the allow-list', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    process.env.MAILCHIMP_API_KEY = 'key-us1'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud'
    const result = await tagLiapContact('x@example.com', ['not_a_tag' as never])
    expect(result).toEqual({ ok: true, skipped: true })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('keeps the Free Guide separately identifiable', () => {
    expect(LIAP_TAGS as readonly string[]).not.toContain('free-guide')
    expect(code('app/api/free-guide/route.ts')).toContain("'free-guide'")
  })

  it('has retreat tags but no retreat capture surface', () => {
    expect(LIAP_TAGS as readonly string[]).toContain('liap_retreat_interest')
    expect(LIAP_TAGS as readonly string[]).toContain('liap_retreat_registered')
    // The tags exist for segmentation. Nothing applies them, because there is
    // no retreat entry point and this task did not build one.
    const applied = ['app/api/liap/interest/route.ts', 'lib/liap/fulfilment.ts'].some((f) =>
      code(f).includes('liap_retreat')
    )
    expect(applied).toBe(false)
  })
})

// ── WHAT IS DELIBERATELY NOT FINISHED ───────────────────────────────────────
//
// These assert GAPS. They are here so the gaps are recorded where a developer
// will meet them, rather than only in a report, and so that closing one is a
// visible change to this file rather than something nobody notices.

describe('the standalone assessment now has its full path', () => {
  it('has a checkout route and a landing page that reaches it', () => {
    expect(() => source('app/api/liap/assessment-checkout/route.ts')).not.toThrow()
    // This previously asserted the ABSENCE of any purchase surface. The owner
    // supplied the landing-page copy, so the surface now exists.
    expect(code('components/liap/AssessmentCta.tsx')).toContain('/api/liap/assessment-checkout')
    expect(
      code('app/living-is-a-project/life-project-ready-assessment/page.tsx')
    ).toContain('AssessmentCta')
  })

  it('has the success page its checkout redirects to', () => {
    const route = code('app/api/liap/assessment-checkout/route.ts')
    expect(route).toContain('assessment-complete')
    // Previously asserted NOT to exist. It does now, so a completed payment
    // no longer lands on a 404.
    expect(() => source('app/living-is-a-project/assessment-complete/page.tsx')).not.toThrow()
  })

  it('has a seeded product row, so a purchase leaves an order trail', async () => {
    const rows = await db.query<{ id: string }>(
      `SELECT id FROM products WHERE product_key = 'LIAP_ASSESSMENT_STANDALONE'`
    )
    expect(rows).toHaveLength(1)
    const result = await fulfilStandaloneAssessment({
      email: 'seeded@example.com',
      sourceId: 'cs_seeded',
      idempotencyKey: 'evt_seeded',
    })
    // Previously null, because the row was absent and the order was skipped.
    expect(result.orderId).not.toBeNull()
    expect(await hasEntitlement(result.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)

    const items = await db.query<{ unit_amount: number }>(
      `SELECT unit_amount FROM order_items WHERE order_id = $1`,
      [result.orderId]
    )
    expect(items).toHaveLength(1)
    expect(items[0]!.unit_amount).toBe(2900)
  })
})

// ── 18, 19, 20. THE APPROVED ASSESSMENT WORK IS UNDISTURBED ─────────────────

describe('the approved Assessment V2 work still holds', () => {
  it('18. V1 report semantics are intact', async () => {
    const { semanticsFor } = await import('@/lib/liap/assessment/registry')
    const v1 = semanticsFor('LIAP_READY_V1')
    expect(v1.dimensions.map((d) => d.key)).toContain('risk')
    expect(v1.positionLabels.rebuild).toBe('Ready to Rebuild')
    expect(v1.priorityDimensions).toEqual(['money', 'risk', 'wellness'])
  })

  it('19. V2 report semantics are intact', async () => {
    const { semanticsFor } = await import('@/lib/liap/assessment/registry')
    const v2 = semanticsFor('LIAP_READY_V2')
    expect(v2.dimensions.map((d) => d.key)).toContain('spiritual')
    expect(v2.dimensions.map((d) => d.key)).not.toContain('risk')
    expect(v2.positionLabels.build).toBe('Ready to Build')
  })

  it('20. the Spiritual Readiness copy is still character-perfect', async () => {
    // Compared as DELIVERED rather than as written: the source escapes its
    // apostrophes, so a source-text comparison would pass on copy the customer
    // never sees and fail on copy that is correct.
    const { buildFullReport } = await import('@/lib/liap/recommendations')
    const { QUESTIONS } = await import('@/lib/liap/assessment/v2')
    const answers = Object.fromEntries(
      QUESTIONS.map((q) => [q.key, q.dimension === 'spiritual' ? 1 : 5])
    )
    const report = buildFullReport(answers as never, {
      changeType: 'expected',
      area: 'career',
      urgency: 2,
    } as never)
    const protect = report.actions.find((a) => a.kind === 'protect')!

    expect(protect.basis).toBe('spiritual')
    expect(protect.headline).toBe('Protect Your First Love')
    expect(protect.body).toBe(
      [
        "Life's demands, disappointments, and distractions can quietly pull our attention away from God. If that has happened, this is not an invitation to condemnation—it is an invitation to come closer.",
        "Remember your first love. Make room for God's presence and receive the assurance that you are accepted in the Beloved.",
        'Before seeking direction, return your heart to the One who directs your steps.',
      ].join('\n\n')
    )
    expect(source('lib/liap/recommendations.ts')).toContain('Remember. Return. Receive.')
  })
})

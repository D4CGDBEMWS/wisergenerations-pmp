import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb, seedCustomer } from './helpers/db'
import { grantEntitlement, hasEntitlement } from '@/lib/entitlements'
import { LIAP_ASSESSMENT_ACCESS } from '@/lib/liap/entitlements'
import { fulfilPreorder, fulfilStandaloneAssessment } from '@/lib/liap/fulfilment'
import { LIAP_ASSESSMENT, LIAP_BOOK } from '@/lib/liap/product'

// ---------------------------------------------------------------------------
// The Assessment landing page and its two access paths.
//
// The rule this file exists to hold: the two paths must stay apart until the
// server has decided. A reader who bought the book must never be shown a
// price, and a reader who has not must never get in by pressing a button that
// says they did.
// ---------------------------------------------------------------------------

const source = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const code = (p: string) =>
  source(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
/** JSX text with entities resolved, so copy is compared as a reader sees it. */
const rendered = (p: string) =>
  code(p)
    .replace(/&trade;/g, '™')
    .replace(/&rsquo;/g, '’')
    .replace(/&hellip;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&rarr;/g, '→')
    .replace(/\{'\s*'\}/g, ' ')
    .replace(/\s+/g, ' ')

const LANDING = 'app/living-is-a-project/life-project-ready-assessment/page.tsx'
const SUCCESS = 'app/living-is-a-project/assessment-complete/page.tsx'
const CTA = 'components/liap/AssessmentCta.tsx'
const SECURE = 'app/living-is-a-project/assessment/page.tsx'

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  const created = await createTestDb()
  db = created.db
  close = created.close
  setDbForTesting(db)
  delete process.env.MAILCHIMP_API_KEY
  delete process.env.MAILCHIMP_AUDIENCE_ID
})

afterEach(async () => {
  setDbForTesting(null)
  await close()
  vi.restoreAllMocks()
})

// ── 1, 2, 3, 15. THE LANDING PAGE ───────────────────────────────────────────

describe('the canonical Assessment landing page', () => {
  it('1. exists at the canonical route and renders as a page', () => {
    const c = code(LANDING)
    expect(c).toContain('export default function')
    expect(c).toContain('<main')
    expect(c).toContain('export const metadata')
  })

  it('2. does not put $29 anywhere near the title', () => {
    const c = rendered(LANDING)
    const h1 = c.slice(c.indexOf('<h1'), c.indexOf('</h1>'))
    expect(h1).toContain('Life Project-Ready™ Assessment')
    expect(h1).not.toContain('29')
    // Nor between the title and the first paragraph of body copy, which is
    // where a price would read as a toll on the idea rather than on the act.
    const titleToOpening = c.slice(c.indexOf('<h1'), c.indexOf('divine assignment'))
    expect(titleToOpening).not.toContain('29')
  })

  it('3. shows the price with the TAKE THE ASSESSMENT action', () => {
    const c = code(LANDING)
    // The price is passed to the CTA, so it can only render beside the button.
    expect(c).toContain('label="TAKE THE ASSESSMENT"')
    expect(c).toContain('priceLabel={LIAP_ASSESSMENT.priceLabel}')
    expect(LIAP_ASSESSMENT.priceLabel).toBe('$29.00')
    const cta = code(CTA)
    expect(cta).toContain("label = 'TAKE THE ASSESSMENT'")
    expect(cta).toContain('{priceLabel}')
  })

  it('and the page never hardcodes a price of its own', () => {
    // A second copy of the number is how a page ends up advertising one price
    // while the server charges another.
    expect(code(LANDING)).not.toMatch(/\$\s?29/)
  })

  it('15. carries the owner-approved copy verbatim', () => {
    const c = rendered(LANDING)
    for (const line of [
      'Life Project-Ready™ Assessment',
      'You are here by divine assignment, and we thank you for investing in YOU!',
      'Sometimes the first step forward is simply taking an honest look at where you are today.',
      'The Life Project-Ready™ Assessment gives you an opportunity to pause, reflect, and assess your life across eight important areas.',
      'Your results can help you recognize where you’re strong, what may deserve your attention, and where your next move may begin.',
      '40 questions. 8 dimensions. One clearer view of where you are.',
      'TAKE THE ASSESSMENT',
      'Your Assessment is included with your book purchase.',
      'ACCESS MY INCLUDED ASSESSMENT',
    ]) {
      expect(c, line).toContain(line)
    }
    // The secondary path's question, which spans elements in the markup.
    expect(c).toContain('Already purchased')
    expect(c).toContain('Living Is a Project…Are You Ready?')
  })

  it('carries the disclaimer verbatim', () => {
    expect(rendered(LANDING)).toContain(
      'The Life Project-Ready™ Assessment is a planning and educational tool. It is not a medical, mental-health, legal, tax, financial, or other professional diagnostic instrument.'
    )
  })

  it('is not presented as Destiny Projects™ or the Free Guide', () => {
    const c = code(LANDING)
    expect(c).not.toMatch(/Destiny Projects/i)
    expect(c).not.toMatch(/free.guide/i)
  })

  it('walks the approved journey', () => {
    const c = code(LANDING)
    for (const step of ['Compass', 'Road', 'Reflection', 'Assessment', 'Direction', 'Launch', 'Purpose']) {
      expect(c, step).toContain(`'${step}'`)
    }
  })

  it('keeps its decorative artwork out of the accessibility tree', () => {
    const c = code(LANDING)
    // Every <svg> and every gradient panel is decorative; none of them carries
    // information, so none of them should be announced.
    const svgCount = (c.match(/<svg/g) ?? []).length
    const hiddenSvg = (c.match(/<svg\s+aria-hidden="true"/g) ?? []).length
    expect(svgCount).toBeGreaterThan(0)
    expect(hiddenSvg).toBe(svgCount)
  })
})

// ── 4, 5. PATH A: THE STANDALONE PURCHASE ───────────────────────────────────

describe('Path A — the standalone $29 purchase', () => {
  it('4. the standalone CTA posts to the standalone checkout', () => {
    const c = code(CTA)
    expect(c).toContain("fetch('/api/liap/assessment-checkout'")
    // Never the book's checkout: the two products must not share a door.
    expect(c).not.toContain('/api/liap/preorder')
  })

  it('5. the server decides the price, and the client cannot', () => {
    expect(LIAP_ASSESSMENT.amount).toBe(2900)
    const route = code('app/api/liap/assessment-checkout/route.ts')
    expect(route).toContain('unit_amount: LIAP_ASSESSMENT.amount')
    // The request body is never read, so there is no parameter through which a
    // browser could propose an amount.
    expect(route).not.toMatch(/req\.json\(\)|body\.amount|unit_amount:\s*\d/)
    // And the button sends no body at all.
    expect(code(CTA)).not.toMatch(/body:\s*JSON\.stringify/)
  })

  it('6. a verified standalone purchase grants the entitlement', async () => {
    const result = await fulfilStandaloneAssessment({
      email: 'pathA@example.com',
      sourceId: 'cs_pathA',
      idempotencyKey: 'evt_pathA',
    })
    expect(await hasEntitlement(result.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
  })

  it('and the landing page itself grants nothing', () => {
    const c = code(LANDING)
    expect(c).not.toContain('grantEntitlement')
    expect(c).not.toContain('hasEntitlement')
  })
})

// ── 7, 8, 16. THE SUCCESS PAGE ──────────────────────────────────────────────

describe('the purchase success page', () => {
  it('7. is reachable only from the checkout redirect', () => {
    const c = code(SUCCESS)
    // Stripe appends session_id. Without it the visitor is sent back to the
    // landing page rather than shown a confirmation for a purchase they never
    // made.
    expect(c).toContain('params.session_id')
    expect(c).toContain("redirect('/living-is-a-project/life-project-ready-assessment')")
  })

  it('and grants nothing, however it was reached', () => {
    const c = code(SUCCESS)
    // The session id is a hint that somebody arrived from checkout, never
    // proof of payment. So it is read, and then nothing is decided with it:
    // no grant, no entitlement read, and no call to Stripe to "confirm" it.
    expect(c).toContain('params.session_id')
    expect(c).not.toContain('grantEntitlement')
    expect(c).not.toContain('hasEntitlement')
    expect(c).not.toMatch(/stripe/i)
  })

  it('8. BEGIN MY ASSESSMENT leads to the entitled assessment route', () => {
    const c = code(SUCCESS)
    expect(c).toContain('BEGIN MY ASSESSMENT')
    expect(c).toContain('href="/living-is-a-project/assessment"')
  })

  it('16. carries the owner-approved success copy verbatim', () => {
    const c = rendered(SUCCESS)
    for (const line of [
      'You’re Ready to Begin.',
      'Thank you for investing in YOU.',
      'This is the investment that keeps giving back.',
      'The Life Project-Ready™ Assessment is more than an opportunity to see where you are today. This is the step that gives you the ability to launch—with greater awareness of what is working, what deserves your attention, and where to focus next.',
      'Answer honestly—not based on where you think you should be, but where you are right now.',
      '40 questions. 8 dimensions. Your life. Your next move.',
      'BEGIN MY ASSESSMENT',
      'Your access is connected to the email used for your purchase.',
      'May this insight lead you to divine purpose.',
      'In His service,',
      'Crystal',
    ]) {
      expect(c, line).toContain(line)
    }
  })

  it('is not a second sales page', () => {
    const c = code(SUCCESS)
    for (const forbidden of [/workshop/i, /retreat/i, /coaching/i, /starter.kit/i]) {
      expect(c, String(forbidden)).not.toMatch(forbidden)
    }
    // Exactly one call to action, and it is the assessment.
    expect((c.match(/<Link/g) ?? []).length).toBe(1)
  })
})

// ── 9, 10, 11, 12. PATH B: THE BOOK PURCHASER ───────────────────────────────

describe('Path B — the reader who already bought the book', () => {
  it('9. the included-assessment path never starts a $29 checkout', () => {
    const c = code(LANDING)
    // The section is found by its owner-approved CTA, then checked in full.
    const idx = c.indexOf('ACCESS MY INCLUDED ASSESSMENT')
    expect(idx).toBeGreaterThan(-1)
    const section = c.slice(Math.max(0, idx - 1200), idx + 400)
    expect(section).not.toContain('assessment-checkout')
    expect(section).not.toContain('AssessmentCta')
    expect(section).toContain('href="/living-is-a-project/assessment"')
  })

  it('10. the CTA is a link that decides nothing', () => {
    const c = code(LANDING)
    // A <Link>, not a button with a handler: there is no code behind it that
    // could grant, record, or claim anything.
    expect(c).toMatch(/<Link[\s\S]{0,1200}ACCESS MY INCLUDED ASSESSMENT/)
    expect(c).not.toContain('onClick')
    expect(c).not.toContain("'use client'")
  })

  it('11. an unverified visitor cannot reach the secure assessment', () => {
    const c = code(SECURE)
    // Server-side, before a single question renders: no session redirects to
    // sign-in, and no entitlement shows the locked state instead of the form.
    expect(c).toContain('await readLiapAccess()')
    expect(c).toContain("redirect('/living-is-a-project/access')")
    expect(c).toContain('if (!access.entitled)')
    // The form is rendered only after both checks.
    expect(c.indexOf('if (!access.entitled)')).toBeLessThan(c.indexOf('<AssessmentForm'))
  })

  it('and entitlement is read from the database, not from the request', () => {
    const c = code('lib/liap/entitlements.ts')
    expect(c).toContain('hasEntitlement(session.customerId, LIAP_ASSESSMENT_ACCESS)')
    // Nothing in the access check reads a query string, header or body.
    expect(c).not.toMatch(/searchParams|headers\(\)|req\./)
  })

  it('12. a verified book purchaser keeps their included access', async () => {
    const result = await fulfilPreorder({
      email: 'bookreader@example.com',
      sourceId: 'cs_book',
      idempotencyKey: 'evt_book',
    })
    expect(await hasEntitlement(result.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
  })

  it('and a book purchaser is never charged the $29', async () => {
    const customerId = await seedCustomer(db, 'entitled@example.com')
    await grantEntitlement({
      customerId,
      entitlementKey: LIAP_ASSESSMENT_ACCESS,
      sourceType: 'order',
      idempotencyKey: `seed:${customerId}`,
    })
    expect(await hasEntitlement(customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
    // The access check is for the ENTITLEMENT, not for which product granted
    // it — so an entitled reader passes whichever door they came through, and
    // the locked branch that offers a purchase is never reached.
    const c = code(SECURE)
    const lockedBranch = c.slice(c.indexOf('if (!access.entitled)'), c.indexOf('<AssessmentForm'))
    expect(lockedBranch).not.toContain('assessment-checkout')
    expect(lockedBranch).not.toMatch(/\$\s?29/)
  })
})

// ── 5. RECOVERY, WITHOUT INVENTING A WORKFLOW ───────────────────────────────

describe('a purchaser who cannot be verified', () => {
  it('is offered the existing verification path, not a repurchase', () => {
    const c = code(SECURE)
    const lockedBranch = c.slice(c.indexOf('if (!access.entitled)'), c.indexOf('<AssessmentForm'))
    // The existing recovery architecture: retailer preorder verification.
    expect(lockedBranch).toContain('/living-is-a-project/verify-preorder')
    // And is never told they must buy it again.
    expect(lockedBranch).not.toMatch(/repurchase|buy it again|purchase again/i)
  })

  it('and is never auto-forwarded into checkout', () => {
    const c = code(SECURE)
    expect(c).not.toContain('assessment-checkout')
    expect(c).not.toContain('/api/liap/preorder')
  })
})

// ── 13, 14. PRICING UNCHANGED ───────────────────────────────────────────────

describe('the book is untouched', () => {
  it('13. remains $24.99', () => {
    expect(LIAP_BOOK.amount).toBe(2499)
    expect(LIAP_BOOK.priceLabel).toBe('$24.99')
  })

  it('14. still includes the assessment', async () => {
    const result = await fulfilPreorder({
      email: 'stillincluded@example.com',
      sourceId: 'cs_still',
      idempotencyKey: 'evt_still',
    })
    expect(await hasEntitlement(result.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
  })
})

// ── 17, 18, 19, 20. NOTHING ELSE MOVED ──────────────────────────────────────

describe('the approved assessment work and the marketing freeze', () => {
  it('17. V1 report integrity is intact', async () => {
    const { semanticsFor } = await import('@/lib/liap/assessment/registry')
    const v1 = semanticsFor('LIAP_READY_V1')
    expect(v1.dimensions.map((d) => d.key)).toContain('risk')
    expect(v1.positionLabels.rebuild).toBe('Ready to Rebuild')
  })

  it('18. V2 report integrity is intact', async () => {
    const { semanticsFor } = await import('@/lib/liap/assessment/registry')
    const v2 = semanticsFor('LIAP_READY_V2')
    expect(v2.dimensions.map((d) => d.key)).toContain('spiritual')
    expect(v2.positionLabels.build).toBe('Ready to Build')
  })

  it('19. the Spiritual Readiness copy is unchanged', async () => {
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
    expect(protect.headline).toBe('Protect Your First Love')
    expect(protect.body).toContain('condemnation—it is an invitation to come closer')
  })

  it('20. no Mailchimp behaviour is activated by either new page', () => {
    for (const f of [LANDING, SUCCESS, CTA]) {
      const c = code(f)
      expect(c, f).not.toMatch(/mailchimp/i)
      expect(c, f).not.toMatch(/tagLiapContact|enrolLiapMarketing|upsertSubscriber/)
      expect(c, f).not.toMatch(/campaign|newsletter|subscribe/i)
    }
  })

  it('and both pages stay behind the LIAP feature flag', () => {
    // They nest under the LIAP layout, which 404s while FEATURE_LIAP is off.
    const layout = code('app/living-is-a-project/layout.tsx')
    expect(layout).toContain("if (!isEnabled('LIAP')) notFound()")
    for (const f of [LANDING, SUCCESS]) {
      expect(f.startsWith('app/living-is-a-project/'), f).toBe(true)
      expect(code(f)).toContain('robots: { index: false, follow: false }')
    }
  })
})

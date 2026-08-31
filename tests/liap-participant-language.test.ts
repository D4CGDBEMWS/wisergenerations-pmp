import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb, seedCustomer } from './helpers/db'
import { grantEntitlement, hasEntitlement } from '@/lib/entitlements'
import { LIAP_ASSESSMENT_ACCESS, fulfilledForCheckoutSession } from '@/lib/liap/entitlements'
import { fulfilPreorder, fulfilStandaloneAssessment } from '@/lib/liap/fulfilment'
import { LIAP_ASSESSMENT, LIAP_BOOK } from '@/lib/liap/product'
import { ACTION_DISPLAY_LABELS, actionLabel } from '@/lib/liap/display-labels'
import { CLASSIFICATION_LABELS, STEADY_STEPS, needsSteady } from '@/lib/liap/scoring'
import { buildFullReport } from '@/lib/liap/recommendations'
import { resultsEmailHtml, resultsEmailText } from '@/lib/liap/results-email'
import { QUESTIONS, DIMENSION_KEYS, VERSION_KEY } from '@/lib/liap/assessment/v2'
import { PUBLICATION_DAY, PUBLICATION_MONTH, PREORDER_OPENS, CAMPAIGN_AWARENESS } from '@/lib/liap/launch'

// ---------------------------------------------------------------------------
// The participant language standard, owner-approved 31 August 2026.
//
// One rule underneath all of it: a participant reads approved language, never
// a database value and never a retired model. What is stored and what is shown
// are different things, and the gap between them is where raw keys leak.
// ---------------------------------------------------------------------------

const source = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const code = (p: string) =>
  source(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const RESULTS_PAGE = 'app/living-is-a-project/results/[token]/page.tsx'
const SUCCESS = 'app/living-is-a-project/assessment-complete/page.tsx'
const PDF = 'lib/liap/snapshot-pdf.ts'
const EMAIL = 'lib/liap/results-email.ts'

/** Every participant-facing surface that renders an action. */
const ACTION_SURFACES = [RESULTS_PAGE, EMAIL, PDF]

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

const CALM = { changeType: 'expected', area: 'career', urgency: 2 } as never
function answers(overrides: Partial<Record<string, number>> = {}) {
  return Object.fromEntries(
    QUESTIONS.map((q) => [q.key, overrides[q.dimension] ?? 3])
  ) as never
}

// ── 12–14, 17–20. THE CANONICAL DISPLAY MAPPING ─────────────────────────────

describe('one canonical display mapping, three surfaces', () => {
  it('12, 13, 14. maps each stored key to its approved label', () => {
    expect(ACTION_DISPLAY_LABELS.protect).toBe('PROTECT')
    expect(ACTION_DISPLAY_LABELS.resolve).toBe('GIVE ATTENTION')
    expect(ACTION_DISPLAY_LABELS.move).toBe('STRENGTHEN')
    expect(actionLabel('protect')).toBe('PROTECT')
    expect(actionLabel('resolve')).toBe('GIVE ATTENTION')
    expect(actionLabel('move')).toBe('STRENGTHEN')
  })

  it('17, 18, 19. every participant surface reads from it', () => {
    for (const f of ACTION_SURFACES) {
      expect(code(f), f).toContain('actionLabel(')
    }
  })

  it('and no surface keeps a map of its own', () => {
    for (const f of ACTION_SURFACES) {
      const c = code(f)
      // The old literal maps and ternaries. Any of them returning would mean
      // two sources of truth for what a participant reads.
      expect(c, f).not.toMatch(/ACTION_HEADING/)
      expect(c, f).not.toMatch(/'protect'\s*\?\s*'/)
      expect(c, f).not.toMatch(/:\s*'Resolve'/)
      expect(c, f).not.toMatch(/:\s*'Move'/)
    }
  })

  it('20. the PDF no longer uppercases a raw stored key', () => {
    const c = code(PDF)
    expect(c).not.toContain('kind.toUpperCase()')
    expect(c).toContain('actionLabel(a.kind)')
  })

  it('and no surface can print a raw key by any route', () => {
    for (const f of ACTION_SURFACES) {
      expect(code(f), f).not.toMatch(/\bkind\.toUpperCase\(\)/)
      // Every use of the raw key must be either a React reconciliation key
      // (never rendered) or an argument to actionLabel. A bare interpolation
      // would put a database value on the page.
      for (const m of code(f).matchAll(/[\w.]*\bkind\b/g)) {
        const before = code(f).slice(Math.max(0, m.index! - 24), m.index!)
        const ok = /key=\{$|actionLabel\($|kind:\s*$/.test(before)
        expect(ok, `${f}: bare use of kind at ${m.index}`).toBe(true)
      }
    }
    // An unrecognised value yields nothing rather than the value itself.
    expect(actionLabel('resolve_v2')).toBe('')
    expect(actionLabel('MOVE')).toBe('')
    expect(actionLabel('')).toBe('')
  })

  it('13, 14. the rendered email shows the approved labels, not the keys', () => {
    const report = buildFullReport(answers({ money: 1 }), CALM)
    const rendered = {
      ...report,
      actions: report.actions.map((a) => ({
        kind: a.kind,
        headline: a.headline,
        body: a.body,
        basis: a.basis,
      })),
      plan: { ...report.plan, phases: report.plan.phases.map((p) => ({ ...p })) },
    } as never

    const html = resultsEmailHtml(rendered, 'https://example.com/r/abc')
    const text = resultsEmailText(rendered, 'https://example.com/r/abc')

    for (const out of [html, text]) {
      expect(out).toContain('PROTECT')
      expect(out).toContain('GIVE ATTENTION')
      expect(out).toContain('STRENGTHEN')
      // The participant-facing keys must be gone from what is sent.
      expect(out).not.toMatch(/\bRESOLVE\b/)
      expect(out).not.toMatch(/\bMOVE\b/)
      expect(out).not.toMatch(/>Resolve</)
    }
  })
})

// ── 15, 16. POSITIVE FRAMING ────────────────────────────────────────────────

describe('the positive-framing replacements', () => {
  it('15. Priority to Strengthen replaces Immediate attention', () => {
    expect(CLASSIFICATION_LABELS.immediate).toBe('Priority to Strengthen')
    expect(Object.values(CLASSIFICATION_LABELS)).not.toContain('Immediate attention')
  })

  it('and the scoring threshold behind it is untouched', async () => {
    const { classify } = await import('@/lib/liap/scoring')
    expect(classify(10)).toBe('immediate')
    expect(classify(11)).toBe('priority')
    expect(classify(15)).toBe('priority')
    expect(classify(16)).toBe('build')
    expect(classify(20)).toBe('build')
    expect(classify(21)).toBe('strength')
  })

  it('16. Start Here replaces Needs attention first, on both surfaces', () => {
    for (const f of [RESULTS_PAGE, PDF]) {
      const c = code(f)
      expect(c, f).toContain('Start Here')
      expect(c, f).not.toContain('Needs attention first')
    }
  })

  it('replaces the two approved plan sentences exactly', () => {
    const report = buildFullReport(answers({ money: 1, wellness: 2 }), CALM)
    const all = report.plan.phases.flatMap((p) => p.items.map((i) => i.text)).join(' | ')
    expect(all).toContain(
      'this is where your answers show the greatest opportunity for growth right now.'
    )
    expect(all).toContain(
      'it is the next area where focused attention may create meaningful progress.'
    )
    expect(all).not.toContain('the least room right now')
    expect(all).not.toContain('will limit progress')
  })

  it('does not characterise the participant as broken', () => {
    // Not a banned-word sweep: these are the phrasings that describe the
    // PERSON rather than the situation, which is the line the standard draws.
    const surfaces = [RESULTS_PAGE, SUCCESS, PDF, EMAIL, 'lib/liap/recommendations.ts']
    for (const f of surfaces) {
      const c = code(f)
      for (const bad of [/you are failing/i, /you are broken/i, /deficien/i, /bad score/i]) {
        expect(c, `${f} ${bad}`).not.toMatch(bad)
      }
    }
  })
})

// ── 21, 22, 23. INTERNAL COMPATIBILITY ──────────────────────────────────────

describe('the persisted keys are untouched', () => {
  it('21, 22. resolve and move remain the stored kinds', () => {
    const report = buildFullReport(answers({ money: 1 }), CALM)
    expect(report.actions.map((a) => a.kind)).toEqual(['protect', 'resolve', 'move'])
  })

  it('23. a historical stored report still renders through the mapping', () => {
    // Exactly the shape held in assessment_results.next_best_three.
    const stored = [
      { kind: 'protect', headline: 'h1', body: 'b1', basis: 'money' },
      { kind: 'resolve', headline: 'h2', body: 'b2', basis: 'time' },
      { kind: 'move', headline: 'h3', body: 'b3', basis: 'vision' },
    ]
    expect(stored.map((a) => actionLabel(a.kind))).toEqual([
      'PROTECT',
      'GIVE ATTENTION',
      'STRENGTHEN',
    ])
  })

  it('and nothing renamed the keys in the engine', () => {
    const c = code('lib/liap/recommendations.ts')
    expect(c).toContain("kind: 'protect'")
    expect(c).toContain("kind: 'resolve'")
    expect(c).toContain("kind: 'move'")
    expect(c).not.toContain("kind: 'give_attention'")
    expect(c).not.toContain("kind: 'strengthen'")
  })
})

// ── 24, 25. S.T.E.A.D.Y. ────────────────────────────────────────────────────

describe('S.T.E.A.D.Y. is retired from customer-facing LIAP', () => {
  it('24. renders on no participant surface', () => {
    for (const f of [RESULTS_PAGE, SUCCESS, PDF, EMAIL]) {
      const c = code(f) // comments stripped, so the retirement note does not count
      expect(c, f).not.toMatch(/S\.T\.E\.A\.D\.Y\./)
      expect(c, f).not.toContain('STEADY_STEPS')
    }
  })

  it('and no plan item mentions it', () => {
    for (const intake of [
      { changeType: 'unexpected', area: 'career', urgency: 5 },
      { changeType: 'expected', area: 'career', urgency: 2 },
    ]) {
      const report = buildFullReport(answers({ money: 1 }), intake as never)
      const all = report.plan.phases.flatMap((p) => p.items.map((i) => i.text)).join(' ')
      expect(all).not.toMatch(/S\.T\.E\.A\.D\.Y\.|STEADY/i)
    }
  })

  it('25. internal identifiers remain, so stored routing still works', () => {
    expect(typeof needsSteady).toBe('function')
    expect(STEADY_STEPS.length).toBe(6)
    expect(needsSteady({ changeType: 'unexpected', area: null, urgency: 1 } as never)).toBe(true)
    // And the flag still reaches the report, which is what steady_routed stores.
    const report = buildFullReport(answers(), {
      changeType: 'unexpected',
      area: 'career',
      urgency: 5,
    } as never)
    expect(report.steady).toBe(true)
  })
})

// ── 26, 27. WISER PIVOTS™ ───────────────────────────────────────────────────

describe('Wiser Pivots™', () => {
  it('26. the canonical model is unchanged', async () => {
    const { PIVOT_INTRO, PIVOT_STEPS } = await import('@/lib/game/pivot')
    expect(PIVOT_INTRO.heading).toBe('WISER Pivots™')
    expect(PIVOT_STEPS.map((s) => s.title)).toEqual([
      'WAIT',
      'INSPECT',
      'SELECT',
      'EMBRACE',
      'PIVOT',
      'REVIEW',
    ])
  })

  it('27. does not replace The LIAP Way™', () => {
    // Nothing renames one to the other, in either direction.
    const c = source('lib/game/pivot.ts')
    expect(c).not.toMatch(/LIAP Way/i)
  })

  it('and no new Wiser Pivots copy was invented for a LIAP surface', () => {
    for (const f of [RESULTS_PAGE, SUCCESS, PDF, EMAIL, 'lib/liap/recommendations.ts']) {
      expect(code(f), f).not.toMatch(/Wiser Pivots|WISER Pivot/i)
    }
  })
})

// ── 5–11. THE SUCCESS PAGE AND ITS AUTHORITY ────────────────────────────────

describe('the success page checks entitlement and grants nothing', () => {
  it('6. grants no entitlement, creates no order, starts no checkout', () => {
    const c = code(SUCCESS)
    expect(c).not.toContain('grantEntitlement')
    expect(c).not.toMatch(/INSERT INTO/i)
    expect(c).not.toContain('assessment-checkout')
    expect(c).not.toMatch(/stripe/i)
  })

  it('7. a session_id alone cannot grant or imply entitlement', async () => {
    // No order behind it, so it answers false — an invented id gets nothing.
    expect(await fulfilledForCheckoutSession('cs_invented_by_hand')).toBe(false)
    expect(await fulfilledForCheckoutSession('')).toBe(false)
  })

  it('and an unpaid order behind a real id still answers false', async () => {
    const customerId = await seedCustomer(db, 'unpaid@example.com')
    await db.query(
      `INSERT INTO orders (customer_id, stripe_checkout_session_id, status, amount, currency)
       VALUES ($1, 'cs_unpaid', 'pending', 2900, 'usd')`,
      [customerId]
    )
    expect(await fulfilledForCheckoutSession('cs_unpaid')).toBe(false)
  })

  it('8. a fulfilled purchase resolves to entitled', async () => {
    const result = await fulfilStandaloneAssessment({
      email: 'done@example.com',
      sourceId: 'cs_done',
      idempotencyKey: 'evt_done',
    })
    expect(await hasEntitlement(result.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
    expect(await fulfilledForCheckoutSession('cs_done')).toBe(true)
  })

  it('9. the waiting state carries the approved copy', () => {
    const c = source(SUCCESS)
    expect(c).toContain('We&rsquo;re Confirming Your Access')
    expect(c).toContain(
      'Your purchase is being processed. Your Assessment access should be ready shortly.'
    )
    expect(c).toContain('Please give us a moment to complete your access.')
    expect(c).toContain('CHECK MY ACCESS')
  })

  it('8. the entitled state carries the approved copy', () => {
    const c = source(SUCCESS)
    for (const line of [
      'You&rsquo;re Ready to Begin.',
      'Thank you for investing in YOU.',
      'This is the investment that keeps giving back.',
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

  it('10. CHECK MY ACCESS can only re-check', () => {
    const c = code(SUCCESS)
    const idx = c.indexOf('CHECK MY ACCESS')
    expect(idx).toBeGreaterThan(-1)
    const around = c.slice(Math.max(0, idx - 900), idx + 100)
    // A plain anchor back to this same page. No handler, no form, no fetch.
    expect(around).toContain('href={`/living-is-a-project/assessment-complete?session_id=')
    expect(around).not.toContain('onClick')
    expect(around).not.toContain('fetch(')
    expect(c).not.toContain("'use client'")
  })

  it('11. the webhook remains the payment authority', () => {
    const webhook = code('app/api/stripe/webhook/route.ts')
    expect(webhook).toContain('fulfilStandaloneAssessment')
    expect(webhook).toContain("payment_status === 'paid'")
    // And fulfilment is the only place the entitlement is granted.
    expect(code('lib/liap/fulfilment.ts')).toContain('grantEntitlement')
  })

  it('5. the secure assessment re-checks independently', () => {
    const c = code('app/living-is-a-project/assessment/page.tsx')
    expect(c).toContain('await readLiapAccess()')
    expect(c).toContain('if (!access.entitled)')
  })
})

// ── 1–4. PRICING AND PATHS ──────────────────────────────────────────────────

describe('pricing and the two paths are unchanged', () => {
  it('1, 2. $29 standalone, $24.99 book', () => {
    expect(LIAP_ASSESSMENT.amount).toBe(2900)
    expect(LIAP_BOOK.amount).toBe(2499)
  })

  it('3. a book purchase includes the assessment', async () => {
    const r = await fulfilPreorder({
      email: 'incl@example.com',
      sourceId: 'cs_incl',
      idempotencyKey: 'evt_incl',
    })
    expect(await hasEntitlement(r.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
  })

  it('4. the included path never enters standalone checkout', () => {
    const c = code('app/living-is-a-project/life-project-ready-assessment/page.tsx')
    const idx = c.indexOf('ACCESS MY INCLUDED ASSESSMENT')
    const section = c.slice(Math.max(0, idx - 1200), idx + 400)
    expect(section).not.toContain('assessment-checkout')
    expect(section).toContain('href="/living-is-a-project/assessment"')
    expect(code('app/living-is-a-project/assessment/page.tsx')).not.toContain('assessment-checkout')
  })

  it('and an entitled purchaser is never shown a price on the secure route', async () => {
    const customerId = await seedCustomer(db, 'entitled@example.com')
    await grantEntitlement({
      customerId,
      entitlementKey: LIAP_ASSESSMENT_ACCESS,
      sourceType: 'order',
      idempotencyKey: `seed:${customerId}`,
    })
    expect(await hasEntitlement(customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
    expect(code('app/living-is-a-project/assessment/page.tsx')).not.toMatch(/\$\s?29/)
  })
})

// ── 28–35. ASSESSMENT INTEGRITY ─────────────────────────────────────────────

describe('the assessment itself did not move', () => {
  it('28. V1 remains immutable, with risk and forty questions', () => {
    const v1 = source('lib/liap/assessment/v1.ts')
    expect(v1).toContain("export const VERSION_KEY = 'LIAP_READY_V1'")
    expect(v1).toContain("key: 'risk'")
    expect(v1.match(/dimension: '/g)).toHaveLength(40)
  })

  it('29, 30. V2 is 8 dimensions and 40 unchanged questions', () => {
    expect(VERSION_KEY).toBe('LIAP_READY_V2')
    expect(DIMENSION_KEYS).toHaveLength(8)
    expect(QUESTIONS).toHaveLength(40)
    // Spot-checks on the typography a tidy would silently normalise.
    expect(QUESTIONS[4]!.text).toContain('“better”')
    expect(QUESTIONS[17]!.text).toContain('—and does not align—')
    expect(QUESTIONS[39]!.text).toContain('lasting value—wisdom')
  })

  it('31, 32. scoring and thresholds are unchanged', async () => {
    const { position, MIN_TOTAL, MAX_TOTAL } = await import('@/lib/liap/scoring')
    expect(MIN_TOTAL).toBe(40)
    expect(MAX_TOTAL).toBe(200)
    expect(position(200)).toBe('move')
    expect(position(160)).toBe('move')
    expect(position(159)).toBe('plan')
    expect(position(120)).toBe('plan')
    expect(position(119)).toBe('build')
    expect(position(80)).toBe('build')
    expect(position(79)).toBe('stabilize')
  })

  it('33. hidden urgency remains at ten or below', async () => {
    const { hiddenUrgencies, classify } = await import('@/lib/liap/scoring')
    const scores = DIMENSION_KEYS.map((key) => ({
      key,
      name: key,
      score: key === 'spiritual' ? 10 : 25,
      classification: classify(key === 'spiritual' ? 10 : 25),
    }))
    expect(hiddenUrgencies(scores as never).map((s) => s.key)).toEqual(['spiritual'])
    expect(code('lib/liap/scoring.ts')).toContain('s.score <= 10')
  })

  it('34. the Spiritual Readiness copy is unchanged', () => {
    const report = buildFullReport(answers({ spiritual: 1 }), CALM)
    const protect = report.actions.find((a) => a.kind === 'protect')!
    expect(protect.headline).toBe('Protect Your First Love')
    expect(protect.body).toContain('condemnation—it is an invitation to come closer')
    expect(source('lib/liap/recommendations.ts')).toContain('Remember. Return. Receive.')
  })

  it('35. nothing on the scoring path calls a model', () => {
    for (const f of ['lib/liap/scoring.ts', 'lib/liap/recommendations.ts']) {
      const c = code(f)
      expect(c, f).not.toMatch(/anthropic|openai|\bllm\b|generateText|createMessage/i)
      expect(c, f).not.toMatch(/fetch\(|https?:\/\//)
    }
  })
})

// ── 36, 37. BOOK METADATA AND TIMELINE ──────────────────────────────────────

describe('the book timeline', () => {
  it('36. September awareness, October 1 preorder, November publication', () => {
    expect(CAMPAIGN_AWARENESS).toBe('September 2026')
    expect(PREORDER_OPENS).toBe('October 1, 2026')
    expect(PUBLICATION_MONTH).toBe('November 2026')
  })

  it('37. no November publication day is invented', () => {
    expect(PUBLICATION_DAY).toBeNull()
  })

  it('and October is never called publication', () => {
    const c = source('lib/liap/launch.ts')
    expect(c).not.toMatch(/publication[^.\n]{0,40}October/i)
  })

  it('the book price and canonical route are unchanged', () => {
    expect(LIAP_BOOK.priceLabel).toBe('$24.99')
    expect(existsSync(join(process.cwd(), 'app/living-is-a-project/book/page.tsx'))).toBe(true)
  })
})

// ── 38–40, 46, 47. WHAT THIS TASK MUST NOT HAVE TOUCHED ─────────────────────

describe('the surfaces this task must not have touched', () => {
  it('38. no book-launch email content exists in the repository to change', () => {
    // Emails #1–#8 are held outside this repository. Nothing here renders them,
    // so nothing here could have rewritten them.
    const hits = ['lib/liap/results-email.ts', 'lib/liap/results-delivery.ts']
      .map((f) => code(f))
      .join(' ')
    expect(hits).not.toMatch(/PREORDERS ARE OPEN|LOOK AGAIN|THE BEND|IT'S HERE|IT'S YOUR MOVE/i)
  })

  it('39. no journey map or roadmap reaches an email surface', () => {
    for (const f of ['lib/liap/results-email.ts', 'lib/liap/results-delivery.ts']) {
      const c = code(f)
      expect(c, f).not.toMatch(/journey.?map|roadmap|road event/i)
    }
  })

  it('40. no substitute or generated Crystal likeness was introduced', () => {
    // Nothing in this task references an author photo at all.
    for (const f of [RESULTS_PAGE, SUCCESS, PDF, EMAIL]) {
      expect(code(f), f).not.toMatch(/crystal[-_ ]?(headshot|photo|portrait)/i)
    }
  })

  it('46, 47. no QR activation and no protected retreat content', () => {
    for (const f of [RESULTS_PAGE, SUCCESS, PDF, EMAIL]) {
      const c = code(f)
      expect(c, f).not.toMatch(/\bqr\b/i)
      expect(c, f).not.toMatch(/retreat|facilitator|Completed Life Project Plan/i)
    }
  })

  it('48. the interactive results experience was not built', () => {
    const c = code(RESULTS_PAGE)
    // The future SEE → LOOK CLOSER → CHOOSE → CONTINUE design is on hold.
    expect(c).not.toMatch(/LOOK CLOSER|CONTINUE THE JOURNEY/i)
    expect(c).not.toContain("'use client'")
  })
})

// ── 41–45. FREEZES ──────────────────────────────────────────────────────────

describe('the freezes held', () => {
  it('41. migrations 0005, 0006 and 0007 exist but nothing applies them', () => {
    for (const m of [
      '0005_results_email_delivery.sql',
      '0006_liap_partner_attribution.sql',
      '0007_seed_liap_assessment_product.sql',
    ]) {
      expect(existsSync(join(process.cwd(), 'db/migrations', m)), m).toBe(true)
    }
    // The only runner is an explicit npm script, never called from app code.
    const appCode = [RESULTS_PAGE, SUCCESS, 'lib/liap/fulfilment.ts']
      .map((f) => code(f))
      .join(' ')
    expect(appCode).not.toMatch(/migrate|CREATE TABLE|ALTER TABLE/i)
  })

  it('42, 43. no live Stripe configuration and no Neon connection here', () => {
    for (const f of [RESULTS_PAGE, SUCCESS]) {
      const c = code(f)
      expect(c, f).not.toMatch(/stripe/i)
      expect(c, f).not.toMatch(/neon|DATABASE_URL/i)
    }
  })

  it('44. no Mailchimp activation on any surface this task touched', () => {
    for (const f of [RESULTS_PAGE, SUCCESS, PDF, EMAIL, 'lib/liap/display-labels.ts']) {
      expect(code(f), f).not.toMatch(/mailchimp|upsertSubscriber|enrolLiapMarketing/i)
    }
  })

  it('45. LIAP remains behind its feature flag', () => {
    expect(code('app/living-is-a-project/layout.tsx')).toContain("if (!isEnabled('LIAP')) notFound()")
    expect(code(SUCCESS)).toContain('robots: { index: false, follow: false }')
  })
})

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  DIMENSIONS, DIMENSION_KEYS, QUESTIONS, SCALE, VERSION_KEY, STEPS,
} from '@/lib/liap/assessment/v2'
import {
  position, POSITION_LABELS, POSITION_MEANINGS, classify, hiddenUrgencies,
  PRIORITY_DIMENSIONS, buildScoreReport,
} from '@/lib/liap/scoring'

// ---------------------------------------------------------------------------
// The owner's question-by-question review, 31 August 2026, is the canonical
// assessment content master. This file is the check that the repository still
// says what the master says.
//
// It compares question text exactly rather than loosely, because the failure
// this guards against is not deletion — nobody deletes a question by accident.
// It is the small tidy: a curly quote straightened, an em dash normalised, a
// sentence trimmed by a word. Each is invisible in review and each changes the
// instrument, because rephrasing a question changes what people answer.
// ---------------------------------------------------------------------------

const source = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const code = (p: string) =>
  source(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/** The forty approved questions, in the owner's order. */
const MASTER: readonly [string, string][] = [
  ['vision', 'I can describe what I want the next season of my life to look like.'],
  ['vision', 'I know which outcomes matter most to me right now.'],
  ['vision', 'I can distinguish what I truly want from what others expect of me.'],
  ['vision', 'I have identified what I want to preserve even though circumstances are changing.'],
  ['vision', 'I can describe what “better” would look like 90 days from now.'],
  ['time', 'I know where most of my time is currently going.'],
  ['time', 'My calendar reflects the priorities I say matter most.'],
  ['time', 'I have enough margin to respond when something unexpected happens.'],
  ['time', 'I can identify commitments that no longer deserve my time.'],
  ['time', 'I consistently protect time for what matters most.'],
  ['money', 'I understand my current financial picture well enough to make informed decisions.'],
  ['money', 'My spending generally reflects what I say matters most.'],
  ['money', 'I know which financial obligations limit my options right now.'],
  ['money', 'I have identified financial resources I may be overlooking or underusing.'],
  ['money', 'I am taking practical steps to strengthen my financial position.'],
  ['career', 'I can explain what meaningful work looks like for me in this season.'],
  ['career', 'I understand which of my skills and experiences are most valuable right now.'],
  ['career', 'I know where my current work aligns—and does not align—with my values and priorities.'],
  ['career', 'I can identify opportunities to use my abilities in ways I may not have considered before.'],
  ['career', 'I am taking intentional steps toward work or contribution that reflects my purpose.'],
  ['relationships', 'I can identify the people who provide healthy support, wisdom, or encouragement in this season of my life.'],
  ['relationships', 'I am giving appropriate time and attention to the relationships that matter most to me.'],
  ['relationships', 'I communicate clearly with people who may be affected by the decisions I make.'],
  ['relationships', 'I can establish healthy boundaries when they are necessary to protect my well-being, priorities, or relationships.'],
  ['relationships', 'I know when to seek input or support from others and when a decision is mine to make.'],
  ['wellness', 'I pay attention to signs that stress, exhaustion, or lack of rest may be affecting my well-being or decisions.'],
  ['wellness', 'I understand my current capacity and can recognize when I am taking on more than I can realistically carry.'],
  ['wellness', 'I have healthy routines or practices that support my physical, mental, and emotional well-being.'],
  ['wellness', 'I know when to seek appropriate professional, practical, or community support rather than trying to handle everything alone.'],
  ['wellness', 'I make room for rest, reflection, and recovery so I can make thoughtful rather than purely reactive decisions.'],
  ['spiritual', 'I make intentional time to seek God for wisdom and direction before making important decisions.'],
  ['spiritual', 'I can distinguish between moving from faith and purpose and reacting from fear, pressure, or impatience.'],
  ['spiritual', 'I consider whether my choices align with my faith, values, and the principles I believe God has called me to live by.'],
  ['spiritual', 'I can trust God with what I cannot control while taking responsibility for what He has placed within my ability to do.'],
  ['spiritual', 'I am willing to adjust my plans when prayer, wisdom, or circumstances reveal that a different direction may be needed.'],
  ['legacy', 'My decisions reflect the values and principles I want my life to be known for.'],
  ['legacy', 'I consider how the decisions I make today may shape my future and the opportunities available to me later.'],
  ['legacy', 'I consider how my choices may affect my family, the people connected to me, and those who may come after me.'],
  ['legacy', 'I am intentional about turning what I have learned, overcome, or been entrusted with into something that can benefit others.'],
  ['legacy', 'I can identify something of lasting value—wisdom, resources, relationships, opportunities, or impact—that I want to leave behind.'],
]

// ── A, B, C, D: structure ────────────────────────────────────────────────
describe('the approved structure', () => {
  it('has exactly eight dimensions', () => {
    expect(DIMENSIONS).toHaveLength(8)
    expect(DIMENSION_KEYS).toHaveLength(8)
  })

  it('names them in the owner’s order', () => {
    expect(DIMENSIONS.map((d) => d.name)).toEqual([
      'Vision', 'Time', 'Money', 'Career & Purpose',
      'Relationships', 'Health & Wellness', 'Spiritual Readiness', 'Legacy & Impact',
    ])
  })

  it('has exactly forty questions', () => {
    expect(QUESTIONS).toHaveLength(40)
  })

  it('has exactly five per dimension, and none orphaned', () => {
    for (const key of DIMENSION_KEYS) {
      expect(QUESTIONS.filter((q) => q.dimension === key), `${key}`).toHaveLength(5)
    }
    for (const q of QUESTIONS) {
      expect(DIMENSION_KEYS, `${q.key} has an unknown dimension`).toContain(q.dimension)
    }
  })

  it('gives every question a distinct key', () => {
    expect(new Set(QUESTIONS.map((q) => q.key)).size).toBe(40)
  })
})

// ── E: verbatim ──────────────────────────────────────────────────────────
describe('all forty questions match the master verbatim', () => {
  it('same text, same dimension, same order', () => {
    expect(QUESTIONS.map((q) => [q.dimension, q.text])).toEqual(MASTER.map(([d, t]) => [d, t]))
  })

  it('keeps the typography the owner approved', () => {
    // The curly quotes in Q5 and the em dashes in Q18 and Q40 are the details a
    // well-meaning editor normalises without mentioning it.
    expect(QUESTIONS[4]!.text).toContain('“better”')
    expect(QUESTIONS[17]!.text).toContain('—and does not align—')
    expect(QUESTIONS[39]!.text).toContain('lasting value—wisdom')
  })
})

// ── F, G, H: the deterministic scale and ranges ──────────────────────────
describe('the scale and the arithmetic', () => {
  it('is 1 to 5, five options', () => {
    expect(SCALE.map((s) => s.value)).toEqual([1, 2, 3, 4, 5])
  })

  it('gives each dimension a 5–25 range', () => {
    expect(5 * 1).toBe(5)
    expect(5 * 5).toBe(25)
    expect(classify(5)).toBe('immediate')
    expect(classify(25)).toBe('strength')
  })

  it('gives a 40–200 total range', () => {
    expect(QUESTIONS.length * 1).toBe(40)
    expect(QUESTIONS.length * 5).toBe(200)
    expect(position(40)).toBe('stabilize')
    expect(position(200)).toBe('move')
  })
})

// ── I, J: classifications ────────────────────────────────────────────────
describe('the four approved classifications', () => {
  it('bands exactly as the owner ruled', () => {
    expect(position(200)).toBe('move')
    expect(position(160)).toBe('move')
    expect(position(159)).toBe('plan')
    expect(position(120)).toBe('plan')
    expect(position(119)).toBe('build')
    expect(position(80)).toBe('build')
    expect(position(79)).toBe('stabilize')
    expect(position(40)).toBe('stabilize')
  })

  it('labels them as approved', () => {
    expect(POSITION_LABELS).toEqual({
      move: 'Ready to Move',
      plan: 'Ready to Plan',
      build: 'Ready to Build',
      stabilize: 'Ready to Stabilize',
    })
  })

  it('carries the owner’s meanings verbatim', () => {
    expect(POSITION_MEANINGS.move).toBe('You have a strong foundation. Move forward intentionally while continuing to watch any dimension requiring attention.')
    expect(POSITION_MEANINGS.plan).toBe('You have direction. Strengthen the areas that need structure before making your next major move.')
    expect(POSITION_MEANINGS.build).toBe('Important areas need development. Build the foundation and resources needed for sustainable progress.')
    expect(POSITION_MEANINGS.stabilize).toBe('Your priority is not to fix everything at once. Protect what matters, address what requires immediate attention, and move deliberately.')
  })

  it('uses no pass/fail language anywhere in the result copy', () => {
    const all = Object.values(POSITION_MEANINGS).join(' ') + Object.values(POSITION_LABELS).join(' ')
    expect(all).not.toMatch(/\bpass\b|\bfail\b|\bsuccessful\b|\bunsuccessful\b|\bscore well\b/i)
  })

  it('READY TO REBUILD is gone from active behaviour', () => {
    for (const f of ['lib/liap/scoring.ts', 'lib/liap/analytics.ts', 'lib/liap/crm.ts']) {
      expect(code(f), `${f} still carries rebuild`).not.toMatch(/'rebuild'|Ready to Rebuild|ready_to_rebuild/)
    }
    // rebuildReport is a function that reconstructs a report. Different word,
    // untouched on purpose — this asserts the rename did not overreach.
    expect(code('lib/liap/assessment-service.ts')).toContain('rebuildReport')
  })
})

// ── K: the hidden-urgency safeguard ──────────────────────────────────────
describe('a weak dimension is never hidden by a strong total', () => {
  const scores = (overrides: Record<string, number>) =>
    DIMENSION_KEYS.map((key) => ({
      key,
      name: DIMENSIONS.find((d) => d.key === key)!.name,
      score: overrides[key] ?? 25,
      classification: classify(overrides[key] ?? 25),
    }))

  it('surfaces a 9 even when the overall position is Ready to Move', () => {
    const s = scores({ spiritual: 9 })
    const total = s.reduce((n, d) => n + d.score, 0)
    expect(position(total)).toBe('move')
    const urgent = hiddenUrgencies(s)
    expect(urgent.map((u) => u.key)).toEqual(['spiritual'])
  })

  it('surfaces every dimension at or below ten, and nothing above it', () => {
    const s = scores({ money: 10, wellness: 11, legacy: 5 })
    expect(hiddenUrgencies(s).map((u) => u.key).sort()).toEqual(['legacy', 'money'])
  })

  it('the threshold is exactly ten, in code, not approximately', () => {
    expect(code('lib/liap/scoring.ts')).toContain('s.score <= 10')
  })
})

// ── L: AI cannot touch a score ───────────────────────────────────────────
describe('nothing on the scoring path can call a model', () => {
  const PATH = [
    'lib/liap/scoring.ts', 'lib/liap/assessment/v2.ts', 'lib/liap/recommendations.ts',
    'lib/liap/assessment-service.ts',
  ]
  it('imports no AI client, anywhere', () => {
    for (const f of PATH) {
      expect(code(f), `${f}`).not.toMatch(/anthropic|openai|@ai-sdk|generateText|\.completions|createChat/i)
    }
  })

  it('scoring is pure arithmetic with no network call', () => {
    const c = code('lib/liap/scoring.ts')
    expect(c).not.toMatch(/fetch\(|axios|https?:\/\//)
  })

  it('the same answers always produce the same result', () => {
    const answers = Object.fromEntries(QUESTIONS.map((q, i) => [q.key, ((i % 5) + 1)]))
    const a = buildScoreReport(answers as never, { changeType: null, area: null, urgency: null } as never)
    const b = buildScoreReport(answers as never, { changeType: null, area: null, urgency: null } as never)
    expect(a.total).toBe(b.total)
    expect(a.position).toBe(b.position)
  })
})

// ── M, N, O: Spiritual in, Risk out as a dimension, risk logic retained ──
describe('Spiritual Readiness replaces Risk & Readiness as a scored dimension', () => {
  it('Spiritual Readiness is scored, with five questions', () => {
    expect(DIMENSION_KEYS).toContain('spiritual')
    expect(QUESTIONS.filter((q) => q.dimension === 'spiritual')).toHaveLength(5)
    expect(DIMENSIONS.find((d) => d.key === 'spiritual')!.name).toBe('Spiritual Readiness')
  })

  it('Risk & Readiness is no longer a scored dimension', () => {
    expect(DIMENSION_KEYS).not.toContain('risk')
    expect(DIMENSIONS.map((d) => d.name)).not.toContain('Risk & Readiness')
    expect(QUESTIONS.some((q) => q.dimension === ('risk' as never))).toBe(false)
    expect(PRIORITY_DIMENSIONS).not.toContain('risk' as never)
    expect(STEPS.flatMap((s) => s.dimensions)).not.toContain('risk' as never)
  })

  it('risk-management copy was retained rather than deleted', () => {
    // The owner ruled risk stays in LIAP methodology. The two blocks that were
    // keyed to the retired dimension are kept verbatim, unwired, pending a
    // decision about where they belong.
    const c = code('lib/liap/recommendations.ts')
    expect(c).toContain('RETIRED_RISK_COPY')
    expect(c).toContain('Protect the essentials before anything else')
    expect(c).toContain('Resolve the risk you keep meaning to handle')
  })

  it('names the one dimension still awaiting approved recommendation copy', () => {
    // Deliberately asserts the gap rather than hiding it. When the owner
    // supplies Spiritual Readiness protect/resolve copy, this test changes.
    const c = code('lib/liap/recommendations.ts')
    expect(c).toContain('Partial<Record<DimensionKey')
    expect(c, 'spiritual copy has arrived — update this test').not.toMatch(/\n  spiritual: \{/)
  })

  it('v1 was left alone, as its own header requires', () => {
    const v1 = source('lib/liap/assessment/v1.ts')
    expect(v1).toContain("export const VERSION_KEY = 'LIAP_READY_V1'")
    expect(v1).toContain("key: 'risk'")
    expect(v1.match(/dimension: '/g)).toHaveLength(40)
  })
})

// ── P, Q, R: untouched territory ─────────────────────────────────────────
describe('nothing outside the assessment moved', () => {
  it('purchase entitlement is unchanged', () => {
    const f = code('lib/liap/fulfilment.ts')
    expect(f).toContain('grantEntitlement')
    expect(f).toContain('LIAP_ENTITLEMENT')
    expect(code('lib/liap/product.ts')).toContain('const AMOUNT_CENTS = 2499')
  })

  it('privacy controls are intact', () => {
    expect(code('lib/liap/scoring.ts')).toContain('s.score <= 10')
    expect(code('lib/liap/retention.ts')).toContain('assessment_narratives')
    expect(code('lib/liap/assessment-service.ts')).toContain('result_token_hash')
  })

  it('no Journey Map content appears', () => {
    for (const f of ['lib/liap/assessment/v2.ts', 'lib/liap/scoring.ts', 'lib/liap/recommendations.ts']) {
      expect(code(f)).not.toMatch(/journey ?map/i)
    }
  })

  it('the version key advanced rather than being edited in place', () => {
    expect(VERSION_KEY).toBe('LIAP_READY_V2')
  })
})

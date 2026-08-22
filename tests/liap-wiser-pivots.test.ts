import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  STEADY_STEPS,
  PIVOTS_INTRO,
  PIVOTS_CYCLE,
  PIVOT_STEP,
  needsSteady,
  buildScoreReport,
} from '@/lib/liap/scoring'
import { buildFullReport } from '@/lib/liap/recommendations'
import { QUESTIONS } from '@/lib/liap/assessment/v1'

// ---------------------------------------------------------------------------
// The WISER Pivots™ customer-facing contract.
//
// Owner approval, 22 August 2026: WISER Pivots™ replaces the customer-facing
// S.T.E.A.D.Y. experience. This file asserts the things that would be quietly
// wrong if somebody edited the copy later without the directive in front of
// them:
//
//   The cycle is WAIT → INSPECT → SELECT → EMBRACE → PIVOT → REVIEW, and
//   REVIEW returns to WAIT.
//
//   PIVOT is the focal point, not the fifth equal card. Exactly one step
//   carries `focal`, and it is that one.
//
//   It is Agile-inspired but written for everyday life, and must NEVER be
//   presented as PMI or PMP instruction — so no certification vocabulary
//   appears anywhere in the copy or on the page that renders it.
//
//   S.T.E.A.D.Y. is gone from everything a customer reads, while the internal
//   identifiers that a shipped migration and the persona suite depend on are
//   untouched.
// ---------------------------------------------------------------------------

const root = join(__dirname, '..')
const source = (rel: string) => readFileSync(join(root, rel), 'utf8')

/** Every string a reader of this section actually sees. */
const CUSTOMER_TEXT = [
  PIVOTS_INTRO.heading,
  PIVOTS_INTRO.descriptor,
  PIVOTS_INTRO.signature,
  ...STEADY_STEPS.flatMap((s) => [s.letter, s.title, s.expansion ?? '', s.lead, ...s.body]),
].join('\n')

const uniform = (value: number) =>
  Object.fromEntries(QUESTIONS.map((q) => [q.key, value])) as Record<string, number>

describe('the cycle', () => {
  it('runs WAIT → INSPECT → SELECT → EMBRACE → PIVOT → REVIEW', () => {
    expect(PIVOTS_CYCLE).toEqual(['WAIT', 'INSPECT', 'SELECT', 'EMBRACE', 'PIVOT', 'REVIEW'])
  })

  it('carries the WISER letters plus the turn', () => {
    expect(STEADY_STEPS.map((s) => s.letter)).toEqual(['W', 'I', 'S', 'E', 'PIVOT', 'R'])
  })

  it('closes the loop back to WAIT', () => {
    const review = STEADY_STEPS[STEADY_STEPS.length - 1]!
    expect(review.title).toBe('REVIEW')
    expect(review.body.join(' ')).toContain('return to WAIT')
  })

  it('derives the diagram from the cards, so the two cannot disagree', () => {
    expect(PIVOTS_CYCLE).toEqual(STEADY_STEPS.map((s) => s.title))
  })

  it('gives every step a lead line and at least one paragraph', () => {
    for (const step of STEADY_STEPS) {
      expect(step.lead.length).toBeGreaterThan(0)
      expect(step.body.length).toBeGreaterThan(0)
      expect(step.body.every((p) => p.trim().length > 0)).toBe(true)
    }
  })
})

describe('PIVOT is the focal point, not the fifth card', () => {
  it('is the only step marked focal', () => {
    const focal = STEADY_STEPS.filter((s) => s.focal)
    expect(focal).toHaveLength(1)
    expect(focal[0]!.title).toBe('PIVOT')
    expect(PIVOT_STEP.title).toBe('PIVOT')
  })

  it('is the personal and intentional action', () => {
    expect(PIVOT_STEP.expansion).toBe('Personal + Intentional Action')
    expect(PIVOT_STEP.lead).toBe('Make the turn.')
  })

  it('carries the four approved paragraphs the others do not', () => {
    expect(PIVOT_STEP.body).toHaveLength(4)
    expect(PIVOT_STEP.body.join(' ')).toContain('A Wiser Pivot™ is an intentional action')
  })

  it('is rendered on a branch of its own, not by the shared card', () => {
    // The directive is a design requirement, so it is asserted against the
    // page rather than trusted to survive a refactor: the render site must
    // still distinguish the focal step.
    expect(source('app/living-is-a-project/results/[token]/page.tsx')).toContain('step.focal')
  })
})

describe('the signature concept', () => {
  it('is present verbatim', () => {
    expect(PIVOTS_INTRO.signature).toBe('The bend is not the end. Be ready to make the turn.')
  })

  it('reaches the page', () => {
    expect(source('app/living-is-a-project/results/[token]/page.tsx')).toContain(
      'PIVOTS_INTRO.signature'
    )
  })
})

describe('it is not certification instruction', () => {
  // "Agile-inspired but written for everyday life. Do not present it as
  // PMI/PMP instruction." Enforced by vocabulary, because that is how it
  // would erode — one helpful-sounding sentence at a time.
  const FORBIDDEN = ['PMI', 'PMP', 'CAPM', 'PMBOK', 'Scrum', 'sprint', 'backlog', 'stakeholder']

  it('uses none of the certification vocabulary in the customer copy', () => {
    for (const word of FORBIDDEN) {
      expect(CUSTOMER_TEXT.toLowerCase()).not.toContain(word.toLowerCase())
    }
  })
})

describe('S.T.E.A.D.Y. is retired from everything a customer reads', () => {
  it('does not appear in the cycle copy', () => {
    expect(CUSTOMER_TEXT).not.toContain('S.T.E.A.D.Y.')
    expect(CUSTOMER_TEXT.toLowerCase()).not.toContain('steady')
  })

  it('names the cycle in the owner-approved words', () => {
    const full = buildFullReport(uniform(3), { changeType: 'unexpected', urgency: 5 })
    expect(full.plan.phases[0]!.items[0]).toBe(
      'Use the WISER Pivots™ cycle before committing to anything larger — Wait. Inspect. ' +
        'Select. Embrace. Then make your Pivot. Review what you learned.'
    )
  })

  it('does not appear in the plan a routed customer is sent', () => {
    const full = buildFullReport(uniform(3), { changeType: 'unexpected', urgency: 5 })
    const everything = JSON.stringify(full)
    expect(everything).not.toContain('S.T.E.A.D.Y.')
    expect(full.plan.phases[0]!.items[0]).toContain('WISER Pivots™')
  })

  it('does not appear in any string rendered by the results page', () => {
    const page = source('app/living-is-a-project/results/[token]/page.tsx')
    expect(page).not.toContain('S.T.E.A.D.Y.')
  })
})

describe('the internals the rename deliberately did not touch', () => {
  // The owner asked for stable identifiers to be preserved. These are the
  // ones a rename would have broken: a shipped migration's column, the flag
  // the persona suite asserts on, and the routing predicate.
  it('still routes through needsSteady() and report.steady', () => {
    expect(needsSteady({ changeType: 'unexpected', urgency: 1 })).toBe(true)
    expect(buildScoreReport(uniform(3), { changeType: 'unexpected', urgency: 5 }).steady).toBe(true)
    expect(buildScoreReport(uniform(3), { changeType: 'expected', urgency: 2 }).steady).toBe(false)
  })

  it('still exports the cards as STEADY_STEPS', () => {
    expect(source('lib/liap/scoring.ts')).toContain('export const STEADY_STEPS')
  })

  it('leaves the shipped migration alone', () => {
    expect(source('db/migrations/0003_liap_phase_1.sql')).toContain('steady_routed')
  })

  it('still persists the routing decision under its original column', () => {
    expect(source('lib/liap/assessment-service.ts')).toContain('steady_routed')
  })
})

describe('the two capitalizations, approved 22 August 2026', () => {
  // WISER Pivots™ is the cycle. Wiser Pivot™ is one personal, intentional
  // action taken inside it. They are different things and the difference is
  // carried by the capital letters, which makes this exactly the kind of
  // detail a well-meaning edit flattens.
  it('names the cycle in caps', () => {
    expect(PIVOTS_INTRO.heading).toBe('WISER Pivots™')
  })

  it('names the individual action in title case', () => {
    expect(PIVOT_STEP.body.join(' ')).toContain('A Wiser Pivot™')
    expect(PIVOT_STEP.body.join(' ')).not.toContain('A WISER Pivot™')
  })

  it('never writes the cycle in title case anywhere a customer reads', () => {
    expect(CUSTOMER_TEXT).not.toContain('Wiser Pivots™')
  })
})

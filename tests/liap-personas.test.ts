import { describe, it, expect } from 'vitest'
import { DIMENSION_KEYS, QUESTIONS, questionsForDimension, type DimensionKey } from '@/lib/liap/assessment/v1'
import {
  buildScoreReport,
  classify,
  position,
  needsSteady,
  MIN_TOTAL,
  MAX_TOTAL,
  type Answers,
  type Intake,
} from '@/lib/liap/scoring'
import { buildFullReport, nextBestThree, buildPlan } from '@/lib/liap/recommendations'

// ---------------------------------------------------------------------------
// The twelve personas, plus the boundaries.
//
// §36 asks that the engine "behaves logically" for twelve situations. That is
// only meaningful if each assertion says what logical means for THAT person —
// so these check the specific thing that would be wrong, not merely that a
// report came back.
//
// The engine is pure, so every one of these runs without a database, a network
// call or a mock. That is the point of keeping AI out of the scoring path.
// ---------------------------------------------------------------------------

/** Answers where every dimension scores exactly `perQuestion` × 5. */
function uniform(perQuestion: number): Answers {
  return Object.fromEntries(QUESTIONS.map((q) => [q.key, perQuestion]))
}

/** Start from a baseline, then set specific dimensions to a per-question value. */
function withDimensions(base: number, overrides: Partial<Record<DimensionKey, number>>): Answers {
  const answers = uniform(base)
  for (const [dim, value] of Object.entries(overrides)) {
    for (const q of questionsForDimension(dim as DimensionKey)) {
      answers[q.key] = value as number
    }
  }
  return answers
}

function scoreOf(report: ReturnType<typeof buildScoreReport>, key: DimensionKey): number {
  return report.scores.find((s) => s.key === key)!.score
}

describe('the scale itself', () => {
  it('spans exactly 40 to 200', () => {
    expect(MIN_TOTAL).toBe(40)
    expect(MAX_TOTAL).toBe(200)
    expect(QUESTIONS).toHaveLength(40)
  })

  it('every dimension has exactly five questions', () => {
    for (const key of DIMENSION_KEYS) {
      expect(questionsForDimension(key), key).toHaveLength(5)
    }
  })

  it('classifies each band at its boundaries', () => {
    expect(classify(25)).toBe('strength')
    expect(classify(21)).toBe('strength')
    expect(classify(20)).toBe('build')
    expect(classify(16)).toBe('build')
    expect(classify(15)).toBe('priority')
    expect(classify(11)).toBe('priority')
    expect(classify(10)).toBe('immediate')
    expect(classify(5)).toBe('immediate')
  })

  it('assigns each position at its boundaries', () => {
    expect(position(200)).toBe('move')
    expect(position(160)).toBe('move')
    expect(position(159)).toBe('plan')
    expect(position(120)).toBe('plan')
    expect(position(119)).toBe('rebuild')
    expect(position(80)).toBe('rebuild')
    expect(position(79)).toBe('stabilize')
    expect(position(40)).toBe('stabilize')
  })
})

describe('persona 1 — expected retirement, strong money, weak purpose', () => {
  const answers = withDimensions(4, { money: 5, career: 2 })
  const intake: Intake = { changeType: 'expected', area: 'retirement', urgency: 2 }
  const report = buildScoreReport(answers, intake)

  it('does not route to WISER Pivots™ for a chosen, unhurried change', () => {
    expect(report.steady).toBe(false)
  })

  it('names Career & Purpose as the area needing attention, not Money', () => {
    expect(report.ranked[0]!.key).toBe('career')
    expect(scoreOf(report, 'money')).toBe(25)
  })

  it('offers Money back as a strength rather than a worry', () => {
    expect(report.strengths[0]!.key).toBe('money')
  })
})

describe('persona 2 — unexpected job loss, weak money and risk, urgency 5', () => {
  const answers = withDimensions(3, { money: 2, risk: 2 })
  const intake: Intake = { changeType: 'unexpected', area: 'career', urgency: 5 }
  const report = buildScoreReport(answers, intake)
  const full = buildFullReport(answers, intake)

  it('routes to WISER Pivots™', () => {
    expect(report.steady).toBe(true)
  })

  it('leads with Money — the priority order, not merely the lowest', () => {
    expect(report.ranked[0]!.key).toBe('money')
    expect(report.ranked[1]!.key).toBe('risk')
  })

  it('protects the financial floor first', () => {
    expect(full.actions[0]!.kind).toBe('protect')
    expect(full.actions[0]!.basis).toBe('money')
  })

  it('opens the plan with stabilisation, not expansion', () => {
    expect(full.plan.phases[0]!.items[0]).toContain('WISER Pivots™')
    expect(full.plan.phases[0]!.items[0]).not.toContain('S.T.E.A.D.Y.')
  })
})

describe('persona 3 — business opportunity, strong across the board', () => {
  const answers = uniform(5)
  const intake: Intake = { changeType: 'opportunity', area: 'business', urgency: 2 }
  const full = buildFullReport(answers, intake)

  it('reaches Ready to Move', () => {
    expect(full.total).toBe(200)
    expect(full.position).toBe('move')
  })

  it('has no dimension in immediate attention', () => {
    expect(full.urgent).toHaveLength(0)
  })

  it('still returns exactly three actions', () => {
    expect(full.actions).toHaveLength(3)
    expect(full.actions.map((a) => a.kind)).toEqual(['protect', 'resolve', 'move'])
  })
})

describe('persona 4 — family transition, weak relationships, strong career', () => {
  const answers = withDimensions(3, { relationships: 2, career: 5 })
  const intake: Intake = { changeType: 'unexpected', area: 'relationship', urgency: 3 }
  const report = buildScoreReport(answers, intake)

  it('surfaces Relationships as the area to attend to', () => {
    expect(report.ranked[0]!.key).toBe('relationships')
  })

  it('routes to WISER Pivots™ on change type alone, without high urgency', () => {
    expect(report.steady).toBe(true)
  })
})

describe('persona 5 — relocation, moderate throughout', () => {
  const answers = uniform(3)
  const intake: Intake = { changeType: 'expected', area: 'relocation', urgency: 3 }
  const full = buildFullReport(answers, intake)

  it('lands in Ready to Plan', () => {
    expect(full.total).toBe(120)
    expect(full.position).toBe('plan')
  })

  it('does not route to WISER Pivots™ below the urgency threshold', () => {
    expect(full.steady).toBe(false)
  })
})

describe('persona 6 — preparing for career change, low Vision, high Legacy', () => {
  const answers = withDimensions(3, { vision: 2, legacy: 5 })
  const intake: Intake = { changeType: 'preparing', area: 'career', urgency: 2 }
  const report = buildScoreReport(answers, intake)

  it('attends to Vision', () => {
    expect(report.ranked[0]!.key).toBe('vision')
  })

  it('offers Legacy back as a strength', () => {
    expect(report.strengths.map((s) => s.key)).toContain('legacy')
  })
})

describe('personas 7, 8 and 9 — the rule that matters most', () => {
  // §15: "A strong total score must NEVER hide a dimension scoring 10 or
  // below." Someone can answer well overall and still be a month from running
  // out of money. A report that opened with "Ready to Move" and buried that
  // would be worse than no report at all.
  const cases: Array<[string, DimensionKey]> = [
    ['persona 7 — high total, Money at 10 or below', 'money'],
    ['persona 8 — high total, Risk at 10 or below', 'risk'],
    ['persona 9 — Wellness at 10 or below', 'wellness'],
  ]

  for (const [label, dimension] of cases) {
    describe(label, () => {
      const answers = withDimensions(5, { [dimension]: 2 })
      const intake: Intake = { changeType: 'expected', area: 'career', urgency: 2 }
      const report = buildScoreReport(answers, intake)
      const full = buildFullReport(answers, intake)

      it('still reports a strong overall position', () => {
        expect(report.total).toBeGreaterThanOrEqual(160)
        expect(report.position).toBe('move')
      })

      it(`flags ${dimension} as immediate attention`, () => {
        expect(scoreOf(report, dimension)).toBeLessThanOrEqual(10)
        expect(report.scores.find((s) => s.key === dimension)!.classification).toBe('immediate')
      })

      it('does not let the strong total bury it', () => {
        expect(report.urgent.map((s) => s.key)).toContain(dimension)
        expect(report.ranked[0]!.key).toBe(dimension)
      })

      it('makes it the first thing the customer is told to protect', () => {
        expect(full.actions[0]!.kind).toBe('protect')
        expect(full.actions[0]!.basis).toBe(dimension)
      })
    })
  }
})

describe('persona 10 — every answer is 1', () => {
  const answers = uniform(1)
  const intake: Intake = { changeType: 'unexpected', area: 'loss', urgency: 5 }
  const full = buildFullReport(answers, intake)

  it('floors at 40 and reads Ready to Stabilize', () => {
    expect(full.total).toBe(40)
    expect(full.position).toBe('stabilize')
  })

  it('marks every dimension as immediate attention', () => {
    expect(full.urgent).toHaveLength(8)
  })

  it('still returns three actions and no more', () => {
    // The failure mode here is a wall of eight urgent items handed to someone
    // in the worst week of their life.
    expect(full.actions).toHaveLength(3)
  })

  it('offers no false strengths', () => {
    expect(full.strengths).toHaveLength(0)
  })

  it('produces a plan that still reads as a plan', () => {
    expect(full.plan.phases).toHaveLength(3)
    for (const phase of full.plan.phases) {
      expect(phase.items.length).toBeGreaterThan(0)
    }
  })
})

describe('persona 11 — every answer is 5', () => {
  const answers = uniform(5)
  const intake: Intake = { changeType: 'opportunity', area: 'business', urgency: 1 }
  const full = buildFullReport(answers, intake)

  it('caps at 200 and reads Ready to Move', () => {
    expect(full.total).toBe(200)
    expect(full.position).toBe('move')
  })

  it('treats all eight dimensions as strengths', () => {
    expect(full.strengths).toHaveLength(8)
    expect(full.urgent).toHaveLength(0)
  })

  it('still gives something to protect and resolve, not just praise', () => {
    expect(full.actions.map((a) => a.kind)).toEqual(['protect', 'resolve', 'move'])
    for (const action of full.actions) {
      expect(action.body.length).toBeGreaterThan(40)
    }
  })
})

describe('persona 12 — arrives via an external retailer preorder', () => {
  // The entitlement route differs; the engine must not. A verified retailer
  // preorder produces exactly the report a Stripe preorder would.
  const answers = withDimensions(3, { money: 4 })
  const intake: Intake = { changeType: 'expected', area: 'education', urgency: 2 }

  it('scores identically regardless of how access was granted', () => {
    const a = buildFullReport(answers, intake)
    const b = buildFullReport(answers, intake)
    expect(a.total).toBe(b.total)
    expect(a.position).toBe(b.position)
    expect(a.actions).toEqual(b.actions)
  })
})

describe('change-navigation routing — needsSteady() keeps its internal name', () => {
  it('triggers on unexpected change at any urgency', () => {
    expect(needsSteady({ changeType: 'unexpected', urgency: 1 })).toBe(true)
  })

  it('triggers on urgency 4 or 5 for any change type', () => {
    expect(needsSteady({ changeType: 'opportunity', urgency: 4 })).toBe(true)
    expect(needsSteady({ changeType: 'expected', urgency: 5 })).toBe(true)
  })

  it('does not trigger below urgency 4 for a chosen change', () => {
    expect(needsSteady({ changeType: 'expected', urgency: 3 })).toBe(false)
    expect(needsSteady({ changeType: 'preparing', urgency: 1 })).toBe(false)
  })

  it('tempers a Ready to Move total during an upended week', () => {
    // §19: stabilisation precedes expansion. A perfect score does not override
    // the fact that something just happened.
    const answers = uniform(5)
    const calm = buildFullReport(answers, { changeType: 'opportunity', urgency: 1 })
    const upended = buildFullReport(answers, { changeType: 'unexpected', urgency: 5 })

    expect(calm.actions[2]!.headline).not.toBe(upended.actions[2]!.headline)
    expect(upended.steady).toBe(true)
  })
})

describe('the engine is deterministic', () => {
  it('produces byte-identical reports for identical input', () => {
    const answers = withDimensions(3, { money: 1, wellness: 5 })
    const intake: Intake = {
      changeType: 'unexpected',
      area: 'money',
      urgency: 4,
      importantDecision: 'Whether to sell the house',
      ninetyDayBetter: 'A clear plan and less panic',
    }
    const runs = Array.from({ length: 25 }, () => JSON.stringify(buildFullReport(answers, intake)))
    expect(new Set(runs).size).toBe(1)
  })

  it('never calls out to anything — the report is a function of its arguments', () => {
    // If this ever needed a database, a clock or a network, the personas above
    // could not be asserted and two customers answering identically could get
    // different advice.
    const answers = uniform(3)
    const withDate = buildPlan(buildScoreReport(answers, {}), {}, new Date('2026-08-20T00:00:00Z'))
    expect(withDate.reviewOn).toBe('2026-11-18')

    const withoutDate = buildPlan(buildScoreReport(answers, {}), {})
    expect(withoutDate.reviewOn).toBeNull()
    expect(withoutDate.phases).toEqual(withDate.phases)
  })
})

describe('the customer’s own words come back to them', () => {
  const answers = uniform(3)

  it('uses the decision they named rather than a generic one', () => {
    const full = buildFullReport(answers, {
      changeType: 'expected',
      urgency: 2,
      importantDecision: 'Whether to take the role in Atlanta',
    })
    expect(full.actions[1]!.body).toContain('Whether to take the role in Atlanta')
    expect(full.actions[1]!.basis).toBe('stated')
  })

  it('measures the 90-day plan against their own definition of better', () => {
    const full = buildFullReport(answers, {
      ninetyDayBetter: 'Sleeping through the night and knowing where the money is',
    })
    const finalPhase = full.plan.phases[2]!.items.join(' ')
    expect(finalPhase).toContain('Sleeping through the night')
  })

  it('truncates a long answer rather than pasting an essay into the report', () => {
    const full = buildFullReport(answers, { importantDecision: 'x'.repeat(500) })
    expect(full.actions[1]!.body.length).toBeLessThan(600)
    expect(full.actions[1]!.body).toContain('…')
  })

  it('falls back cleanly when they skipped the narrative questions', () => {
    const full = buildFullReport(answers, { changeType: 'expected', urgency: 2 })
    expect(full.actions).toHaveLength(3)
    expect(full.actions[1]!.basis).not.toBe('stated')
    expect(full.actions[1]!.body).not.toContain('undefined')
    expect(full.actions[1]!.body).not.toContain('“”')
  })
})

describe('partial answers do not crash the engine', () => {
  it('treats an unanswered question as its floor and still reports', () => {
    const report = buildScoreReport({ vision_1: 5 }, {})
    expect(report.total).toBe(44) // 39 unanswered at 1, plus one 5
    expect(report.position).toBe('stabilize')
  })
})

import {
  DIMENSIONS,
  DIMENSION_KEYS,
  QUESTIONS,
  questionsForDimension,
  type DimensionKey,
  type ChangeType,
} from './assessment/v1'

// ---------------------------------------------------------------------------
// Deterministic scoring.
//
// NO AI. NO NETWORK. NO RANDOMNESS. NO CLOCK.
//
// Every function here is pure: the same answers always produce the same
// report, on any machine, forever. That is not a stylistic preference. A
// customer is being told what to protect and what to resolve during a job
// loss or a bereavement, and that advice has to be explainable, reproducible
// and identical for two people who answered identically. A language model
// cannot promise any of the three.
//
// It also means the whole engine is testable without a database, a network or
// a mock — which is why the twelve personas can be asserted properly rather
// than eyeballed.
// ---------------------------------------------------------------------------

export type Classification = 'strength' | 'build' | 'priority' | 'immediate'
export type PositionKey = 'move' | 'plan' | 'rebuild' | 'stabilize'

/** §15. A dimension is 5 questions × 1–5, so 5–25. */
export function classify(score: number): Classification {
  if (score >= 21) return 'strength'
  if (score >= 16) return 'build'
  if (score >= 11) return 'priority'
  return 'immediate'
}

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  strength: 'Strength',
  build: 'Build',
  priority: 'Priority',
  immediate: 'Immediate attention',
}

/** §14. Forty questions × 1–5, so 40–200. */
export function position(total: number): PositionKey {
  if (total >= 160) return 'move'
  if (total >= 120) return 'plan'
  if (total >= 80) return 'rebuild'
  return 'stabilize'
}

export const POSITION_LABELS: Record<PositionKey, string> = {
  move: 'Ready to Move',
  plan: 'Ready to Plan',
  rebuild: 'Ready to Rebuild',
  stabilize: 'Ready to Stabilize',
}

export const POSITION_MEANINGS: Record<PositionKey, string> = {
  move: 'You have the footing to act. The work now is choosing well and moving deliberately rather than waiting for more certainty.',
  plan: 'The ground is steady enough to plan on. The work now is turning intent into a sequence you can actually follow.',
  rebuild: 'Some foundations need attention before bigger moves will hold. That is ordinary during a real change, and it is addressable.',
  stabilize: 'Several essentials need steadying first. Start there — not because the larger goals do not matter, but because they will hold better once they do.',
}

/**
 * §16. When one of these is very low it is heard first, whatever the total.
 *
 * Not because the other five matter less, but because a shortfall in any of
 * them constrains every other move: you cannot execute a career plan while
 * you are running out of money, carrying an unhandled risk, or too depleted
 * to think. Order is deliberate — money before risk before wellness — so two
 * dimensions tied at the same score resolve the same way every time.
 */
export const PRIORITY_DIMENSIONS: readonly DimensionKey[] = ['money', 'risk', 'wellness'] as const

export interface DimensionScore {
  key: DimensionKey
  name: string
  score: number
  classification: Classification
}

export type Answers = Partial<Record<string, number>>

export interface Intake {
  changeType?: ChangeType | null
  area?: string | null
  urgency?: number | null
  whatChanged?: string | null
  importantDecision?: string | null
  ninetyDayBetter?: string | null
}

export function scoreDimension(answers: Answers, dimension: DimensionKey): number {
  return questionsForDimension(dimension).reduce((sum, q) => {
    const value = answers[q.key]
    // An unanswered question scores its floor rather than throwing. A partial
    // assessment should still produce a usable, honest picture; submission is
    // where completeness is enforced.
    return sum + (typeof value === 'number' ? value : 1)
  }, 0)
}

export function scoreAll(answers: Answers): DimensionScore[] {
  return DIMENSIONS.map((d) => {
    const score = scoreDimension(answers, d.key)
    return { key: d.key, name: d.name, score, classification: classify(score) }
  })
}

export function totalScore(scores: readonly DimensionScore[]): number {
  return scores.reduce((sum, s) => sum + s.score, 0)
}

/**
 * §17. S.T.E.A.D.Y. routing.
 *
 * Triggered by the situation, never by the score. Someone who answered well
 * across the board can still have lost a parent on Tuesday, and telling them
 * to seize the moment would be the wrong reading of a good total.
 */
export function needsSteady(intake: Intake): boolean {
  return intake.changeType === 'unexpected' || (intake.urgency ?? 0) >= 4
}

/**
 * The change-navigation steps shown on the readiness report.
 *
 * ── AWAITING WISER PIVOTS™ CONTENT ─────────────────────────────────────────
 *
 * Owner ruling, 22 August 2026: S.T.E.A.D.Y. is retired from customer-facing
 * LIAP and Wiser Pivots™ is the approved replacement concept — but the six
 * replacement cards are being written separately, and the instruction was
 * explicit that they must not be invented here.
 *
 * So the copy below is unchanged and still renders. That is deliberate: the
 * alternative is a report with a hole in it for anyone navigating an
 * unexpected change, which is precisely the reader who most needs something
 * on the page.
 *
 * WHAT WAS PREPARED: the render site now reads its heading and introduction
 * from `PIVOTS_INTRO` rather than having them inline, and every card is typed
 * as a `PivotStep`. When the approved content arrives, replacing it is one
 * edit to this array and one to that constant — no component changes, no
 * layout work, and nothing else in the engine moves.
 *
 * The identifier stays `STEADY_STEPS`. It is referenced by the persona suite
 * and seen by nobody, and renaming an internal symbol to follow a marketing
 * decision is the blind replacement the handoff warns against.
 */
export interface PivotStep {
  /** Currently the S.T.E.A.D.Y. initial. Wiser Pivots™ may use something else. */
  readonly letter: string
  readonly title: string
  readonly body: string
}

/**
 * Heading and introduction for that section.
 *
 * Lifted out of the page so the retired acronym appears in exactly one place
 * a writer has to touch.
 */
export const PIVOTS_INTRO = {
  heading: 'Start with S.T.E.A.D.Y.',
  body:
    'What you described is the kind of change that rewards steadying before planning. Work ' +
    'these in order — it is how you move from reacting to choosing.',
} as const

export const STEADY_STEPS: readonly PivotStep[] = [
  { letter: 'S', title: 'Stabilize what is urgent', body: 'Deal first with anything that gets worse if left. Not everything — the things with a clock on them.' },
  { letter: 'T', title: 'Take inventory', body: 'Write down what you actually have: money, people, time, options, obligations. Most situations look different once they are on paper.' },
  { letter: 'E', title: 'Evaluate the impact', body: 'Separate what has genuinely changed from what you fear might change. They are rarely the same list.' },
  { letter: 'A', title: 'Assess risks and resources', body: 'Name what would hurt most if it went wrong, and what you already have that would help.' },
  { letter: 'D', title: 'Determine the next best steps', body: 'Choose the smallest number of actions that move you forward. Three is usually enough.' },
  { letter: 'Y', title: 'Yield, review and adjust', body: 'Set a date to look again. A plan made in the first week of a change is a draft, not a commitment.' },
]

// ---------------------------------------------------------------------------
// §15's critical rule, made explicit.
//
// "A strong total score must NEVER hide a dimension scoring 10 or below."
//
// This is the single most important behaviour in the engine. Someone can
// answer 180/200 and still be one month from running out of money, and a
// report that opened with "Ready to Move" and buried that would be worse than
// no report at all.
// ---------------------------------------------------------------------------
export function hiddenUrgencies(scores: readonly DimensionScore[]): DimensionScore[] {
  return scores.filter((s) => s.score <= 10)
}

/** Priority order for what the plan addresses first. §19. */
export function rankForAttention(scores: readonly DimensionScore[]): DimensionScore[] {
  const weight = (s: DimensionScore) => {
    const priorityIndex = PRIORITY_DIMENSIONS.indexOf(s.key)
    const isPriority = priorityIndex >= 0
    return [
      s.score <= 10 ? 0 : 1,            // immediate attention first
      isPriority ? 0 : 1,                // then money / risk / wellness
      s.score,                           // then simply the lowest
      isPriority ? priorityIndex : 99,   // stable tie-break within priorities
      DIMENSION_KEYS.indexOf(s.key),     // and a total order, so ties never flap
    ]
  }
  return [...scores].sort((a, b) => {
    const wa = weight(a)
    const wb = weight(b)
    for (let i = 0; i < wa.length; i++) {
      if (wa[i]! !== wb[i]!) return wa[i]! - wb[i]!
    }
    return 0
  })
}

export function strengths(scores: readonly DimensionScore[]): DimensionScore[] {
  return [...scores]
    .filter((s) => s.classification === 'strength' || s.classification === 'build')
    .sort((a, b) => b.score - a.score || DIMENSION_KEYS.indexOf(a.key) - DIMENSION_KEYS.indexOf(b.key))
}

export interface ScoreReport {
  scores: DimensionScore[]
  total: number
  position: PositionKey
  urgent: DimensionScore[]
  ranked: DimensionScore[]
  strengths: DimensionScore[]
  steady: boolean
}

/** Everything derivable from the answers alone. */
export function buildScoreReport(answers: Answers, intake: Intake): ScoreReport {
  const scores = scoreAll(answers)
  const total = totalScore(scores)
  return {
    scores,
    total,
    position: position(total),
    urgent: hiddenUrgencies(scores),
    ranked: rankForAttention(scores),
    strengths: strengths(scores),
    steady: needsSteady(intake),
  }
}

/** Guard: the question set and the scale must agree with the score ranges. */
export const MIN_TOTAL = QUESTIONS.length * 1
export const MAX_TOTAL = QUESTIONS.length * 5

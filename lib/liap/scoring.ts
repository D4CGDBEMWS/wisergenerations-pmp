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
 * §17. Change-navigation routing — whether the report leads with WISER
 * Pivots™.
 *
 * Triggered by the situation, never by the score. Someone who answered well
 * across the board can still have lost a parent on Tuesday, and telling them
 * to seize the moment would be the wrong reading of a good total.
 *
 * The name is internal and predates the rename; see STEADY_STEPS below.
 */
export function needsSteady(intake: Intake): boolean {
  return intake.changeType === 'unexpected' || (intake.urgency ?? 0) >= 4
}

/**
 * The change-navigation steps shown on the readiness report.
 *
 * WISER Pivots™ — approved by the owner on 22 August 2026 as the customer-
 * facing replacement for S.T.E.A.D.Y., which is retired. Every string below is
 * her approved wording; nothing here was written by the system, and nothing
 * here may be rewritten by it.
 *
 * ── WHY THE IDENTIFIER STILL SAYS STEADY ───────────────────────────────────
 *
 * `STEADY_STEPS`, `needsSteady()` and the `steady_routed` column are internal
 * and seen by nobody. The owner’s instruction was to preserve stable
 * identifiers unless changing them is technically necessary, and renaming a
 * symbol to follow a marketing decision is exactly the blind replacement the
 * handoff warns against — it would touch the persona suite, the assessment
 * service and a shipped migration to change nothing a customer can see.
 *
 * ── WHAT THE CYCLE IS, AND WHAT IT IS NOT ──────────────────────────────────
 *
 * It is Agile-inspired but written for everyday life. It is NOT PMI or PMP
 * instruction and must never be presented as such — a test asserts that no
 * certification vocabulary appears in any of this copy.
 *
 * ── PIVOT IS NOT THE FIFTH CARD ────────────────────────────────────────────
 *
 * WISER is the adaptive thinking cycle; PIVOT is the personal and intentional
 * action, and it carries `focal` so the render site can give it the weight the
 * owner asked for rather than laying six equal tiles side by side. The type
 * permits exactly one focal step and a test proves there is exactly one.
 */
export interface PivotStep {
  /**
   * Position in the acronym. Five are letters; the turn is the word PIVOT,
   * because it is not one more letter in a list.
   */
  readonly letter: string
  /** The step word: WAIT, INSPECT, SELECT, EMBRACE, PIVOT, REVIEW. */
  readonly title: string
  /** What the word stands for, where it stands for more than itself. */
  readonly expansion?: string
  /** The imperative beneath the word. */
  readonly lead: string
  /** One entry per paragraph. The turn needs four; the others need one. */
  readonly body: readonly string[]
  /** The focal point of the section. Exactly one step carries it. */
  readonly focal?: true
}

/**
 * Heading, descriptor and signature concept for the section.
 *
 * All three are approved wording. There is deliberately no system-written
 * bridging sentence: the previous S.T.E.A.D.Y. introduction was generated
 * copy, and replacing generated copy with more generated copy is not what
 * retiring it meant. If the owner wants a line tying the cycle to what the
 * reader described, it is one approved sentence away.
 */
export const PIVOTS_INTRO = {
  heading: 'WISER Pivots™',
  descriptor: 'An adaptive cycle for navigating change.',
  signature: 'The bend is not the end. Be ready to make the turn.',
} as const

export const STEADY_STEPS: readonly PivotStep[] = [
  {
    letter: 'W',
    title: 'WAIT',
    lead: 'Resist the reaction.',
    body: [
      'Something changed. Give yourself enough space to respond intentionally rather than simply react.',
    ],
  },
  {
    letter: 'I',
    title: 'INSPECT',
    lead: 'See what is true now.',
    body: [
      'Look at the current reality. What changed? What remains? What is working? What isn’t?',
    ],
  },
  {
    letter: 'S',
    title: 'SELECT',
    lead: 'Choose what matters now.',
    body: [
      'Priorities can change when circumstances change. Decide what requires your attention now—and what can wait.',
    ],
  },
  {
    letter: 'E',
    title: 'EMBRACE',
    lead: 'Accept the need to adapt.',
    body: [
      'You don’t have to like the change to acknowledge it. Embrace the reality of where you are so you can determine how to move forward.',
    ],
  },
  {
    letter: 'PIVOT',
    title: 'PIVOT',
    expansion: 'Personal + Intentional Action',
    lead: 'Make the turn.',
    body: [
      'You have waited. You have inspected. You have selected. You have embraced the need for change.',
      'Now decide what to do with what you know.',
      'A pivot may mean changing the route—not the destination. It may mean changing the timeline, reordering priorities, moving resources, reducing scope, trying another approach, or recognizing that the destination itself needs to change.',
      'A Wiser Pivot™ is an intentional action you choose in response to what has changed.',
    ],
    focal: true,
  },
  {
    letter: 'R',
    title: 'REVIEW',
    lead: 'Learn from your pivot.',
    body: [
      'What happened after you made the turn? Did it move you closer to your destination? What worked? What didn’t? What did you learn? What needs another adjustment?',
      'When circumstances change again, return to WAIT.',
    ],
  },
]

/**
 * The cycle, in order, for the diagram at the top of the section.
 *
 * Derived rather than typed a second time, so the picture and the cards can
 * never disagree about what comes after what.
 */
export const PIVOTS_CYCLE: readonly string[] = STEADY_STEPS.map((s) => s.title)

/** The one step that is an action rather than a way of thinking. */
export const PIVOT_STEP: PivotStep = STEADY_STEPS.find((s) => s.focal)!

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

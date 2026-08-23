import {
  HEALTH_KEYS,
  STARTING_FOCUS,
  STARTING_HEALTH,
  type Choice,
  type DelayedConsequence,
  type GameState,
  type Health,
  type HealthDelta,
  type HealthKey,
  type Scenario,
} from './types'
import { SCENARIOS } from './scenarios'
import { PIVOT_STEPS, PIVOT_WISDOM } from './pivot'

// ---------------------------------------------------------------------------
// The engine.
//
// A pure reducer. No React, no fetch, no database, no clock, no randomness —
// given the same state and the same action it returns the same next state,
// which is what lets a test play an entire day in a millisecond and assert on
// the result without a browser.
//
// ── WHY THE PHASE LIVES IN STATE ───────────────────────────────────────────
//
// The order of beats is the pedagogy: the participant decides, then sees what
// happened, then — and only then — is offered the word for it. If that order
// lived in JSX it would be a property of a component's render tree and a test
// could not assert it. Here it is a property of the reducer, and
// `tests/liap-game.test.ts` asserts that no glossary prompt is ever reachable
// before its outcome.
//
// ── THE FOCUS OVERDRAW RULE ────────────────────────────────────────────────
//
// Focus never goes below zero, but the day does not stop when it runs out.
// Spending attention you do not have is allowed and it comes out of the team:
// every point of shortfall costs two points of `people`. That is the honest
// model. A hard block would be tidier and would teach the wrong thing — real
// project managers do not get a modal saying they are out of hours, they get
// a tired team in week three.
//
// ── WHAT THIS MODULE MAY IMPORT ────────────────────────────────────────────
//
// ./types, ./scenarios, ./pivot. Nothing else, ever. Not the assessment, not
// the scoring engine, not entitlements, not the CRM, not the database.
// `tests/liap-game.test.ts` asserts the boundary by reading the source.
// ---------------------------------------------------------------------------

/** Every point of Focus spent past zero costs this much of `people`. */
const OVERDRAW_PEOPLE_COST = 2

export function initialState(): GameState {
  return {
    phase: 'brief',
    scenarioIndex: 0,
    health: HEALTH_KEYS.reduce(
      (acc, key) => ({ ...acc, [key]: STARTING_HEALTH }),
      {} as Health
    ),
    focus: STARTING_FOCUS,
    focusOverdrawn: 0,
    wisdom: 0,
    glossaryPoints: 0,
    termsDiscovered: [],
    glossaryAnswered: [],
    glossaryCorrect: [],
    pending: [],
    landed: [],
    decisions: [],
    pivotOffered: false,
    pivotResolved: false,
    pivotTaken: false,
    pivotStep: 0,
    pivotPriority: null,
    pivotAction: null,
    lesson: null,
  }
}

export function scenarioAt(index: number): Scenario | null {
  return SCENARIOS[index] ?? null
}

/** The scenario the participant is in, or null once the day is over. */
export function currentScenario(state: GameState): Scenario | null {
  return scenarioAt(state.scenarioIndex)
}

/**
 * The consequences that landed at the start of the current scenario.
 *
 * Derived rather than stored: `landed` records every consequence that has
 * fired and each one knows where it fired, so a second field would be a second
 * source of truth for the same fact.
 */
export function consequencesNow(state: GameState): DelayedConsequence[] {
  const scenario = currentScenario(state)
  if (!scenario) return []
  return state.landed.filter((c) => c.firesAt === scenario.id)
}

export function choiceById(scenario: Scenario, choiceId: string): Choice | null {
  return scenario.choices.find((c) => c.id === choiceId) ?? null
}

/** Health, clamped. Nothing may leave the 0–100 range, in either direction. */
function applyHealth(health: Health, delta: HealthDelta | undefined): Health {
  if (!delta) return health
  const next = { ...health }
  for (const key of HEALTH_KEYS) {
    const change = delta[key]
    if (typeof change === 'number') {
      next[key] = Math.max(0, Math.min(100, next[key] + change))
    }
  }
  return next
}

/**
 * Spends Focus, applying the overdraw rule.
 *
 * Returns the new balance, the running overdraw total, and the health cost of
 * any shortfall — so the caller applies it in one place alongside the choice's
 * own effects rather than mutating health twice.
 */
function spendFocus(
  state: GameState,
  cost: number
): { focus: number; focusOverdrawn: number; penalty: HealthDelta } {
  const shortfall = Math.max(0, cost - state.focus)
  return {
    focus: Math.max(0, state.focus - cost),
    focusOverdrawn: state.focusOverdrawn + shortfall,
    penalty: shortfall > 0 ? { people: -shortfall * OVERDRAW_PEOPLE_COST } : {},
  }
}

export type GameAction =
  | { type: 'begin' }
  | { type: 'choose'; choiceId: string }
  /** Acknowledges whatever is on screen and moves to the next beat. */
  | { type: 'continue' }
  | { type: 'answer-glossary'; option: string }
  | { type: 'take-pivot' }
  | { type: 'decline-pivot' }
  | { type: 'pivot-choose'; optionId: string }
  | { type: 'record-lesson'; lessonId: string }
  | { type: 'restart' }

/**
 * The whole game, in one function.
 *
 * Unrecognised actions return the state unchanged rather than throwing: a
 * double-click on a button that has already advanced the phase is a normal
 * thing for a browser to do and should not be an error page.
 */
export function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'restart':
      return initialState()

    case 'begin':
      return state.phase === 'brief' ? { ...state, phase: 'situation' } : state

    case 'choose':
      return state.phase === 'situation' ? chooseChoice(state, action.choiceId) : state

    case 'answer-glossary':
      return state.phase === 'glossary' ? answerGlossary(state, action.option) : state

    case 'take-pivot':
      return state.phase === 'pivot' && !state.pivotResolved
        ? { ...state, pivotTaken: true, pivotStep: 0 }
        : state

    case 'decline-pivot':
      return state.phase === 'pivot' && !state.pivotResolved
        ? advance({ ...state, pivotResolved: true })
        : state

    case 'pivot-choose':
      return state.phase === 'pivot' && state.pivotTaken
        ? choosePivotOption(state, action.optionId)
        : state

    case 'record-lesson':
      return state.phase === 'lesson'
        ? { ...state, lesson: action.lessonId, phase: 'results' }
        : state

    case 'continue':
      return continueFrom(state)

    default:
      return state
  }
}

function chooseChoice(state: GameState, choiceId: string): GameState {
  const scenario = currentScenario(state)
  if (!scenario) return state
  const choice = choiceById(scenario, choiceId)
  if (!choice) return state

  const spent = spendFocus(state, choice.focusCost)
  const health = applyHealth(applyHealth(state.health, choice.health), spent.penalty)

  return {
    ...state,
    phase: 'outcome',
    health,
    focus: spent.focus,
    focusOverdrawn: spent.focusOverdrawn,
    wisdom: state.wisdom + choice.wisdom,
    pending: choice.delayed ? [...state.pending, choice.delayed] : state.pending,
    decisions: [
      ...state.decisions,
      {
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        choiceId: choice.id,
        choiceLabel: choice.label,
        wisdom: choice.wisdom,
      },
    ],
    // Recorded now, consumed after the outcome has been read. A pivot offered
    // before the participant has seen what happened would be a pivot away from
    // information they do not have yet.
    pivotOffered: state.pivotOffered || choice.opensPivot === true,
  }
}

/**
 * The glossary bonus.
 *
 * §24, and the single most important rule in this function: a wrong answer
 * costs nothing. Not a health point, not a Focus point, not Practical Wisdom.
 * Terminology is a bonus layer on top of the project score and must never
 * become a second way to lose. The term is discovered either way — the point
 * is that the participant leaves knowing the word, not that they guessed it.
 */
export const GLOSSARY_POINTS = 3
export const GLOSSARY_WISDOM = 10

function answerGlossary(state: GameState, option: string): GameState {
  const scenario = currentScenario(state)
  if (!scenario?.glossary) return state
  if (state.glossaryAnswered.includes(scenario.id)) return state

  const correct = option === scenario.glossary.answer
  const term = scenario.glossary.answer

  return {
    ...state,
    glossaryPoints: state.glossaryPoints + (correct ? GLOSSARY_POINTS : 0),
    wisdom: state.wisdom + (correct ? GLOSSARY_WISDOM : 0),
    termsDiscovered: state.termsDiscovered.includes(term)
      ? state.termsDiscovered
      : [...state.termsDiscovered, term],
    glossaryAnswered: [...state.glossaryAnswered, scenario.id],
    glossaryCorrect: correct ? [...state.glossaryCorrect, scenario.id] : state.glossaryCorrect,
  }
}

function choosePivotOption(state: GameState, optionId: string): GameState {
  const step = PIVOT_STEPS[state.pivotStep]
  if (!step?.options) return state
  const option = step.options.find((o) => o.id === optionId)
  if (!option) return state

  const isPriority = step.title === 'SELECT'
  return {
    ...state,
    health: applyHealth(state.health, option.health),
    pivotPriority: isPriority ? (option.id as HealthKey) : state.pivotPriority,
    pivotAction: step.focal ? option.id : state.pivotAction,
    pivotStep: state.pivotStep + 1,
  }
}

/**
 * The beat order.
 *
 * outcome → glossary → pivot → the clock moves. Naming comes after the
 * consequence, and the turn comes after the naming because a WISER Pivot™ is
 * a decision about the route, which is the last thing that happens before the
 * day carries on.
 */
function continueFrom(state: GameState): GameState {
  switch (state.phase) {
    case 'brief':
      return { ...state, phase: 'situation' }

    case 'outcome': {
      const scenario = currentScenario(state)
      if (scenario?.glossary) return { ...state, phase: 'glossary' }
      if (pivotDue(state)) return { ...state, phase: 'pivot' }
      return advance(state)
    }

    case 'glossary':
      if (pivotDue(state)) return { ...state, phase: 'pivot' }
      return advance(state)

    case 'pivot':
      // Walking the cycle. Steps without options advance on acknowledgement;
      // steps with options wait for `pivot-choose`, which advances them.
      if (!state.pivotTaken) return state
      if (state.pivotStep >= PIVOT_STEPS.length) {
        return advance({
          ...state,
          pivotResolved: true,
          wisdom: state.wisdom + PIVOT_WISDOM,
        })
      }
      if (PIVOT_STEPS[state.pivotStep]?.options) return state
      return { ...state, pivotStep: state.pivotStep + 1 }

    default:
      return state
  }
}

/** True once a branch has opened the turn and the offer is still outstanding. */
function pivotDue(state: GameState): boolean {
  return state.pivotOffered && !state.pivotResolved
}

/**
 * The clock moves.
 *
 * Any pending consequence whose hour has come fires here, before the next
 * situation is read — so the participant meets it as something that has
 * already happened rather than as a warning they could still act on.
 */
export function advance(state: GameState): GameState {
  const nextIndex = state.scenarioIndex + 1
  const next = scenarioAt(nextIndex)

  if (!next) {
    return { ...state, phase: 'lesson', scenarioIndex: nextIndex, pivotStep: 0 }
  }

  const firing = state.pending.filter((c) => c.firesAt === next.id)
  const remaining = state.pending.filter((c) => c.firesAt !== next.id)

  return {
    ...state,
    phase: 'situation',
    scenarioIndex: nextIndex,
    pivotStep: 0,
    health: firing.reduce((h, c) => applyHealth(h, c.health), state.health),
    pending: remaining,
    landed: [...state.landed, ...firing],
  }
}

/** For the dashboard: whether a dimension is in trouble. Display only. */
export function healthBand(value: number): 'critical' | 'strained' | 'steady' | 'strong' {
  if (value <= 25) return 'critical'
  if (value <= 45) return 'strained'
  if (value <= 75) return 'steady'
  return 'strong'
}

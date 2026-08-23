// ---------------------------------------------------------------------------
// A Day in the Life of a Project Manager — types.
//
// Version 1, owner-authorised. Part of the Living Is a Project...Are You
// Ready?™ experience, associated with the Virtual Workshop.
//
// ── WHAT THIS IS NOT ───────────────────────────────────────────────────────
//
// Not a PMP® quiz with a story painted on it. The participant meets a
// situation, decides, and lives with what follows; the terminology arrives
// afterwards, as a name for something they have already experienced.
//
// ── WHY EVERYTHING IS DATA ─────────────────────────────────────────────────
//
// Scenarios, choices, effects, delayed consequences and glossary bonuses are
// all configuration. The engine is a pure reducer over them and the UI renders
// whatever it is handed. Adding a scenario is an entry in an array; it is not
// another branch in a component.
//
// That matters more than it usually would, because the thing most likely to
// happen to this game is that somebody wants to add a scenario after running a
// workshop and hearing what people asked about.
//
// ── ISOLATION ──────────────────────────────────────────────────────────────
//
// Nothing here imports from the assessment, the scoring engine, entitlements,
// the CRM or the database, and nothing here may. The game collects no
// participant data of any kind: state lives in React for the length of one
// visit and is gone when the tab closes. A test asserts the import boundary.
// ---------------------------------------------------------------------------

/**
 * The six dimensions of project health.
 *
 * Deliberately six and no more. A project manager watching twenty indicators
 * is doing analytics, not leading; the point of the game is judgement under
 * partial information, and an exhaustive dashboard quietly removes the
 * judgement by making everything visible.
 */
export const HEALTH_KEYS = ['people', 'value', 'time', 'resources', 'risk', 'quality'] as const
export type HealthKey = (typeof HEALTH_KEYS)[number]

export type Health = Record<HealthKey, number>

/** A change to project health. Absent keys mean no effect on that dimension. */
export type HealthDelta = Partial<Health>

/**
 * The day's finite attention.
 *
 * The PM cannot personally investigate, attend, fix and intervene in
 * everything. Focus Points are what make that true in the game rather than
 * merely said — and they are why delegating well can beat solving well.
 *
 * Never monetised, never purchasable, never restored by anything but a new
 * day.
 */
export const STARTING_FOCUS = 10

/** Every dimension starts here. Mid-range: a real project already underway. */
export const STARTING_HEALTH = 60

export interface GlossaryBonus {
  /** Asked only after the consequence has been seen. */
  readonly prompt: string
  readonly options: readonly string[]
  readonly answer: string
  /**
   * What Terms I Discovered records, when that differs from the answer.
   *
   * Almost always it does not, and this stays absent. It exists because the
   * best question does not always have the canonical term as its answer.
   *
   * At 4:00 PM the honest question is "what should the project manager
   * check?" and the honest answer is fitness for use — but the approved
   * vocabulary in Destiny Projects — Words to Know has one entry there,
   * Conformance, and teaches fitness for use as part of it. Without this
   * field the panel would hand the participant a term the guide says is not
   * a term, and the two assets would disagree about their own vocabulary.
   */
  readonly term?: string
  /** Shown on both a correct and an incorrect answer. Naming, not scoring. */
  readonly reveal: string
}

/**
 * Something a choice sets up that lands later in the day.
 *
 * The single most important mechanic in the game. At 9:00 the participant
 * decides whether to chase an unanswered approver; at 14:00 the work either
 * stalls or quietly does not. Nothing announces the link at 9:00 — the whole
 * lesson is that it was not obvious at the time.
 */
export interface DelayedConsequence {
  /** The scenario at whose start this fires. */
  readonly firesAt: string
  /** Shown above that scenario, framed as something that has already happened. */
  readonly text: string
  readonly health?: HealthDelta
  /** True when the earlier decision quietly prevented a problem. */
  readonly favourable: boolean
}

export interface Choice {
  readonly id: string
  readonly label: string
  /**
   * What the participant sees immediately.
   *
   * Not a verdict. Several scenarios have more than one defensible answer,
   * and saying "Correct" would teach test-taking rather than judgement.
   */
  readonly outcome: string
  readonly focusCost: number
  readonly health?: HealthDelta
  /** Practical Wisdom. Awarded for judgement, never for finding a keyword. */
  readonly wisdom: number
  readonly delayed?: DelayedConsequence
  /**
   * Marks the branch on which a WISER Pivot™ is genuinely warranted.
   *
   * Not an emergency button and not offered after every event: only where new
   * information really does call the current route into question.
   */
  readonly opensPivot?: boolean
}

export interface Scenario {
  readonly id: string
  /** Displayed clock time. The day is the spine of the experience. */
  readonly time: string
  readonly title: string
  /** Where this sits on the project roadmap shown to the player. */
  readonly stage: RoadmapStageId
  /** The situation. Written so the concept is felt before it is named. */
  readonly situation: readonly string[]
  readonly question: string
  readonly choices: readonly Choice[]
  readonly glossary?: GlossaryBonus
}

/**
 * The project roadmap the game teaches by walking it.
 *
 * Loops rather than a waterfall: planning does not stop when execution starts,
 * and the middle of this list is a cycle the day passes through more than once.
 */
export const ROADMAP_STAGES = [
  { id: 'why', label: 'Why are we doing this?', looping: false },
  { id: 'need', label: 'Understand the need', looping: false },
  { id: 'plan', label: 'Plan enough to begin', looping: false },
  { id: 'backlog', label: 'Create / prioritize the backlog', looping: false },
  { id: 'start', label: 'Start the work', looping: false },
  { id: 'check', label: 'Check what is happening', looping: true },
  { id: 'adjust', label: 'Learn · adjust · communicate · deliver', looping: true },
  { id: 'risk', label: 'Risk · change · opportunity', looping: true },
  { id: 'pivot', label: 'Pivot when warranted', looping: false },
  { id: 'value', label: 'Deliver value', looping: false },
  { id: 'done', label: 'Is it really done?', looping: false },
  { id: 'close', label: 'Close · learn · carry wisdom forward', looping: false },
] as const

export type RoadmapStageId = (typeof ROADMAP_STAGES)[number]['id']

/** One closed choice at the end of the day. No free text, in Version 1. */
export interface LessonChoice {
  readonly id: string
  readonly label: string
}

export interface GameState {
  readonly phase: GamePhase
  readonly scenarioIndex: number
  readonly health: Health
  readonly focus: number
  /**
   * Focus spent beyond what the day had left.
   *
   * The day does not stop when attention runs out — a real one does not
   * either. It comes out of the team instead, which is what the overdraw rule
   * in the engine models and what this counter records for the debrief.
   */
  readonly focusOverdrawn: number
  readonly wisdom: number
  readonly glossaryPoints: number
  /** Terms met during this session, in the order they were met. */
  readonly termsDiscovered: readonly string[]
  /** Scenario ids whose glossary bonus has been answered, right or wrong. */
  readonly glossaryAnswered: readonly string[]
  /** Scenario ids whose glossary bonus was answered correctly. */
  readonly glossaryCorrect: readonly string[]
  readonly pending: readonly DelayedConsequence[]
  /** Consequences that have already landed, for the end-of-day review. */
  readonly landed: readonly DelayedConsequence[]
  readonly decisions: readonly DecisionRecord[]
  /** A branch has opened the turn. Set the moment that choice is made. */
  readonly pivotOffered: boolean
  /**
   * The offer has been dealt with, by walking the cycle or by declining it.
   *
   * Separate from `pivotTaken` because declining must also close the offer —
   * without this the turn would be re-offered at every subsequent scenario,
   * which is precisely the generic emergency button it must not be.
   */
  readonly pivotResolved: boolean
  /** The cycle was actually walked. */
  readonly pivotTaken: boolean
  /** How far through the six steps the participant is, while phase is 'pivot'. */
  readonly pivotStep: number
  /** The dimension chosen at SELECT, once chosen. */
  readonly pivotPriority: HealthKey | null
  /** The turn chosen at PIVOT, once chosen. */
  readonly pivotAction: string | null
  readonly lesson: string | null
}

export interface DecisionRecord {
  readonly scenarioId: string
  readonly scenarioTitle: string
  readonly choiceId: string
  readonly choiceLabel: string
  readonly wisdom: number
}

// ---------------------------------------------------------------------------
// The WISER Pivot™ moment.
//
// Not an emergency button. It is offered only on a branch where the
// participant has just learned something that genuinely calls the current
// route into question, and only once in a day — see `opensPivot` above.
//
// Four of the six steps are ways of thinking and one is an action, which is
// why the shape below distinguishes them: a step either asks the participant
// to look at something, or it asks them to decide. Making all six identical
// would turn the cycle into a six-click corridor with a reward at the end,
// and a cycle you can click through without deciding anything teaches nothing.
// ---------------------------------------------------------------------------

export interface PivotOption {
  readonly id: string
  readonly label: string
  /** What this turn actually costs and buys. Every option has both. */
  readonly outcome: string
  readonly health?: HealthDelta
}

export interface PivotStepDef {
  /** W, I, S, E, PIVOT, R. */
  readonly letter: string
  /** WAIT · INSPECT · SELECT · EMBRACE · PIVOT · REVIEW. Approved wording. */
  readonly title: string
  /** The imperative beneath the word. Approved wording. */
  readonly lead: string
  /** The step's prompt, written for this project. */
  readonly prompt: string
  /**
   * Absent means the step is a look, not a decision: the participant reads and
   * continues. Present means a real fork.
   */
  readonly options?: readonly PivotOption[]
  /** True for the one step that is an action rather than a way of thinking. */
  readonly focal?: true
  /** True where the step should render the live health dashboard beneath it. */
  readonly showsDashboard?: true
}

/**
 * Where the participant is in the experience.
 *
 * In state rather than in a component, so a test can drive a whole day without
 * rendering anything and so the order of beats — outcome, then naming, then
 * the clock moves — is a property of the engine rather than of JSX.
 */
export type GamePhase =
  | 'brief'
  | 'situation'
  | 'outcome'
  | 'glossary'
  | 'pivot'
  | 'lesson'
  | 'results'

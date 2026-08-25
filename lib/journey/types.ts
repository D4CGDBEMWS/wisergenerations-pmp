// ---------------------------------------------------------------------------
// The LIAP Journey Game — types.
//
// A FACILITATED TEAM EXPERIENCE. Not the single-player day; that is Living
// Life as a Project Manager and it is untouched by this module.
//
// ── WHAT MAKES THIS DIFFERENT FROM A BOARD GAME ────────────────────────────
//
// No dice. No random movement. No right answers and no score. A team advances
// because it decided something and the facilitator moved them on — never
// because a number came up. There is deliberately no `Math.random` anywhere in
// this directory, and a test asserts it.
//
// Road Events are INTERRUPTIONS BETWEEN ROADMAP POINTS, not spaces on a board
// and not phases of the journey. The facilitator chooses when one lands, and
// on whom. That is the whole pedagogy: a real project is interrupted by things
// nobody rolled for.
//
// ── DECISIONS ARE THE RECORD ───────────────────────────────────────────────
//
// Every decision is preserved, because a later event has to be able to point
// back at one — "because you decided to move without the sponsor's answer" —
// and force a roadmap revision. A journey with no memory cannot teach
// consequence.
// ---------------------------------------------------------------------------

/**
 * The permanent journey architecture. Six points, owner-approved, fixed.
 *
 * Not configurable, not extensible, not shuffled. The same five-point process
 * appears again in MY PROJECT mode, which is the point: the team learns a
 * shape and then uses that shape on the project they actually brought.
 */
export const ROADMAP_POINTS = [
  { id: 'start', label: 'TODAY / START', short: 'Today' },
  { id: 'first-move', label: 'FIRST MOVE', short: 'First move' },
  { id: 'decision-check', label: 'DECISION / MILESTONE CHECK', short: 'Decision check' },
  { id: 'milestone-2', label: 'NEXT MILESTONE', short: 'Next milestone' },
  { id: 'milestone-3', label: 'NEXT MILESTONE', short: 'Next milestone' },
  { id: 'destination', label: 'DESTINATION', short: 'Destination' },
] as const

export type RoadmapPointId = (typeof ROADMAP_POINTS)[number]['id']

/**
 * The eight Road Events. Owner-approved names, fixed set.
 *
 * `recalculating` is the only one that opens a structured review rather than
 * simply landing — see RECALCULATION_PROMPTS.
 */
export const ROAD_EVENTS = [
  'risk-ahead',
  'issue-now',
  'opening-ahead',
  'resources',
  'low-fuel',
  'no-signal',
  'lifeline',
  'recalculating',
] as const

export type RoadEventId = (typeof ROAD_EVENTS)[number]

/**
 * One Road Event, in the six fields the approved printed card carries.
 *
 * The card is marked FACILITATOR ONLY, so the fields split by audience:
 * `name`, `tagline` and `readToTeam` are read aloud and may be projected;
 * `whenToPlay`, `watchFor` and `pushWithoutSolving` are the facilitator's own
 * and are never copied onto the wire.
 */
export interface RoadEvent {
  readonly id: RoadEventId
  /** Owner-approved display name. */
  readonly name: string
  /** The card's one-line statement of what has happened. Read to the team. */
  readonly tagline: string
  /** READ TO TEAM. Participant-facing. */
  readonly readToTeam: string
  /** WHEN TO PLAY. Facilitator only. */
  readonly whenToPlay: string
  /** WATCH FOR. Facilitator only. */
  readonly watchFor: string
  /** PUSH WITHOUT SOLVING. Facilitator only — questions, never answers. */
  readonly pushWithoutSolving: string
  /**
   * True where the event is a gift rather than a pressure. Kept explicit so
   * the participant view can style it honestly instead of making everything
   * feel like a threat.
   */
  readonly favourable: boolean
  /** Opens the structured five-question review. Only `recalculating` does. */
  readonly opensRecalculation?: true
}

/** One thing a team decided, at one point on the roadmap. */
export interface DecisionRecord {
  readonly id: string
  readonly pointId: RoadmapPointId
  /** The team's own words, entered by the facilitator as they capture them. */
  readonly text: string
  /**
   * What this decision rests on, in the team's words — "the car", "Marcus's
   * yes", "the deposit". Optional, and only ever what the facilitator was told.
   *
   * This is half of the consequence model: see DependencyRecord.
   */
  readonly dependsOn?: string
  readonly at: number
}

/**
 * What a team decided a Road Event changes.
 *
 * Owner-specified, fixed, and exhaustive: after an event the team must say
 * whether it moves the First Move, the Decision / Milestone Check, either Next
 * Milestone, the Destination — or nothing.
 *
 * 'none' is a real answer, not a skip. Deciding an interruption changes
 * nothing is a project-management judgement, and the record should show the
 * team made it rather than show a blank.
 */
export type ImpactTarget =
  | 'first-move'
  | 'decision-check'
  | 'milestone-2'
  | 'milestone-3'
  | 'destination'
  | 'none'

/**
 * Something a decision rests on, and whether it is still available.
 *
 * The other half of the consequence model. A team builds an income plan around
 * a vehicle; two milestones later the vehicle is gone. Marking it unavailable
 * lets the console SURFACE that link to the facilitator — "decision 2 rests on
 * the car; land Issue Now on it?" — and the facilitator decides.
 *
 * Nothing here fires on its own. There is no rule engine, no scheduler and no
 * model call: the system remembers, a human chooses.
 *
 * FACILITATOR-PRIVATE. The register is not projected — a team that can read
 * the dependency list can see the consequence coming.
 */
export interface DependencyRecord {
  readonly id: string
  /** The team's own words for the thing depended on. */
  readonly label: string
  readonly decisionId: string
  readonly available: boolean
  readonly at: number
}

/**
 * A Road Event as it actually landed.
 *
 * `linkedDecisionId` is what makes consequence possible: the facilitator can
 * land an event ON an earlier decision, and the participant view then shows
 * the team what their own choice set up.
 */
export interface EventRecord {
  readonly id: string
  readonly eventId: RoadEventId
  /** Which gap it interrupted — the point the team had just left. */
  readonly afterPointId: RoadmapPointId
  /**
   * What the room sees on the projected map. Written by the facilitator at
   * the moment of reveal, in the language of the room.
   */
  readonly revealText: string
  /**
   * PRIVATE. Facilitator's own note — the consequence they are holding, the
   * card they are working from, what they intend next. Never projected; see
   * lib/journey/projection.ts, where it is not copied onto the wire at all.
   */
  readonly facilitatorNote: string
  readonly linkedDecisionId?: string
  /**
   * What the TEAM decided this event changes. Recorded after the fact, once
   * they have argued it out. Undefined until they answer.
   */
  readonly impact?: ImpactTarget
  readonly at: number
}

/**
 * A Lifeline, which is deliberately two steps rather than one.
 *
 * `asked` is what the team said when the facilitator put the question to them
 * — what kind of help do you need? — and it is captured BEFORE any help is
 * given. That ordering is the pedagogy: naming the help you need is most of
 * the skill, and a Lifeline handed over without it teaches nothing.
 *
 * `note` is what the facilitator then gave: information, another perspective,
 * a category of professional, permission to consult another team, a clue.
 * Never a solution to the project.
 */
export interface LifelineRecord {
  readonly id: string
  readonly asked: string
  readonly note: string
  readonly at: number
}

export interface ResourceRecord {
  readonly id: string
  readonly note: string
  readonly at: number
}

/**
 * A GPS: Recalculating… review.
 *
 * The five questions are owner-specified and fixed. Nothing here scores the
 * answers — the review exists so a team says out loud what changed, and then
 * changes the roadmap on purpose rather than drifting.
 */
export interface RecalculationRecord {
  readonly id: string
  readonly afterPointId: RoadmapPointId
  readonly stillTrue: string
  readonly changed: string
  readonly destinationValid: 'holds' | 'changes' | 'undecided'
  readonly milestoneToChange: string
  readonly nextMove: string
  readonly at: number
}

export type JourneyPhase =
  | 'briefing'
  | 'at-point'
  | 'event'
  | 'recalculating'
  | 'complete'

export interface JourneyState {
  readonly phase: JourneyPhase
  readonly pointIndex: number
  readonly decisions: readonly DecisionRecord[]
  readonly events: readonly EventRecord[]
  readonly lifelines: readonly LifelineRecord[]
  readonly resources: readonly ResourceRecord[]
  readonly recalculations: readonly RecalculationRecord[]
  /** Set once a recalculation concludes the Destination itself must change. */
  readonly destinationRevised: boolean
  /** FACILITATOR-PRIVATE. Never projected. */
  readonly dependencies: readonly DependencyRecord[]
  /** The event currently on screen, if any. */
  readonly activeEventId: string | null
  /** The progress prompt currently on the wall, if any. */
  readonly activePromptId: string | null
  /** Milliseconds since the facilitator started the task window. */
  readonly startedAt: number | null
}

// ---------------------------------------------------------------------------
// The projected view.
//
// ── WHY THIS IS A SEPARATE TYPE AND NOT A FLAG ─────────────────────────────
//
// The participant display is projected onto a wall or shared to a call. The
// facilitator's console is private on their laptop. Everything that must never
// reach the wall — private notes, the events not yet revealed, the real time
// budget and its buffer, the Sponsor / Higher Power reveal, the closing reveal
// — is not "hidden with CSS" and not "filtered on render".
//
// It is NEVER PUT ON THE WIRE. The facilitator window broadcasts a
// ProjectedJourney and nothing else, so the participant window has no access
// to private state even in its own memory, even with devtools open, even if
// somebody edits the component. A test asserts the projection carries none of
// the private keys.
//
// That is the difference between a promise and a guarantee, and it is worth
// the extra type: a facilitator running this in front of a room cannot afford
// to find out that a CSS rule was the only thing between the audience and the
// answer.
// ---------------------------------------------------------------------------

/** One Road Event, as the room sees it. No facilitator note, no linkage text. */
export interface ProjectedEvent {
  readonly id: string
  readonly eventId: RoadEventId
  readonly name: string
  readonly afterPointId: RoadmapPointId
  readonly revealText: string
  readonly favourable: boolean
  /** The team's own earlier words, when the facilitator chose to show them. */
  readonly becauseOf: string | null
  /** What the team decided it changes. Null until they have decided. */
  readonly impact: ImpactTarget | null
  /**
   * The same answer as a sentence, resolved here rather than in the display.
   *
   * The projected window then needs no module from lib/journey but the channel
   * itself — it renders strings it was handed and imports nothing that could
   * carry private content into its bundle.
   */
  readonly impactLabel: string | null
}

export interface ProjectedJourney {
  readonly phase: JourneyPhase
  readonly pointIndex: number
  readonly points: typeof ROADMAP_POINTS
  /** Decisions the team has made, in their own words. */
  readonly decisions: readonly { readonly pointId: RoadmapPointId; readonly text: string }[]
  /** ONLY events already revealed. Never anything queued or upcoming. */
  readonly events: readonly ProjectedEvent[]
  readonly lifelines: readonly { readonly asked: string; readonly note: string }[]
  readonly resources: readonly { readonly note: string }[]
  readonly recalculations: readonly RecalculationRecord[]
  readonly destinationRevised: boolean
  readonly activeEventId: string | null
  /**
   * The progress prompt on the wall, resolved to its TEXT here rather than
   * left as an id, so the display never needs the prompt library and cannot
   * render one the facilitator did not choose.
   */
  readonly activePrompt: string | null
  /**
   * The five GPS: Recalculating… questions, present only while a recalculation
   * is on the wall.
   *
   * Projected as resolved text for the same reason as activePrompt: the
   * display never receives a library it could render from, only the strings
   * the facilitator's action put there. This is a major interaction and the
   * room should be looking at the actual questions, not at a paraphrase of
   * them.
   */
  readonly recalculationQuestions: readonly string[] | null
  /**
   * The 90-minute task window only.
   *
   * Never the 120-minute facilitator budget and never the 30-minute
   * contingency buffer — those are not on this object at all.
   */
  readonly minutesRemaining: number | null
  readonly windowMinutes: number
}

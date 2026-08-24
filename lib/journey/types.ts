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

export interface RoadEvent {
  readonly id: RoadEventId
  /** Owner-approved display name. */
  readonly name: string
  /** What the facilitator is inviting the team to do. */
  readonly intent: string
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
  readonly at: number
}

export interface LifelineRecord {
  readonly id: string
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
  /** The event currently on screen, if any. */
  readonly activeEventId: string | null
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
}

export interface ProjectedJourney {
  readonly phase: JourneyPhase
  readonly pointIndex: number
  readonly points: typeof ROADMAP_POINTS
  /** Decisions the team has made, in their own words. */
  readonly decisions: readonly { readonly pointId: RoadmapPointId; readonly text: string }[]
  /** ONLY events already revealed. Never anything queued or upcoming. */
  readonly events: readonly ProjectedEvent[]
  readonly lifelines: readonly { readonly note: string }[]
  readonly resources: readonly { readonly note: string }[]
  readonly recalculations: readonly RecalculationRecord[]
  readonly destinationRevised: boolean
  readonly activeEventId: string | null
  /**
   * The 90-minute task window only.
   *
   * Never the 120-minute facilitator budget and never the 30-minute
   * contingency buffer — those are not on this object at all.
   */
  readonly minutesRemaining: number | null
  readonly windowMinutes: number
}

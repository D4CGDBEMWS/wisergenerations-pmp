import {
  ROADMAP_POINTS,
  type ImpactTarget,
  type JourneyState,
  type RoadEventId,
  type RoadmapPointId,
} from './types'
import { roadEvent } from './events'

// ---------------------------------------------------------------------------
// The engine. A pure reducer, facilitator-driven.
//
// ── NO DICE, AND NO WAY TO ADD ONE ─────────────────────────────────────────
//
// There is no randomness here and no clock read. Every transition is something
// a facilitator did, and `at` timestamps arrive as arguments rather than being
// taken from Date.now(), so a whole session can be replayed in a test and
// produce identical state. A test asserts no module in lib/journey contains
// Math.random.
//
// ── NO SCORE ───────────────────────────────────────────────────────────────
//
// Nothing here counts anything. No points, no health, no correctness, no
// ranking. A team that took the Lifeline is not behind a team that did not.
// The Journey Record at the end is a record of what happened, not a result.
//
// ── EVENTS DO NOT MOVE ANYONE ──────────────────────────────────────────────
//
// `revealEvent` never touches pointIndex. Only `advancePoint` does, and only a
// facilitator calls it. That is what makes a Road Event an interruption rather
// than a space on a board.
// ---------------------------------------------------------------------------

export function initialJourney(): JourneyState {
  return {
    phase: 'briefing',
    pointIndex: 0,
    decisions: [],
    events: [],
    lifelines: [],
    resources: [],
    recalculations: [],
    dependencies: [],
    destinationRevised: false,
    activeEventId: null,
    activePromptId: null,
    startedAt: null,
  }
}

export type JourneyAction =
  /** Starts the 90-minute task window. */
  | { type: 'begin'; at: number }
  | { type: 'record-decision'; text: string; dependsOn?: string; at: number }
  | {
      type: 'reveal-event'
      eventId: RoadEventId
      revealText: string
      facilitatorNote: string
      linkedDecisionId?: string
      at: number
    }
  | { type: 'clear-event' }
  /** What the TEAM decided the event changes. Section B; 'none' is an answer. */
  | { type: 'record-event-impact'; eventRecordId: string; impact: ImpactTarget }
  | { type: 'grant-lifeline'; asked: string; note: string; at: number }
  | { type: 'grant-resource'; note: string; at: number }
  | { type: 'open-recalculation' }
  | {
      type: 'record-recalculation'
      stillTrue: string
      changed: string
      destinationValid: 'holds' | 'changes' | 'undecided'
      milestoneToChange: string
      nextMove: string
      at: number
    }
  | { type: 'register-dependency'; decisionId: string; label: string; at: number }
  | { type: 'set-dependency-available'; dependencyId: string; available: boolean }
  | { type: 'show-prompt'; promptId: string }
  | { type: 'clear-prompt' }
  | { type: 'advance-point' }
  | { type: 'complete' }
  /** Facilitator ends the session. Identical to reset; named for what it is. */
  | { type: 'reset' }
  /**
   * Restores a snapshot the facilitator chose to resume.
   *
   * A stored session is a snapshot, not an action log, so there is nothing to
   * replay — it is adopted whole. Deliberately the only action that can set
   * state arbitrarily, and it exists for exactly one caller: the console's
   * resume prompt, after a human said yes. Nothing calls it automatically.
   */
  | { type: 'adopt'; state: JourneyState }

const lastPointIndex = ROADMAP_POINTS.length - 1

function currentPointId(state: JourneyState): RoadmapPointId {
  return ROADMAP_POINTS[Math.min(state.pointIndex, lastPointIndex)].id
}

/** Stable ids without randomness, so a replayed session is byte-identical. */
function nextId(prefix: string, count: number): string {
  return `${prefix}-${count + 1}`
}

export function journeyReduce(state: JourneyState, action: JourneyAction): JourneyState {
  switch (action.type) {
    case 'reset':
      return initialJourney()

    case 'adopt':
      return action.state

    case 'begin':
      return state.phase === 'briefing'
        ? { ...state, phase: 'at-point', startedAt: action.at }
        : state

    case 'record-decision': {
      const text = action.text.trim()
      if (!text) return state
      const dependsOn = action.dependsOn?.trim()
      const decisionId = nextId('decision', state.decisions.length)
      return {
        ...state,
        decisions: [
          ...state.decisions,
          {
            id: decisionId,
            pointId: currentPointId(state),
            text,
            ...(dependsOn ? { dependsOn } : {}),
            at: action.at,
          },
        ],
        // Capturing a dependency at the moment of the decision is what makes a
        // consequence possible later. Registering it here rather than as a
        // second chore means the facilitator does it while the team is still
        // saying it out loud.
        dependencies: dependsOn
          ? [
              ...state.dependencies,
              {
                id: nextId('dependency', state.dependencies.length),
                label: dependsOn,
                decisionId,
                available: true,
                at: action.at,
              },
            ]
          : state.dependencies,
      }
    }

    case 'reveal-event': {
      const event = roadEvent(action.eventId)
      const record = {
        id: nextId('event', state.events.length),
        eventId: action.eventId,
        afterPointId: currentPointId(state),
        revealText: action.revealText.trim(),
        facilitatorNote: action.facilitatorNote.trim(),
        ...(action.linkedDecisionId ? { linkedDecisionId: action.linkedDecisionId } : {}),
        at: action.at,
      }
      return {
        ...state,
        // Note what does NOT change: pointIndex. An event interrupts; it does
        // not move anybody.
        events: [...state.events, record],
        activeEventId: record.id,
        phase: event.opensRecalculation ? 'recalculating' : 'event',
      }
    }

    case 'clear-event':
      return state.phase === 'event' || state.phase === 'recalculating'
        ? { ...state, phase: 'at-point', activeEventId: null }
        : state

    case 'record-event-impact':
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.eventRecordId ? { ...e, impact: action.impact } : e,
        ),
      }

    case 'grant-lifeline': {
      // The ask comes first and is kept, so the record shows what the team
      // said they needed as well as what they were given.
      const asked = action.asked.trim()
      if (!asked) return state
      return {
        ...state,
        lifelines: [
          ...state.lifelines,
          {
            id: nextId('lifeline', state.lifelines.length),
            asked,
            note: action.note.trim(),
            at: action.at,
          },
        ],
      }
    }

    case 'register-dependency': {
      const label = action.label.trim()
      if (!label) return state
      return {
        ...state,
        dependencies: [
          ...state.dependencies,
          {
            id: nextId('dependency', state.dependencies.length),
            label,
            decisionId: action.decisionId,
            available: true,
            at: action.at,
          },
        ],
      }
    }

    case 'set-dependency-available':
      // Marking something unavailable SURFACES a suggestion on the console. It
      // does not create an event, does not move anybody, and does not appear
      // on the wall. A human decides what to do about it.
      return {
        ...state,
        dependencies: state.dependencies.map((d) =>
          d.id === action.dependencyId ? { ...d, available: action.available } : d,
        ),
      }

    case 'show-prompt':
      return { ...state, activePromptId: action.promptId }

    case 'clear-prompt':
      return { ...state, activePromptId: null }

    case 'grant-resource':
      return {
        ...state,
        resources: [
          ...state.resources,
          { id: nextId('resource', state.resources.length), note: action.note.trim(), at: action.at },
        ],
      }

    case 'open-recalculation':
      return { ...state, phase: 'recalculating' }

    case 'record-recalculation': {
      const record = {
        id: nextId('recalculation', state.recalculations.length),
        afterPointId: currentPointId(state),
        stillTrue: action.stillTrue.trim(),
        changed: action.changed.trim(),
        destinationValid: action.destinationValid,
        milestoneToChange: action.milestoneToChange.trim(),
        nextMove: action.nextMove.trim(),
        at: action.at,
      }
      return {
        ...state,
        recalculations: [...state.recalculations, record],
        // A team may conclude the Destination itself has to change. That is a
        // legitimate outcome, not a failure, and the map says so afterwards.
        destinationRevised: state.destinationRevised || action.destinationValid === 'changes',
        phase: 'at-point',
        activeEventId: null,
      }
    }

    case 'advance-point': {
      if (state.pointIndex >= lastPointIndex) return { ...state, phase: 'complete' }
      return {
        ...state,
        pointIndex: state.pointIndex + 1,
        phase: 'at-point',
        activeEventId: null,
        activePromptId: null,
      }
    }

    case 'complete':
      return { ...state, phase: 'complete', activeEventId: null, activePromptId: null }

    default:
      return state
  }
}

/** Decisions made so far, newest last — what a facilitator links an event to. */
export function linkableDecisions(state: JourneyState) {
  return state.decisions
}

/**
 * Consequences the facilitator COULD land, given what has become unavailable.
 *
 * FACILITATOR-ONLY, and a suggestion rather than an action: this returns the
 * decisions that rest on something now marked unavailable, so the console can
 * say "decision 2 rests on the car" and the facilitator can choose to land an
 * Issue Now on it — or choose not to.
 *
 * Deterministic. No scoring, no ranking, no model call, and nothing fires by
 * itself.
 */
export function brokenDependencies(state: JourneyState) {
  const decisionText = new Map(state.decisions.map((d) => [d.id, d.text]))
  return state.dependencies
    .filter((d) => !d.available)
    .map((d) => ({
      dependencyId: d.id,
      label: d.label,
      decisionId: d.decisionId,
      decisionText: decisionText.get(d.decisionId) ?? '',
    }))
}

export function pointAt(index: number) {
  return ROADMAP_POINTS[Math.min(Math.max(index, 0), lastPointIndex)]
}

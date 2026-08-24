import { ROADMAP_POINTS, type JourneyState, type RoadEventId, type RoadmapPointId } from './types'
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
    destinationRevised: false,
    activeEventId: null,
    startedAt: null,
  }
}

export type JourneyAction =
  /** Starts the 90-minute task window. */
  | { type: 'begin'; at: number }
  | { type: 'record-decision'; text: string; at: number }
  | {
      type: 'reveal-event'
      eventId: RoadEventId
      revealText: string
      facilitatorNote: string
      linkedDecisionId?: string
      at: number
    }
  | { type: 'clear-event' }
  | { type: 'grant-lifeline'; note: string; at: number }
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
  | { type: 'advance-point' }
  | { type: 'complete' }
  | { type: 'reset' }

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

    case 'begin':
      return state.phase === 'briefing'
        ? { ...state, phase: 'at-point', startedAt: action.at }
        : state

    case 'record-decision': {
      const text = action.text.trim()
      if (!text) return state
      return {
        ...state,
        decisions: [
          ...state.decisions,
          {
            id: nextId('decision', state.decisions.length),
            pointId: currentPointId(state),
            text,
            at: action.at,
          },
        ],
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

    case 'grant-lifeline':
      return {
        ...state,
        lifelines: [
          ...state.lifelines,
          { id: nextId('lifeline', state.lifelines.length), note: action.note.trim(), at: action.at },
        ],
      }

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
      }
    }

    case 'complete':
      return { ...state, phase: 'complete', activeEventId: null }

    default:
      return state
  }
}

/** Decisions made so far, newest last — what a facilitator links an event to. */
export function linkableDecisions(state: JourneyState) {
  return state.decisions
}

export function pointAt(index: number) {
  return ROADMAP_POINTS[Math.min(Math.max(index, 0), lastPointIndex)]
}

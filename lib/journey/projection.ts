import { ROADMAP_POINTS, type JourneyState, type ProjectedEvent, type ProjectedJourney } from './types'
import { roadEvent } from './events'
import { projectedMinutesRemaining, WINDOW_MINUTES } from './timing'

// ---------------------------------------------------------------------------
// What goes on the wall.
//
// This is the single narrowing point between the facilitator's private console
// and the projected participant display. Everything the room must never see is
// excluded HERE, by not being copied, rather than hidden later by a component.
//
// ── WHAT IS DELIBERATELY ABSENT ────────────────────────────────────────────
//
//   facilitatorNote        the consequence they are holding, the card they are
//                          working from, what they intend to do next
//   unrevealed events      the entire library, and anything queued
//   BUFFER_MINUTES         and TOTAL_MINUTES, and elapsed time, and overrun
//   linkedDecisionId       replaced by the team's OWN WORDS, or by nothing
//   Sponsor / Higher Power and the closing reveal — not modelled here at all
//
// The projection is built by listing what goes on, never by deleting what
// should not. A field added to JourneyState is invisible to the room until
// somebody deliberately adds it below, which is the correct default for a
// screen pointed at an audience.
//
// tests/liap-journey.test.ts serialises a fully-populated session and asserts
// the wire format contains none of the private strings.
// ---------------------------------------------------------------------------

export function projectJourney(state: JourneyState, now: number): ProjectedJourney {
  const decisionText = new Map(state.decisions.map((d) => [d.id, d.text]))

  const events: ProjectedEvent[] = state.events.map((e) => {
    const definition = roadEvent(e.eventId)
    return {
      id: e.id,
      eventId: e.eventId,
      name: definition.name,
      afterPointId: e.afterPointId,
      revealText: e.revealText,
      favourable: definition.favourable,
      // The team's own earlier words, so a consequence reads as something they
      // chose rather than something done to them. Never the facilitator's
      // private note about it.
      becauseOf: e.linkedDecisionId ? decisionText.get(e.linkedDecisionId) ?? null : null,
    }
  })

  return {
    phase: state.phase,
    pointIndex: state.pointIndex,
    points: ROADMAP_POINTS,
    decisions: state.decisions.map((d) => ({ pointId: d.pointId, text: d.text })),
    events,
    lifelines: state.lifelines.map((l) => ({ note: l.note })),
    resources: state.resources.map((r) => ({ note: r.note })),
    recalculations: state.recalculations,
    destinationRevised: state.destinationRevised,
    activeEventId: state.activeEventId,
    minutesRemaining: projectedMinutesRemaining(state.startedAt, now),
    windowMinutes: WINDOW_MINUTES,
  }
}

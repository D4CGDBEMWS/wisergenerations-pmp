import { ROADMAP_POINTS, type JourneyState, type ProjectedEvent, type ProjectedJourney } from './types'
import { roadEvent } from './events'
import { impactLabel } from './impact'
import { progressPrompt } from './prompts'
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
//   dependencies           the register of what rests on what, and what has
//                          quietly become unavailable — a team that can read
//                          it can see the consequence coming
//   whenToUse              the facilitator's guidance on each progress prompt
//   the debrief            Sponsor / Higher Power and the autobiographical
//                          reveal are not merely excluded here: the display
//                          route never imports lib/journey/debrief.ts, so they
//                          are not in its bundle at all
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
      // What the team decided it changes. Their conclusion, shown back to
      // them — not a verdict on whether they were right.
      impact: e.impact ?? null,
      impactLabel: e.impact ? impactLabel(e.impact) : null,
    }
  })

  return {
    phase: state.phase,
    pointIndex: state.pointIndex,
    points: ROADMAP_POINTS,
    decisions: state.decisions.map((d) => ({ pointId: d.pointId, text: d.text })),
    events,
    lifelines: state.lifelines.map((l) => ({ asked: l.asked, note: l.note })),
    resources: state.resources.map((r) => ({ note: r.note })),
    recalculations: state.recalculations,
    destinationRevised: state.destinationRevised,
    activeEventId: state.activeEventId,
    // Resolved to text here. The display never receives the prompt library, so
    // it cannot render one the facilitator did not put up — and never receives
    // `whenToUse`, which is the facilitator's own reasoning.
    activePrompt: state.activePromptId ? progressPrompt(state.activePromptId)?.text ?? null : null,
    minutesRemaining: projectedMinutesRemaining(state.startedAt, now),
    windowMinutes: WINDOW_MINUTES,
  }
}

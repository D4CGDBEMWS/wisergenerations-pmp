import { ROADMAP_POINTS, type JourneyState, type RoadmapPointId } from './types'
import { RECALCULATION_PROMPTS, roadEvent } from './events'
import { impactLabel } from './impact'

// ---------------------------------------------------------------------------
// The Journey Record.
//
// What the team did, in the order they did it. Not a score, not a verdict, not
// a ranking against another table — there is nothing here to win.
//
// ── WHY IT IS ORGANISED BY POINT ───────────────────────────────────────────
//
// A flat log would be a transcript. Grouped under the roadmap point it
// happened at, the same information becomes the thing the debrief needs: at
// FIRST MOVE you decided this, then this interrupted you, and by the DECISION
// CHECK you had changed the plan. The shape of the record is the shape of the
// conversation it exists to support.
//
// ── PRIVATE NOTES STAY OUT ─────────────────────────────────────────────────
//
// The record is handed to the team, so it carries reveal text and the team's
// own words — never the facilitator's private note, and never the Sponsor /
// Higher Power or closing reveal, which belong to the facilitated debrief.
// ---------------------------------------------------------------------------

export interface RecordEntry {
  readonly kind: 'decision' | 'event' | 'lifeline' | 'resource' | 'recalculation'
  readonly heading: string
  readonly body: string
  /** The team's own earlier words, where a consequence pointed back at one. */
  readonly becauseOf?: string
  /** What the team decided the event changed. Their call, recorded as made. */
  readonly changed?: string
  readonly favourable?: boolean
}

export interface RecordSection {
  readonly pointId: RoadmapPointId
  readonly label: string
  readonly entries: readonly RecordEntry[]
}

export interface JourneyRecord {
  readonly sections: readonly RecordSection[]
  readonly totals: {
    readonly decisions: number
    readonly events: number
    readonly lifelines: number
    readonly resources: number
    readonly recalculations: number
  }
  readonly destinationRevised: boolean
  readonly reachedDestination: boolean
  /**
   * The last thing the team said they would do next — taken from their most
   * recent recalculation, because that is where they said it. Null if they
   * never recalculated.
   */
  readonly finalNextMove: string | null
}

export function buildJourneyRecord(state: JourneyState): JourneyRecord {
  const decisionText = new Map(state.decisions.map((d) => [d.id, d.text]))

  const sections: RecordSection[] = ROADMAP_POINTS.map((point) => {
    const entries: RecordEntry[] = []

    for (const decision of state.decisions.filter((d) => d.pointId === point.id)) {
      entries.push({ kind: 'decision', heading: 'You decided', body: decision.text })
    }

    for (const event of state.events.filter((e) => e.afterPointId === point.id)) {
      const definition = roadEvent(event.eventId)
      entries.push({
        kind: definition.opensRecalculation ? 'recalculation' : 'event',
        heading: definition.name,
        body: event.revealText,
        favourable: definition.favourable,
        ...(event.linkedDecisionId
          ? { becauseOf: decisionText.get(event.linkedDecisionId) ?? undefined }
          : {}),
        ...(event.impact ? { changed: impactLabel(event.impact) } : {}),
      })
    }

    for (const recalculation of state.recalculations.filter((r) => r.afterPointId === point.id)) {
      entries.push({
        kind: 'recalculation',
        heading: 'You recalculated',
        // The five owner-ruled questions, read back in the team's own answers
        // and in the order they were asked.
        body: RECALCULATION_PROMPTS.map(
          (prompt) => `${prompt.label} ${recalculation[prompt.key]}`,
        ).join('\n'),
      })
    }

    return { pointId: point.id, label: point.label, entries }
  })

  // Lifelines and resources are not tied to a point — they were given, and the
  // team used them wherever they used them.
  const loose: RecordEntry[] = [
    ...state.lifelines.map((l) => ({
      kind: 'lifeline' as const,
      heading: 'Lifeline',
      // Both halves: what the team said they needed, and what they were given.
      // The ask is the part worth reading back in the debrief.
      body: l.asked ? `You asked for: ${l.asked}\n${l.note}`.trim() : l.note,
      favourable: true,
    })),
    ...state.resources.map((r) => ({
      kind: 'resource' as const,
      heading: 'Resources',
      body: r.note,
      favourable: true,
    })),
  ]

  const withLoose = loose.length
    ? [...sections, { pointId: 'destination' as RoadmapPointId, label: 'ALONG THE WAY', entries: loose }]
    : sections

  return {
    sections: withLoose,
    totals: {
      decisions: state.decisions.length,
      events: state.events.length,
      lifelines: state.lifelines.length,
      resources: state.resources.length,
      recalculations: state.recalculations.length,
    },
    destinationRevised: state.destinationRevised,
    reachedDestination: state.pointIndex >= ROADMAP_POINTS.length - 1,
    finalNextMove: state.recalculations.at(-1)?.revisedNextMove ?? null,
  }
}

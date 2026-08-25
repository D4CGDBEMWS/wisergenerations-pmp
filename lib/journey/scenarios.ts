import type { RoadmapPointId } from './types'

// ---------------------------------------------------------------------------
// The scenario registry, which is DELIBERATELY EMPTY.
//
// ── WHY THERE IS NO CONTENT HERE ───────────────────────────────────────────
//
// Owner ruling: the approved Scenario Card Deck is physical, and Version 1 of
// the Journey Game runs on it. Teams work from printed cards; the digital map
// is the shared surface and the facilitator's reveal mechanism, not a second
// copy of the deck.
//
// So this file ships the SHAPE and none of the substance. It exists so that
// authorising a digital deck later is a data change rather than an
// architecture change — and so that nobody is tempted to paste scenario text
// into a component in the meantime.
//
// Nothing may be added to SCENARIOS without a separate owner authorisation. A
// test asserts the registry is empty, which is not a placeholder for a
// forgotten task: it is the check that keeps unapproved scenario content out.
//
// The existing Living Life as a Project Manager scenarios are a SEPARATE
// content set and are not migrated, referenced or imported here.
// ---------------------------------------------------------------------------

/** One fact a facilitator reveals at a point on the roadmap. */
export interface ScenarioFact {
  readonly id: string
  readonly atPointId: RoadmapPointId
  /** Read to the room, or projected. */
  readonly text: string
  /** Facilitator-only. Never projected. */
  readonly note?: string
}

export interface JourneyScenario {
  readonly id: string
  readonly title: string
  readonly briefing: string
  readonly facts: readonly ScenarioFact[]
  /** Facilitator-only. */
  readonly facilitatorNotes: readonly string[]
}

/**
 * EMPTY BY OWNER RULING. Do not populate without separate authorisation.
 */
export const SCENARIOS: readonly JourneyScenario[] = []

/**
 * How Version 1 actually runs: no digital scenario loaded, facilitator working
 * from the printed deck and typing each reveal in the language of the room.
 */
export const PRINTED_DECK_MODE = 'printed-deck' as const

export function scenario(id: string): JourneyScenario | null {
  return SCENARIOS.find((s) => s.id === id) ?? null
}

import { SCENARIOS } from './scenarios'
import type { GameState } from './types'

// ---------------------------------------------------------------------------
// Terms I Discovered.
//
// ── DERIVED, NOT DUPLICATED ────────────────────────────────────────────────
//
// The glossary is not a second list of terms maintained alongside the day. It
// is a projection of the scenarios: every term is the answer to a bonus
// question somewhere in the day, and its definition is the `reveal` the
// participant already saw. Adding a scenario with a glossary bonus adds a term
// here automatically; there is nothing to remember to update, and the panel
// cannot drift out of step with the game.
//
// ── WHY UNDISCOVERED TERMS ARE SHOWN AT ALL ────────────────────────────────
//
// A locked row says a word exists without saying what it means. That is the
// honest state after one play: the participant met ten situations and named
// some of them. Hiding the rest would make a first play look complete, and
// replay — §35 — depends on the participant knowing there is something left.
//
// The count is never framed as a score out of ten. Missing a term costs
// nothing (§24) and the panel must not imply otherwise.
// ---------------------------------------------------------------------------

export interface GlossaryTerm {
  readonly term: string
  readonly definition: string
  /** Where in the day it comes up. Shown once discovered. */
  readonly metAt: string
}

/** Every term the day can teach, in the order the day teaches them. */
export const GLOSSARY_TERMS: readonly GlossaryTerm[] = SCENARIOS.flatMap((scenario) =>
  scenario.glossary
    ? [
        {
          term: scenario.glossary.term ?? scenario.glossary.answer,
          definition: scenario.glossary.reveal,
          metAt: `${scenario.time} · ${scenario.title}`,
        },
      ]
    : []
)

export interface GlossaryRow extends GlossaryTerm {
  readonly discovered: boolean
}

/**
 * The panel.
 *
 * Full order always, discovered flag per row — so the list does not reflow as
 * terms are found and a participant who looks twice sees the same shape.
 */
export function glossaryRows(state: GameState): GlossaryRow[] {
  return GLOSSARY_TERMS.map((entry) => ({
    ...entry,
    discovered: state.termsDiscovered.includes(entry.term),
  }))
}

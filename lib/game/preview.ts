import { SCENARIOS, PROJECT_BRIEF } from './scenarios'
import { initialState, reduce } from './engine'
import type { GameState, Scenario } from './types'
import { GAME_NAME, GAME_SUPPORTING_LINE } from './naming'

// ---------------------------------------------------------------------------
// Living Life as a Project Manager — the one-scenario teaser.
//
// One hour of one day, for someone who has never met any of this.
//
// ── WHY THE FULL GAME IS NOT REACHABLE FROM HERE, STRUCTURALLY ─────────────
//
// The obvious way to build a teaser is to run the real game and stop it after
// the first scenario. That works until somebody adds a button, and then a
// pre-launch teaser is quietly serving the unreleased product.
//
// So the preview does not have the vocabulary to advance the day. The engine
// moves the clock in exactly one place — `advance()`, reachable only through
// the `{ type: 'continue' }` action — and PreviewAction below cannot express
// that action. It is not that the preview declines to dispatch it; it is that
// the type does not contain it, so no component can, and the compiler says so.
// A test asserts the string never appears in this module or its client.
//
// ── AND THE SCENARIO IS IMPORTED, NOT COPIED ───────────────────────────────
//
// PREVIEW_SCENARIO is a lookup into the same SCENARIOS array the full game
// reads. Owner ruling: do not fork or duplicate the scenario content. If the
// 10:00 AM hour is ever re-approved, the teaser changes with it and there is
// no second copy to forget.
//
// ── DATA ───────────────────────────────────────────────────────────────────
//
// None. Same as the full game: React state for the length of one visit, no
// fetch, no storage, no free text. The CTA is a LINK, not a form — the
// marketing signup lives on its own page with its own consent story, and
// nothing about a participant's choice travels with them.
// ---------------------------------------------------------------------------

/**
 * The hour the teaser uses.
 *
 * 10:00 AM, owner-selected. It needs no prior context — a colleague asks for
 * one small extra thing — it has four defensible answers, its term is the
 * guide's own headline example, and it sets up no delayed consequence, so
 * nothing is left dangling when a one-hour experience ends.
 */
export const PREVIEW_SCENARIO_ID = 'backlog'

const PREVIEW_INDEX = SCENARIOS.findIndex((s) => s.id === PREVIEW_SCENARIO_ID)

export const PREVIEW_SCENARIO: Scenario = SCENARIOS[PREVIEW_INDEX]

/**
 * Owner-approved. The teaser is titled with the product name and nothing else.
 * "That was one decision. The full day is coming soon." is what marks it as a
 * taste of something larger — a title suffix would say it twice.
 */
export const PREVIEW_TITLE = GAME_NAME
export const PREVIEW_SUPPORTING_LINE = GAME_SUPPORTING_LINE
export const PREVIEW_CLOSING = 'That was one decision. The full day is coming soon.'
export const PREVIEW_CTA_LABEL = 'YES, KEEP ME IN THE LOOP!'

/**
 * Where the CTA sends an engaged participant.
 *
 * OWNER DECISION REQUIRED. There is no anonymous LIAP pre-launch signup
 * surface in the repository today: /api/liap/interest is signed-in only, and
 * the general newsletter band belongs to the PMP business and is deliberately
 * suppressed on every LIAP page. So this points at the LIAP hub, which is
 * where that journey will live, and it is one string to change when the real
 * destination exists.
 *
 * It must stay inside the LIAP shell's own paths or shared infrastructure — a
 * test asserts that — so the teaser can never hand a book reader to the exam
 * simulator.
 */
export const PREVIEW_CTA_HREF = '/living-is-a-project'

/**
 * The lead-in, assembled from the project brief the full game already uses.
 *
 * Three fields, not the whole brief: the teaser has no dashboard to explain,
 * and the brief's weak signals only pay off across a full day. Nothing here is
 * a second copy of anything — the strings come from PROJECT_BRIEF.
 */
export const PREVIEW_BRIEF = {
  project: PROJECT_BRIEF.name,
  purpose: PROJECT_BRIEF.purpose,
  milestone: PROJECT_BRIEF.milestone,
} as const

export type PreviewPhase = 'brief' | 'situation' | 'outcome' | 'glossary' | 'reveal' | 'cta'

/**
 * Everything the preview can do.
 *
 * Note what is absent: `continue`. That is the engine's action for moving the
 * clock, and its absence here is the whole containment argument. `next` is a
 * different word on purpose — it walks the preview's own six beats and never
 * reaches the engine.
 */
export type PreviewAction =
  | { type: 'begin' }
  | { type: 'choose'; choiceId: string }
  | { type: 'answer-glossary'; option: string }
  | { type: 'next' }
  | { type: 'restart' }

export interface PreviewState {
  readonly phase: PreviewPhase
  /** The real GameState, so the real engine computes the real consequences. */
  readonly game: GameState
}

export function previewInitialState(): PreviewState {
  return {
    phase: 'brief',
    game: { ...initialState(), phase: 'situation', scenarioIndex: PREVIEW_INDEX },
  }
}

/**
 * The preview's six beats.
 *
 * Choice and glossary delegate to the engine, so the outcome a participant
 * reads and the term they discover are produced by exactly the code the full
 * game runs. The phase machine around it is the preview's own.
 */
export function previewReduce(state: PreviewState, action: PreviewAction): PreviewState {
  switch (action.type) {
    case 'restart':
      return previewInitialState()

    case 'begin':
      return state.phase === 'brief' ? { ...state, phase: 'situation' } : state

    case 'choose': {
      if (state.phase !== 'situation') return state
      const game = reduce(state.game, { type: 'choose', choiceId: action.choiceId })
      // Unchanged state means the engine rejected the id.
      if (game === state.game) return state
      return { phase: 'outcome', game }
    }

    case 'answer-glossary': {
      if (state.phase !== 'glossary') return state
      const game = reduce(state.game, { type: 'answer-glossary', option: action.option })
      return { phase: 'reveal', game }
    }

    case 'next':
      if (state.phase === 'outcome') {
        // The engine only accepts a glossary answer while it believes it is in
        // the glossary beat, so the preview says so explicitly rather than
        // routing through `continue`, which would also move the clock.
        return { phase: 'glossary', game: { ...state.game, phase: 'glossary' } }
      }
      if (state.phase === 'reveal') return { ...state, phase: 'cta' }
      return state

    default:
      return state
  }
}

/** The choice a participant made, for the outcome beat. */
export function previewChoice(state: PreviewState) {
  const last = state.game.decisions[state.game.decisions.length - 1]
  return last ? PREVIEW_SCENARIO.choices.find((c) => c.id === last.choiceId) ?? null : null
}

export function previewGlossaryCorrect(state: PreviewState): boolean {
  return state.game.glossaryCorrect.includes(PREVIEW_SCENARIO_ID)
}

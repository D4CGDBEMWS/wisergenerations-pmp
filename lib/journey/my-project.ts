import { ROADMAP_POINTS, type RoadmapPointId } from './types'

// ---------------------------------------------------------------------------
// MY PROJECT — the same shape, on the project they actually brought.
//
// Runs after the facilitated game and the debrief. The team has just walked a
// journey with a Destination somebody else chose; now each participant walks
// the same five-point process on the thing that made them come.
//
// ── IT NEVER TOUCHES A SERVER. AT ALL. ─────────────────────────────────────
//
// Owner ruling, and the reason this file has no fetch, no action, no route
// handler and no storage call. What a participant types here is a real problem
// in their real life — a business they are trying to start, a parent they are
// caring for, a marriage, a diagnosis. It is built in the browser, printed or
// saved as a file THEY hold, and gone when the tab closes.
//
// That is not a limitation to be relaxed later. Persisting it would create a
// new sensitive-data pathway needing its own retention window, its own privacy
// language and its own purge — the exact thing the assessment work spent weeks
// getting right. tests/liap-journey.test.ts asserts no module here can
// transmit or persist.
//
// ── WHAT AI MAY AND MAY NOT DO ─────────────────────────────────────────────
//
// May: prompt, and organise what the participant already wrote.
// May not: solve the scenario, choose the milestone, decide the next move, or
// write the Destination.
//
// So the prompts below are QUESTIONS. Not one of them proposes an answer, and
// there is no generation step anywhere in this module — no model call, no
// suggestion list, no autocomplete. A participant's roadmap is composed
// entirely of their own sentences.
// ---------------------------------------------------------------------------

export interface MyProjectStep {
  readonly pointId: RoadmapPointId
  readonly label: string
  /** Asked, never answered. */
  readonly prompt: string
  /** A second, narrower question for someone who stalls. Still a question. */
  readonly nudge: string
}

/**
 * SYSTEM-WRITTEN, pending owner approval.
 *
 * Every line is interrogative on purpose: the moment one of them becomes a
 * suggestion, the roadmap stops being the participant's.
 */
export const MY_PROJECT_STEPS: readonly MyProjectStep[] = [
  {
    pointId: 'start',
    label: ROADMAP_POINTS[0].label,
    prompt: 'Where are you actually starting from today — not where you meant to be?',
    nudge: 'What is true right now that you would rather not write down?',
  },
  {
    pointId: 'first-move',
    label: ROADMAP_POINTS[1].label,
    prompt: 'What is the first move — the one you could make this week?',
    nudge: 'What is the smallest thing that would count as having started?',
  },
  {
    pointId: 'decision-check',
    label: ROADMAP_POINTS[2].label,
    prompt: 'What decision has to be made before you can go further, and what does it turn on?',
    nudge: 'What are you waiting to find out, and who has that answer?',
  },
  {
    pointId: 'milestone-2',
    label: ROADMAP_POINTS[3].label,
    prompt: 'What is the next milestone, and how will you know you have reached it?',
    nudge: 'What would somebody else be able to see that tells them it happened?',
  },
  {
    pointId: 'milestone-3',
    label: ROADMAP_POINTS[4].label,
    prompt: 'And the one after that?',
    nudge: 'What has to be true before this one is even possible?',
  },
  {
    pointId: 'destination',
    label: ROADMAP_POINTS[5].label,
    prompt: 'What is the Destination — and how would you know you had arrived?',
    nudge: 'If this went well, what is different a year from now?',
  },
]

/** One participant's roadmap. Lives in React state and nowhere else. */
export type MyProjectDraft = Partial<Record<RoadmapPointId, string>>

export interface MyProjectRoadmap {
  readonly title: string
  readonly steps: readonly { readonly label: string; readonly text: string }[]
  readonly complete: boolean
}

/**
 * Organises what the participant wrote. It does not add to it.
 *
 * The only transformation is whitespace tidying — no rewriting, no expanding,
 * no summarising, no "improving". A test compares every output string against
 * the input and asserts they match after trimming.
 */
export function buildMyProjectRoadmap(title: string, draft: MyProjectDraft): MyProjectRoadmap {
  const steps = MY_PROJECT_STEPS.map((step) => ({
    label: step.label,
    text: (draft[step.pointId] ?? '').replace(/\s+/g, ' ').trim(),
  }))
  return {
    title: title.replace(/\s+/g, ' ').trim(),
    steps,
    complete: steps.every((s) => s.text.length > 0),
  }
}

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
// ── EVERY PROMPT HERE IS THE OWNER'S ───────────────────────────────────────
//
// Reconciled against Artifact 5, LIAP_MY_PROJECT_Personal_Roadmap.docx. The
// sixteen prompts I had written are gone, replaced verbatim by the printed
// sheet's own questions, so a participant who fills this in on a laptop is
// answering the same words as the participant beside them filling in paper.
//
// Four approved sections were missing from the digital version entirely and
// are added here: WHY THIS MATTERS, MAKE IT REAL, MY NEXT WISE MOVE (with its
// 24–48 hour window) and LEGACY MATTERS.
//
// The six per-point "nudges" are now owner-approved canonical wording. The
// six I had written are deleted, not kept alongside — Artifact 5 has no second
// question for a stalled participant, and rather than leave the gap filled
// with mine, the owner supplied the set.
//
// ── REVIEW POINTS, FROM THE COMPLETED LIFE PROJECT PLAN™ ───────────────────
//
// The owner asked for "review points" and Artifact 5 has none. The Completed
// Life Project Plan™ §20 does — MY REVIEW RHYTHM and WHEN I WILL ASK FOR HELP
// — and its wording is used rather than an invented equivalent.
//
// WISER Pivots™ is §16 of that same Plan and is deliberately NOT brought over.
// The Plan is the Retreat's outcome document; the Journey Game teaches the
// road so a participant can later fill that Plan in. Owner §L: the Journey
// Game "does NOT need to digitally implement the entire Completed Life Project
// Plan™", and §M holds the framework back until the debrief.
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
  /** Asked, never answered. Verbatim from Artifact 5. */
  readonly prompt: string
  /**
   * A second, narrower question for someone who stalls.
   *
   * OWNER-APPROVED CANONICAL. These replaced the six I had written, which are
   * gone rather than kept beside them. Every one is a question and nothing
   * else — no example, no suggestion, no coaching, no recommended answer.
   */
  readonly nudge: string
}

/**
 * The six roadmap steps. Prompts verbatim from Artifact 5.
 *
 * The printed sheet lays DESTINATION out above SECOND NEXT MILESTONE, which is
 * a page-layout artifact; the canonical sequence stated identically in
 * Artifacts 6, 7 and 9 is TODAY → FIRST MOVE → DECISION / MILESTONE CHECK →
 * NEXT MILESTONE → NEXT MILESTONE → DESTINATION, and that is the order used
 * here.
 */
export const MY_PROJECT_STEPS: readonly MyProjectStep[] = [
  {
    pointId: 'start',
    label: ROADMAP_POINTS[0].label,
    prompt: 'Where am I right now? What is true today?',
    nudge: 'What do you know to be true right now?',
  },
  {
    pointId: 'first-move',
    label: ROADMAP_POINTS[1].label,
    prompt: 'What will I do first?',
    nudge: 'What can you begin with what you have now?',
  },
  {
    pointId: 'decision-check',
    label: ROADMAP_POINTS[2].label,
    prompt: 'What decision or result will tell me I am moving?',
    nudge: 'What do you need to know before you decide?',
  },
  {
    pointId: 'milestone-2',
    label: ROADMAP_POINTS[3].label,
    prompt: 'What must I accomplish next?',
    nudge: 'How will you know you reached this milestone?',
  },
  {
    pointId: 'milestone-3',
    label: ROADMAP_POINTS[4].label,
    prompt: 'What must happen after the first milestone?',
    nudge: 'What needs to happen before you can move forward?',
  },
  {
    pointId: 'destination',
    label: ROADMAP_POINTS[5].label,
    prompt: 'What does finished/successful look like?',
    nudge: 'What will tell you that you have reached your intended outcome?',
  },
]

/**
 * The two framing questions Artifact 5 opens with, before the road begins.
 *
 * Both verbatim. WHY THIS MATTERS was missing from the digital version
 * altogether, and it is the question that makes the rest of the sheet worth
 * filling in.
 */
export const MY_PROJECT_OPENING = [
  { id: 'project', label: 'MY PROJECT', prompt: 'What project did I bring with me?' },
  {
    id: 'why',
    label: 'WHY IT MATTERS',
    prompt: 'Why is completing this important to me—and who else may benefit?',
  },
] as const

export type MyProjectOpeningId = (typeof MY_PROJECT_OPENING)[number]['id']

/**
 * CHECK THE ROAD BEFORE YOU GO — Artifact 5, in the printed order.
 *
 * ── FOUR LABELS FOLLOW THE COMPLETED LIFE PROJECT PLAN™, BY OWNER RULING ───
 *
 * MY PROJECT is the transfer surface — the participant's real life, not the
 * game — so its labels take the Plan's practical vocabulary rather than the
 * Journey's metaphor: PEOPLE AND SUPPORT, DEPENDENCIES AND BACKUP, WHY IT
 * MATTERS, LIFELINES. Owner ruling, 25 August 2026.
 *
 * The Journey Game keeps its own metaphor language. Nothing was replaced there
 * merely because MY PROJECT reads more plainly: a team meets No Signal on the
 * road and a person plans around a dependency at their kitchen table, and
 * those are allowed to be different words for the same idea.
 *
 * The prompts themselves remain Artifact 5's, verbatim.
 *
 * "Your roadmap is more than milestones. Look at what can help, what can
 * interfere, and what you will do when the road changes."
 *
 * OPTIONAL MEANS OPTIONAL. A roadmap is complete when the six points are
 * answered; nothing here is required and an empty field is simply not printed.
 *
 * The Road Event names are reused deliberately and are the approved ones — a
 * participant who has just spent ninety minutes with Risk Ahead and Low Fuel
 * meets the same words on their own sheet, not synonyms for them.
 */
export const MY_PROJECT_EXTRAS = [
  { id: 'team', label: 'PEOPLE AND SUPPORT', prompt: 'Who needs to be part of this journey?' },
  { id: 'resources', label: 'RESOURCES', prompt: 'What do I already have? What do I still need?' },
  { id: 'risk-ahead', label: 'RISK AHEAD', prompt: 'What might get in the way?' },
  { id: 'issue-now', label: 'ISSUE NOW', prompt: 'What is already a problem?' },
  { id: 'opening-ahead', label: 'OPENING AHEAD', prompt: 'What opportunity could help?' },
  {
    id: 'low-fuel',
    label: 'LOW FUEL',
    prompt: 'Where could I run short—time, money, energy, skills, or focus?',
  },
  {
    id: 'backup',
    label: 'DEPENDENCIES AND BACKUP',
    prompt: 'What am I depending on? What is my backup?',
  },
  { id: 'lifeline', label: 'LIFELINES', prompt: 'Who can I call when I need help?' },
  {
    id: 'recalculating',
    label: 'GPS: RECALCULATING…',
    prompt:
      'When something changes: What is still true? What changed? What part of my road needs to move?',
  },
  {
    id: 'review-rhythm',
    label: 'MY REVIEW RHYTHM',
    // Completed Life Project Plan™ §20, verbatim. The owner instruction asked
    // for "review points" and Artifact 5 has none; the Plan does, and this is
    // its wording rather than a paraphrase of the idea.
    prompt: 'How often will I review this plan, and what will I inspect when I do?',
  },
  {
    id: 'ask-for-help',
    label: 'WHEN I WILL ASK FOR HELP',
    // Completed Life Project Plan™ §20, verbatim.
    prompt: 'What will tell me it is time to use a Lifeline or seek additional support?',
  },
  {
    id: 'revised-next-move',
    label: 'My revised next move',
    // Artifact 5 prints this as a bare labelled line under GPS: Recalculating…
    // with no question, so none is invented here.
    prompt: '',
  },
  {
    id: 'target-date',
    label: 'Target date',
    // Likewise a bare labelled line, attached to the second Next Milestone.
    // Artifact 7 §11: "Require target dates where appropriate."
    prompt: '',
  },
] as const

export type MyProjectExtraId = (typeof MY_PROJECT_EXTRAS)[number]['id']

/**
 * MAKE IT REAL — Artifact 5's four-column table, verbatim.
 *
 * The columns are the difference between a wish and a plan, and the sheet is
 * not finished without them.
 */
export const MAKE_IT_REAL_COLUMNS = [
  'WHAT HAPPENS NEXT?',
  'WHO?',
  'BY WHEN?',
  "HOW WILL I KNOW IT'S DONE?",
] as const

/**
 * MY NEXT WISE MOVE and LEGACY MATTERS — Artifact 5, verbatim.
 *
 * The 24–48 hour window is the whole point of the first one: a roadmap that
 * does not name something happening this week is a document, not a plan.
 */
export const MY_PROJECT_CLOSING = [
  {
    id: 'next-wise-move',
    label: 'MY NEXT WISE MOVE',
    prompt: 'Within the next 24–48 hours, I will:',
  },
  {
    id: 'legacy',
    label: 'LEGACY MATTERS',
    prompt:
      'When I complete this project, what changes—in me, for someone else, or because I kept going?',
  },
] as const

export type MyProjectClosingId = (typeof MY_PROJECT_CLOSING)[number]['id']

/** Artifact 5's closing lines, verbatim. */
export const MY_PROJECT_SIGNOFF =
  'Keep the destination in sight. When the road changes, recalculate—and keep moving.'

/** Artifact 5's header line, verbatim. */
export const MY_PROJECT_INTRO = 'You practiced the road. Now build yours.'

/**
 * One participant's roadmap in progress.
 *
 * Lives in React state and nowhere else. There is no id, no owner, no session
 * key and no timestamp on this type, because nothing ever looks it up again.
 */
export interface MyProjectDraft {
  readonly opening: Partial<Record<MyProjectOpeningId, string>>
  readonly points: Partial<Record<RoadmapPointId, string>>
  readonly extras: Partial<Record<MyProjectExtraId, string>>
  readonly makeItReal: readonly (readonly string[])[]
  readonly closing: Partial<Record<MyProjectClosingId, string>>
}

export function emptyDraft(): MyProjectDraft {
  return {
    opening: {},
    points: {},
    extras: {},
    makeItReal: [
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
    ],
    closing: {},
  }
}

export interface MyProjectRoadmap {
  readonly title: string
  readonly why: string
  readonly steps: readonly { readonly label: string; readonly text: string }[]
  readonly extras: readonly { readonly label: string; readonly text: string }[]
  readonly makeItReal: readonly (readonly string[])[]
  readonly closing: readonly { readonly label: string; readonly text: string }[]
  /** True once all six roadmap points are answered. Optional fields never count. */
  readonly complete: boolean
}

/**
 * Organises what the participant wrote. It does not add to it.
 *
 * The only transformation is whitespace tidying — no rewriting, no expanding,
 * no summarising, no "improving", no suggestion, no completion. A test compares
 * every output string against its input.
 */
export function buildMyProjectRoadmap(draft: MyProjectDraft): MyProjectRoadmap {
  const tidy = (value: string | undefined) => (value ?? '').replace(/\s+/g, ' ').trim()

  const steps = MY_PROJECT_STEPS.map((step) => ({
    label: step.label,
    text: tidy(draft.points[step.pointId]),
  }))

  return {
    title: tidy(draft.opening.project),
    why: tidy(draft.opening.why),
    steps,
    // Only what the participant filled in. An empty optional field is not on
    // the printed roadmap, rather than printed as a blank to be embarrassed by.
    extras: MY_PROJECT_EXTRAS.map((extra) => ({
      label: extra.label,
      text: tidy(draft.extras[extra.id]),
    })).filter((extra) => extra.text.length > 0),
    makeItReal: draft.makeItReal
      .map((row) => row.map(tidy))
      .filter((row) => row.some((cell) => cell.length > 0)),
    closing: MY_PROJECT_CLOSING.map((item) => ({
      label: item.label,
      text: tidy(draft.closing[item.id]),
    })).filter((item) => item.text.length > 0),
    complete: steps.every((s) => s.text.length > 0),
  }
}

/** True once the participant has typed anything at all worth losing. */
export function draftHasContent(draft: MyProjectDraft): boolean {
  const values = [
    ...Object.values(draft.opening),
    ...Object.values(draft.points),
    ...Object.values(draft.extras),
    ...Object.values(draft.closing),
    ...draft.makeItReal.flat(),
  ]
  return values.some((value) => (value ?? '').trim().length > 0)
}

/**
 * OWNER-APPROVED COPY. Verbatim, and not to be expanded.
 *
 * Shown before reset and on tab close. Two short sentences: one instruction
 * and one fact. Adding reassurance or a second privacy promise around it would
 * turn approved functional copy into new unapproved policy language.
 */
export const MY_PROJECT_EXIT_WARNING =
  'Save or print your roadmap if you want to keep it. Your project information is not stored by Wiser Generations.'

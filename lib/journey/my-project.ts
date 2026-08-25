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
 * The six roadmap steps — the same permanent architecture the team just walked
 * in the facilitated game, now on the project the participant actually brought.
 *
 * PROVENANCE: SYSTEM-WRITTEN, PENDING OWNER APPROVAL. Where the physical MY
 * PROJECT Roadmap already carries a prompt for one of these points, the
 * approved wording replaces the draft rather than sitting alongside it.
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

/**
 * The optional fields, owner-specified in Section N.
 *
 * OPTIONAL MEANS OPTIONAL. A roadmap is complete when the six points are
 * answered; nothing here is required, nothing is flagged as missing, and an
 * empty one is not marked incomplete. A participant who only wants the spine
 * should be able to print after six answers.
 *
 * The Road Event names are reused deliberately — a participant who has just
 * spent ninety minutes with Risk Ahead and Low Fuel should meet the same words
 * on their own roadmap, not synonyms for them.
 *
 * PROVENANCE: labels are the owner-approved Road Event names; the prompts are
 * SYSTEM-WRITTEN and pending approval.
 */
export const MY_PROJECT_EXTRAS = [
  { id: 'team', label: 'Team / support', prompt: 'Who is with you on this, and what do they actually do?' },
  { id: 'resources', label: 'Resources', prompt: 'What do you have to work with — money, time, access, skill, information?' },
  { id: 'risk-ahead', label: 'Risk Ahead', prompt: 'What could go wrong that has not gone wrong yet?' },
  { id: 'issue-now', label: 'Issue Now', prompt: 'What has already gone wrong that you are still carrying?' },
  { id: 'opening-ahead', label: 'Opening Ahead', prompt: 'What opportunity is in front of you, and what would taking it cost?' },
  { id: 'low-fuel', label: 'Low Fuel', prompt: 'What is running low, and what will you protect when it does?' },
  { id: 'lifeline', label: 'Lifeline', prompt: 'What kind of help do you need, and who could give it?' },
  { id: 'backup', label: 'Backup / dependency', prompt: 'What does this plan rest on — and what is your plan if that is taken away?' },
  { id: 'recalculating', label: 'GPS: Recalculating…', prompt: 'What has already changed since you started thinking about this?' },
  { id: 'target-dates', label: 'Target dates', prompt: 'When do you want each milestone to happen?' },
] as const

export type MyProjectExtraId = (typeof MY_PROJECT_EXTRAS)[number]['id']

/**
 * One participant's roadmap in progress.
 *
 * Lives in React state and nowhere else. There is no id, no owner, no session
 * key and no timestamp on this type, because there is nothing for those to be
 * useful to — nothing ever looks this up again.
 */
export interface MyProjectDraft {
  readonly title: string
  readonly points: Partial<Record<RoadmapPointId, string>>
  readonly extras: Partial<Record<MyProjectExtraId, string>>
}

export function emptyDraft(): MyProjectDraft {
  return { title: '', points: {}, extras: {} }
}

export interface MyProjectRoadmap {
  readonly title: string
  readonly steps: readonly { readonly label: string; readonly text: string }[]
  readonly extras: readonly { readonly label: string; readonly text: string }[]
  /** True once all six roadmap points are answered. Optional fields never count. */
  readonly complete: boolean
}

/**
 * Organises what the participant wrote. It does not add to it.
 *
 * The only transformation is whitespace tidying — no rewriting, no expanding,
 * no summarising, no "improving", no suggestion, no completion. A test compares
 * every output string against its input and asserts they match after
 * normalising whitespace.
 */
export function buildMyProjectRoadmap(draft: MyProjectDraft): MyProjectRoadmap {
  const tidy = (value: string | undefined) => (value ?? '').replace(/\s+/g, ' ').trim()

  const steps = MY_PROJECT_STEPS.map((step) => ({
    label: step.label,
    text: tidy(draft.points[step.pointId]),
  }))

  return {
    title: tidy(draft.title),
    steps,
    // Only what the participant filled in. An empty optional field is simply
    // not on the printed roadmap, rather than printed as a blank to be
    // embarrassed by.
    extras: MY_PROJECT_EXTRAS.map((extra) => ({
      label: extra.label,
      text: tidy(draft.extras[extra.id]),
    })).filter((extra) => extra.text.length > 0),
    complete: steps.every((s) => s.text.length > 0),
  }
}

/** True once the participant has typed anything at all worth losing. */
export function draftHasContent(draft: MyProjectDraft): boolean {
  if (draft.title.trim()) return true
  return [...Object.values(draft.points), ...Object.values(draft.extras)].some(
    (value) => (value ?? '').trim().length > 0,
  )
}

/**
 * OWNER-APPROVED COPY. Verbatim, and not to be expanded.
 *
 * Shown before reset and on tab close. It is deliberately two short sentences:
 * one instruction and one fact. Adding reassurance, elaboration or a second
 * privacy promise around it would turn approved functional copy into new
 * unapproved policy language.
 */
export const MY_PROJECT_EXIT_WARNING =
  'Save or print your roadmap if you want to keep it. Your project information is not stored by Wiser Generations.'

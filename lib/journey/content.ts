import { DEBRIEF_DO_NOT, DEBRIEF_FINAL_REMINDER, DEBRIEF_SEQUENCE } from './debrief'
import { DISPLAY_STRINGS } from './display-copy'
import { ROADMAP_CHECK, ROAD_EVENT_LIBRARY, RECALCULATION_PROMPTS } from './events'
import { IMPACT_CHOICES, impactLabel } from './impact'
import {
  MAKE_IT_REAL_COLUMNS,
  MY_PROJECT_CLOSING,
  MY_PROJECT_EXIT_WARNING,
  MY_PROJECT_EXTRAS,
  MY_PROJECT_INTRO,
  MY_PROJECT_OPENING,
  MY_PROJECT_SIGNOFF,
  MY_PROJECT_STEPS,
} from './my-project'
import { PROGRESS_PROMPTS } from './prompts'

// ---------------------------------------------------------------------------
// The content inventory — every word this product shows anyone, in one place,
// with where it appears, who sees it, and where it came from.
//
// ── WHY IT IS GENERATED RATHER THAN WRITTEN ────────────────────────────────
//
// A hand-typed inventory drifts within a week: somebody edits a prompt and the
// review table quietly stops describing the product. This one is assembled
// FROM the constants the interface renders, so a changed string changes the
// inventory.
//
// ── AND WHY THAT WAS NOT ENOUGH ────────────────────────────────────────────
//
// The first version of this file read only the content modules, so it missed
// eight participant-facing lines hardcoded in the display component's JSX —
// projected onto a wall, never reviewed by anyone. They now live as data in
// display-copy.ts and are read here. A generated inventory is only as complete
// as the surface it reads; that hole is the reason display-copy.ts exists.
//
// ── PROVENANCE IS THE POINT ────────────────────────────────────────────────
//
// 'owner-approved' means the words came from an approved artifact, and `source`
// names which one. 'system-written' means I wrote it and it is NOT cleared for
// production.
//
// 'conflict' means two approved artifacts word the same moment differently.
// Those are not mine to decide, so they are carried at one artifact's wording
// provisionally and surfaced here for the owner.
// ---------------------------------------------------------------------------

export type ContentAudience = 'participant' | 'facilitator'

export type ContentProvenance = 'owner-approved' | 'system-written' | 'conflict'

export type ContentGroup =
  | 'A. Road Event participant text'
  | 'B. Road Event facilitator intent/note'
  | 'C. Journey progress prompts'
  | 'D. MY PROJECT prompts'
  | 'E. MY PROJECT nudges/warnings'
  | 'F. Debrief prompts/cues'
  | 'G. Participant Display copy'

export interface ContentEntry {
  readonly group: ContentGroup
  readonly id: string
  readonly text: string
  /** The surface it renders on. */
  readonly where: string
  readonly audience: ContentAudience
  readonly provenance: ContentProvenance
  /** Which approved artifact it came from, where one exists. */
  readonly source?: string
  /** What the disagreement is, for conflict entries. */
  readonly conflict?: string
}

const CARDS = 'Artifact 3 — Facilitator Road-Event Cards'
const ROADMAP = 'Artifact 5 — MY PROJECT Personal Roadmap'
const DEBRIEF = 'Artifact 6 — 30-Minute Facilitator Debrief Guide'

// ── A. Road Event participant text ─────────────────────────────────────────

const eventNames: ContentEntry[] = ROAD_EVENT_LIBRARY.map((event) => ({
  group: 'A. Road Event participant text',
  id: `event.${event.id}.name`,
  text: event.name,
  where: 'Participant Display, event card heading; Facilitator Console; Journey Record',
  audience: 'participant',
  provenance: 'owner-approved',
  source:
    event.id === 'recalculating'
      ? 'Owner ruling, 25 August 2026 — ellipsis character, consistently'
      : CARDS,
}))

const eventTaglines: ContentEntry[] = ROAD_EVENT_LIBRARY.map((event) => ({
  group: 'A. Road Event participant text',
  id: `event.${event.id}.tagline`,
  text: event.tagline,
  where: 'Participant Display, under the event name; Facilitator Console',
  audience: 'participant',
  provenance: 'owner-approved',
  source: CARDS,
}))

const eventReadToTeam: ContentEntry[] = ROAD_EVENT_LIBRARY.map((event) => ({
  group: 'A. Road Event participant text',
  id: `event.${event.id}.readToTeam`,
  text: event.readToTeam,
  where: 'Participant Display, the event card body',
  audience: 'participant',
  provenance: 'owner-approved',
  source: `${CARDS} — READ TO TEAM`,
}))

const roadmapCheck: ContentEntry = {
  group: 'A. Road Event participant text',
  id: 'event.roadmap-check',
  text: ROADMAP_CHECK,
  where: 'Participant Display, under a revealed event until the team answers',
  audience: 'participant',
  provenance: 'owner-approved',
  source: `${CARDS} — ROADMAP CHECK, identical on all eight cards`,
}

const recalculationQuestions: ContentEntry[] = RECALCULATION_PROMPTS.map((prompt) => ({
  group: 'A. Road Event participant text',
  id: `recalculation.${prompt.key}`,
  text: prompt.label,
  where: 'Participant Display during GPS: Recalculating…; Facilitator Console capture form',
  audience: 'participant',
  provenance: 'owner-approved',
  // Canonical, and deliberately not the printed wording. The cards are on the
  // revision list; the software does not revert to them.
  source: 'Completed Life Project Plan™ §15, verbatim; confirmed by owner ruling',
}))

const impactLabels: ContentEntry[] = IMPACT_CHOICES.map((choice) => ({
  group: 'A. Road Event participant text',
  id: `impact.${choice.id}`,
  text: impactLabel(choice.id),
  where: 'Participant Display, under an event once the team has answered; Journey Record',
  audience: 'participant',
  // Reviewed as written and kept. The approved artifacts phrase this moment as
  // a question and let the team answer in their own words; these six read that
  // answer back, and the owner approved them unchanged.
  provenance: 'owner-approved',
  source: 'Owner ruling — approved as written',
}))

// ── B. Road Event facilitator fields ───────────────────────────────────────

const facilitatorCardFields: ContentEntry[] = ROAD_EVENT_LIBRARY.flatMap((event) =>
  (
    [
      ['whenToPlay', 'WHEN TO PLAY', event.whenToPlay],
      ['watchFor', 'WATCH FOR', event.watchFor],
      ['pushWithoutSolving', 'PUSH WITHOUT SOLVING', event.pushWithoutSolving],
    ] as const
  ).map(([key, label, text]) => ({
    group: 'B. Road Event facilitator intent/note' as const,
    id: `event.${event.id}.${key}`,
    text,
    where: 'Facilitator Console only, under the event button',
    audience: 'facilitator' as const,
    provenance: 'owner-approved' as const,
    source: `${CARDS} — ${label}`,
  })),
)

// ── C. Progress prompts ────────────────────────────────────────────────────

const progressPromptText: ContentEntry[] = PROGRESS_PROMPTS.map((prompt) => ({
  group: 'C. Journey progress prompts',
  id: `prompt.${prompt.id}`,
  text: prompt.text,
  where: 'Participant Display, when the facilitator puts it up',
  audience: 'participant',
  provenance: 'owner-approved',
  source: prompt.source,
}))

const progressPromptGuidance: ContentEntry[] = PROGRESS_PROMPTS.filter((p) => p.whenToUse).map(
  (prompt) => ({
    group: 'C. Journey progress prompts',
    id: `prompt.${prompt.id}.whenToUse`,
    text: prompt.whenToUse!,
    where: 'Facilitator Console only',
    audience: 'facilitator',
    provenance: 'owner-approved',
    source: prompt.source,
  }),
)

// ── D. MY PROJECT prompts ──────────────────────────────────────────────────

const myProjectOpening: ContentEntry[] = MY_PROJECT_OPENING.map((field) => ({
  group: 'D. MY PROJECT prompts',
  id: `my-project.opening.${field.id}`,
  text: field.prompt,
  where: 'MY PROJECT, above the road',
  audience: 'participant',
  provenance: 'owner-approved',
  source: ROADMAP,
}))

const myProjectPrompts: ContentEntry[] = MY_PROJECT_STEPS.map((step) => ({
  group: 'D. MY PROJECT prompts',
  id: `my-project.${step.pointId}.prompt`,
  text: step.prompt,
  where: 'MY PROJECT, on the participant’s own device',
  audience: 'participant',
  provenance: 'owner-approved',
  source: ROADMAP,
}))

const myProjectExtras: ContentEntry[] = MY_PROJECT_EXTRAS.filter((e) => e.prompt).map((extra) => ({
  group: 'D. MY PROJECT prompts',
  id: `my-project.extra.${extra.id}`,
  text: extra.prompt,
  where: 'MY PROJECT, CHECK THE ROAD BEFORE YOU GO',
  audience: 'participant',
  provenance: 'owner-approved',
  source: ROADMAP,
}))

const myProjectStructure: ContentEntry[] = [
  ...MAKE_IT_REAL_COLUMNS.map((column) => ({
    group: 'D. MY PROJECT prompts' as const,
    id: `my-project.make-it-real.${column}`,
    text: column,
    where: 'MY PROJECT, MAKE IT REAL table header',
    audience: 'participant' as const,
    provenance: 'owner-approved' as const,
    source: ROADMAP,
  })),
  ...MY_PROJECT_CLOSING.map((field) => ({
    group: 'D. MY PROJECT prompts' as const,
    id: `my-project.closing.${field.id}`,
    text: field.prompt,
    where: 'MY PROJECT, below MAKE IT REAL',
    audience: 'participant' as const,
    provenance: 'owner-approved' as const,
    source: ROADMAP,
  })),
  {
    group: 'D. MY PROJECT prompts',
    id: 'my-project.intro',
    text: MY_PROJECT_INTRO,
    where: 'MY PROJECT, page header',
    audience: 'participant',
    provenance: 'owner-approved',
    source: ROADMAP,
  },
  {
    group: 'D. MY PROJECT prompts',
    id: 'my-project.signoff',
    text: MY_PROJECT_SIGNOFF,
    where: 'MY PROJECT, closing line',
    audience: 'participant',
    provenance: 'owner-approved',
    source: ROADMAP,
  },
]

// ── E. MY PROJECT nudges and warnings ──────────────────────────────────────

const myProjectNudges: ContentEntry[] = MY_PROJECT_STEPS.map((step) => ({
  group: 'E. MY PROJECT nudges/warnings',
  id: `my-project.${step.pointId}.nudge`,
  text: step.nudge,
  where: 'MY PROJECT, shown on request when a participant stalls',
  audience: 'participant',
  provenance: 'owner-approved',
  source: 'Owner ruling — canonical MY PROJECT second questions',
}))

const exitWarning: ContentEntry = {
  group: 'E. MY PROJECT nudges/warnings',
  id: 'my-project.exit-warning',
  text: MY_PROJECT_EXIT_WARNING,
  where: 'MY PROJECT, before reset and on tab close',
  audience: 'participant',
  provenance: 'owner-approved',
  source: 'Owner ruling — Section O, approved functional copy, verbatim',
}

// ── F. Debrief ─────────────────────────────────────────────────────────────

const debriefAsks: ContentEntry[] = DEBRIEF_SEQUENCE.flatMap((moment) =>
  moment.asks.map((ask, index) => ({
    group: 'F. Debrief prompts/cues' as const,
    id: `debrief.${moment.id}.ask-${index + 1}`,
    text: ask,
    where: `Facilitator Console, debrief panel, ${moment.time}. Spoken aloud; never rendered to the room`,
    audience: 'facilitator' as const,
    provenance: moment.ownerWordingPending
      ? ('system-written' as const)
      : ('owner-approved' as const),
    source: DEBRIEF,
  })),
)

const debriefNotes: ContentEntry[] = DEBRIEF_SEQUENCE.map((moment) => ({
  group: 'F. Debrief prompts/cues',
  id: `debrief.${moment.id}.note`,
  text: moment.note,
  where: 'Facilitator Console, debrief panel',
  audience: 'facilitator',
  // The two reveal moments carry an OWNER WORDING PENDING marker rather than
  // approved copy, so they are not counted as approved.
  provenance: moment.ownerWordingPending ? 'system-written' : 'owner-approved',
  source: moment.ownerWordingPending
    ? 'OWNER WORDING PENDING — owner ruling, 25 August 2026'
    : `${DEBRIEF} — FACILITATOR NOTE`,
}))

const debriefRules: ContentEntry[] = [
  ...DEBRIEF_DO_NOT.map((rule, index) => ({
    group: 'F. Debrief prompts/cues' as const,
    id: `debrief.do-not-${index + 1}`,
    text: rule,
    where: 'Facilitator Console, debrief panel',
    audience: 'facilitator' as const,
    provenance: 'owner-approved' as const,
    source: `${DEBRIEF} — Do Not Do During the Debrief`,
  })),
  ...DEBRIEF_FINAL_REMINDER.map((line, index) => ({
    group: 'F. Debrief prompts/cues' as const,
    id: `debrief.final-reminder-${index + 1}`,
    text: line,
    where: 'Facilitator Console, debrief panel',
    audience: 'facilitator' as const,
    provenance: 'owner-approved' as const,
    source: `${DEBRIEF} — Facilitator Final Reminder`,
  })),
]

// ── G. Participant Display copy ────────────────────────────────────────────

const displayCopy: ContentEntry[] = DISPLAY_STRINGS.map((entry) => ({
  group: 'G. Participant Display copy',
  id: entry.id,
  text: entry.text,
  where: entry.where,
  audience: 'participant',
  // The four with no artifact source — the page heading, the waiting state,
  // the clock label and the line that introduces a team's own words — were
  // reviewed as written and approved.
  provenance: 'owner-approved',
  source: entry.source ?? 'Owner ruling — approved as written',
}))

export const CONTENT_INVENTORY: readonly ContentEntry[] = [
  ...eventNames,
  ...eventTaglines,
  ...eventReadToTeam,
  roadmapCheck,
  ...recalculationQuestions,
  ...impactLabels,
  ...facilitatorCardFields,
  ...progressPromptText,
  ...progressPromptGuidance,
  ...myProjectOpening,
  ...myProjectPrompts,
  ...myProjectExtras,
  ...myProjectStructure,
  ...myProjectNudges,
  exitWarning,
  ...debriefAsks,
  ...debriefNotes,
  ...debriefRules,
  ...displayCopy,
]

export function inventoryByGroup(group: ContentGroup): readonly ContentEntry[] {
  return CONTENT_INVENTORY.filter((entry) => entry.group === group)
}

/** What still needs owner wording before this ships to a room. */
export function pendingOwnerReview(): readonly ContentEntry[] {
  return CONTENT_INVENTORY.filter((entry) => entry.provenance === 'system-written')
}

/** Where two approved artifacts disagree. Owner decision, not mine. */
export function wordingConflicts(): readonly ContentEntry[] {
  return CONTENT_INVENTORY.filter((entry) => entry.provenance === 'conflict')
}

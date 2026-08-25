import { DEBRIEF_SEQUENCE } from './debrief'
import { IMPACT_CHOICES } from './impact'
import { impactLabel } from './impact'
import { ROAD_EVENT_LIBRARY, RECALCULATION_PROMPTS } from './events'
import { MY_PROJECT_EXIT_WARNING, MY_PROJECT_EXTRAS, MY_PROJECT_STEPS } from './my-project'
import { PROGRESS_PROMPTS } from './prompts'

// ---------------------------------------------------------------------------
// The content inventory — every word this product shows anyone, in one place,
// with where it appears, who sees it, and where it came from.
//
// ── WHY IT IS GENERATED RATHER THAN WRITTEN ────────────────────────────────
//
// A hand-typed inventory in a document starts accurate and drifts within a
// week: somebody edits a prompt in prompts.ts and the review table quietly
// stops describing the product. This one is assembled FROM the constants the
// interface actually renders, so a changed string changes the inventory, and a
// new string that nobody classified fails the count assertion in
// tests/liap-journey.test.ts.
//
// ── PROVENANCE IS THE POINT ────────────────────────────────────────────────
//
// 'owner-approved' means the words came from an approved artifact — the Road
// Event names, the five GPS: Recalculating… questions, the MY PROJECT exit
// warning.
//
// 'system-written' means I wrote it and it is NOT cleared for production. The
// physical Journey Map, Scenario Cards, Road-Event Deck, MY PROJECT Roadmap,
// Facilitator Guide and Debrief Guide are the authority; where one of them
// carries a line for one of these moments, the approved wording REPLACES the
// draft rather than sitting beside it. A parallel digital vocabulary is the
// failure this file exists to prevent.
// ---------------------------------------------------------------------------

export type ContentAudience = 'participant' | 'facilitator'

export type ContentProvenance = 'owner-approved' | 'system-written'

export type ContentGroup =
  | 'A. Road Event participant text'
  | 'B. Road Event facilitator intent/note'
  | 'C. Journey progress prompts'
  | 'D. MY PROJECT prompts'
  | 'E. MY PROJECT nudges/warnings'
  | 'F. Debrief prompts/cues'

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
}

/** Ratified on owner review: they support the moment without giving an answer. */
const APPROVED_PROMPT_IDS = new Set(['research', 'help-needed'])

const eventNames: ContentEntry[] = ROAD_EVENT_LIBRARY.map((event) => ({
  group: 'A. Road Event participant text',
  id: `event.${event.id}.name`,
  text: event.name,
  where: 'Participant Display, event card heading; Facilitator Console, event button; Journey Record',
  audience: 'participant',
  provenance: 'owner-approved',
  source: 'Owner ruling — Road Event names, Section B',
}))

const recalculationQuestions: ContentEntry[] = RECALCULATION_PROMPTS.map((prompt) => ({
  group: 'A. Road Event participant text',
  id: `recalculation.${prompt.key}`,
  text: prompt.label,
  where: 'Participant Display during GPS: Recalculating…; Facilitator Console capture form',
  audience: 'participant',
  provenance: 'owner-approved',
  source: 'Owner ruling — Section K, five questions',
}))

const eventIntents: ContentEntry[] = ROAD_EVENT_LIBRARY.map((event) => ({
  group: 'B. Road Event facilitator intent/note',
  id: `event.${event.id}.intent`,
  text: event.intent,
  where: 'Facilitator Console only, under the event button',
  audience: 'facilitator',
  provenance: 'system-written',
}))

const impactLabels: ContentEntry[] = IMPACT_CHOICES.map((choice) => ({
  group: 'A. Road Event participant text',
  id: `impact.${choice.id}`,
  text: impactLabel(choice.id),
  where: 'Participant Display, under an event once the team has answered; Journey Record',
  audience: 'participant',
  provenance: 'system-written',
}))

const progressPromptText: ContentEntry[] = PROGRESS_PROMPTS.map((prompt) => ({
  group: 'C. Journey progress prompts',
  id: `prompt.${prompt.id}`,
  text: prompt.text,
  where: 'Participant Display, when the facilitator puts it up',
  audience: 'participant',
  // Two were ratified on review as approved progress prompts; the rest are
  // still mine and still pending.
  provenance: APPROVED_PROMPT_IDS.has(prompt.id) ? 'owner-approved' : 'system-written',
  ...(APPROVED_PROMPT_IDS.has(prompt.id)
    ? { source: 'Owner review — approved progress prompts, Sections I and J' }
    : {}),
}))

const progressPromptGuidance: ContentEntry[] = PROGRESS_PROMPTS.map((prompt) => ({
  group: 'C. Journey progress prompts',
  id: `prompt.${prompt.id}.whenToUse`,
  text: prompt.whenToUse,
  where: 'Facilitator Console only',
  audience: 'facilitator',
  provenance: 'system-written',
}))

const myProjectPrompts: ContentEntry[] = MY_PROJECT_STEPS.map((step) => ({
  group: 'D. MY PROJECT prompts',
  id: `my-project.${step.pointId}.prompt`,
  text: step.prompt,
  where: 'MY PROJECT, on the participant’s own device',
  audience: 'participant',
  provenance: 'system-written',
}))

const myProjectExtras: ContentEntry[] = MY_PROJECT_EXTRAS.map((extra) => ({
  group: 'D. MY PROJECT prompts',
  id: `my-project.extra.${extra.id}`,
  text: extra.prompt,
  where: 'MY PROJECT, optional fields',
  audience: 'participant',
  provenance: 'system-written',
}))

const myProjectNudges: ContentEntry[] = MY_PROJECT_STEPS.map((step) => ({
  group: 'E. MY PROJECT nudges/warnings',
  id: `my-project.${step.pointId}.nudge`,
  text: step.nudge,
  where: 'MY PROJECT, shown on request when a participant stalls',
  audience: 'participant',
  provenance: 'system-written',
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

const debriefCues: ContentEntry[] = DEBRIEF_SEQUENCE.flatMap((cue) => [
  {
    group: 'F. Debrief prompts/cues' as const,
    id: `debrief.${cue.id}.cue`,
    text: cue.cue,
    where: 'Facilitator Console, debrief panel. Spoken aloud; never rendered to the room',
    audience: 'facilitator' as const,
    provenance:
      cue.id === 'sponsor' ? ('owner-approved' as const) : ('system-written' as const),
    ...(cue.id === 'sponsor'
      ? { source: 'Owner ruling — Section L.1, asked and never answered for participants' }
      : {}),
  },
  {
    group: 'F. Debrief prompts/cues' as const,
    id: `debrief.${cue.id}.note`,
    text: cue.note,
    where: 'Facilitator Console, debrief panel',
    audience: 'facilitator' as const,
    provenance: 'system-written' as const,
  },
])

export const CONTENT_INVENTORY: readonly ContentEntry[] = [
  ...eventNames,
  ...recalculationQuestions,
  ...impactLabels,
  ...eventIntents,
  ...progressPromptText,
  ...progressPromptGuidance,
  ...myProjectPrompts,
  ...myProjectExtras,
  ...myProjectNudges,
  exitWarning,
  ...debriefCues,
]

export function inventoryByGroup(group: ContentGroup): readonly ContentEntry[] {
  return CONTENT_INVENTORY.filter((entry) => entry.group === group)
}

/** What still needs owner wording review before this ships to a room. */
export function pendingOwnerReview(): readonly ContentEntry[] {
  return CONTENT_INVENTORY.filter((entry) => entry.provenance === 'system-written')
}

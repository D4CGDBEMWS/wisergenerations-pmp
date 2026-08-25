// ---------------------------------------------------------------------------
// The debrief — the approved 30-minute sequence. FACILITATOR-ONLY.
//
// ── PROVENANCE: ARTIFACT 6, WITH ARTIFACT 9 §8–9 ───────────────────────────
//
// Every question and every note below is transcribed from
// LIAP_30_Minute_Facilitator_Debrief_Guide.docx. The six cues I had written
// are gone. Artifact 6 is a timed sequence, not a list of prompts, and the
// timing is part of the method — the Sponsor question lands at 21 minutes
// because the room has spent twenty minutes earning it.
//
// ── THIS MODULE IS NEVER IMPORTED BY THE PARTICIPANT DISPLAY ───────────────
//
// Two things here must not reach a projected screen under any circumstance:
//
//   1. The Sponsor / Higher Power question — "Pause after the question. Do not
//      answer for the room." (Artifact 6)
//
//   2. The personal reveal — "The autobiographical connection is the
//      crescendo, not the opening. Do not leak it through scenario
//      introductions, side comments, digital screens, facilitator hints, or
//      participant materials." (Artifact 9 §9)
//
// That is not a render-time decision. The display route does not import this
// file, so none of these strings are in the bundle the projected window loads.
// They cannot leak through devtools, view-source, an alt attribute, a tooltip,
// a stray console.log, or a future component that forgot. There is nothing
// there to find, and a test walks the display route's import graph to prove it.
// ---------------------------------------------------------------------------

export type DebriefStage =
  | 'story'
  | 'name-it'
  | 'recalculating'
  | 'what-changed'
  | 'sponsor'
  | 'personal-reveal'
  | 'close'

export interface DebriefMoment {
  readonly id: string
  readonly stage: DebriefStage
  /** Artifact 6's own time band. The pacing is part of the method. */
  readonly time: string
  readonly heading: string
  /** Artifact 6's stated purpose for the moment. */
  readonly purpose: string
  /** What the facilitator asks, in order. Spoken aloud; never rendered to the room. */
  readonly asks: readonly string[]
  /** Artifact 6's FACILITATOR NOTE, verbatim. */
  readonly note: string
}

export const DEBRIEF_SEQUENCE: readonly DebriefMoment[] = [
  {
    id: 'story',
    stage: 'story',
    time: '0–5 min',
    heading: 'Let Them Tell the Story',
    purpose: 'Teams describe the road they traveled and the decisions that changed it.',
    asks: [
      "Which moment changed your team's road the most?",
      'What decision was harder than you expected?',
      'What did your team initially think would work that later had to change?',
      'Where did collaboration make a difference?',
    ],
    note: 'Do not correct their decisions. Let different teams discover that the same circumstances can produce different responsible routes.',
  },
  {
    id: 'name-it',
    stage: 'name-it',
    time: '5–12 min',
    heading: 'Name What They Already Did',
    purpose: 'Translate their experience into simple project-management language.',
    asks: [
      'Where did you begin? → TODAY / current reality',
      'What did you do first? → FIRST MOVE',
      'How did you know you were progressing? → DECISION / MILESTONE CHECK',
      'What had to happen next? → MILESTONES',
      'What were you trying to complete? → DESTINATION',
      'What might have happened? → RISK',
      'What had already happened? → ISSUE',
      'What did you already have or find? → RESOURCES',
      'What opportunity appeared? → OPENING',
      'What were you running low on? → CONSTRAINT / LOW FUEL',
      'What did you depend on? → DEPENDENCY / BACKUP',
      'Who or what helped? → LIFELINE / SUPPORT',
    ],
    note: 'Keep the translation simple. Do not turn this into a certification lesson. The aha is: they were already managing a project.',
  },
  {
    id: 'recalculating',
    stage: 'recalculating',
    time: '12–17 min',
    heading: 'GPS: Recalculating...',
    purpose: 'Surface adaptation, consequences, resources, teamwork, and focus.',
    asks: [
      'What stayed true even when the road changed?',
      'What had to change?',
      'Did anyone change a milestone but keep the same Destination?',
      'Did anyone discover the Destination itself needed to change?',
      'What happened when an earlier decision created a later consequence?',
    ],
    note: 'Connect adaptation to WISER Pivots™ only after participants have described the behavior themselves. Recalculating is not failure; it is a deliberate response to what is true now.',
  },
  {
    id: 'what-changed',
    stage: 'what-changed',
    time: '17–21 min',
    heading: 'What Changed? / Legacy Matters',
    purpose: 'Move from the scenario to personal meaning and impact.',
    asks: [
      'What changed in the way you approached the problem?',
      'What changed because you worked as a team?',
      'What would you do differently if you traveled the road again?',
      'Who benefits when a project like this is completed well?',
      'What can change in you, for someone else, or because you kept going?',
    ],
    note: 'Do not define Legacy Matters for them. Let participants say what changed and who was affected.',
  },
  {
    id: 'sponsor',
    stage: 'sponsor',
    time: '21–25 min',
    heading: 'The Missing Role: Sponsor',
    purpose: 'Introduce the Sponsor question without supplying the answer.',
    asks: [
      // CONFLICT, flagged for owner decision: Artifact 9 §8 gives a shorter
      // lead-in — "You managed the project. You built a team. You found
      // resources. You made decisions. There is another project role we have
      // not talked about yet—the Sponsor." Artifact 6's longer version is used
      // here provisionally because Artifact 6 is the debrief's own guide.
      'You had a project. You had a team. You found resources. You made decisions. You managed risks and issues. You recalculated when the road changed.',
      'But there is one project role we have not talked about yet: the Sponsor.',
      // Identical in both artifacts. Not in conflict.
      'Who is the Sponsor of your life project?',
    ],
    note: 'Pause after the question. Do not answer for the room. For some participants the answer may be God or a Higher Power; others may process the question differently. Protect the reflection.',
  },
  {
    id: 'personal-reveal',
    stage: 'personal-reveal',
    time: '25–29 min',
    heading: 'The Personal Reveal',
    purpose: 'Reveal the lived-experience connection behind the scenarios.',
    asks: [
      "There is one more thing I haven't told you.",
      'Every one of these high-impact scenarios was rooted in something that happened in my life.',
      'You found your way through them. I had to find mine.',
      'Some choices I made well. Some cost me. Sometimes I saw the risk coming. Sometimes I didn’t.',
      'More than once, the GPS of my life said, “Recalculating...”',
      'Living Is a Project...Are You Ready?™ was incubated and born through adversity.',
      'You were never supposed to leave here with my roadmap. You were supposed to leave with yours.',
      'We all have different fingerprints for a reason.',
    ],
    note: 'Deliver this conversationally, not theatrically. Do not explain every scenario or turn the reveal into a biography. The recognition is enough.',
  },
  {
    id: 'close',
    stage: 'close',
    time: '29–30 min',
    heading: 'Close & Transition',
    purpose: 'Let the moment land, then move to the next agenda item.',
    asks: ['Life is a Journey. Enjoy the Ride!', 'Living Is a Project... and You Are Its Project Manager!™'],
    note: 'Stop. Allow a brief silence. Do not immediately sell, overteach, or reopen every scenario. Close the experience and move to the next agenda item.',
  },
]

/** Artifact 6, "Do Not Do During the Debrief" — verbatim, in order. */
export const DEBRIEF_DO_NOT: readonly string[] = [
  "Do not rank teams or declare one team's route the winning answer.",
  'Do not turn consequences into shame or moral judgment.',
  'Do not reveal Sponsor/Higher Power before the Sponsor moment.',
  'Do not reveal the autobiographical connection before the final reveal.',
  'Do not over-explain WISER Pivots™ before participants recognize recalculation themselves.',
  'Do not allow the debrief to consume the next agenda item.',
  "Do not make the participant's roadmap for them.",
]

/** Artifact 6, Facilitator Final Reminder — verbatim. */
export const DEBRIEF_FINAL_REMINDER = [
  'The aha belongs to the participant.',
  'Ask. Listen. Connect. Reveal. Then let the road speak.',
] as const

/** Artifact 7 §11 — the handover line to MY PROJECT, verbatim. */
export const MY_PROJECT_TRANSITION =
  'You just traveled the road with a project that was handed to you. Now take out the project you brought with you.'

export function debriefStage(stage: DebriefStage): readonly DebriefMoment[] {
  return DEBRIEF_SEQUENCE.filter((c) => c.stage === stage)
}

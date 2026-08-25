// ---------------------------------------------------------------------------
// The debrief. FACILITATOR-ONLY, AND STRUCTURALLY SO.
//
// ── THIS MODULE IS NEVER IMPORTED BY THE PARTICIPANT DISPLAY ───────────────
//
// Two things live here that must not reach a projected screen under any
// circumstance:
//
//   1. The Sponsor / Higher Power question, which the facilitator asks aloud
//      in the room and which the system must never answer for anybody.
//
//   2. The autobiographical reveal — that the high-impact scenarios came out
//      of the facilitator's own lived experience. Held back until the final
//      debrief, because a team that knows it up front is watching a testimony
//      instead of running a project.
//
// Keeping them out of the participant view is not a render-time decision. The
// display route does not import this file, so none of these strings are in the
// bundle the projected window loads. They cannot leak through devtools, view-
// source, an alt attribute, a tooltip, a stray console.log, or a future
// component that forgot. There is nothing there to find.
//
// tests/liap-journey.test.ts walks the display route's import graph and
// asserts this module is absent from it.
//
// ── PROVENANCE: SYSTEM-WRITTEN, PENDING OWNER APPROVAL ─────────────────────
//
// Except where noted, the wording below is system-written and not approved.
// The physical Debrief Guide is the authority; where it carries a line for one
// of these moments, that line replaces the draft here.
// ---------------------------------------------------------------------------

export type DebriefStage = 'journey' | 'sponsor' | 'origin' | 'my-project'

export interface DebriefCue {
  readonly id: string
  readonly stage: DebriefStage
  readonly heading: string
  /** What the facilitator says or asks. Spoken aloud; never rendered to the room. */
  readonly cue: string
  /** Facilitator-only guidance on holding the moment. */
  readonly note: string
  /**
   * True where the system must never supply an answer — only the question.
   * Enforced by there being no answer field on this type at all.
   */
  readonly participantAnswers: boolean
}

export const DEBRIEF_SEQUENCE: readonly DebriefCue[] = [
  {
    id: 'walk-the-record',
    stage: 'journey',
    heading: 'Walk the Journey Record',
    cue: 'Take us back through it. Where did the plan you started with stop being the plan?',
    note: 'Read the record aloud point by point. Let the team narrate their own decisions before you offer any reading of them.',
    participantAnswers: true,
  },
  {
    id: 'what-interrupted',
    stage: 'journey',
    heading: 'What interrupted you',
    cue: 'Which of those did you see coming, and which one did you build the plan around without noticing?',
    note: 'This is where the dependency register earns its keep — name the thing they leaned on before it was taken away.',
    participantAnswers: true,
  },
  {
    id: 'recalculating',
    stage: 'journey',
    heading: 'When you recalculated',
    cue: 'You revised the roadmap rather than starting over. What let you do that?',
    note: 'Do NOT name WISER Pivots™ here. The team has just lived the need for it; the framework is taught after they feel the gap, not before.',
    participantAnswers: true,
  },
  {
    id: 'sponsor',
    stage: 'sponsor',
    heading: 'The Sponsor',
    // Owner Section L.1 — the question is asked, and never answered for them.
    cue: 'Who is the Sponsor of your life project?',
    note: 'Ask it, then stop talking. Do not offer candidates, do not narrow it, do not fill the silence. The answer is theirs and it is often not the one they say first.',
    participantAnswers: true,
  },
  {
    id: 'origin',
    stage: 'origin',
    heading: 'Where the scenarios came from',
    // Owner Section L.2 — held to the final debrief. Facilitator-told, aloud.
    cue: 'Facilitator tells the origin of the high-impact scenarios, in their own words and at their own discretion.',
    note: 'This is yours to tell or not to tell. Nothing in the system discloses it, and nothing should until you choose to.',
    participantAnswers: false,
  },
  {
    id: 'handover',
    stage: 'my-project',
    heading: 'Hand over to MY PROJECT',
    cue: 'Now do it on the project you actually brought.',
    note: 'Send participants to MY PROJECT on their own devices. Remind them it is not stored — they print or save it themselves.',
    participantAnswers: true,
  },
]

export function debriefStage(stage: DebriefStage): readonly DebriefCue[] {
  return DEBRIEF_SEQUENCE.filter((c) => c.stage === stage)
}

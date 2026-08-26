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
//   1. The God at the Center Reveal. Owner ruling, 25 August 2026: God is the
//      Creator and foundation of life in the LIAP philosophy, and that framing
//      REPLACES the project-role language Artifact 6 carried. God is
//      not a project sponsor, a stakeholder, a resource, a Lifeline or a
//      contingency, and the reveal must not be pre-taught on any
//      participant-facing surface.
//
//      The final script is OWNER PENDING. Artifact 6's Sponsor script is
//      superseded and is NOT shown in its place — a facilitator reading
//      retired framing to a room is worse than a facilitator reading their own
//      notes. Nothing here generates a replacement.
//
//   2. The autobiographical reveal, now OWNER-APPROVED FINAL and carried here
//      verbatim. "The autobiographical connection is the crescendo, not the
//      opening. Do not leak it through scenario introductions, side comments,
//      digital screens, facilitator hints, or participant materials."
//      (Artifact 9 §9) — which is precisely why it lives in a module the
//      participant display cannot reach.
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
  | 'god-at-the-center'
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
  /**
   * Set where the owner has not yet settled the wording.
   *
   * Two different situations both land here and the console says which:
   * SUPERSEDED, where a ruling retired the old script and no replacement
   * exists yet, and PENDING REVISION, where the owner's own words are still
   * in the file but subject to change. Neither is a licence to write one.
   */
  readonly ownerWordingPending?: 'superseded' | 'pending-revision'
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
    heading: 'GPS: Recalculating…',
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
    id: 'god-at-the-center',
    stage: 'god-at-the-center',
    time: '21–25 min',
    heading: 'God at the Center Reveal',
    purpose: 'The spiritual foundation of the book, revealed after the road has been travelled.',
    // DELIBERATELY EMPTY. The owner ruling of 25 August 2026 supersedes both
    // Sponsor lead-ins and the Sponsor question itself; the replacement script
    // is the owner's to write and has not been written. Showing the retired
    // script here would be worse than showing nothing, and generating a
    // stand-in would be worse still.
    asks: [],
    note: 'OWNER WORDING PENDING. The previous project-role framing is superseded by the God at the Center ruling and is not reproduced here. Deliver this moment from your own approved notes until the script is issued. God is the Creator and foundation of life in the LIAP philosophy — not a project sponsor, a stakeholder, a resource, a Lifeline, or a contingency.',
    ownerWordingPending: 'superseded',
  },
  {
    id: 'personal-reveal',
    stage: 'personal-reveal',
    time: '25–29 min',
    heading: 'The Personal Reveal',
    purpose: 'Reveal the lived-experience connection behind the scenarios.',
    // OWNER-APPROVED FINAL, verbatim from the RECONCILED master's protected-
    // reveals ruling. Twenty paragraphs, in order, unedited.
    //
    // The instruction attached to it is unusually specific and worth keeping
    // in view: use verbatim; do not rewrite, summarize, embellish, or map
    // scenarios to specific autobiographical events. The last of those is the
    // one a well-meaning facilitator breaks — pointing at a scenario and
    // saying "that one was the diagnosis" turns a testimony into a key, and
    // the room stops hearing the point.
    //
    // Note where it ends: TODAY and FIRST MOVE. The reveal IS the handover to
    // the participant's own project, which is why the protected sequence runs
    // through it rather than stopping at it.
    asks: [
      'There is something else I did not tell you when we began this Journey.',
      'You approached these situations as scenarios. You discussed what was happening, considered what you had available, made decisions, encountered changes, and determined what you would do next.',
      'But these were not simply exercises created for a workshop.',
      'They came from real life.',
      'They were shaped by roads I have actually traveled—times when plans changed, information was incomplete, resources were not always obvious, and decisions still had to be made even though I could not see what was waiting around the next bend.',
      'While I was living those experiences, I did not always recognize the lessons that were being formed through them. There were times when all I knew to do was pray, pay attention to what was in front of me, use what God had placed in my hands, and make the next wise move I could make.',
      'Looking back, I can see what I could not always see while I was living it: God was there. He was present in the uncertainty, revealing resources I had not yet recognized and placing people along my path at just the right time. Some doors opened while others remained firmly closed, and there were moments when the road in front of me looked nothing like the one I had planned. Yet even then, God had not left the journey. I was learning to trust Him while continuing to steward what He had placed in my hands.',
      'Over time, experiences that once seemed unrelated began revealing lessons about preparation, stewardship, discernment, resilience, and change. I began to understand that making a plan did not mean I could control everything that would happen. A plan gave me something to work from, but wisdom required me to keep paying attention.',
      'That distinction matters.',
      'Living Is a Project...Are You Ready?™ is not about perfectly planning your life. We cannot predict every turn, prevent every disruption, or know everything we will need before the journey begins. It is about learning to steward the life God has given us with intention while remaining attentive enough to recognize when something has changed.',
      'Sometimes that means continuing forward. At other times, it means stopping long enough to inspect what is true now, reconsidering what matters, and being willing to change direction rather than holding tightly to a route that no longer fits where God is leading.',
      'You have spent part of today traveling through pieces of a road I once traveled.',
      'I did not tell you that beforehand because I wanted you to encounter the situations without my conclusions attached to them. You needed the freedom to examine what was happening, make your own decisions, and experience what happens when circumstances change.',
      'Now the focus shifts.',
      'You did not come here to recreate my road. You came here with a project of your own.',
      'The same process you just practiced can help you look more carefully at what is in front of you—not so that I can tell you where your road should lead, but so that you can prayerfully and intentionally steward what God has placed in your hands.',
      'So bring your project forward.',
      'Start with what is true TODAY.',
      'Then determine your FIRST MOVE.',
      'From there, we will begin building your road.',
    ],
    note: 'OWNER-APPROVED FINAL. Use verbatim; do not rewrite, summarize, embellish, or map scenarios to specific autobiographical events. Deliver conversationally, not theatrically. The recognition is enough.',
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
  // Artifact 6's line named the superseded framing; the rule it states is
  // unchanged and now attaches to the God at the Center Reveal.
  'Do not reveal God at the Center before the God at the Center moment.',
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

/**
 * The protected sequence, from the RECONCILED master's owner ruling.
 *
 * Order is the method. God at the Center lands only after the room has walked
 * the road and named what they did; the autobiographical reveal lands only
 * after that; and the transfer to the participant's own project comes out of
 * the reveal rather than being announced separately.
 */
export const PROTECTED_SEQUENCE = [
  'EXPERIENCE',
  'DEBRIEF',
  'GOD AT THE CENTER',
  'AUTOBIOGRAPHICAL REVEAL',
  'TRANSFER TO THEIR PROJECT',
  'TODAY',
  'FIRST MOVE',
] as const

/**
 * The foundation, in the owner's words. Facilitator-only, like everything else
 * in this module, and NOT a script — the God at the Center script itself
 * remains owner-controlled and is not generated here.
 */
export const GOD_AT_THE_CENTER_FOUNDATION =
  'God is the Creator and foundation of life in LIAP. The book carries this foundation; the Journey reveals it through the participant\'s experience. Do not frame God as merely a Sponsor, stakeholder, resource, Lifeline, or contingency.'

export function debriefStage(stage: DebriefStage): readonly DebriefMoment[] {
  return DEBRIEF_SEQUENCE.filter((c) => c.stage === stage)
}

// ---------------------------------------------------------------------------
// Progress prompts — the short lines a facilitator puts on the wall.
//
// ── PROVENANCE ─────────────────────────────────────────────────────────────
//
// Two of the six `text` lines are OWNER-APPROVED: 'Research before you decide.'
// and 'What kind of help do you need?'. The other four, and every `whenToUse`
// line, are system-written and NOT approved production copy.
// Where the physical Facilitator Guide, Journey Map or Road-Event Deck already
// carries a line for one of these moments, the approved wording replaces the
// draft here rather than the two coexisting — a parallel digital vocabulary is
// exactly the failure the owner ruled against.
//
// lib/journey/content.ts collects these for the owner wording review, and a
// test asserts nothing in this file escapes that inventory.
//
// ── WHY THE FACILITATOR CHOOSES, AND NOT THE SYSTEM ────────────────────────
//
// Nothing here fires automatically, on a timer, or because a rule matched. A
// prompt appears because a facilitator read the room and pressed a button.
// ---------------------------------------------------------------------------

export interface ProgressPrompt {
  readonly id: string
  /** Shown on the projected display, in the room. */
  readonly text: string
  /** Facilitator-only. When this prompt is the right one to reach for. */
  readonly whenToUse: string
}

export const PROGRESS_PROMPTS: readonly ProgressPrompt[] = [
  {
    id: 'research',
    // OWNER-APPROVED. Section I, ratified on review: the interface may prompt
    // this and must not then supply the answer. There is no lookup behind this
    // button and no model call — the team goes and finds out, which is the
    // learning.
    text: 'Research before you decide.',
    whenToUse:
      'The team is about to guess at something knowable — a cost, a rule, a timeline, an entitlement. Send them to find out rather than telling them.',
  },
  {
    id: 'help-needed',
    // OWNER-APPROVED. Section J, ratified on review: asked BEFORE a Lifeline is
    // granted, never after.
    text: 'What kind of help do you need?',
    whenToUse:
      'A team has reached for the Lifeline. Put this up first and make them name it. Naming the help you need is most of the skill.',
  },
  {
    id: 'land-it',
    text: 'Land your decision, then move.',
    whenToUse: 'The discussion has stopped producing new information and is now circling.',
  },
  {
    id: 'who-owns-it',
    text: 'Who owns this, and by when?',
    whenToUse: 'A decision has been made in the abstract with nobody attached to it.',
  },
  {
    id: 'what-does-it-cost',
    text: 'What does this cost you — and what does it cost you not to?',
    whenToUse: 'An Opening Ahead is being taken because it is attractive rather than because it serves the Destination.',
  },
  {
    id: 'still-the-destination',
    text: 'Does this still take you to the Destination?',
    whenToUse: 'The plan has drifted and nobody has said so out loud yet.',
  },
]

export function progressPrompt(id: string): ProgressPrompt | null {
  return PROGRESS_PROMPTS.find((p) => p.id === id) ?? null
}

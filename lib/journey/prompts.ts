// ---------------------------------------------------------------------------
// The facilitation prompts — reconciled against the approved artifacts.
//
// ── WHAT CHANGED HERE ──────────────────────────────────────────────────────
//
// This file used to hold six prompts I wrote. Four of them are gone. The
// approved artifacts already carry a complete, ratified set of push questions
// — Artifact 3, "Quick Facilitation Prompts", and Artifact 9 §6, "How to Push
// Without Rescuing" — and keeping mine beside them would have been the
// parallel vocabulary the owner ruled against.
//
// Two survive because the owner ratified them directly: "Research before you
// decide." and "What kind of help do you need?".
//
// ── THREE OF THE APPROVED PROMPTS CONFLICT WITH EACH OTHER ─────────────────
//
// Artifacts 3 and 9 give the same prompt in different words. Those three are
// marked below and carry the Artifact 3 wording provisionally, because
// choosing between two approved artifacts is the owner's decision, not mine.
//
// ── THEY ARE ALL QUESTIONS, AND THAT IS THE POINT ──────────────────────────
//
// Artifact 3: "If the team stalls, push with a question, not an answer."
// Artifact 9: "Ask short questions that move the team" / "DO NOT: Give the
// answer because you know it."
//
// Nothing here fires on a timer or because a rule matched. A prompt reaches
// the wall because a facilitator read the room and pressed a button.
// ---------------------------------------------------------------------------

export interface ProgressPrompt {
  readonly id: string
  /** Shown on the projected display, in the room. */
  readonly text: string
  /** Which approved artifact the wording came from. */
  readonly source: string
  /**
   * Facilitator-only. Present only where an approved artifact states the
   * condition; absent rather than invented where none does.
   */
  readonly whenToUse?: string
  /** True where two approved artifacts word this prompt differently. */
  readonly conflict?: string
}

const A3 = 'Artifact 3 — Quick Facilitation Prompts'
const A9 = 'Artifact 9 §6 — How to Push Without Rescuing'
const A7 = 'Artifact 7 §8 — Pace Management'

export const PROGRESS_PROMPTS: readonly ProgressPrompt[] = [
  {
    id: 'research',
    text: 'Research before you decide.',
    source: 'Owner ruling — approved progress prompt, Section I',
    whenToUse:
      'When a scenario requires research, direct the team toward legitimate professional/resource categories rather than pretending the facilitator is the expert.',
  },
  {
    id: 'help-needed',
    text: 'What kind of help do you need?',
    source: 'Owner ruling — approved progress prompt, Section J',
    whenToUse:
      'When the team is genuinely stuck or when asking for appropriate help is itself part of the learning.',
  },
  {
    id: 'where-on-road',
    text: 'Show me where you are on the road.',
    source: `${A3}; identical in ${A9}`,
  },
  {
    id: 'next-decision',
    text: 'What is the next decision you need to make?',
    source: `${A7}; identical in Artifact 9 §5`,
    whenToUse: 'If a team is stalled.',
  },
  {
    id: 'need-to-know',
    text: 'What do you need to know before you can move?',
    source: `${A7}; identical in Artifact 9 §5`,
    whenToUse: 'If discussion is expanding without movement.',
  },
  {
    id: 'next-milestone',
    text: 'What is your next milestone?',
    source: A3,
  },
  {
    id: 'avoiding',
    text: 'What decision are you avoiding?',
    source: `${A3}; identical in ${A9}`,
  },
  {
    id: 'assumption',
    text: 'What assumption are you making?',
    source: `${A3}; also Artifact 9 §5 as the prompt for a team moving too quickly`,
    whenToUse: 'If a team is moving too quickly, ask what assumption or dependency it may be overlooking.',
  },
  {
    id: 'who-else',
    text: 'Who else belongs in this decision?',
    source: `${A3}; identical in ${A9}`,
  },
  {
    id: 'depending-on',
    text: 'What are you depending on?',
    source: A9,
  },
  {
    id: 'running-low',
    text: 'What are you running low on?',
    source: `${A3}; identical in ${A9}`,
  },
  {
    id: 'overlooking',
    text: 'What opportunity might you be overlooking?',
    source: A9,
  },
  {
    id: 'progress',
    text: 'What would tell you that you are making progress?',
    source: A9,
  },
  {
    id: 'do-nothing',
    text: 'What happens if you do nothing?',
    source: A3,
    conflict: `${A9} gives "What happens if nothing changes?" for the same moment.`,
  },
  {
    id: 'still-true',
    text: 'What is still true?',
    source: `${A9}; identical in Artifacts 2, 3, 4 and 5`,
  },
  {
    id: 'what-changed',
    text: 'What changed?',
    source: `${A3}; identical in ${A9}`,
  },
  {
    id: 'road-or-destination',
    text: 'Does the road change, or does the Destination change?',
    source: A3,
    conflict: `${A9} gives "Does the route change, or does the destination change?" — different nouns and different capitalisation.`,
  },
  {
    id: 'next-wise-move',
    text: 'What is the next wise move?',
    source: A3,
    conflict:
      'Artifact 9 and the Artifact 3 GPS card both give "What is your next wise move?" — the possessive differs.',
  },
]

export function progressPrompt(id: string): ProgressPrompt | null {
  return PROGRESS_PROMPTS.find((p) => p.id === id) ?? null
}

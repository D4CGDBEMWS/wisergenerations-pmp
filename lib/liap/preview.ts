// ---------------------------------------------------------------------------
// The Sneak Preview — "SNEAK PREVIEW / Get a Look Inside".
//
// The campaign promises a look inside the book on October 1, 2026, alongside
// preorder opening. This module is where that promise is kept.
//
// ── PROVENANCE ─────────────────────────────────────────────────────────────
//
// Every word below is transcribed from the owner-approved source,
// LIAP_Ebook_Sneak_Preview_7_Reflections_OWNER_APPROVED, supplied 31 August
// 2026. Nothing here was written, paraphrased, shortened, expanded or
// reordered. The source's own production control says it plainly:
//
//   "OWNER-APPROVED: the seven reflection questions in this preview are
//    controlled LIAP copy. Do not rewrite, paraphrase, shorten, expand, or
//    substitute them during production."
//
// So the questions live in their own array, separate from the prose, and a
// test asserts each one character for character. Prose can be reflowed by a
// designer without anyone noticing; a reflection question cannot.
//
// ── WHAT THIS IS NOT ───────────────────────────────────────────────────────
//
// The source states: "This preview is not represented as a verbatim manuscript
// excerpt." That is why nothing here is presented as a passage from the book,
// and why the closing section says so to the reader in the owner's own words.
//
// ── THE QR CODE IS DELIBERATELY ABSENT ─────────────────────────────────────
//
// The source carries the placeholder "[VERIFIED PREORDER QR + WEBSITE TO BE
// INSERTED AFTER TECHNICAL APPROVAL]" and instructs that the public QR is not
// to be fabricated. It is not reproduced here in any form. The page links to
// the preorder page instead, which is a route this repository controls.
// ---------------------------------------------------------------------------

import { PUBLICATION_MONTH } from '@/lib/liap/launch'

/** The CTA label. Owner-approved campaign language — do not edit. */
export const SNEAK_PREVIEW_LABEL = 'SNEAK PREVIEW'

/** The CTA supporting line. Owner-approved campaign language — do not edit. */
export const SNEAK_PREVIEW_TAGLINE = 'Get a Look Inside'

/** Where the look-inside lives. Nested under the durable print seam. */
export const SNEAK_PREVIEW_PATH = '/liap/book/preview'

/** The approved source is in hand and transcribed below. */
export const PREVIEW_CONTENT_APPROVED = true

/** Masthead, from the source's cover page. */
export const PREVIEW_EDITION = 'A Preorder Preview Edition'
export const PREVIEW_PROMISE = 'FIND HIDDEN RESOURCES | NAVIGATE RISKS | BUILD SUSTAINABLE SUCCESS'
export const PREVIEW_AUTHOR = 'Crystal Glover Stewart, PMP®'
export const PREVIEW_IMPRINT = 'Goshen Publishing'

/**
 * The seven reflections, verbatim.
 *
 * Held apart from the prose because these are the strings the owner ruled
 * controlled. A test compares each one exactly, so a stray edit fails the
 * build rather than reaching a reader.
 */
export const REFLECTIONS: readonly string[] = [
  'What projects have you delayed that could help you improve your life today?',
  'Have you experienced a bend that makes you question if you are ready to make the turn?',
  'What has changed since you first imagined how this would go?',
  'What do you know to be true now?',
  'Given what you know now, what matters most—and whose life could be changed for the better by what you do next?',
  'What people, places, experiences, or resources have been right under your nose all along that you may not have recognized could help you move forward?',
  'With what you know and what you have discovered, how do you plan to move forward?',
  'Are you ready to make your next move?',
] as const

export interface PreviewSection {
  heading: string
  paragraphs: string[]
  /** Indices into REFLECTIONS, so a question is never retyped. */
  reflections: number[]
}

/** The preview body, in the source's order. */
export const PREVIEW_SECTIONS: PreviewSection[] = [
  {
    heading: 'The Project May Already Be in Front of You',
    paragraphs: [
      'Some projects begin because you chose them. Others arrive because life changed.',
      'Starting a new business. Sending a child off to college. Caring for an aging loved one. Navigating an unexpected illness. Organizing a community event. Homesteading.',
      'Each can ask something different of you. Time. Money. People. Decisions. Resources. Preparation. Risk. Patience. A willingness to adjust when what you expected is no longer what is in front of you.',
      'And sometimes more than one of these projects is unfolding at the same time.',
    ],
    reflections: [0],
  },
  {
    heading: 'When the Road Bends',
    paragraphs: [
      'A project can matter deeply to you and still become difficult to move forward. A change in timing, money, health, relationships, information, or circumstances can make the road look different from the one you expected.',
      'The bend does not automatically mean the Destination is wrong. But it may ask you to look again before you keep moving.',
    ],
    reflections: [1, 2],
  },
  {
    heading: 'See What Is True Now',
    paragraphs: [
      'When circumstances change, fear can speak loudly. So can assumptions. So can the pressure to keep moving simply because you once decided on a particular road.',
      'Before deciding what comes next, there is value in seeing the present clearly—not what you hoped would be true, not what you fear may happen, but what you can honestly recognize from where you stand.',
    ],
    reflections: [3],
  },
  {
    heading: 'The Project Is Bigger Than Completion',
    paragraphs: [
      'Finishing matters. But some projects carry meaning beyond the finish line. The choice you make may affect a family, a child, an aging parent, a customer, a neighborhood, a future generation—or someone you may never meet.',
      'That is where a project begins to reveal its impact. Not simply in what gets completed, but in what becomes possible because you kept going.',
    ],
    reflections: [4],
  },
  {
    heading: 'Look Again at What Is Already Around You',
    paragraphs: [
      'Moving forward does not always begin with getting something new. Sometimes it begins with recognizing the value of what is already present.',
      'A person you know. A place you have access to. An experience you once dismissed. A skill you developed years ago. Information, relationships, opportunities, or resources that did not look important until the road changed.',
    ],
    reflections: [5],
  },
  {
    heading: 'Your Next Move',
    paragraphs: [
      'You do not have to know every mile of the road before you move. What you know now, what has changed, what matters, and what you have discovered can help you decide how to move from reflection toward action.',
    ],
    reflections: [6, 7],
  },
  {
    heading: 'This Is a Glimpse, Not the Whole Journey',
    paragraphs: [
      'This Sneak Preview is designed to help you recognize the project in front of you and begin asking different questions. It does not replace the full book or the deeper LIAP experiences.',
      'Living Is a Project…Are You Ready?™ goes further into recognizing hidden resources, navigating risks and change, building plans that can adapt, and approaching the projects of life with greater intention and purpose.',
    ],
    reflections: [],
  },
]

/** The closing line, verbatim. Also Email #6's approved line. */
export const PREVIEW_CLOSING_LINE = 'The bend is not the end. Be ready to make the turn.'

/** The preorder section, verbatim. */
export const PREORDER_HEADING = 'Preorder'
/**
 * Verbatim from the source, with the month derived rather than duplicated.
 *
 * The rendered sentence is byte-identical to the approved text. It reads the
 * month from launch.ts because this repository keeps exactly one place where
 * the publication date is written, and a second copy here would silently rot
 * the day the owner moves it.
 *
 * PUBLICATION_MONTH, not publicationDate(): the sentence is month-scoped, and
 * once a specific day is set "launches in November 30, 2026" is broken English.
 */
export const PREORDER_BODY =
  `The book launches in ${PUBLICATION_MONTH}. The preorder period is designed to give you time to sit with the preview, consider the project you are living, and decide whether you are ready to continue the journey.`

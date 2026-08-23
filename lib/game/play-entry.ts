import { GAME_NAME } from './naming'

// ---------------------------------------------------------------------------
// The durable seam. Where a printed QR code points.
//
// Owner-approved destination: /liap/play.
//
// ── WHY A SEAM AND NOT THE ROUTE ITSELF ────────────────────────────────────
//
// A QR code is permanent. Once it is printed the URL inside it can never
// change, and every route it could point at directly is one that will move.
// /liap/game/preview is a pre-launch teaser that will be superseded;
// /liap/game is a route that could be restructured. Pointing paper at either
// commits the business to that path for as long as the paper exists.
//
// So the paper points here, and here decides. When the teaser is what is
// live, this resolves to the teaser. When the full day ships, it resolves to
// the full day, and nothing that was printed has to change.
//
// This is not theory. /liap/book survived the rename that turned
// /life-is-a-project into /living-is-a-project across fourteen files, because
// it never lived inside the product tree. The same argument applies here.
//
// ── THE RULE THAT MATTERS MOST ─────────────────────────────────────────────
//
// It never 404s. That inverts the convention every other gated route in this
// codebase follows, and the inversion is deliberate: a 404 is right while
// nothing points at a route, because an unreleased product should not be
// discoverable by probing. The moment ink is on paper that reasoning
// reverses. Someone scanning a code the business printed must never be told
// by the business's own site that the page does not exist.
//
// ── ISOLATION ──────────────────────────────────────────────────────────────
//
// Imports ./naming and nothing else. The decision is pure — the route reads
// the flags and hands them in — so a test can prove every combination without
// a request, a database or a browser.
// ---------------------------------------------------------------------------

export type PlayEntry =
  /** Something is live. Send them straight to it. */
  | { action: 'play'; href: string }
  /**
   * Nothing is live yet.
   *
   * A soft landing, never a 404 — see above. It is honest that the experience
   * is not open, and it does not pretend otherwise.
   */
  | { action: 'soft-landing' }

export interface PlayEntryInput {
  /** The full twelve-scenario day. */
  gameEnabled: boolean
  /** The one-scenario teaser. */
  previewEnabled: boolean
}

/**
 * Which experience a scan resolves to.
 *
 * The full day wins when both are live. Once it ships it IS the experience,
 * and a code printed during pre-launch should carry its holder forward to the
 * complete thing rather than stranding them on a teaser they have outgrown.
 *
 * Pure, and total: every combination of two booleans has an answer, and the
 * one where both are false is the answer that matters — it is what a scan
 * meets today.
 */
export function decidePlayEntry(input: PlayEntryInput): PlayEntry {
  if (input.gameEnabled) return { action: 'play', href: '/liap/game' }
  if (input.previewEnabled) return { action: 'play', href: '/liap/game/preview' }
  return { action: 'soft-landing' }
}

/**
 * The soft landing's copy. Owner-approved, 23 August 2026, verbatim.
 *
 * This is what a scan meets for the whole pre-launch period, which makes it
 * the most-read page in the product for a while — a printed code has no other
 * destination until the experience opens.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ───────────────────────────────────────
 *
 * No launch date, no countdown, no email capture, no purchase call to action.
 * A date on a page a QR points at becomes a promise the moment ink dries, and
 * a "tell me when it's ready" field is an acquisition decision with a
 * segmentation tag attached — LIAP readers are not to be mixed into the
 * generic newsletter list. A test asserts all four absences.
 *
 * The closing line is the approved WISER Pivots™ signature.
 */
export const PLAY_SOFT_LANDING = {
  eyebrow: 'Living Is a Project…Are You Ready?™',
  heading: GAME_NAME,
  comingSoon: 'The experience is coming soon.',
  body: 'You’ll step into real project-management decisions, choose what you would do, and discover what happens next.',
  promise: 'Real choices. Real consequences. Practical wisdom.',
  signature: 'The bend is not the end. Be ready to make the turn.',
} as const

// ---------------------------------------------------------------------------
// The Sneak Preview — "SNEAK PREVIEW / Get a Look Inside".
//
// The campaign promises a look inside the book on October 1, 2026, alongside
// preorder opening. This module is where that promise is kept.
//
// ── WHY THE COPY IS FROZEN IN CONSTANTS ────────────────────────────────────
//
// The two strings below are owner-approved campaign language and appear on
// printed and social collateral. They are constants rather than inline JSX so
// that "the button says what the poster says" is one assertion in one place,
// and so a well-meaning edit to a component cannot quietly desynchronise the
// site from artwork that is already at the printer.
//
// ── WHY THE EXCERPT IS NOT HERE ────────────────────────────────────────────
//
// It has not been written yet, or at least it does not exist in this
// repository — every spelling of sneak preview, excerpt, sample, chapter,
// manuscript, foreword and preface was searched, and the only matches were
// comments describing the campaign period.
//
// So this module ships a placeholder that announces itself, and a flag saying
// so. The page refuses to present placeholder text as though it were the book:
// when PREVIEW_CONTENT_APPROVED is false it renders a development notice
// instead of pretending. That is deliberate. A preview shell is useful for
// review; a shell containing invented prose that reads like the author's is a
// liability, because the first person to see it may not know it is invented.
//
// ── WHAT REPLACES THIS ─────────────────────────────────────────────────────
//
// When the owner supplies the approved excerpt, it goes in PREVIEW_SECTIONS
// and PREVIEW_CONTENT_APPROVED becomes true. Nothing else changes. The route,
// the flag, the CTA and the tests are all already correct for that day.
//
// Deliberately NOT a file in public/: anything under public/ is served
// unauthenticated and is enumerable by anyone who guesses the name, which is
// the wrong home for manuscript material that is gated by a feature flag
// everywhere else.
// ---------------------------------------------------------------------------

/** The CTA label. Owner-approved campaign language — do not edit. */
export const SNEAK_PREVIEW_LABEL = 'SNEAK PREVIEW'

/** The CTA supporting line. Owner-approved campaign language — do not edit. */
export const SNEAK_PREVIEW_TAGLINE = 'Get a Look Inside'

/** Where the look-inside lives. Nested under the durable print seam. */
export const SNEAK_PREVIEW_PATH = '/liap/book/preview'

/**
 * False until the owner supplies the approved excerpt.
 *
 * While false, the page shows a development notice rather than the sections
 * below, and a test asserts that it does.
 */
export const PREVIEW_CONTENT_APPROVED = false

export interface PreviewSection {
  heading: string
  paragraphs: string[]
}

/**
 * The approved excerpt. Empty on purpose.
 *
 * Populating this with invented prose would be the single most damaging thing
 * that could be done in this file, so it stays empty until real text arrives.
 */
export const PREVIEW_SECTIONS: PreviewSection[] = []

/** Shown in place of the excerpt while the content is pending. */
export const PREVIEW_PENDING_NOTICE =
  'Development placeholder — the approved excerpt has not been supplied. ' +
  'This page is the delivery shell only. No part of the book appears here yet.'

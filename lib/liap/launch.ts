// ---------------------------------------------------------------------------
// LIAP campaign timing. The single source of the publication date.
//
// ── WHY THIS FILE EXISTS ───────────────────────────────────────────────────
//
// The publication date was written out by hand in six customer-facing places
// and stored in a seventh constant that nothing read. Six copies of a fact
// that changes is six chances to change five of them — and the one that would
// have been missed longest is the Stripe checkout description, which a
// customer reads on the payment page itself.
//
// This project has already had that exact bug once, in the PMP checkout, which
// advertised one price and charged another because the two numbers lived in
// different files. A date is not a price, but a preorder page promising
// October beside a receipt promising November is the same class of mistake in
// front of the same paying customer.
//
// So: one value, imported everywhere, and a test that fails if any surface
// hardcodes a month again.
//
// ── OCTOBER IS NOT PUBLICATION ─────────────────────────────────────────────
//
// Owner ruling: publication and public launch are the same event, in November
// 2026. October 2026 is the Sneak Preview and preorder period, and there is no
// planned October release of any kind. Every October publication reference in
// the code was stale.
//
// The distinction is worth keeping straight in the names, because "launch"
// meant both things in different documents and that ambiguity is what let the
// stale date survive.
// ---------------------------------------------------------------------------

/** Curiosity, Free Guide, cover reveal. */
export const CAMPAIGN_AWARENESS = 'September 2026'

/** Sneak Preview opens and preorders open. */
export const PREORDER_OPENS = 'October 1, 2026'

/** The preorder and consideration window. NOT a publication date. */
export const PREORDER_PERIOD = 'October 2026'

/** Publication and public launch — one event, one month. */
export const PUBLICATION_MONTH = 'December 2026'

/**
 * The exact day. Owner ruling, 29 October 2026: Monday, November 30, 2026.
 * Owner ruling, 9 November 2026: moved to Wednesday, December 16, 2026, for
 * both publication and the LinkedIn launch. Unchanged since.
 *
 * NOTE for anyone reading the history above: November 30 appears twice in
 * this file now, meaning two different things. It is the SUPERSEDED
 * publication date here, and it is the live email-campaign launch below. The
 * book publishes 16 December. Do not let the coincidence of the number
 * reunite them -- that collapse is the bug this whole file exists to prevent.
 *
 * Set here once, so every page, the checkout description and the receipt
 * update together. That is the whole point of the file.
 */
export const PUBLICATION_DAY: string | null = 'December 16, 2026'

// ── THE EMAIL CAMPAIGN ─────────────────────────────────────────────────────
//
// Owner ruling, 13 November 2026: the campaign has TWO dates, and they are
// not the same event.
//
// Sending begins on the 16th; the campaign proper launches on the 30th. Both
// run ahead of publication on 16 December, which is the point of a campaign
// and not a discrepancy to be tidied away.
//
// ── WHY "LAUNCH" IS QUALIFIED HERE ─────────────────────────────────────────
//
// The header of this file records what the bare word "launch" already cost
// this project once: it meant the campaign in one document and the release in
// another, so a stale October publication date read as correct in six places
// and nobody saw it. EMAIL_CAMPAIGN_LAUNCH is the launch OF THE EMAIL
// CAMPAIGN. It is not the book launch, it is not publication, and it is not
// the LinkedIn launch, which moved to 16 December with publication.
//
// A test asserts these stay three distinct values.

/** First email goes out. Monday, November 16, 2026. */
export const EMAIL_CAMPAIGN_FIRST_SEND = 'November 16, 2026'

/** The campaign proper opens. Monday, November 30, 2026. NOT publication. */
export const EMAIL_CAMPAIGN_LAUNCH = 'November 30, 2026'

/**
 * What a customer is shown as the publication date.
 *
 * The day once there is one, the month until then. Callers do not branch on
 * whether the day has been chosen, so adding it later changes no page.
 */
export function publicationDate(): string {
  return PUBLICATION_DAY ?? PUBLICATION_MONTH
}

/** True while the owner has not yet selected a day. */
export function publicationDayPending(): boolean {
  return PUBLICATION_DAY === null
}

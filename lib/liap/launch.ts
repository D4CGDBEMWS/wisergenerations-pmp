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
export const PUBLICATION_MONTH = 'November 2026'

/**
 * The exact day. Owner ruling, 29 October 2026: publication and public launch
 * are Monday, November 30, 2026 (book files ready November 15).
 *
 * Set here once, so every page, the checkout description and the receipt
 * update together. That is the whole point of the file.
 */
export const PUBLICATION_DAY: string | null = 'November 30, 2026'

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

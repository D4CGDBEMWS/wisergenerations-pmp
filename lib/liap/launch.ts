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
 * The exact day. Chosen by the owner on 4 September 2026.
 *
 * This is the Publication & Official Book Launch date and nothing else. It is
 * NOT a shipping date, a delivery date, or a promise that a copy is in a
 * reader's hands — no such promise has been authorised, and no surface may
 * infer one from this value.
 *
 * Setting it here was the single edit the file was built for: the book page,
 * the checkout description, the receipt page and the product constant all
 * call publicationDate() and moved together.
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

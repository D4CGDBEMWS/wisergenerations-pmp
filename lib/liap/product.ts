// ---------------------------------------------------------------------------
// The Living Is a Project…Are You Ready? book preorder.
//
// Its own module with its own numbers. §8: do not reuse PMP product ids,
// membership permissions or business logic. A PMP price change must not be
// able to reach this, and this must not be reachable from lib/constants.ts,
// where the certification programmes live.
//
// The amount is in cents and is the single source of truth for both the
// display price and the Stripe charge — the PMP checkout once advertised one
// price and charged another because those two numbers lived apart.
//
// $24.99, set by the business owner on 20 August 2026.
// ---------------------------------------------------------------------------

import { publicationDate } from './launch'

const AMOUNT_CENTS = 2499

export const LIAP_BOOK = {
  productKey: 'LIAP_BOOK_PREORDER',
  /**
   * The displayed line item at checkout and on the receipt.
   *
   * The locked book title, so a customer reads the same name here that they
   * read on the page that sent them. It is passed as product_data.name on the
   * session — it creates no Stripe product and modifies nothing that exists.
   * Price, product ids, price ids and metadataKey are untouched.
   */
  name: 'Living Is a Project…Are You Ready?™',
  /** Cents. The only place this number exists. */
  amount: AMOUNT_CENTS,
  priceLabel: `$${(AMOUNT_CENTS / 100).toFixed(2)}`,
  currency: 'usd',
  format: 'Hardcover',
  publisher: 'Goshen Publishing',
  /**
   * Derived, never typed. The canonical value lives in lib/liap/launch.ts;
   * this field had no readers at all and still said October, which is exactly
   * how a second source of truth goes stale without anybody noticing.
   */
  publishesOn: publicationDate(),
  /** Stripe metadata marker the webhook matches on. */
  metadataKey: 'liap-book-preorder',
} as const

/** Granted by a completed preorder, however it was placed. */
export const LIAP_ENTITLEMENT = 'LIAP_ASSESSMENT_ACCESS'

// ---------------------------------------------------------------------------
// The Life Project-Ready™ Assessment, sold on its own.
//
// $29.00, set by the business owner on 31 August 2026, for the customer who
// wants the assessment WITHOUT buying the book. It does not replace or alter
// the book: a $24.99 book purchase still includes assessment access, and this
// price exists alongside it rather than instead of it.
//
// ── WHY THIS NEEDS NO STRIPE PRODUCT ───────────────────────────────────────
//
// The preorder checkout builds its line item from `price_data` inline, so the
// amount charged comes from this file at request time and no Stripe Price ID
// is involved. This follows the same pattern, which means the standalone
// assessment is fully implementable with no live Stripe object created — and
// the number below stays the single source of truth for both the displayed
// price and the charge.
//
// The client cannot influence it. The checkout route reads AMOUNT_CENTS and
// ignores any amount in the request body; there is no branch that charges
// something a caller supplied.
// ---------------------------------------------------------------------------

const ASSESSMENT_AMOUNT_CENTS = 2900

export const LIAP_ASSESSMENT = {
  productKey: 'LIAP_ASSESSMENT_STANDALONE',
  name: 'Life Project-Ready™ Assessment',
  /** Cents. The only place this number exists. */
  amount: ASSESSMENT_AMOUNT_CENTS,
  priceLabel: `$${(ASSESSMENT_AMOUNT_CENTS / 100).toFixed(2)}`,
  currency: 'usd',
  /** Stripe metadata marker the webhook matches on. Distinct from the book's. */
  metadataKey: 'liap-assessment-standalone',
} as const

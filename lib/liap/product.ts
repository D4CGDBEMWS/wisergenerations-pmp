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
// Living the Journey — 3-Day Retreat. Owner rulings 2026-10-29: this is the
// canonical name (not "Weekend Masterclass Retreat"), and it is sold through
// Stripe checkout. The per-person amount is the price shown on the Author
// page; it still sits under the handoff's PRICING CONFIRMATION hold, which is
// why the checkout is behind FEATURE_LIAP_RETREAT.
// ---------------------------------------------------------------------------

const RETREAT_CENTS = 149999

export const LIAP_RETREAT = {
  name: 'Living the Journey — 3-Day Retreat',
  /** Cents, per person. The only place this number exists. */
  amount: RETREAT_CENTS,
  priceLabel: `$${(RETREAT_CENTS / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} per person`,
  currency: 'usd',
  /** Seats one buyer may reserve in a single checkout. */
  maxSeats: 4,
  /** Stripe metadata marker the webhook matches on. Shared with nothing. */
  metadataKey: 'liap-retreat',
} as const

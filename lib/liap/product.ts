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

/**
 * Flat shipping for the hardcover. Owner ruling 2026-10-30: $4.99, US only,
 * USPS Media Mail, books mailed by the author after publication.
 */
const SHIPPING_CENTS = 499

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
  shipping: {
    amount: SHIPPING_CENTS,
    label: `$${(SHIPPING_CENTS / 100).toFixed(2)}`,
    /** Stripe allowed_countries. */
    countries: ['US'] as const,
    displayName: 'USPS Media Mail (US only) — mails after publication',
  },
  /** e.g. "$24.99 + $4.99 shipping" */
  priceWithShippingLabel: `$${(AMOUNT_CENTS / 100).toFixed(2)} + $${(SHIPPING_CENTS / 100).toFixed(2)} shipping`,
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
// Living the Journey — 3-Day Retreat. Owner rulings 2026-10-29:
//   - canonical name (not "Weekend Masterclass Retreat");
//   - sold through Stripe; $1,499.99 per person confirmed;
//   - Garland Mountain Retreat, Allatoona, Georgia, March 19–21, 2027 (venue
//     changed from Callaway Gardens by the owner the same day);
//   - limited to 12 participants, first come, first served;
//   - $500 deposit per seat at checkout (non-refundable), the balance due
//     30 days before the retreat by invoice;
//   - other payments non-refundable within 7 days of the retreat.
// Every customer-facing number and term below is derived or stated once here.
// ---------------------------------------------------------------------------

const RETREAT_CENTS = 149999
const DEPOSIT_CENTS = 50000
const BALANCE_CENTS = RETREAT_CENTS - DEPOSIT_CENTS

/** "$500" for whole dollars, "$999.99" otherwise. */
const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`

export const LIAP_RETREAT = {
  name: 'Living the Journey — 3-Day Retreat',
  /** Cents, per person: the full price. */
  amount: RETREAT_CENTS,
  priceLabel: `${usd(RETREAT_CENTS)} per person`,
  /** Cents, per person: what checkout charges today. */
  depositAmount: DEPOSIT_CENTS,
  depositLabel: usd(DEPOSIT_CENTS),
  /** Cents, per person: invoiced before the retreat. */
  balanceAmount: BALANCE_CENTS,
  balanceLabel: usd(BALANCE_CENTS),
  when: 'March 19–21, 2027',
  where: 'Garland Mountain Retreat, Allatoona, Georgia',
  cancellation: `The ${usd(DEPOSIT_CENTS)} deposit is non-refundable. Other payments are refundable if you cancel more than 7 days before the retreat; within 7 days, nothing is refundable.`,
  currency: 'usd',
  /** Total participants. First come, first served — enforced at checkout. */
  capacity: 12,
  /** Seats one buyer may reserve in a single checkout. */
  maxSeats: 4,
  /** Stripe metadata marker the webhook matches on. Shared with nothing. */
  metadataKey: 'liap-retreat',
} as const

/** The deposit-and-balance promise, in one sentence, for checkout and pages. */
export function retreatPaymentTerms(): string {
  const r = LIAP_RETREAT
  return `A ${r.depositLabel} deposit per person reserves your seat today. The remaining ${r.balanceLabel} per person is due 30 days before the retreat — we’ll email you an invoice.`
}

// ---------------------------------------------------------------------------
// Weekend Masterclass Retreat — the facts that may be published.
//
// The price lives in one constant, in cents, for the same reason the book's
// does: the PMP checkout once advertised one price and charged another
// because those two numbers lived in different files.
//
// Phase II-A publishes this figure and takes no money. When registration is
// built (Phase II-C) the charge is created from AMOUNT_CENTS on the server,
// against a registration a human approved — never from a price the browser
// sent, and never from a reusable public Stripe price object, because a
// permanent payment link is a URL and URLs get forwarded.
//
// $1,499.99 per person, approved by the business owner on 21 August 2026,
// including lodging, meals and the masterclass itself.
// ---------------------------------------------------------------------------

const AMOUNT_CENTS = 149999

export const LIAP_RETREAT = {
  productKey: 'LIAP_RETREAT',
  name: 'LIAP Retreat',
  /** Cents. The only place this number exists. */
  amount: AMOUNT_CENTS,
  priceLabel: `$${(AMOUNT_CENTS / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`,
  currency: 'usd',
  /** The threshold at which the group enquiry path is offered. */
  groupThreshold: 5,
  metadataKey: 'liap-retreat-registration',
} as const

/**
 * Granted on verified payment OR on confirmed sponsorship.
 *
 * Not defined by whether the participant personally paid: a fully underwritten
 * participant who never touches Stripe must still get in, or the sponsorship
 * bought nothing. Phase II-C and II-D implement the grant; the key is declared
 * here so there is one spelling of it.
 */
export const LIAP_RETREAT_ENTITLEMENT = 'LIAP_RETREAT'

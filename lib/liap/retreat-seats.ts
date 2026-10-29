import type Stripe from 'stripe'
import { LIAP_RETREAT } from './product'

// ---------------------------------------------------------------------------
// The 12-seat limit. Owner ruling 2026-10-29: first come, first served.
//
// Stripe is the record: a seat is taken by a paid Retreat checkout, and held
// by one that is still open (a buyer on the payment page). Counting from
// Stripe needs no new database table — the handoff withholds migrations.
//
// Holds expire after 30 minutes (the shortest Stripe allows), so an abandoned
// payment page releases its seats. Two buyers finishing in the same moment
// could still both get through; the webhook checks the paid total afterwards
// and flags any overbooking for the owner to resolve.
// ---------------------------------------------------------------------------

/** How long a buyer's seats are held while they are on the payment page. */
export const HOLD_MINUTES = 30

/** Seats in one session: the quantity of its line item. */
function seatsIn(session: Stripe.Checkout.Session): number {
  return (session.line_items?.data ?? []).reduce((n, li) => n + (li.quantity ?? 0), 0)
}

export interface SeatCount {
  paid: number
  held: number
}

/** Paid and currently held Retreat seats, read from Stripe. Throws on Stripe errors. */
export async function countRetreatSeats(stripe: Stripe): Promise<SeatCount> {
  const since = Math.floor(Date.now() / 1000) - 400 * 24 * 60 * 60
  const count: SeatCount = { paid: 0, held: 0 }
  for await (const s of stripe.checkout.sessions.list({
    limit: 100,
    created: { gte: since },
    expand: ['data.line_items'],
  })) {
    if (s.metadata?.product !== LIAP_RETREAT.metadataKey) continue
    if (s.payment_status === 'paid') count.paid += seatsIn(s)
    else if (s.status === 'open') count.held += seatsIn(s)
  }
  return count
}

/** Seats a new buyer may still take. Never negative. */
export function seatsRemaining(count: SeatCount): number {
  return Math.max(0, LIAP_RETREAT.capacity - count.paid - count.held)
}

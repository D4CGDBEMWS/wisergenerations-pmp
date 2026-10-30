import type Stripe from 'stripe'
import { getDb } from '@/lib/db/client'

// ---------------------------------------------------------------------------
// Saves where a pre-ordered hardcover is to be mailed. Owner ruling 2026-10-30.
//
// Never fatal: the buyer has paid and has their entitlement whatever happens
// here. A failure is logged, and the address is still in Stripe.
// ---------------------------------------------------------------------------

export interface ShippingAddress {
  name: string
  line1: string
  line2: string | null
  city: string
  state: string
  postalCode: string
  country: string
}

/** Reads the shipping address from a completed checkout session, if any. */
export function shippingFromSession(session: Stripe.Checkout.Session): ShippingAddress | null {
  const legacy = (session as unknown as {
    shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null
  }).shipping_details
  const details = session.collected_information?.shipping_details ?? legacy ?? null
  const a = details?.address
  if (!details?.name || !a?.line1 || !a.city || !a.state || !a.postal_code) return null
  return {
    name: details.name,
    line1: a.line1,
    line2: a.line2 ?? null,
    city: a.city,
    state: a.state,
    postalCode: a.postal_code,
    country: a.country ?? 'US',
  }
}

export async function saveBookShipment(orderId: string, addr: ShippingAddress): Promise<void> {
  try {
    await getDb().query(
      `INSERT INTO book_shipments (order_id, ship_name, line1, line2, city, state, postal_code, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (order_id) DO NOTHING`,
      [orderId, addr.name, addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country]
    )
  } catch (err) {
    console.error('[liap/shipping] could not save shipping address for order', orderId, err)
  }
}

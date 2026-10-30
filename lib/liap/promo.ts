// ---------------------------------------------------------------------------
// Free-shipping codes for the hardcover pre-order.
//
// Owner ruling 2026-10-30: code SHIP2027, no limits, until the owner turns it
// off. To retire a code, delete it from this list; to add one, add it here.
//
// Why the site checks the code instead of Stripe: Stripe promotion codes only
// discount the item price, never shipping, and a Stripe code would also work
// on the retreat and PMP checkouts. Checked here, it can only ever set the
// book's shipping to $0, so it cannot change the price of anything else.
// ---------------------------------------------------------------------------

export const FREE_SHIPPING_CODES: readonly string[] = ['SHIP2027']

export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const code = raw.trim().toUpperCase()
  return /^[A-Z0-9-]{3,24}$/.test(code) ? code : null
}

export function isFreeShippingCode(raw: unknown): boolean {
  const code = normalizeCode(raw)
  return code !== null && FREE_SHIPPING_CODES.includes(code)
}

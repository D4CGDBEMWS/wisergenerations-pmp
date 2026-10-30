import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type Stripe from 'stripe'
import { LIAP_BOOK } from '@/lib/liap/product'
import { shippingFromSession } from '@/lib/liap/shipping'

// Owner ruling 2026-10-30: US-only shipping address, flat $4.99, author mails.

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

describe('hardcover pre-order shipping', () => {
  it('is a flat $4.99, US only', () => {
    expect(LIAP_BOOK.shipping.amount).toBe(499)
    expect(LIAP_BOOK.shipping.label).toBe('$4.99')
    expect(LIAP_BOOK.shipping.countries).toEqual(['US'])
    expect(LIAP_BOOK.amount).toBe(2499)
  })

  it('checkout collects a US address and charges the flat rate', () => {
    const src = read('app/api/liap/preorder/route.ts')
    expect(src).toContain('shipping_address_collection: { allowed_countries: [...LIAP_BOOK.shipping.countries] }')
    expect(src).toContain("type: 'fixed_amount'")
    expect(src).toContain('amount: LIAP_BOOK.shipping.amount')
  })

  it('the webhook saves the address with the order', () => {
    const src = read('app/api/stripe/webhook/route.ts')
    expect(src).toContain('shippingFromSession(liapSession)')
    expect(src).toContain('saveBookShipment(result.orderId, shipTo)')
  })

  it('reads the address from a checkout session', () => {
    const s = {
      collected_information: {
        shipping_details: {
          name: 'Pat Reader',
          address: { line1: '1 Main St', line2: null, city: 'Smyrna', state: 'GA', postal_code: '30080', country: 'US' },
        },
      },
    } as unknown as Stripe.Checkout.Session
    expect(shippingFromSession(s)).toEqual({
      name: 'Pat Reader', line1: '1 Main St', line2: null, city: 'Smyrna', state: 'GA', postalCode: '30080', country: 'US',
    })
  })

  it('returns null when no address was collected', () => {
    expect(shippingFromSession({} as Stripe.Checkout.Session)).toBeNull()
  })

  it('pages tell buyers about shipping', () => {
    expect(read('app/living-is-a-project/book/page.tsx')).toContain('LIAP_BOOK.shipping.label')
    expect(read('app/living-is-a-project/author/page.tsx')).toContain('USPS Media Mail')
  })

  it('has an idempotent migration with a shipping-list view', () => {
    const sql = read('db/migrations/0007_liap_book_shipments.sql')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS book_shipments')
    expect(sql).toContain('CREATE OR REPLACE VIEW book_shipping_list')
    expect(sql).not.toMatch(/\bDROP\b|\bALTER\b/)
  })
})

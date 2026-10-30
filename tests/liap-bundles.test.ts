import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  BUNDLES, bundleCopies, bundleSavings, bundleStatus, bundleValue, findBundle, isLiapBundle, usd, BUNDLE_METADATA_KEY,
} from '@/lib/liap/bundles'
import { isLiapPreorder } from '@/lib/liap/fulfilment'

// Owner ruling 2026-10-30: Black Friday 3-book bundle for $50, bundles page.

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const bf = findBundle('black-friday-3-pack')!

describe('Black Friday 3-book bundle', () => {
  it('is 3 hardcovers for $50.00, saving $24.97 on $74.97', () => {
    expect(bf).toBeTruthy()
    expect(bundleCopies(bf)).toBe(3)
    expect(bf.price).toBe(5000)
    expect(usd(bundleValue(bf))).toBe('$74.97')
    expect(usd(bundleSavings(bf))).toBe('$24.97')
  })

  it('is on sale Black Friday through Nov 30, Eastern time', () => {
    expect(bundleStatus(bf, new Date('2026-11-26T23:59:00-05:00'))).toBe('upcoming')
    expect(bundleStatus(bf, new Date('2026-11-27T00:00:01-05:00'))).toBe('active')
    expect(bundleStatus(bf, new Date('2026-11-30T23:00:00-05:00'))).toBe('active')
    expect(bundleStatus(bf, new Date('2026-12-01T00:00:01-05:00'))).toBe('ended')
  })

  it('every bundle costs less than its parts and has unique slugs', () => {
    for (const b of BUNDLES) expect(bundleSavings(b)).toBeGreaterThan(0)
    expect(new Set(BUNDLES.map((b) => b.slug)).size).toBe(BUNDLES.length)
  })

  it('has its own Stripe marker, distinct from the single-book preorder', () => {
    expect(isLiapBundle({ product: BUNDLE_METADATA_KEY })).toBe(true)
    expect(isLiapPreorder({ product: BUNDLE_METADATA_KEY })).toBe(false)
    expect(isLiapBundle({ product: 'liap-book-preorder' })).toBe(false)
  })
})

describe('bundle checkout and fulfilment', () => {
  const route = read('app/api/liap/bundle/route.ts')
  it('takes price and contents from the server and refuses outside the sale window', () => {
    expect(route).toContain('unit_amount: bundle.price')
    expect(route).toContain("status !== 'active'")
    expect(route).toContain('allow_promotion_codes: false')
    expect(route).toContain('shipping_address_collection')
    expect(route).toContain('isFreeShippingCode')
  })
  it('is fulfilled as a pre-order with its copy count and gets the bonus', () => {
    const hook = read('app/api/stripe/webhook/route.ts')
    expect(hook).toContain('isLiapPreorder(liapSession.metadata) || liapIsBundle')
    expect(hook).toContain('liapSession.metadata?.copies')
    expect(read('app/api/liap/bonus/route.ts')).toContain('isLiapBundle(s.metadata)')
  })
  it('the shipping list counts copies', () => {
    expect(read('db/migrations/0008_shipping_list_quantity.sql')).toContain('AS copies')
  })
  it('has the /bundles address but stays hidden until FEATURE_LIAP_BUNDLES is on', () => {
    expect(read('next.config.mjs')).toContain("source: '/bundles'")
    expect(read('app/living-is-a-project/bundles/page.tsx')).toContain("!isEnabled('LIAP_BUNDLES')")
    expect(route).toContain("!isEnabled('LIAP_BUNDLES')")
    expect(read('lib/shell.ts')).not.toContain("href: '/bundles'")
  })
})

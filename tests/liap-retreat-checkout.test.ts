import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const create = vi.fn()
vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create } }
  },
}))
vi.mock('@/lib/api-guard', () => ({ checkOrigin: () => null, rateLimit: async () => null }))

import { POST } from '@/app/api/liap/retreat/route'
import { LIAP_RETREAT } from '@/lib/liap/product'
import { isLiapRetreat } from '@/lib/liap/retreat'

const req = (body: unknown = {}) =>
  new Request('https://www.wisergenerations.com/api/liap/retreat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0]

describe('Living the Journey — 3-Day Retreat checkout', () => {
  beforeEach(() => {
    create.mockReset()
    create.mockResolvedValue({ url: 'https://checkout.stripe.com/test' })
    process.env.FEATURE_LIAP = 'true'
    process.env.FEATURE_LIAP_RETREAT = 'true'
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'
  })
  afterEach(() => {
    delete process.env.FEATURE_LIAP
    delete process.env.FEATURE_LIAP_RETREAT
    delete process.env.STRIPE_SECRET_KEY
  })

  it('uses the canonical name and the per-person price', () => {
    expect(LIAP_RETREAT.name).toBe('Living the Journey — 3-Day Retreat')
    expect(LIAP_RETREAT.amount).toBe(149999)
    expect(LIAP_RETREAT.priceLabel).toBe('$1,499.99 per person')
    expect(LIAP_RETREAT.depositAmount + LIAP_RETREAT.balanceAmount).toBe(LIAP_RETREAT.amount)
    expect(LIAP_RETREAT.depositLabel).toBe('$500')
    expect(LIAP_RETREAT.balanceLabel).toBe('$999.99')
    expect(LIAP_RETREAT.where).toBe('Callaway Gardens, Georgia')
  })

  it('does not exist while the Retreat switch is off', async () => {
    delete process.env.FEATURE_LIAP_RETREAT
    expect((await POST(req())).status).toBe(404)
    expect(create).not.toHaveBeenCalled()
  })

  it('does not exist while the Living Is a Project section is off', async () => {
    delete process.env.FEATURE_LIAP
    expect((await POST(req())).status).toBe(404)
  })

  it('creates a Stripe session priced on the server and marked for the webhook', async () => {
    const res = await POST(req({ p: 'not a valid code!!' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.com/test' })
    const arg = create.mock.calls[0]![0]
    expect(arg.mode).toBe('payment')
    expect(arg.line_items[0].price_data.unit_amount).toBe(50000)
    expect(arg.line_items[0].price_data.product_data.name).toBe(`${LIAP_RETREAT.name} — Deposit`)
    expect(arg.custom_text.submit.message).toContain('$999.99')
    expect(arg.custom_text.submit.message).toContain('7 days')
    expect(arg.custom_text.submit.message).toContain('deposit is non-refundable')
    expect(arg.custom_text.submit.message).toContain('30 days before')
    expect(arg.line_items[0].adjustable_quantity).toEqual({ enabled: true, minimum: 1, maximum: 4 })
    expect(arg.metadata).toEqual({ product: 'liap-retreat', payment: 'deposit' })
    expect(arg.success_url).toContain('/living-is-a-project/retreat-complete')
    expect(isLiapRetreat(arg.metadata)).toBe(true)
  })

  it('cannot be confused with the book pre-buy', () => {
    expect(isLiapRetreat({ product: 'liap-book-preorder' })).toBe(false)
  })

  it('no longer uses the retired retreat name on the Author page', () => {
    const src = readFileSync(join(process.cwd(), 'app/living-is-a-project/author/page.tsx'), 'utf8')
    expect(src).not.toContain('Weekend Masterclass')
    expect(src).toContain("isEnabled('LIAP_RETREAT')")
  })
})

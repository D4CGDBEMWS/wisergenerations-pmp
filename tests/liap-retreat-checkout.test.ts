import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const create = vi.fn()
// Sessions Stripe would list, for the seat count.
let existing: Array<Record<string, unknown>> = []
const list = vi.fn(() =>
  (async function* () {
    for (const s of existing) yield s
  })()
)
vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create, list } }
  },
}))

const session = (product: string, quantity: number, payment_status: string, status: string) => ({
  metadata: { product },
  payment_status,
  status,
  line_items: { data: [{ quantity }] },
})
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
    existing = []
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
    expect(LIAP_RETREAT.where).toBe('Garland Mountain Retreat, Allatoona, Georgia')
    expect(LIAP_RETREAT.when).toBe('March 19–21, 2027')
    expect(LIAP_RETREAT.capacity).toBe(12)
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

  it('counts paid and held seats, ignores other products, and caps the buyer at what is left', async () => {
    existing = [
      session('liap-retreat', 4, 'paid', 'complete'),
      session('liap-retreat', 4, 'paid', 'complete'),
      session('liap-retreat', 2, 'unpaid', 'open'),
      session('liap-retreat', 3, 'unpaid', 'expired'),
      session('liap-book-preorder', 9, 'paid', 'complete'),
    ]
    const res = await POST(req())
    expect(res.status).toBe(200)
    const arg = create.mock.calls[0]![0]
    expect(arg.line_items[0].adjustable_quantity.maximum).toBe(2)
    expect(arg.expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it('refuses once all 12 seats are taken — first come, first served', async () => {
    existing = [
      session('liap-retreat', 4, 'paid', 'complete'),
      session('liap-retreat', 4, 'paid', 'complete'),
      session('liap-retreat', 4, 'unpaid', 'open'),
    ]
    const res = await POST(req())
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ full: true })
    expect(create).not.toHaveBeenCalled()
  })

  it('fails closed when seats cannot be counted', async () => {
    list.mockImplementationOnce(() => {
      throw new Error('stripe down')
    })
    expect((await POST(req())).status).toBe(503)
    expect(create).not.toHaveBeenCalled()
  })
})

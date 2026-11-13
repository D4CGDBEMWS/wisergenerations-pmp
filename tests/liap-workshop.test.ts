import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const create = vi.fn()
vi.mock('stripe', () => ({ default: class { checkout = { sessions: { create } } } }))
vi.mock('@/lib/api-guard', () => ({ checkOrigin: () => null, rateLimit: async () => null }))

import { POST } from '@/app/api/liap/workshop/route'
import {
  WORKSHOP,
  WORKSHOP_SESSIONS,
  findSession,
  isLiapWorkshop,
  sessionLabel,
  sessionOpen,
} from '@/lib/liap/workshop'
import { confirmationEmail, reminderEmail, replayEmail, sessionIcs } from '@/lib/liap/workshop-email'
import { ownerKeyValid } from '@/lib/liap/workshop-service'

const req = (body: unknown = {}) =>
  new Request('https://www.wisergenerations.com/api/liap/workshop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0]

const ZOOM = { url: 'https://us06web.zoom.us/j/1?pwd=x', meetingId: '111 222 333', passcode: '000000' }
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

describe('Be Ready to Make the Turn Workshop — schedule', () => {
  it('runs January 11–15, 2027, twice a day, 90 minutes, $49', () => {
    expect(WORKSHOP.priceCents).toBe(4900)
    expect(WORKSHOP.priceLabel).toBe('$49')
    expect(WORKSHOP_SESSIONS).toHaveLength(10)
    expect(sessionLabel(findSession('2027-01-11-noon')!)).toBe('Monday, January 11, 2027 · 12:00 PM–1:30 PM Eastern')
    expect(sessionLabel(findSession('2027-01-15-evening')!)).toBe('Friday, January 15, 2027 · 7:00 PM–8:30 PM Eastern')
    expect(new Set(WORKSHOP_SESSIONS.map((s) => s.key)).size).toBe(10)
  })

  it('states the non-refundable and replay terms', () => {
    expect(WORKSHOP.terms).toMatch(/non-refundable/i)
    expect(WORKSHOP.terms).toMatch(/replay/i)
  })

  it('closes registration an hour before a session starts', () => {
    const s = findSession('2027-01-11-noon')!
    expect(sessionOpen(s, new Date('2027-01-11T10:59:00-05:00'))).toBe(true)
    expect(sessionOpen(s, new Date('2027-01-11T11:00:00-05:00'))).toBe(false)
  })

  it('recognises only its own checkout marker', () => {
    expect(isLiapWorkshop({ product: 'liap-workshop' })).toBe(true)
    expect(isLiapWorkshop({ product: 'liap-retreat' })).toBe(false)
    expect(isLiapWorkshop(null)).toBe(false)
  })
})

describe('Workshop checkout', () => {
  beforeEach(() => {
    create.mockReset()
    create.mockResolvedValue({ url: 'https://checkout.stripe.com/test' })
    process.env.FEATURE_LIAP = 'true'
    process.env.FEATURE_LIAP_WORKSHOP = 'true'
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-12-01T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    delete process.env.FEATURE_LIAP
    delete process.env.FEATURE_LIAP_WORKSHOP
    delete process.env.STRIPE_SECRET_KEY
  })

  it('does not exist while the workshop switch is off', async () => {
    delete process.env.FEATURE_LIAP_WORKSHOP
    expect((await POST(req({ session: '2027-01-11-noon' }))).status).toBe(404)
    expect(create).not.toHaveBeenCalled()
  })

  it('requires a real session', async () => {
    expect((await POST(req({}))).status).toBe(400)
    expect((await POST(req({ session: '2027-02-01-noon' }))).status).toBe(400)
    expect(create).not.toHaveBeenCalled()
  })

  it('refuses a closed session', async () => {
    vi.setSystemTime(new Date('2027-01-11T17:30:00Z')) // 12:30 pm Eastern
    expect((await POST(req({ session: '2027-01-11-noon' }))).status).toBe(409)
    expect(create).not.toHaveBeenCalled()
  })

  it('prices on the server and marks the session for the webhook', async () => {
    const res = await POST(req({ session: '2027-01-13-evening', p: 'SHOP1', price: 1 }))
    expect(res.status).toBe(200)
    const arg = create.mock.calls[0]![0]
    expect(arg.line_items[0].price_data.unit_amount).toBe(4900)
    expect(arg.line_items[0].price_data.product_data.name).toBe(WORKSHOP.name)
    expect(arg.metadata).toEqual({ product: 'liap-workshop', session: '2027-01-13-evening', referral: 'SHOP1' })
    expect(arg.success_url).toContain('/living-is-a-project/workshop/registered?session=2027-01-13-evening')
    expect(JSON.stringify(arg)).not.toContain('zoom.us')
  })
})

describe('Workshop emails', () => {
  const s = findSession('2027-01-12-noon')!

  it('the confirmation carries the Zoom details, the terms and Crystal’s sign-off', () => {
    const e = confirmationEmail(s, ZOOM)
    expect(e.html).toContain(ZOOM.url.replace(/&/g, '&amp;'))
    expect(e.html).toContain('111 222 333')
    expect(e.html).toContain('000000')
    expect(e.html).toMatch(/non-refundable/)
    expect(e.html).toContain('Life is a journey. Enjoy the ride!')
    expect(e.text).toContain(ZOOM.url)
  })

  it('never mentions PMP study access or an exam', () => {
    for (const e of [confirmationEmail(s, ZOOM), reminderEmail(s, ZOOM), replayEmail(s, 'https://zoom.us/rec/x', 'https://x/survey/t')]) {
      expect(e.html).not.toMatch(/Study Access|exam/i)
    }
  })

  it('the replay email links the replay and the survey', () => {
    const e = replayEmail(s, 'https://zoom.us/rec/share/abc', 'https://www.wisergenerations.com/living-is-a-project/workshop/survey/tok')
    expect(e.html).toContain('https://zoom.us/rec/share/abc')
    expect(e.html).toContain('/workshop/survey/tok')
  })

  it('the calendar file is a valid one-hour-thirty event in Eastern time', () => {
    const ics = sessionIcs(s, ZOOM, 'uid-1')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('DTSTART:20270112T170000Z')
    expect(ics).toContain('DTEND:20270112T183000Z')
  })
})

describe('Workshop — the Zoom link stays private', () => {
  it('never appears in source, pages or tests outside env lookup', () => {
    for (const p of [
      'lib/liap/workshop.ts',
      'app/living-is-a-project/workshop/page.tsx',
      'components/liap/WorkshopRegister.tsx',
      'app/living-is-a-project/author/page.tsx',
    ]) {
      expect(read(p)).not.toMatch(/86168694138|755517/)
    }
  })

  it('the owner replay page needs a long secret key', () => {
    const prev = process.env.WORKSHOP_ADMIN_KEY
    process.env.WORKSHOP_ADMIN_KEY = 'k'.repeat(32)
    expect(ownerKeyValid('k'.repeat(32))).toBe(true)
    expect(ownerKeyValid('k'.repeat(31))).toBe(false)
    expect(ownerKeyValid(undefined)).toBe(false)
    process.env.WORKSHOP_ADMIN_KEY = 'short'
    expect(ownerKeyValid('short')).toBe(false)
    if (prev === undefined) delete process.env.WORKSHOP_ADMIN_KEY
    else process.env.WORKSHOP_ADMIN_KEY = prev
  })

  it('the daily job is scheduled and protected', () => {
    const v = JSON.parse(read('vercel.json'))
    expect(v.crons).toContainEqual({ path: '/api/cron/workshop', schedule: '0 14 * * *' })
    expect(read('app/api/cron/workshop/route.ts')).toContain('CRON_SECRET')
    expect(existsSync(join(process.cwd(), 'db/migrations/0009_liap_workshop.sql'))).toBe(true)
  })
})

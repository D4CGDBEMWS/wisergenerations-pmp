import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/api-guard', () => ({ checkOrigin: () => null, rateLimit: async () => null }))
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: async () => ({ success: true }) }))

import { POST } from '@/app/api/subscribe/route'

const req = (body: unknown) =>
  new Request('https://www.wisergenerations.com/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0]

describe('/api/subscribe tags existing members too (2026-10-29 fix)', () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = []
  beforeEach(() => {
    calls.length = 0
    process.env.MAILCHIMP_API_KEY = 'abc-us21'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud1'
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)) })
      return new Response('{}', { status: 200 })
    }))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.MAILCHIMP_API_KEY
    delete process.env.MAILCHIMP_AUDIENCE_ID
  })

  it('never forces status, and applies tags in a separate call', async () => {
    const res = await POST(req({ email: 'Reader@Example.com', tags: ['liap-words-to-know'], turnstileToken: 't' }))
    expect(res.status).toBe(200)
    expect(calls[0]!.body).not.toHaveProperty('status')
    expect(calls[0]!.body.status_if_new).toBe('pending')
    expect(calls[1]!.url).toMatch(/\/tags$/)
    expect(calls[1]!.body).toEqual({ tags: [{ name: 'liap-words-to-know', status: 'active' }] })
  })
})

describe('Words to Know is delivered by the website (2026-10-29)', () => {
  const sent: Array<{ url: string; body: Record<string, unknown> }> = []
  beforeEach(() => {
    sent.length = 0
    process.env.MAILCHIMP_API_KEY = 'abc-us21'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud1'
    process.env.RESEND_API_KEY = 're_test'
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      sent.push({ url, body: JSON.parse(String(init.body)) })
      return new Response('{}', { status: 200 })
    }))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.MAILCHIMP_API_KEY
    delete process.env.MAILCHIMP_AUDIENCE_ID
    delete process.env.RESEND_API_KEY
  })

  it('emails the guide link when the sign-up is for Words to Know', async () => {
    await POST(req({ email: 'reader@example.com', tags: ['liap-words-to-know'], turnstileToken: 't' }))
    const mail = sent.find((c) => c.url === 'https://api.resend.com/emails')
    expect(mail).toBeTruthy()
    expect(mail!.body.to).toEqual(['reader@example.com'])
    expect(String(mail!.body.text)).toContain('/liap/author/words-to-know.pdf')
  })

  it('sends nothing for other sign-ups', async () => {
    await POST(req({ email: 'reader@example.com', tags: ['newsletter'], turnstileToken: 't' }))
    expect(sent.some((c) => c.url === 'https://api.resend.com/emails')).toBe(false)
  })
})

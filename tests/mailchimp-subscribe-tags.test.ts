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

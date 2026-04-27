import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'

// ---------------------------------------------------------------------------
// POST /api/subscribe
//
// Adds an email address to the Mailchimp audience list and optionally tags
// the subscriber based on the source (newsletter, practice-questions, etc.).
//
// Required env vars:
//   MAILCHIMP_API_KEY     -- from Mailchimp account → Extras → API Keys
//   MAILCHIMP_AUDIENCE_ID -- from Mailchimp → Audience → Settings → Audience name and defaults
//   MAILCHIMP_DC          -- data center prefix, e.g. "us21" (from API key suffix after the dash)
//
// In development without these vars set we log and return success so the UI
// flow can be tested without the integration.
// ---------------------------------------------------------------------------

const EMAIL_MAX = 254

export async function POST(req: NextRequest) {
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'subscribe', { limit: 5, windowMs: 60_000 })
  if (rateBlock) return rateBlock

  let body: { email?: string; tags?: string[]; source?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const tags: string[] = Array.isArray(body.tags) ? body.tags : []

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  if (email.length > EMAIL_MAX) {
    return NextResponse.json({ error: 'Email address is too long.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  const apiKey = process.env.MAILCHIMP_API_KEY
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID
  const dc = process.env.MAILCHIMP_DC

  if (!apiKey || !audienceId || !dc) {
    console.warn('[/api/subscribe] Mailchimp env vars not set — skipping subscription.')
    return NextResponse.json({ ok: true })
  }

  // Mailchimp uses MD5 hash of lowercase email as subscriber ID
  // Using PUT (upsert) handles existing subscribers gracefully
  const crypto = await import('crypto')
  const subscriberHash = crypto.createHash('md5').update(email).digest('hex')

  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: 'pending',
        status: 'pending',
        tags: tags.map((tag) => ({ name: tag, status: 'active' })),
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      if (res.status === 400 && data?.title === 'Invalid Resource') {
        return NextResponse.json(
          { error: 'That email address is not valid.' },
          { status: 400 }
        )
      }
      console.error('[/api/subscribe] Mailchimp error:', {
        status: res.status,
        title: data?.title ?? null,
        detail: data?.detail ?? null,
      })
      return NextResponse.json(
        { error: 'Could not sign you up. Please try again.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/subscribe] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

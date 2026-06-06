import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { verifyTurnstile } from '@/lib/turnstile'

// ---------------------------------------------------------------------------
// POST /api/subscribe
//
// Adds an email address to the Mailchimp audience list and optionally tags
// the subscriber based on the source (newsletter, practice-questions, etc.).
//
// Required env vars:
// MAILCHIMP_API_KEY -- from Mailchimp account -> Extras -> API Keys
// MAILCHIMP_AUDIENCE_ID -- from Mailchimp -> Audience -> Settings
// MAILCHIMP_DC -- data center prefix, e.g. "us21" (from API key suffix)
// TURNSTILE_SECRET_KEY -- from Cloudflare Turnstile dashboard
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

  let body: { email?: string; tags?: string[]; source?: string; turnstileToken?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // ---------------------------------------------------------------------------
  // Turnstile CAPTCHA verification
  // ---------------------------------------------------------------------------
  const turnstileResult = await verifyTurnstile(body.turnstileToken, req)
  if (!turnstileResult.success) {
    return NextResponse.json(
      { error: 'Security check failed. Please refresh and try again.' },
      { status: 400 }
    )
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
  const crypto = await import('crypto')
  const emailHash = crypto.createHash('md5').update(email).digest('hex')

  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${emailHash}`

  const payload = {
    email_address: email,
    status_if_new: 'pending',
    status: 'pending',
    tags,
  }

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('[/api/subscribe] Mailchimp error:', errorData)
      return NextResponse.json(
        { error: 'Could not subscribe. Please try again later.' },
        { status: 500 }
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

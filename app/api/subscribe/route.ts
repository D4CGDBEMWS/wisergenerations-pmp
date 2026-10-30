import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { verifyTurnstile } from '@/lib/turnstile'
import { upsertSubscriber } from '@/lib/mailchimp'
import { sendWordsToKnowGuide } from '@/lib/liap/guide-email'

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

  let body: {
    email?: string
    firstName?: string
    lastName?: string
    tags?: string[]
    source?: string
    turnstileToken?: string
  }
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

  // 2026-10-29 fix. This used to PUT the member with `status: 'pending'` and
  // the tags in the same body. Mailchimp only applies tags in that body when
  // it CREATES a member, so someone already on the list who signed up again
  // (for Words to Know, say) got no new tag and no welcome series; and forcing
  // `status` could push an existing subscriber back to unconfirmed. The shared
  // helper sets status only for new members and applies tags separately.
  // Names are optional and capped; Mailchimp stores them as FNAME / LNAME.
  const clean = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 80) : undefined)
  const result = await upsertSubscriber({
    email,
    firstName: clean(body.firstName),
    lastName: clean(body.lastName),
    tags,
  })
  if (!result.ok) {
    return NextResponse.json(
      { error: 'Could not subscribe. Please try again later.' },
      { status: 500 }
    )
  }
  // Words to Know is delivered by the website, not only by a Mailchimp
  // journey (owner ruling 2026-10-29). Never fails the sign-up.
  if (tags.includes('liap-words-to-know')) {
    await sendWordsToKnowGuide(email)
  }
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { verifyTurnstile } from '@/lib/turnstile'
import { upsertSubscriber } from '@/lib/mailchimp'

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// POST /api/free-guide
//
// Captures a lead for the "2026 PMP Exam, Decoded" guide.
//
// Mailchimp is the system of record (tags: ebook-lead, free-guide). ConvertKit
// is still called while CONVERTKIT_API_KEY is set, because the ConvertKit
// automation is what currently emails the PDF — switching that off before a
// Mailchimp equivalent exists would silently break delivery for real people.
//
// To finish the migration to Mailchimp only: build the Mailchimp automation,
// then delete CONVERTKIT_API_KEY and CONVERT_KIT_FORM_ID from Vercel. This
// route needs no code change — it skips ConvertKit when those are absent.
//
// Note that the visitor does not depend on email for access: the thank-you
// page links the PDF directly.
// ---------------------------------------------------------------------------

const NAME_MAX = 80
const EMAIL_MAX = 254

async function subscribeToConvertKit(firstName: string, email: string): Promise<void> {
  const apiKey = process.env.CONVERTKIT_API_KEY
  const formId = process.env.CONVERT_KIT_FORM_ID
  if (!apiKey || !formId) return

  try {
    const res = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, email, first_name: firstName }),
    })

    if (!res.ok) {
      // ConvertKit echoes the email address back in error bodies, so log only
      // structural information to keep PII out of Vercel function logs.
      const data = (await res.json().catch(() => null)) as { message?: string } | null
      console.error('[/api/free-guide] ConvertKit error:', {
        status: res.status,
        message: typeof data?.message === 'string' ? data.message : null,
      })
    }
  } catch (err) {
    console.error('[/api/free-guide] ConvertKit request failed:', err)
  }
}

export async function POST(req: NextRequest) {
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'free-guide', { limit: 10, windowMs: 10 * 60_000 })
  if (rateBlock) return rateBlock

  let body: { firstName?: string; email?: string; turnstileToken?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const turnstile = await verifyTurnstile(body.turnstileToken, req)
  if (!turnstile.success) {
    return NextResponse.json(
      { error: 'Security check failed. Please refresh and try again.' },
      { status: 400 }
    )
  }

  const firstName = (body.firstName ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()

  if (!firstName || !email) {
    return NextResponse.json(
      { error: 'Please enter your first name and email address.' },
      { status: 400 }
    )
  }
  if (firstName.length > NAME_MAX || email.length > EMAIL_MAX) {
    return NextResponse.json({ error: 'One or more fields are too long.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'That email address does not look right. Please check it and try again.' },
      { status: 400 }
    )
  }

  const result = await upsertSubscriber({
    email,
    firstName,
    tags: ['ebook-lead', 'free-guide'],
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status })
  }

  // Delivery automation lives in ConvertKit for now; failures there must not
  // block the visitor, who gets the PDF on the thank-you page regardless.
  await subscribeToConvertKit(firstName, email)

  return NextResponse.json({ ok: true })
}

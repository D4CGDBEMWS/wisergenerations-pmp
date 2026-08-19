import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { recordAuditEvent } from '@/lib/audit'

// ---------------------------------------------------------------------------
// POST /api/free-guide
// Subscribes the user to ConvertKit and triggers the PDF delivery sequence.
//
// ConvertKit setup steps:
//   1. Create a Form in ConvertKit → copy the Form ID into CONVERT_KIT_FORM_ID
//   2. Create an API key → copy into CONVERTKIT_API_KEY
//   3. Create an Automation: trigger = "subscribes to form" → send email with PDF link
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'free-guide', { limit: 5, windowMs: 60_000 })
  if (rateBlock) return rateBlock

  let body: { firstName?: string; email?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { firstName, email } = body

  if (!firstName || !email) {
    return NextResponse.json({ error: 'firstName and email are required.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  // Two spellings accepted for the form id. The key is CONVERTKIT_API_KEY with
  // no separator and the form id was CONVERT_KIT_FORM_ID with one, so setting
  // the pair consistently — the obvious thing to do — left the form id unread
  // and every lead silently discarded. The same class of mismatch left
  // RESEND_FROM_EMAIL unread in this deployment for five months.
  const apiKey = process.env.CONVERTKIT_API_KEY
  const formId = process.env.CONVERT_KIT_FORM_ID || process.env.CONVERTKIT_FORM_ID

  if (!apiKey || !formId) {
    // Returning ok keeps the UI flow testable without the integration, but a
    // misconfigured PRODUCTION deployment then tells the visitor their guide is
    // on its way and drops the address — the failure is invisible from both
    // sides. So say which half is missing, and say it at error level, because
    // nobody reads warnings in serverless logs.
    console.error('[/api/free-guide] lead NOT captured — ConvertKit not configured', {
      hasApiKey: Boolean(apiKey),
      hasFormId: Boolean(formId),
    })
    await recordAuditEvent({
      eventType: 'lead.dropped',
      metadata: { reason: 'convertkit_not_configured', source_type: 'free-guide' },
    })
    return NextResponse.json({ ok: true })
  }

  try {
    const res = await fetch(
      `https://api.convertkit.com/v3/forms/${formId}/subscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          email,
          first_name: firstName,
          // Tags are optional — useful for segmenting free-guide leads
          tags: [],
        }),
      }
    )

    if (!res.ok) {
      // ConvertKit's error responses typically echo the email address back as
      // part of the body. Logging the full response would put PII into Vercel
      // function logs on every failed signup, so we log only structural info.
      const data = await res.json().catch(() => null)
      console.error('[/api/free-guide] ConvertKit error:', {
        status: res.status,
        message: typeof data?.message === 'string' ? data.message : null,
      })
      return NextResponse.json(
        { error: 'Could not subscribe. Please try again.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/free-guide] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}

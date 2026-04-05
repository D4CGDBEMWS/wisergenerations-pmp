import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// POST /api/free-guide
// Subscribes the user to ConvertKit and triggers the PDF delivery sequence.
//
// ConvertKit setup steps (see clicks guide):
//   1. Create a Form in ConvertKit → copy the Form ID into CONVERTKIT_FORM_ID
//   2. Create an API key → copy into CONVERTKIT_API_KEY
//   3. Create an Automation: trigger = "subscribes to form" → send email with PDF link
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
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

  const apiKey = process.env.CONVERTKIT_API_KEY
  const formId = process.env.CONVERTKIT_FORM_ID

  if (!apiKey || !formId) {
    // In development without ConvertKit configured, log and return success
    // so you can test the UI flow without the integration.
    console.warn('[/api/free-guide] ConvertKit env vars not set — skipping subscription.')
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
      const data = await res.json().catch(() => null)
      console.error('[/api/free-guide] ConvertKit error:', data)
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

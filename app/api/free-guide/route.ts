import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// POST /api/free-guide
// Subscribes the user to Mailchimp and tags them so an Automation can
// trigger PDF delivery.
//
// Mailchimp setup steps:
//   1. Copy your API key into MAILCHIMP_API_KEY (format: xxxxx-usNN)
//   2. Copy your audience/list ID into MAILCHIMP_AUDIENCE_ID
//   3. Create a Customer Journey / Automation with starting point
//      "Tag added" = "free-guide" → send email containing the PDF link
// ---------------------------------------------------------------------------

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function getMailchimpHeaders(apiKey: string) {
  return {
    Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
    'Content-Type': 'application/json',
  }
}

export async function POST(req: NextRequest) {
  let body: { firstName?: string; email?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { firstName, email: rawEmail } = body

  if (!firstName || !rawEmail) {
    return NextResponse.json({ error: 'firstName and email are required.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(rawEmail)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  const apiKey = process.env.MAILCHIMP_API_KEY
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID

  if (!apiKey || !audienceId) {
    // In development without Mailchimp configured, log and return success
    // so you can test the UI flow without the integration.
    console.warn('[/api/free-guide] Mailchimp env vars not set — skipping subscription.')
    return NextResponse.json({ ok: true })
  }

  const dataCenter = apiKey.split('-')[1]

  if (!dataCenter) {
    console.error('[/api/free-guide] Mailchimp API key is invalid (missing data center).')
    return NextResponse.json({ error: 'Mailchimp is misconfigured.' }, { status: 500 })
  }

  const email = normalizeEmail(rawEmail)
  const subscriberHash = createHash('md5').update(email).digest('hex')
  const memberUrl = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`
  const headers = getMailchimpHeaders(apiKey)

  try {
    const upsertResponse = await fetch(memberUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        email_address: email,
        status_if_new: 'subscribed',
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName.trim(),
        },
      }),
    })

    if (!upsertResponse.ok) {
      const errorText = await upsertResponse.text()
      console.error('[/api/free-guide] Mailchimp upsert error:', errorText)
      return NextResponse.json(
        { error: 'Could not subscribe. Please try again.' },
        { status: 502 }
      )
    }

    const tagsResponse = await fetch(`${memberUrl}/tags`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tags: [
          { name: 'free-guide', status: 'active' },
          { name: 'lead', status: 'active' },
        ],
      }),
    })

    if (!tagsResponse.ok) {
      const errorText = await tagsResponse.text()
      console.error('[/api/free-guide] Mailchimp tag error:', errorText)
      // Subscriber was saved; tag failure is non-fatal for the UI flow.
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

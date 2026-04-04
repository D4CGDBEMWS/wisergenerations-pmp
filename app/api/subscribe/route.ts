import { NextRequest, NextResponse } from 'next/server'

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY!
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID!
const MAILCHIMP_DC = process.env.MAILCHIMP_DC! // e.g. 'us5'

export async function POST(req: NextRequest) {
  try {
    const { firstName, email } = await req.json()

    if (!email || !firstName) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }

    const url = `https://${MAILCHIMP_DC}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `apikey ${MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName,
        },
        tags: ['PMP Guide Download', 'Website Lead'],
      }),
    })

    const data = await response.json()

    // Already subscribed is fine — still give them the guide
    if (!response.ok && data.title !== 'Member Exists') {
      console.error('Mailchimp error:', data)
      return NextResponse.json(
        { error: 'Could not subscribe. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Subscribe error:', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}

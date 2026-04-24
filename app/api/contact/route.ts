import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const originBlock = checkOrigin(request)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(request, 'contact', { limit: 5, windowMs: 60_000 })
  if (rateBlock) return rateBlock

  try {
    const data = await request.json()
    const { name, email, subject, message } = data

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
    }

    // Send via Mailchimp transactional / Resend / or forward as a Mailchimp campaign
    // For now, log it and return success so the UI works.
    // TODO: wire up a transactional email provider (Resend, SendGrid, etc.) using
    //       CONTACT_EMAIL_API_KEY env var when available.
    console.log('[/api/contact] New message:', { name, email, subject, message })

    // If Mailchimp API key is available, also add them as a lead
    const apiKey = process.env.MAILCHIMP_API_KEY
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID
    if (apiKey && audienceId) {
      const { createHash } = await import('crypto')
      const dc = apiKey.split('-')[1]
      if (dc) {
        const hash = createHash('md5').update(email.toLowerCase()).digest('hex')
        const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${hash}`
        await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email_address: email.toLowerCase(),
            status_if_new: 'subscribed',
            status: 'subscribed',
            merge_fields: { FNAME: name.split(' ')[0] || '', LNAME: name.split(' ').slice(1).join(' ') || '' },
            tags: [{ name: 'contact-form', status: 'active' }],
          }),
        }).catch((err) => console.error('[/api/contact] Mailchimp upsert error:', err))
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/contact] Error:', error)
    return NextResponse.json({ error: 'Unable to send your message. Please try again.' }, { status: 500 })
  }
}

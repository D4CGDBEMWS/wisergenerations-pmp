import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// Strips HTML tags and trims a string field.
// Prevents HTML/script injection from being forwarded to email or Mailchimp.
// ---------------------------------------------------------------------------
function sanitize(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/<[^>]*>/g, '').trim()
}

export async function POST(request: NextRequest) {
  const originBlock = checkOrigin(request)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(request, 'contact', { limit: 5, windowMs: 60_000 })
  if (rateBlock) return rateBlock

  try {
    const data = await request.json()

    const name = sanitize(data.name)
    const email = sanitize(data.email)
    const subject = sanitize(data.subject)
    const message = sanitize(data.message)

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
    }

    console.log('[/api/contact] New message:', { name, email, subject, message })

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

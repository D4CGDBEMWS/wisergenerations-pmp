import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type SubscribeBody = {
    email?: string
    firstName?: string
    lastName?: string
    tags?: string[]
    source?: string
}

function normalizeEmail(value: string) {
    return value.trim().toLowerCase()
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizeTag(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
}

function getMailchimpHeaders(apiKey: string) {
    return {
          Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
          'Content-Type': 'application/json',
    }
}

export async function POST(req: NextRequest) {
    try {
          const body = (await req.json()) as SubscribeBody
          const email = normalizeEmail(body.email || '')

      if (!isValidEmail(email)) {
              return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
      }

      const apiKey = process.env.MAILCHIMP_API_KEY
          const audienceId = process.env.MAILCHIMP_AUDIENCE_ID
          const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX

      if (!apiKey || !audienceId || !serverPrefix) {
              console.warn('Mailchimp env vars not set. Skipping subscription for:', email)
              return NextResponse.json({ success: true, skipped: true })
      }

      const firstName = body.firstName?.trim() || ''
          const lastName = body.lastName?.trim() || ''
          const source = normalizeTag(body.source || 'website') || 'website'
          const tags = Array.from(
                  new Set(['wiser-generations', source, ...(body.tags || []).map(normalizeTag)].filter(Boolean))
                )

      const subscriberHash = createHash('md5').update(email).digest('hex')
          const baseUrl = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`

      const upsertRes = await fetch(baseUrl, {
              method: 'PUT',
              headers: getMailchimpHeaders(apiKey),
              body: JSON.stringify({
                        email_address: email,
                        status_if_new: 'subscribed',
                        merge_fields: {
                                    FNAME: firstName,
                                    LNAME: lastName,
                        },
              }),
      })

      const upsertData = await upsertRes.json()

      if (!upsertRes.ok) {
              console.error('Mailchimp upsert error:', upsertData)
              return NextResponse.json({ success: true, warning: 'Email subscription skipped.' })
      }

      if (tags.length > 0) {
              const tagsRes = await fetch(`${baseUrl}/tags`, {
                        method: 'POST',
                        headers: getMailchimpHeaders(apiKey),
                        body: JSON.stringify({
                                    tags: tags.map((name) => ({ name, status: 'active' })),
                        }),
              })

            if (!tagsRes.ok) {
                      const tagsData = await tagsRes.json()
                      console.error('Mailchimp tag error:', tagsData)
            }
      }

      return NextResponse.json({ success: true })
    } catch (error) {
          console.error('Subscribe API error:', error)
          return NextResponse.json({ success: true, warning: 'Email subscription skipped due to error.' })
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}

import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'

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
      return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
}

function getMailchimpHeaders(apiKey: string) {
      return {
              Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
              'Content-Type': 'application/json',
      }
}

export async function POST(request: NextRequest) {
      const originBlock = checkOrigin(request)
      if (originBlock) return originBlock

      const rateBlock = await rateLimit(request, 'subscribe', { limit: 5, windowMs: 60_000 })
      if (rateBlock) return rateBlock

      try {
              const apiKey = process.env.MAILCHIMP_API_KEY
              const audienceId = process.env.MAILCHIMP_AUDIENCE_ID

        if (!apiKey || !audienceId) {
                  return NextResponse.json({ error: 'Mailchimp is not configured.' }, { status: 500 })
        }

        const data = (await request.json()) as SubscribeBody
              const email = normalizeEmail(data.email ?? '')

        if (!isValidEmail(email)) {
                  return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
        }

        const firstName = (data.firstName ?? '').trim()
              const lastName = (data.lastName ?? '').trim()
              const tags = Array.from(
                        new Set(
                                    ['lead', ...(data.tags ?? []), data.source ?? 'website']
                                      .map((tag) => normalizeTag(String(tag)))
                                      .filter(Boolean),
                                  ),
                      )

        const dataCenter = apiKey.split('-')[1]

        if (!dataCenter) {
                  return NextResponse.json({ error: 'Mailchimp API key is invalid.' }, { status: 500 })
        }

        const subscriberHash = createHash('md5').update(email).digest('hex')
              const memberUrl = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`
              const headers = getMailchimpHeaders(apiKey)

        const upsertResponse = await fetch(memberUrl, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify({
                              email_address: email,
                              status_if_new: 'subscribed',
                              status: 'subscribed',
                              merge_fields: {
                                            FNAME: firstName,
                                            LNAME: lastName,
                              },
                  }),
        })

        if (!upsertResponse.ok) {
                  const errorText = await upsertResponse.text()
                  console.error('[/api/subscribe] Mailchimp upsert failed:', errorText)
                  return NextResponse.json({ error: 'Unable to save subscriber.' }, { status: 502 })
        }

        if (tags.length > 0) {
                  const tagsResponse = await fetch(`${memberUrl}/tags`, {
                              method: 'POST',
                              headers,
                              body: JSON.stringify({
                                            tags: tags.map((name) => ({ name, status: 'active' })),
                              }),
                  })

                if (!tagsResponse.ok) {
                            const errorText = await tagsResponse.text()
                            console.error('[/api/subscribe] Mailchimp tag sync failed:', errorText)
                            return NextResponse.json({ error: 'Subscriber saved but tags could not be applied.' }, { status: 502 })
                }
        }

        return NextResponse.json({ success: true, email, tags })
      } catch (error) {
              console.error('Subscribe route error:', error)
              return NextResponse.json({ error: 'Unable to process subscription request.' }, { status: 500 })
      }
}

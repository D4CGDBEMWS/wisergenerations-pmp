import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

function getEnv(name: string) {
    const value = process.env[name]

  if (!value) {
        throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function normalizeEmail(value: string) {
    return value.trim().toLowerCase()
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

async function upsertMailchimpCustomer(input: {
    email: string
    firstName?: string
    lastName?: string
    tags: string[]
}) {
    const apiKey = getEnv('MAILCHIMP_API_KEY')
    const audienceId = getEnv('MAILCHIMP_AUDIENCE_ID')
    const dataCenter = apiKey.split('-')[1]

  if (!dataCenter) {
        throw new Error('Invalid Mailchimp API key.')
  }

  const email = normalizeEmail(input.email)
    const subscriberHash = createHash('md5').update(email).digest('hex')
    const memberUrl = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`
    const headers = getMailchimpHeaders(apiKey)
    const tags = Array.from(new Set(input.tags.map(normalizeTag).filter(Boolean)))

  const memberResponse = await fetch(memberUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
                email_address: email,
                status_if_new: 'subscribed',
                status: 'subscribed',
                merge_fields: {
                          FNAME: input.firstName?.trim() || '',
                          LNAME: input.lastName?.trim() || '',
                },
        }),
  })

  if (!memberResponse.ok) {
        throw new Error(`Mailchimp member upsert failed: ${await memberResponse.text()}`)
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
              throw new Error(`Mailchimp tag sync failed: ${await tagsResponse.text()}`)
      }
  }
}

export async function POST(request: NextRequest) {
    try {
          const stripe = new Stripe(getEnv('STRIPE_SECRET_KEY'), { apiVersion: '2025-08-27.basil' })
          const signature = request.headers.get('stripe-signature')
          const webhookSecret = getEnv('STRIPE_WEBHOOK_SECRET')

      if (!signature) {
              return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 })
      }

      const payload = await request.text()
          const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

      if (event.type === 'payment_intent.succeeded') {
              const paymentIntent = event.data.object as Stripe.PaymentIntent
              const email = normalizeEmail(paymentIntent.receipt_email || paymentIntent.metadata.customer_email || '')

            if (email) {
                      const firstName = paymentIntent.metadata.customer_first_name || ''
                      const lastName = paymentIntent.metadata.customer_last_name || ''
                      const programId = paymentIntent.metadata.program_id || 'program'
                      const programName = paymentIntent.metadata.program_name || programId

                await upsertMailchimpCustomer({
                            email,
                            firstName,
                            lastName,
                            tags: ['customer', normalizeTag(programId), normalizeTag(programName)],
                })
            }
      }

      return NextResponse.json({ received: true })
    } catch (error) {
          console.error('Stripe webhook error:', error)
          return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 400 })
    }
}

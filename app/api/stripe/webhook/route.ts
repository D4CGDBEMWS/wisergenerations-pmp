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

// Removes (deactivates) tags from a Mailchimp subscriber. Used when a Study
// Access subscription is canceled — the customer stays on the list, but the
// "study-access" / "active-subscriber" tags are deactivated so they stop
// receiving the monthly templates drip.
async function deactivateMailchimpTags(input: { email: string; tags: string[] }) {
    const apiKey = getEnv('MAILCHIMP_API_KEY')
    const audienceId = getEnv('MAILCHIMP_AUDIENCE_ID')
    const dataCenter = apiKey.split('-')[1]

  if (!dataCenter) {
        throw new Error('Invalid Mailchimp API key.')
  }

  const email = normalizeEmail(input.email)
    const subscriberHash = createHash('md5').update(email).digest('hex')
    const tagsUrl = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}/tags`
    const headers = getMailchimpHeaders(apiKey)
    const tags = Array.from(new Set(input.tags.map(normalizeTag).filter(Boolean)))

  if (tags.length === 0) return

  const response = await fetch(tagsUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
                tags: tags.map((name) => ({ name, status: 'inactive' })),
        }),
  })

  if (!response.ok) {
        // Don't throw — Mailchimp returns 404 if the subscriber was deleted,
        // and we don't want that to retry the webhook indefinitely.
        console.warn(`Mailchimp tag deactivation soft-failed: ${await response.text()}`)
  }
}

function splitFullName(full: string | null | undefined) {
    const trimmed = (full ?? '').trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const parts = trimmed.split(/\s+/)
  return {
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' '),
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

      // ─────────────────────────────────────────────────────────────────
      // 1. One-time program purchases (PMP, CAPM, Veterans) — existing
      // ─────────────────────────────────────────────────────────────────
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

      // ─────────────────────────────────────────────────────────────────
      // 2. Study Access subscription signups ($47/mo)
      //    Fires once when the Stripe Checkout Session in subscription
      //    mode completes. Tags the customer so the Mailchimp drip with
      //    monthly PM templates kicks in.
      // ─────────────────────────────────────────────────────────────────
      if (event.type === 'checkout.session.completed') {
              const session = event.data.object as Stripe.Checkout.Session

            if (session.mode === 'subscription') {
                      const email = normalizeEmail(
                                session.customer_email || session.customer_details?.email || ''
                      )

                if (email) {
                            const tier = session.metadata?.tier || 'study-access'
                            const fullName = session.customer_details?.name
                            const { firstName, lastName } = splitFullName(fullName)

                      await upsertMailchimpCustomer({
                                  email,
                                  firstName,
                                  lastName,
                                  tags: [
                                              'customer',
                                              'subscriber',
                                              'active-subscriber',
                                              normalizeTag(tier),
                                              'pm-templates-monthly',
                                  ],
                            })
                  }
            }
      }

      // ─────────────────────────────────────────────────────────────────
      // 3. Subscription cancellations
      //    Deactivate the active-subscriber and pm-templates-monthly tags
      //    so the templates drip stops. Customer stays on the audience.
      // ─────────────────────────────────────────────────────────────────
      if (event.type === 'customer.subscription.deleted') {
              const subscription = event.data.object as Stripe.Subscription

            // Need to look up the customer email from the customer object
            try {
                      const customerId =
                                typeof subscription.customer === 'string'
                                          ? subscription.customer
                                          : subscription.customer.id
                      const customer = await stripe.customers.retrieve(customerId)

                if (!('deleted' in customer) || !customer.deleted) {
                            const email = (customer as Stripe.Customer).email
                            if (email) {
                                        await deactivateMailchimpTags({
                                                    email,
                                                    tags: ['active-subscriber', 'pm-templates-monthly'],
                                          })
                                  }
                  }
            } catch (lookupErr) {
                      console.warn('Could not look up canceled subscription customer:', lookupErr)
            }
      }

      return NextResponse.json({ received: true })
    } catch (error) {
          console.error('Stripe webhook error:', error)
          return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 400 })
    }
}

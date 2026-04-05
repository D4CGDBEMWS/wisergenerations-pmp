import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })
    : null

async function syncEnrollment(req: NextRequest, paymentIntent: Stripe.PaymentIntent) {
    const email = paymentIntent.receipt_email || paymentIntent.metadata.customer_email || ''
    if (!email) return

  const subscribeUrl = new URL('/api/subscribe', req.url)

  await fetch(subscribeUrl.toString(), {
        method: 'POST',
        headers: {
                'Content-Type': 'application/json',
        },
        body: JSON.stringify({
                email,
                firstName: paymentIntent.metadata.customer_first_name || '',
                lastName: paymentIntent.metadata.customer_last_name || '',
                source: 'checkout',
                tags: ['customer', paymentIntent.metadata.program_id || 'paid-enrollment'],
        }),
  })
}

export async function POST(req: NextRequest) {
    if (!stripe || !webhookSecret) {
          return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 500 })
    }

  const signature = req.headers.get('stripe-signature')
    if (!signature) {
          return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 })
    }

  try {
        const payload = await req.text()
        const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

      switch (event.type) {
        case 'payment_intent.succeeded': {
                  await syncEnrollment(req, event.data.object as Stripe.PaymentIntent)
                  break
        }
        case 'payment_intent.payment_failed': {
                  console.warn('Payment failed for intent:', (event.data.object as Stripe.PaymentIntent).id)
                  break
        }
        default:
                  break
      }

      return NextResponse.json({ received: true })
  } catch (error) {
        console.error('Stripe webhook error:', error)
        return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 })
  }
}

export async function GET() {
    return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}

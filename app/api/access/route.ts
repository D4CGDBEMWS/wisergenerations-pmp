import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkOrigin, rateLimit } from '@/lib/api-guard'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'access', { limit: 5, windowMs: 60_000 })
  if (rateBlock) return rateBlock

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    console.error('[/api/access] STRIPE_SECRET_KEY is not set')
    return NextResponse.json({ error: 'Payments are not configured. Please contact support.' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const email = (body.email || '').trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 })
    }
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-08-27.basil' })
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wisergenerations.com'
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'PMP Study Access Package', description: 'Lifetime access to PMP Exam Simulator and PMBOK Flashcards.' },
          unit_amount: 4700,
        },
        quantity: 1,
      }],
      success_url: siteUrl + '/access/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: siteUrl + '/access',
      metadata: { email, product: 'study-access' },
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[api/access] error:', err)
    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: 'Payment setup failed. Please try again.' }, { status: 502 })
    }
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 })
  }
}

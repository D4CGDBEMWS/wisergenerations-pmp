import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// POST /api/checkout-subscription
// Creates a Stripe Checkout Session in `subscription` mode for the
// $47/month Wiser Generations™ Study Access tier.
// Uses the price configured via NEXT_PUBLIC_STRIPE_STUDY_PRICE_ID.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const priceId = process.env.NEXT_PUBLIC_STRIPE_STUDY_PRICE_ID
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!priceId) {
    return NextResponse.json(
      { error: 'Study Access price is not configured (NEXT_PUBLIC_STRIPE_STUDY_PRICE_ID).' },
      { status: 500 }
    )
  }

  if (!secretKey) {
    return NextResponse.json(
      { error: 'Stripe secret key is not configured.' },
      { status: 500 }
    )
  }

  let body: { email?: string; firstName?: string; lastName?: string } = {}
  try {
    body = await req.json()
  } catch {
    // body is optional for this endpoint
  }

  const email = (body.email ?? '').trim()

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2025-08-27.basil' })
    const origin = req.headers.get('origin') || new URL(req.url).origin

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      allow_promotion_codes: true,
      success_url: `${origin}/checkout/success?tier=study&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=1`,
      subscription_data: {
        metadata: {
          tier: 'study-access',
          source: 'checkout-page',
          first_name: body.firstName ?? '',
          last_name: body.lastName ?? '',
        },
      },
      metadata: {
        tier: 'study-access',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[/api/checkout-subscription] Stripe error:', err)
    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: err.message }, { status: 402 })
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

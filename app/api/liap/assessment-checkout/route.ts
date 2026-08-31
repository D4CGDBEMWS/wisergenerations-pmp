import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { isEnabled } from '@/lib/flags'
import { LIAP_ASSESSMENT } from '@/lib/liap/product'

// ---------------------------------------------------------------------------
// Standalone Life Project-Ready™ Assessment checkout. $29.
//
// For the customer who wants the assessment WITHOUT the book. The book at
// $24.99 still includes assessment access; this is an alternative door to the
// same product, not a replacement for it and not an upsell on top of it.
//
// ── THE PRICE IS SERVER-SIDE, FULL STOP ────────────────────────────────────
//
// The amount comes from lib/liap/product.ts at request time. The request body
// is read for nothing at all — there is no amount, no coupon, no price id and
// no quantity a caller could supply, because the only safe way to make a
// client-supplied price impossible is to have no code that reads one.
//
// Like the book preorder, the line item is built from `price_data` inline, so
// no Stripe Product or Price object is required to exist. That is deliberate:
// it keeps the price in the same file the page displays it from, and it means
// this route is complete without any live Stripe configuration.
//
// ── AND IT GRANTS NOTHING ──────────────────────────────────────────────────
//
// This route starts a payment. It does not grant the entitlement — the Stripe
// webhook does, after Stripe reports the session paid, via
// fulfilStandaloneAssessment. A checkout session that is created and abandoned
// leaves no access behind.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 10, windowMs: 10 * 60_000 }

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Gated by the same flag as the rest of LIAP. Without this the assessment
  // would be purchasable before it is announced, by anyone who found the URL.
  if (!isEnabled('LIAP')) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'liap-assessment-checkout', RATE_LIMIT)
  if (rateBlock) return rateBlock

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    console.error('[liap/assessment-checkout] STRIPE_SECRET_KEY is not set')
    return NextResponse.json(
      { error: 'The assessment is not available right now. Please try again shortly.' },
      { status: 503 }
    )
  }

  try {
    const stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' })
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wisergenerations.com'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: LIAP_ASSESSMENT.currency,
            unit_amount: LIAP_ASSESSMENT.amount,
            product_data: {
              name: LIAP_ASSESSMENT.name,
              description:
                'Eight dimensions, forty questions, and a 30/60/90-day plan built from your own answers.',
            },
          },
        },
      ],
      // The webhook matches on this, and it is distinct from the book's marker
      // so a standalone buyer is never fulfilled — or tagged — as a book
      // purchaser.
      metadata: { product: LIAP_ASSESSMENT.metadataKey },
      payment_intent_data: { metadata: { product: LIAP_ASSESSMENT.metadataKey } },
      customer_creation: 'always',
      success_url: `${origin}/living-is-a-project/assessment-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/living-is-a-project`,
      allow_promotion_codes: true,
    })

    if (!session.url) {
      console.error('[liap/assessment-checkout] Stripe returned a session with no URL')
      return NextResponse.json({ error: 'Could not start checkout.' }, { status: 502 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[liap/assessment-checkout] Stripe error:', err)
    return NextResponse.json(
      { error: 'We could not start checkout. Please try again in a moment.' },
      { status: 502 }
    )
  }
}

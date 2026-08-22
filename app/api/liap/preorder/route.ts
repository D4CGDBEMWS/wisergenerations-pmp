import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { isEnabled } from '@/lib/flags'
import { LIAP_BOOK } from '@/lib/liap/product'

// ---------------------------------------------------------------------------
// Book preorder checkout. §4.
//
// A hosted Stripe Checkout Session rather than an embedded PaymentIntent. The
// PMP checkout embeds its own card form; this does not need to, and a hosted
// page brings Apple Pay, Google Pay and Link for free — which matters when §32
// expects most arrivals from Instagram and email on a phone.
//
// The amount comes from lib/liap/product.ts, the same constant the page
// displays. The PMP checkout once advertised one price and charged another
// precisely because those two numbers lived in different files.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 10, windowMs: 10 * 60_000 }

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Gated by the same flag as the pages. Without this the product would be
  // purchasable before it is announced, by anyone who found the endpoint.
  if (!isEnabled('LIAP')) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'liap-preorder', RATE_LIMIT)
  if (rateBlock) return rateBlock

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    console.error('[liap/preorder] STRIPE_SECRET_KEY is not set')
    return NextResponse.json(
      { error: 'Preorders are not available right now. Please try again shortly.' },
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
            currency: LIAP_BOOK.currency,
            unit_amount: LIAP_BOOK.amount,
            product_data: {
              name: `${LIAP_BOOK.name} — Preorder`,
              description:
                'Preorder the hardcover, publishing October 2026, and unlock the Life Project-Ready™ Assessment immediately.',
            },
          },
        },
      ],
      // The webhook matches on this. It is the ONLY thing that distinguishes a
      // LIAP preorder from a PMP purchase, so it is not optional and not
      // shared with any other product's marker.
      metadata: { product: LIAP_BOOK.metadataKey },
      payment_intent_data: { metadata: { product: LIAP_BOOK.metadataKey } },
      // Collected here so the customer never types it twice — §24 asks that
      // the results email reuse the checkout address rather than re-prompting.
      customer_creation: 'always',
      success_url: `${origin}/living-is-a-project/preorder-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/living-is-a-project/book`,
      allow_promotion_codes: true,
    })

    if (!session.url) {
      console.error('[liap/preorder] Stripe returned a session with no URL')
      return NextResponse.json({ error: 'Could not start checkout.' }, { status: 502 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[liap/preorder] Stripe error:', err)
    return NextResponse.json(
      { error: 'We could not start checkout. Please try again in a moment.' },
      { status: 502 }
    )
  }
}

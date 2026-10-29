import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { isEnabled } from '@/lib/flags'
import { LIAP_RETREAT, retreatPaymentTerms } from '@/lib/liap/product'
import { isWellFormedCode } from '@/lib/liap/partners'

// ---------------------------------------------------------------------------
// Living the Journey — 3-Day Retreat checkout.
//
// Same shape as the book pre-buy: a hosted Stripe Checkout Session whose price
// comes from lib/liap/product.ts, never from the browser. Checkout takes the
// $500-per-seat deposit; the balance is invoiced by the owner in Stripe before
// the retreat. Seats are per person, adjustable on Stripe's page up to maxSeats.
//
// Two switches: LIAP (the section exists) and LIAP_RETREAT (the Retreat is on
// sale). Either off and this route does not exist.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 10, windowMs: 10 * 60_000 }

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isEnabled('LIAP') || !isEnabled('LIAP_RETREAT')) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'liap-retreat', RATE_LIMIT)
  if (rateBlock) return rateBlock

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    console.error('[liap/retreat] STRIPE_SECRET_KEY is not set')
    return NextResponse.json(
      { error: 'Retreat registration is not available right now. Please try again shortly.' },
      { status: 503 }
    )
  }

  // Partner code, shape-checked only — as on the book pre-buy, it can credit a
  // partner and do nothing else.
  let referral: string | null = null
  try {
    const body = await req.json().catch(() => null)
    const candidate = body && typeof body === 'object' ? (body as { p?: unknown }).p : null
    if (typeof candidate === 'string' && isWellFormedCode(candidate.trim())) {
      referral = candidate.trim()
    }
  } catch {
    // A malformed body is not a reason to refuse a registration.
  }

  try {
    const stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' })
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wisergenerations.com'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          adjustable_quantity: { enabled: true, minimum: 1, maximum: LIAP_RETREAT.maxSeats },
          price_data: {
            currency: LIAP_RETREAT.currency,
            // The deposit, not the full price: the balance is invoiced later.
            unit_amount: LIAP_RETREAT.depositAmount,
            product_data: {
              name: `${LIAP_RETREAT.name} — Deposit`,
              description: `${LIAP_RETREAT.when} · ${LIAP_RETREAT.where}. Deposit per person; full price ${LIAP_RETREAT.priceLabel}.`,
            },
          },
        },
      ],
      custom_text: {
        submit: { message: `${retreatPaymentTerms()} ${LIAP_RETREAT.cancellation}` },
      },
      metadata: {
        product: LIAP_RETREAT.metadataKey,
        payment: 'deposit',
        ...(referral ? { referral } : {}),
      },
      payment_intent_data: { metadata: { product: LIAP_RETREAT.metadataKey, payment: 'deposit' } },
      customer_creation: 'always',
      phone_number_collection: { enabled: true },
      success_url: `${origin}/living-is-a-project/retreat-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/living-is-a-project/author#next-steps`,
      allow_promotion_codes: true,
    })

    if (!session.url) {
      console.error('[liap/retreat] Stripe returned a session with no URL')
      return NextResponse.json({ error: 'Could not start checkout.' }, { status: 502 })
    }
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[liap/retreat] Stripe error:', err)
    return NextResponse.json(
      { error: 'We could not start checkout. Please try again in a moment.' },
      { status: 502 }
    )
  }
}

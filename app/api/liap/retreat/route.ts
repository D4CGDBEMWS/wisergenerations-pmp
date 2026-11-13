import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { isEnabled } from '@/lib/flags'
import { LIAP_RETREAT, retreatPaymentTerms } from '@/lib/liap/product'
import { isWellFormedCode } from '@/lib/liap/partners'
import { countRetreatSeats, seatsRemaining, HOLD_MINUTES } from '@/lib/liap/retreat-seats'

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

    // First come, first served: refuse once all 12 seats are paid or held,
    // and never let one buyer take more than what is left.
    let remaining: number
    try {
      remaining = seatsRemaining(await countRetreatSeats(stripe))
    } catch (err) {
      // Fail closed. Better a retry than a 13th seat.
      console.error('[liap/retreat] could not count seats', err)
      return NextResponse.json(
        { error: 'We could not check seat availability. Please try again in a moment.' },
        { status: 503 }
      )
    }
    if (remaining <= 0) {
      return NextResponse.json(
        {
          error: `${LIAP_RETREAT.name} is full. Contact us to join the waiting list.`,
          full: true,
        },
        { status: 409 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
            maximum: Math.min(LIAP_RETREAT.maxSeats, remaining),
          },
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
      // Releases held seats if the buyer walks away from the payment page.
      expires_at: Math.floor(Date.now() / 1000) + HOLD_MINUTES * 60,
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

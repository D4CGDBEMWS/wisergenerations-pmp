import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { isEnabled } from '@/lib/flags'
import { isWellFormedCode } from '@/lib/liap/partners'
import { WORKSHOP, findSession, sessionLabel, sessionOpen } from '@/lib/liap/workshop'

// ---------------------------------------------------------------------------
// Workshop checkout. Owner ruling 2026-11-04: $49, non-refundable, one session
// per registration. Price and session come from lib/liap/workshop.ts, never the
// browser; a closed session is refused here even if the page were bypassed.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const RATE_LIMIT = { limit: 10, windowMs: 10 * 60_000 }

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isEnabled('LIAP') || !isEnabled('LIAP_WORKSHOP')) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock
  const rateBlock = await rateLimit(req, 'liap-workshop', RATE_LIMIT)
  if (rateBlock) return rateBlock

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const session = findSession(body?.session)
  if (!session) return NextResponse.json({ error: 'Please choose a session.' }, { status: 400 })
  if (!sessionOpen(session)) {
    return NextResponse.json({ error: 'Registration for that session has closed. Please choose another.' }, { status: 409 })
  }
  const referral = typeof body?.p === 'string' && isWellFormedCode(body.p.trim()) ? body.p.trim() : null

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Registration is not available right now.' }, { status: 503 })

  try {
    const stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' })
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wisergenerations.com'
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: WORKSHOP.currency,
            unit_amount: WORKSHOP.priceCents,
            product_data: {
              name: WORKSHOP.name,
              description: `${sessionLabel(session)}. Live on Zoom, ${WORKSHOP.durationMinutes} minutes. ${WORKSHOP.terms}`,
            },
          },
        },
      ],
      metadata: { product: WORKSHOP.metadataKey, session: session.key, ...(referral ? { referral } : {}) },
      payment_intent_data: { metadata: { product: WORKSHOP.metadataKey, session: session.key } },
      customer_creation: 'always',
      custom_text: { submit: { message: WORKSHOP.terms } },
      success_url: `${origin}/living-is-a-project/workshop/registered?session=${session.key}`,
      cancel_url: `${origin}/living-is-a-project/workshop`,
      allow_promotion_codes: true,
    })
    if (!checkout.url) return NextResponse.json({ error: 'Could not start checkout.' }, { status: 502 })
    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    console.error('[liap/workshop] Stripe error:', err)
    return NextResponse.json({ error: 'We could not start checkout. Please try again in a moment.' }, { status: 502 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { isEnabled } from '@/lib/flags'
import { LIAP_BOOK } from '@/lib/liap/product'
import { BUNDLE_METADATA_KEY, bundleCopies, bundleStatus, findBundle } from '@/lib/liap/bundles'
import { isFreeShippingCode, normalizeCode } from '@/lib/liap/promo'
import { isWellFormedCode } from '@/lib/liap/partners'
import { publicationDate } from '@/lib/liap/launch'

// ---------------------------------------------------------------------------
// Bundle checkout. Owner ruling 2026-10-30. Same shape as the single-book
// preorder: price and contents come from lib/liap/bundles.ts, never from the
// browser; a bundle outside its sale window is refused here even if the page
// were bypassed. Shipping: one flat rate per order, US only; the free-shipping
// code still applies. Stripe promotion codes are off so a sale price cannot
// be stacked with another discount.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 10, windowMs: 10 * 60_000 }

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isEnabled('LIAP') || !isEnabled('LIAP_BUNDLES')) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock
  const rateBlock = await rateLimit(req, 'liap-bundle', RATE_LIMIT)
  if (rateBlock) return rateBlock

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const bundle = findBundle(body?.bundle)
  if (!bundle) return NextResponse.json({ error: 'That bundle was not found.' }, { status: 404 })

  const status = bundleStatus(bundle)
  if (status !== 'active') {
    return NextResponse.json(
      { error: status === 'upcoming' ? 'This bundle is not on sale yet.' : 'This sale has ended.' },
      { status: 409 }
    )
  }

  const referral =
    typeof body?.p === 'string' && isWellFormedCode(body.p.trim()) ? body.p.trim() : null
  const shipCode = body?.ship
  const typedShipCode = typeof shipCode === 'string' && shipCode.trim() !== ''
  const freeShipping = typedShipCode && isFreeShippingCode(shipCode)
  if (typedShipCode && !freeShipping) {
    return NextResponse.json(
      { error: 'That shipping code is not valid. Check the spelling, or leave it blank to continue.' },
      { status: 400 }
    )
  }

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    console.error('[liap/bundle] STRIPE_SECRET_KEY is not set')
    return NextResponse.json({ error: 'Checkout is not available right now.' }, { status: 503 })
  }

  try {
    const stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' })
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wisergenerations.com'
    const copies = bundleCopies(bundle)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: LIAP_BOOK.currency,
            unit_amount: bundle.price,
            product_data: {
              name: bundle.name,
              description: `${copies} hardcover copies of ${LIAP_BOOK.name}, publishing ${publicationDate()}.`,
            },
          },
        },
      ],
      metadata: {
        product: BUNDLE_METADATA_KEY,
        bundle: bundle.slug,
        copies: String(copies),
        ...(referral ? { referral } : {}),
        ...(freeShipping ? { free_shipping_code: normalizeCode(shipCode)! } : {}),
      },
      payment_intent_data: { metadata: { product: BUNDLE_METADATA_KEY, bundle: bundle.slug } },
      customer_creation: 'always',
      shipping_address_collection: { allowed_countries: [...LIAP_BOOK.shipping.countries] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: freeShipping ? 0 : LIAP_BOOK.shipping.amount, currency: LIAP_BOOK.currency },
            display_name: freeShipping
              ? `Free shipping (code ${normalizeCode(shipCode)}) — USPS Media Mail, mails after publication`
              : LIAP_BOOK.shipping.displayName,
          },
        },
      ],
      success_url: `${origin}/living-is-a-project/preorder-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/living-is-a-project/bundles`,
      allow_promotion_codes: false,
    })
    if (!session.url) return NextResponse.json({ error: 'Could not start checkout.' }, { status: 502 })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[liap/bundle] Stripe error:', err)
    return NextResponse.json(
      { error: 'We could not start checkout. Please try again in a moment.' },
      { status: 502 }
    )
  }
}

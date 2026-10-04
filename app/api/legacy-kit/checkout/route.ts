import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { isEnabled } from '@/lib/flags'
import { consentProblem, type KitCheckoutBody } from '@/lib/legacy-kit/checkout'
import {
  LEGACY_KIT_AMOUNT,
  LEGACY_KIT_CONSENT_VERSION,
  LEGACY_KIT_CURRENCY,
  LEGACY_KIT_METADATA_KEY,
  LEGACY_KIT_NAME_TM,
} from '@/lib/legacy-kit/product'

// ---------------------------------------------------------------------------
// Legacy Kit checkout: Stripe's hosted page, one-time $30.
//
// The two required boxes are on our page, because Stripe's hosted page can't
// show custom checkboxes. The browser disables Buy until both are ticked, but
// that is a convenience: THIS route is the check. It refuses unless both are
// true and the buyer saw the current wording, then writes what they agreed to
// into the session's metadata so the webhook can store it with the purchase.
//
// Collects email and billing address only (Stripe needs the address for tax).
//
// ── NOT LIVE BY ACCIDENT ───────────────────────────────────────────────────
//
// The whole section is behind FEATURE_LEGACY_KIT. On top of that this route
// refuses a live Stripe key unless LEGACY_KIT_LIVE=true, so turning the page
// on for review cannot take real money.
//
// ── SETTINGS, ALL OPTIONAL, ALL DOCUMENTED IN .env.example ─────────────────
//
//   LEGACY_KIT_AUTOMATIC_TAX=false     turn Stripe Tax off (default on)
//   STRIPE_LEGACY_KIT_TAX_CODE         the product tax code your CPA picks;
//                                      unset uses the account's default
//   LEGACY_KIT_STRIPE_TERMS_CHECKBOX=true  Stripe's own "I agree to the
//                                      Terms" box; needs a Terms of Service
//                                      URL in Stripe → Settings → Public details
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 10, windowMs: 10 * 60_000 }

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isEnabled('LEGACY_KIT')) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'legacy-kit-checkout', RATE_LIMIT)
  if (rateBlock) return rateBlock

  const body = (await req.json().catch(() => null)) as KitCheckoutBody | null
  const problem = consentProblem(body)
  if (problem) return NextResponse.json({ error: problem }, { status: 400 })

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    console.error('[legacy-kit/checkout] STRIPE_SECRET_KEY is not set')
    return NextResponse.json({ error: 'Checkout is not available right now.' }, { status: 503 })
  }
  if (secret.startsWith('sk_live_') && process.env.LEGACY_KIT_LIVE !== 'true') {
    console.error('[legacy-kit/checkout] refusing a live key: LEGACY_KIT_LIVE is not "true"')
    return NextResponse.json({ error: 'Checkout is not open yet.' }, { status: 503 })
  }

  const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wisergenerations.com').replace(/\/$/, '')
  const taxCode = process.env.STRIPE_LEGACY_KIT_TAX_CODE
  const automaticTax = process.env.LEGACY_KIT_AUTOMATIC_TAX !== 'false'
  const stripeTermsBox = process.env.LEGACY_KIT_STRIPE_TERMS_CHECKBOX === 'true'
  const consentAt = new Date().toISOString()

  try {
    const stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' })
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: LEGACY_KIT_CURRENCY,
            unit_amount: LEGACY_KIT_AMOUNT,
            // Price shown is before tax; tax is added at checkout where owed.
            tax_behavior: 'exclusive',
            product_data: {
              name: LEGACY_KIT_NAME_TM,
              description: 'Fillable PDF workbook for one household, delivered by email right after payment.',
              ...(taxCode ? { tax_code: taxCode } : {}),
            },
          },
        },
      ],
      automatic_tax: { enabled: automaticTax },
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      // No Stripe customer record and no phone, shipping or name fields:
      // the brief is email and billing address only.
      customer_creation: 'if_required',
      ...(stripeTermsBox ? { consent_collection: { terms_of_service: 'required' as const } } : {}),
      custom_text: {
        submit: {
          message:
            'Your download starts immediately after payment. Educational only — not legal, tax or financial advice.',
        },
        ...(stripeTermsBox
          ? {
              terms_of_service_acceptance: {
                message: `I agree to the [Terms of Sale](${origin}/legacy-kit/terms-of-sale).`,
              },
            }
          : {}),
      },
      metadata: {
        product: LEGACY_KIT_METADATA_KEY,
        consent_version: LEGACY_KIT_CONSENT_VERSION,
        consent_at: consentAt,
        consent_notices: 'true',
        consent_waiver: 'true',
      },
      // The marker also rides on the payment, so the webhook's PMP branch can
      // recognise a kit payment and leave it alone, and a refund can find it.
      payment_intent_data: { metadata: { product: LEGACY_KIT_METADATA_KEY } },
      success_url: `${origin}/legacy-kit/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/legacy-kit#buy`,
    })

    if (!session.url) {
      console.error('[legacy-kit/checkout] Stripe returned a session with no URL')
      return NextResponse.json({ error: 'Could not start checkout.' }, { status: 502 })
    }
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[legacy-kit/checkout] Stripe error:', err)
    return NextResponse.json(
      { error: 'We could not start checkout. Please try again in a moment.' },
      { status: 502 }
    )
  }
}

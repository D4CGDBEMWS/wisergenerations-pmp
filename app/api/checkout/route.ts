import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkOrigin, rateLimit } from '@/lib/api-guard'

// ---------------------------------------------------------------------------
// Program definitions — server is the canonical source of truth for prices.
// Never trust the client to send the amount.
// ---------------------------------------------------------------------------
const PROGRAMS = {
  'pmp-prep': {
    name: 'PMP® Certification Prep',
    amount: 149700, // $1,497.00 in cents
    description: 'PMP® Certification Prep — Wiser Generations Int’l™',
  },
  'capm-launcher': {
    name: 'CAPM® Career Launcher',
    amount: 99700, // $997.00 in cents
    description: 'CAPM® Career Launcher — Wiser Generations Int’l™',
  },
  'veterans-pathway': {
    name: 'Veterans PM Pathway',
    amount: 79700, // $797.00 in cents
    description: 'Veterans PM Pathway — Wiser Generations Int’l™',
  },
} as const

type ProgramId = keyof typeof PROGRAMS

// ---------------------------------------------------------------------------
// POST /api/checkout
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // ── Origin & rate-limit guards ────────────────────────────────────────────
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'checkout', { limit: 5, windowMs: 60_000 })
  if (rateBlock) return rateBlock

  // ── Validate idempotency key ───────────────────────────────────────────────
  // SECURITY: the client-supplied key is used only as a *suffix* and is
  // namespaced by a server-generated UUID, so a malicious caller cannot
  // collide with another caller's PaymentIntent by replaying the same key.
  const clientKey = req.headers.get('x-idempotency-key')
  if (!clientKey || clientKey.length > 128) {
    return NextResponse.json({ error: 'Missing idempotency key.' }, { status: 400 })
  }
  const idempotencyKey = `${randomUUID()}-${clientKey}`

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: {
    name?: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    programId?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { name, email, phone, programId } = body

  // ── Validate required fields ───────────────────────────────────────────────
  if (!name || !email || !phone || !programId) {
    return NextResponse.json(
      { error: 'name, email, phone, and programId are required.' },
      { status: 400 }
    )
  }

  // ── Validate email ─────────────────────────────────────────────────────────
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  // ── Validate program ───────────────────────────────────────────────────────
  if (!Object.keys(PROGRAMS).includes(programId)) {
    return NextResponse.json({ error: 'Invalid program selected.' }, { status: 400 })
  }

  const program = PROGRAMS[programId as ProgramId]

  // Fail fast (and clearly) when the secret key is missing instead of letting
  // the Stripe SDK throw an opaque error deeper in the call stack.
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    console.error('[/api/checkout] STRIPE_SECRET_KEY is not set')
    return NextResponse.json(
      { error: 'Payments are not configured. Please contact support.' },
      { status: 500 }
    )
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    })

    // ── Find or create Stripe Customer ─────────────────────────────────────
    // Reusing an existing customer keeps the Stripe dashboard clean and
    // allows payment method reuse in the future.
    //
    // SECURITY: this endpoint is unauthenticated, so we must NOT trust the
    // submitted name/phone to overwrite an existing customer record — that
    // would let any attacker rewrite arbitrary Stripe customer details just
    // by knowing the email. We only set name/phone when CREATING a new
    // customer; for an existing one we reuse it as-is and pass the
    // submitted values via PaymentIntent metadata only.
    const existingCustomers = await stripe.customers.list({ email, limit: 1 })

    const customer: Stripe.Customer =
      existingCustomers.data.length > 0
        ? existingCustomers.data[0]
        : await stripe.customers.create({ name, email, phone })

    // ── Create PaymentIntent ───────────────────────────────────────────────
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: program.amount,
        currency: 'usd',
        customer: customer.id,
        receipt_email: email,
        description: program.description,
        metadata: {
          program_id: programId,
          program_name: program.name,
          customer_email: email,
          customer_first_name: body.firstName ?? '',
          customer_last_name: body.lastName ?? '',
          customer_phone: phone,
        },
        // Allows card, Apple Pay, Google Pay automatically via Stripe
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey }
    )

    return NextResponse.json({ client_secret: paymentIntent.client_secret })
  } catch (err) {
    // Always log the real error server-side for debugging.
    console.error('[/api/checkout] Stripe error:', err)

    // Never reflect raw Stripe error messages to the client. They can leak
    // account-state details (rate-limit info, restricted-key warnings,
    // internal IDs). Map known categories to safe, user-facing messages.
    if (err instanceof Stripe.errors.StripeCardError) {
      return NextResponse.json(
        { error: 'Your card was declined. Please try a different payment method.' },
        { status: 402 }
      )
    }

    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: 'We could not initialise your payment. Please try again in a moment.' },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

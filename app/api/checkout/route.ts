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

    // ── Create Stripe Customer ─────────────────────────────────────────────
    // We deliberately do NOT call stripe.customers.list({ email }) before
    // creating, even though that would let us reuse an existing customer
    // record across repeat purchases. The reason is privacy:
    //
    // The conditional "list-then-create" pattern produces a measurable
    // timing difference between "this email exists in our Stripe account"
    // (one extra API call) and "this email is new" (two API calls). That
    // difference is observable from the outside and turns the unauthenticated
    // checkout endpoint into an enumeration oracle — anyone could probe
    // whether a given email has ever bought from us.
    //
    // Always creating a fresh customer eliminates the oracle. The trade-off
    // is that repeat purchasers will produce duplicate Customer rows in the
    // Stripe dashboard, which is cosmetic only — the dashboard already
    // groups by email when filtering, and the webhook still finds the right
    // customer via paymentIntent.customer.
    const customer = await stripe.customers.create({ name, email, phone })

    // ── Create PaymentIntent ───────────────────────────────────────────────
    // SECURITY: PaymentIntent.metadata is for non-sensitive identifiers only.
    // It surfaces in every webhook event for this PI's lifecycle, the Stripe
    // dashboard search/filter UI, and all CSV exports. We do NOT put the
    // customer's email, phone, or name here — those live on the Customer
    // object (created above) and the webhook reads them from there via
    // stripe.customers.retrieve(paymentIntent.customer).
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

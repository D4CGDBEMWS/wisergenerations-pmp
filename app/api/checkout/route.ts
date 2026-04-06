import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// ---------------------------------------------------------------------------
// Stripe server-side client
// ---------------------------------------------------------------------------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

// ---------------------------------------------------------------------------
// Program definitions — server is the canonical source of truth for prices.
// Never trust the client to send the amount.
// ---------------------------------------------------------------------------
const PROGRAMS = {
  'pmp-prep': {
    name: 'PMP® Certification Prep',
    amount: 149700, // $1,497.00 in cents
    description: 'PMP® Certification Prep — Wiser Generations™',
  },
  'capm-launcher': {
    name: 'CAPM® Career Launcher',
    amount: 99700, // $997.00 in cents
    description: 'CAPM® Career Launcher — Wiser Generations™',
  },
  'veterans-pathway': {
    name: 'Veterans PM Pathway',
    amount: 79700, // $797.00 in cents
    description: 'Veterans PM Pathway — Wiser Generations™',
  },
} as const

type ProgramId = keyof typeof PROGRAMS

// ---------------------------------------------------------------------------
// POST /api/checkout
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // ── Validate idempotency key ───────────────────────────────────────────────
  const idempotencyKey = req.headers.get('x-idempotency-key')
  if (!idempotencyKey) {
    return NextResponse.json({ error: 'Missing idempotency key.' }, { status: 400 })
  }

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

  try {
    // ── Find or create Stripe Customer ─────────────────────────────────────
    // Reusing an existing customer keeps the Stripe dashboard clean and
    // allows payment method reuse in the future.
    const existingCustomers = await stripe.customers.list({ email, limit: 1 })

    let customer: Stripe.Customer

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
      // Update name/phone in case they changed
      customer = await stripe.customers.update(customer.id, { name, phone })
    } else {
      customer = await stripe.customers.create({ name, email, phone })
    }

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
    console.error('[/api/checkout] Stripe error:', err)

    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: err.message || 'A payment error occurred.' },
        { status: 402 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

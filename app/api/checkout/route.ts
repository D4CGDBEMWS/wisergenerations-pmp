import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { verifyTurnstile } from '@/lib/turnstile'

// ---------------------------------------------------------------------------
// Program definitions — server is the canonical source of truth for prices.
// Never trust the client to send the amount.
// ---------------------------------------------------------------------------
const PROGRAMS = {
  'pmp-prep': {
    name: 'PMP\u00ae Certification Prep',
    amount: 149700,
    description: "PMP\u00ae Certification Prep \u2014 Wiser Generations Int\u2019l\u2122",
  },
  'capm-launcher': {
    name: 'CAPM\u00ae Career Launcher',
    amount: 99700,
    description: "CAPM\u00ae Career Launcher \u2014 Wiser Generations Int\u2019l\u2122",
  },
  'veterans-pathway': {
    name: 'Veterans PM Pathway',
    amount: 79700,
    description: "Veterans PM Pathway \u2014 Wiser Generations Int\u2019l\u2122",
  },
} as const

type ProgramId = keyof typeof PROGRAMS

// ---------------------------------------------------------------------------
// POST /api/checkout
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // Origin & rate-limit guards
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'checkout', { limit: 5, windowMs: 60_000 })
  if (rateBlock) return rateBlock

  // Validate idempotency key
  const clientKey = req.headers.get('x-idempotency-key')
  if (!clientKey || clientKey.length > 128) {
    return NextResponse.json({ error: 'Missing idempotency key.' }, { status: 400 })
  }
  const idempotencyKey = `${randomUUID()}-${clientKey}`

  // Parse body
  let body: {
    name?: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    programId?: string
    turnstileToken?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // ---------------------------------------------------------------------------
  // Turnstile CAPTCHA verification
  // ---------------------------------------------------------------------------
  const turnstileResult = await verifyTurnstile(body.turnstileToken, req)
  if (!turnstileResult.success) {
    return NextResponse.json(
      { error: 'Security check failed. Please refresh and try again.' },
      { status: 400 }
    )
  }

  const { name, email, phone, programId } = body

  // Validate required fields
  if (!name || !email || !phone || !programId) {
    return NextResponse.json(
      { error: 'name, email, phone, and programId are required.' },
      { status: 400 }
    )
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  // Validate program
  if (!Object.keys(PROGRAMS).includes(programId)) {
    return NextResponse.json({ error: 'Invalid program selected.' }, { status: 400 })
  }

  const program = PROGRAMS[programId as ProgramId]

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

    // Create Stripe Customer (always new — avoids email enumeration oracle)
    const customer = await stripe.customers.create({ name, email, phone })

    // Create PaymentIntent
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
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey }
    )

    return NextResponse.json({ client_secret: paymentIntent.client_secret })
  } catch (err) {
    console.error('[/api/checkout] Stripe error:', err)

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

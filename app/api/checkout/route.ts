import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

const PROGRAMS = {
    'pmp-prep': {
          name: 'PMP® Certification Prep',
          price: 1497,
    },
    'capm-launcher': {
          name: 'CAPM® Career Launcher',
          price: 997,
    },
    'veterans-pathway': {
          name: 'Veterans PM Pathway',
          price: 797,
    },
} as const

type ProgramId = keyof typeof PROGRAMS

type CheckoutBody = {
    programId?: string
    customer?: {
      firstName?: string
      lastName?: string
      email?: string
      phone?: string
    }
}

function isProgramId(value: string): value is ProgramId {
    return value in PROGRAMS
}

function normalizeEmail(value: string) {
    return value.trim().toLowerCase()
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPhone(value: string) {
    return value.replace(/\D/g, '').length >= 10
}

export async function POST(req: NextRequest) {
    try {
          const stripeSecretKey = process.env.STRIPE_SECRET_KEY

      if (!stripeSecretKey) {
              return NextResponse.json(
                { error: 'Payment configuration error. Please contact support.' },
                { status: 500 }
                      )
      }

      const body = (await req.json()) as CheckoutBody
          const programId = body.programId?.trim() || ''

      if (!isProgramId(programId)) {
              return NextResponse.json({ error: 'Invalid program selected.' }, { status: 400 })
      }

      const firstName = body.customer?.firstName?.trim() || ''
          const lastName = body.customer?.lastName?.trim() || ''
          const email = normalizeEmail(body.customer?.email || '')
          const phone = body.customer?.phone?.trim() || ''

      if (!firstName || !lastName || !isValidEmail(email)) {
              return NextResponse.json(
                { error: 'Customer information is incomplete or invalid.' },
                { status: 400 }
                      )
      }

      if (!isValidPhone(phone)) {
              return NextResponse.json({ error: 'A valid phone number is required.' }, { status: 400 })
      }

      const program = PROGRAMS[programId]
          const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })
          const idempotencyKey = req.headers.get('x-idempotency-key') || undefined

      const paymentIntent = await stripe.paymentIntents.create(
        {
                  amount: program.price * 100,
                  currency: 'usd',
                  payment_method_types: ['card'],
                  receipt_email: email,
                  description: `Wiser Generations — ${program.name}`,
                  metadata: {
                              source: 'checkout',
                              program_id: programId,
                              program_name: program.name,
                              customer_first_name: firstName,
                              customer_last_name: lastName,
                              customer_name: `${firstName} ${lastName}`.trim(),
                              customer_email: email,
                              customer_phone: phone,
                  },
        },
              idempotencyKey ? { idempotencyKey } : undefined
            )

      if (!paymentIntent.client_secret) {
              return NextResponse.json(
                { error: 'Unable to initialize payment. Please try again.' },
                { status: 500 }
                      )
      }

      return NextResponse.json({
              success: true,
              clientSecret: paymentIntent.client_secret,
              paymentIntentId: paymentIntent.id,
              amount: program.price,
              programName: program.name,
      })
    } catch (error) {
          console.error('Checkout API error:', error)

      if (error instanceof Stripe.errors.StripeError) {
              return NextResponse.json(
                { error: error.message || 'Unable to process payment.' },
                { status: 400 }
                      )
      }

      return NextResponse.json(
        { error: 'Unexpected server error. Please try again.' },
        { status: 500 }
            )
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}

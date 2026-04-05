import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

const PROGRAMS = {
          'pmp-prep': { name: 'PMP® Certification Prep', price: 1497 },
          'capm-launcher': { name: 'CAPM® Career Launcher', price: 997 },
          'veterans-pathway': { name: 'Veterans PM Pathway', price: 797 },
} as const

type CheckoutBody = {
          programId?: string
          customer?: {
            firstName?: string
            lastName?: string
            email?: string
            phone?: string
          }
}

function getEnv(name: string) {
          const value = process.env[name]

  if (!value) {
              throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function jsonError(error: string, status = 400) {
          return NextResponse.json({ error }, { status })
}

function normalizeEmail(value: string) {
          return value.trim().toLowerCase()
}

export async function POST(request: NextRequest) {
          try {
                      const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()

            if (!idempotencyKey) {
                          return jsonError('Missing idempotency key.')
            }

            const stripe = new Stripe(getEnv('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' })
                      const body = (await request.json()) as CheckoutBody
                      const programId = String(body.programId ?? '') as keyof typeof PROGRAMS
                      const program = PROGRAMS[programId]

            if (!program) {
                          return jsonError('Invalid program selected.')
            }

            const firstName = String(body.customer?.firstName ?? '').trim()
                      const lastName = String(body.customer?.lastName ?? '').trim()
                      const email = normalizeEmail(String(body.customer?.email ?? ''))
                      const phone = String(body.customer?.phone ?? '').trim()

            if (!firstName || !lastName) {
                          return jsonError('Customer name is required.')
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                          return jsonError('A valid email is required.')
            }

            if (phone.replace(/\D/g, '').length < 10) {
                          return jsonError('A valid phone number is required.')
            }

            const paymentIntent = await stripe.paymentIntents.create(
                    {
                                    amount: program.price * 100,
                                    currency: 'usd',
                                    automatic_payment_methods: { enabled: true },
                                    receipt_email: email,
                                    description: `Wiser Generations — ${program.name}`,
                                    metadata: {
                                                      program_id: programId,
                                                      program_name: program.name,
                                                      program_price: String(program.price),
                                                      customer_first_name: firstName,
                                                      customer_last_name: lastName,
                                                      customer_name: `${firstName} ${lastName}`.trim(),
                                                      customer_email: email,
                                                      customer_phone: phone,
                                                      source: 'checkout',
                                    },
                    },
                    { idempotencyKey },
                        )

            if (!paymentIntent.client_secret) {
                          return jsonError('Unable to initialize payment.', 500)
            }

            return NextResponse.json({ client_secret: paymentIntent.client_secret })
          } catch (error) {
                      console.error('Checkout API error:', error)
                      return jsonError('Unable to create payment intent.', 500)
          }
}

export async function GET() {
          return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}

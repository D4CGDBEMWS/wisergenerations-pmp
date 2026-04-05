import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

const PROGRAMS = {
        'pmp-prep': { name: 'PMP® Certification Prep', price: 1497 },
        'capm-launcher': { name: 'CAPM® Career Launcher', price: 997 },
        'veterans-pathway': { name: 'Veterans PM Pathway', price: 797 },
} as const

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })
        : null

function jsonError(error: string, status = 400) {
        return NextResponse.json({ error }, { status })
}

export async function POST(req: NextRequest) {
        try {
                    if (!stripe) {
                                    return jsonError('Payment configuration error. Please contact support.', 500)
                    }

            const body = (await req.json()) as {
                            programId?: string
                            customer?: {
                                firstName?: string
                                lastName?: string
                                email?: string
                                phone?: string
                            }
            }

            const programId = body.programId as keyof typeof PROGRAMS
                    const program = PROGRAMS[programId]

            if (!program) {
                            return jsonError('Invalid program selected.')
            }

            const firstName = String(body.customer?.firstName ?? '').trim()
                    const lastName = String(body.customer?.lastName ?? '').trim()
                    const email = String(body.customer?.email ?? '').trim().toLowerCase()
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
                                    payment_method_types: ['card'],
                                    receipt_email: email,
                                    description: `Wiser Generations — ${program.name}`,
                                    metadata: {
                                                            program_id: programId,
                                                            program_name: program.name,
                                                            customer_first_name: firstName,
                                                            customer_last_name: lastName,
                                                            customer_name: `${firstName} ${lastName}`.trim(),
                                                            customer_email: email,
                                                            customer_phone: phone,
                                                            source: 'checkout',
                                    },
                },
                {
                                    idempotencyKey: req.headers.get('x-idempotency-key') ?? undefined,
                }
                        )

            if (!paymentIntent.client_secret) {
                            return jsonError('Unable to initialize payment.', 500)
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
                    return jsonError('Unable to create payment intent.', 500)
        }
}

export async function GET() {
        return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}

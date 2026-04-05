'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null

const PROGRAMS = {
    'pmp-prep': {
          id: 'pmp-prep',
          name: 'PMP® Certification Prep',
          price: 1497,
          description: 'Our flagship PMP® prep experience with live instruction, accountability, and application support.',
    },
    'capm-launcher': {
          id: 'capm-launcher',
          name: 'CAPM® Career Launcher',
          price: 997,
          description: 'Foundational project management training for early-career professionals and career changers.',
    },
    'veterans-pathway': {
          id: 'veterans-pathway',
          name: 'Veterans PM Pathway',
          price: 797,
          description: 'A mission-aligned transition pathway designed for veterans moving into project management roles.',
    },
} as const

type ProgramId = keyof typeof PROGRAMS

type CheckoutFormState = {
    firstName: string
    lastName: string
    email: string
    phone: string
    programId: ProgramId
}

function formatPrice(price: number) {
    return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
    }).format(price)
}

function createIdempotencyKey() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
          return crypto.randomUUID()
    }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function PaymentStep({
    customerEmail,
    programName,
}: {
    customerEmail: string
    programName: string
}) {
    const stripe = useStripe()
    const elements = useElements()
    const [errorMessage, setErrorMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

      if (!stripe || !elements) {
              return
      }

      setIsSubmitting(true)
        setErrorMessage('')

      const result = await stripe.confirmPayment({
              elements,
              confirmParams: {
                        receipt_email: customerEmail,
                        return_url: `${window.location.origin}/thank-you?program=${encodeURIComponent(programName)}`,
              },
      })

      if (result.error) {
              setErrorMessage(result.error.message ?? 'Unable to process payment. Please review your details and try again.')
              setIsSubmitting(false)
              return
      }
  }

  return (
        <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
                <div>
                        <h2 className="text-2xl font-semibold text-slate-900">Complete your payment</h2>h2>
                        <p className="mt-2 text-sm text-slate-600">
                                  Your payment details are processed securely by Stripe using the Payment Element.
                        </p>p>
                </div>div>
        
              <PaymentElement options={{ layout: 'tabs' }} />
        
          {errorMessage ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>div>
                ) : null}
        
              <button
                        type="submit"
                        disabled={!stripe || !elements || isSubmitting}
                        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                {isSubmitting ? 'Processing payment…' : 'Pay now'}
              </button>button>
        
              <p className="text-xs leading-5 text-slate-500">
                      By completing your purchase, you agree to the enrollment terms shared by Wiser Generations.
              </p>p>
        </form>form>
      )
}

export default function CheckoutPage() {
    const [form, setForm] = useState<CheckoutFormState>({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          programId: 'pmp-prep',
    })
        const [clientSecret, setClientSecret] = useState('')
            const [formError, setFormError] = useState('')
                const [isInitializingPayment, setIsInitializingPayment] = useState(false)
                  
                    const selectedProgram = useMemo(() => PROGRAMS[form.programId], [form.programId])
                        const stripeUnavailable = !stripePromise
                          
                            function updateField<K extends keyof CheckoutFormState>(key: K, value: CheckoutFormState[K]) {
                                  setForm((current) => ({ ...current, [key]: value }))
                            }
  
    async function handleContinueToPayment(event: FormEvent<HTMLFormElement>) {
          event.preventDefault()
            
                if (stripeUnavailable) {
                        setFormError('Stripe is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY before accepting live payments.')
                                return
                }
      
          setIsInitializingPayment(true)
                setFormError('')
                      setClientSecret('')
                        
                            try {
                                    const response = await fetch('/api/checkout', {
                                              method: 'POST',
                                              headers: {
                                                          'Content-Type': 'application/json',
                                                          'x-idempotency-key': createIdempotencyKey(),
                                              },
                                              body: JSON.stringify({
                                                          programId: form.programId,
                                                          customer: {
                                                                        firstName: form.firstName,
                                                                        lastName: form.lastName,
                                                                        email: form.email,
                                                                        phone: form.phone,
                                                          },
                                              }),
                                    })
                                      
                                            const data = await response.json()
                                              
                                                    if (!response.ok || !data.client_secret) {
                                                              throw new Error(data.error ?? 'Unable to initialize payment.')
                                                    }
                              
                                    setClientSecret(data.client_secret)
                            } catch (error) {
                                    setFormError(error instanceof Error ? error.message : 'Unable to initialize payment.')
                            } finally {
                                    setIsInitializingPayment(false)
                            }
    }
  
    return (
          <main className="min-h-screen bg-slate-50 py-12">
                <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
                        <section className="space-y-6">
                                  <div className="space-y-3">
                                              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Secure checkout</p>p>
                                              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Enroll with confidence</h1>h1>
                                              <p className="max-w-2xl text-base leading-7 text-slate-600">
                                                            Choose the program that matches your next milestone. Pricing is validated server-side and payment
                                                            details stay inside Stripe&apos;s PCI-compliant payment flow.
                                              </p>p>
                                  </div>div>
                        
                                  <div className="grid gap-4 md:grid-cols-3">
                                    {Object.values(PROGRAMS).map((program) => {
                          const selected = program.id === form.programId
                            
                                          return (
                                                            <button
                                                                                key={program.id}
                                                                                type="button"
                                                                                onClick={() => updateField('programId', program.id)}
                                                                                className={`rounded-2xl border p-5 text-left transition ${
                                                                                                      selected
                                                                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                                                        : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                                                                                }`}
                                                                              >
                                                                              <div className="flex items-center justify-between gap-4">
                                                                                                  <h2 className="text-lg font-semibold">{program.name}</h2>h2>
                                                                                                  <span
                                                                                                                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                                                                                                                    selected ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'
                                                                                                                            }`}
                                                                                                                        >
                                                                                                    {formatPrice(program.price)}
                                                                                                    </span>span>
                                                                              </div>div>
                                                                              <p className={`mt-3 text-sm leading-6 ${selected ? 'text-slate-100' : 'text-slate-600'}`}>
                                                                                {program.description}
                                                                              </p>p>
                                                            </button>button>
                                                          )
                                    })}
                                  </div>div>
                        
                                  <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleContinueToPayment}>
                                              <div>
                                                            <h2 className="text-2xl font-semibold text-slate-900">Student information</h2>h2>
                                                            <p className="mt-2 text-sm text-slate-600">
                                                                            We use these details to create your Stripe PaymentIntent and enrollment record.
                                                            </p>p>
                                              </div>div>
                                  
                                              <div className="grid gap-4 md:grid-cols-2">
                                                            <label className="space-y-2 text-sm font-medium text-slate-700">
                                                                            <span>First name</span>span>
                                                                            <input
                                                                                                required
                                                                                                autoComplete="given-name"
                                                                                                value={form.firstName}
                                                                                                onChange={(event) => updateField('firstName', event.target.value)}
                                                                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                                                                              />
                                                            </label>label>
                                              
                                                            <label className="space-y-2 text-sm font-medium text-slate-700">
                                                                            <span>Last name</span>span>
                                                                            <input
                                                                                                required
                                                                                                autoComplete="family-name"
                                                                                                value={form.lastName}
                                                                                                onChange={(event) => updateField('lastName', event.target.value)}
                                                                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                                                                              />
                                                            </label>label>
                                              </div>div>
                                  
                                              <div className="grid gap-4 md:grid-cols-2">
                                                            <label className="space-y-2 text-sm font-medium text-slate-700">
                                                                            <span>Email</span>span>
                                                                            <input
                                                                                                required
                                                                                                type="email"
                                                                                                autoComplete="email"
                                                                                                value={form.email}
                                                                                                onChange={(event) => updateField('email', event.target.value)}
                                                                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                                                                              />
                                                            </label>label>
                                              
                                                            <label className="space-y-2 text-sm font-medium text-slate-700">
                                                                            <span>Phone</span>span>
                                                                            <input
                                                                                                required
                                                                                                type="tel"
                                                                                                autoComplete="tel"
                                                                                                value={form.phone}
                                                                                                onChange={(event) => updateField('phone', event.target.value)}
                                                                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                                                                              />
                                                            </label>label>
                                              </div>div>
                                  
                                    {formError ? (
                          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>div>
                        ) : null}
                                  
                                              <button
                                                              type="submit"
                                                              disabled={isInitializingPayment}
                                                              className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                                                            >
                                                {isInitializingPayment ? 'Preparing secure payment…' : `Continue to payment for ${formatPrice(selectedProgram.price)}`}
                                              </button>button>
                                  </form>form>
                        </section>section>
                
                        <aside className="space-y-6">
                                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Selected program</p>p>
                                              <h2 className="mt-3 text-2xl font-semibold text-slate-900">{selectedProgram.name}</h2>h2>
                                              <p className="mt-2 text-sm leading-6 text-slate-600">{selectedProgram.description}</p>p>
                                              <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-200 pt-6">
                                                            <div>
                                                                            <p className="text-sm text-slate-500">Total due today</p>p>
                                                                            <p className="text-4xl font-semibold tracking-tight text-slate-900">{formatPrice(selectedProgram.price)}</p>p>
                                                            </div>div>
                                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Stripe secured</span>span>
                                              </div>div>
                                  </div>div>
                        
                          {clientSecret ? (
                        <Elements
                                        stripe={stripePromise}
                                        options={{
                                                          clientSecret,
                                                          appearance: {
                                                                              theme: 'stripe',
                                                          },
                                        }}
                                      >
                                      <PaymentStep customerEmail={form.email} programName={selectedProgram.name} />
                        </Elements>Elements>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-600 shadow-sm">
                                      Your secure Stripe Payment Element will appear here after you submit your enrollment details.
                        </div>div>
                                  )}
                        
                                  <div className="rounded-2xl bg-slate-900 p-6 text-sm leading-6 text-slate-200 shadow-sm">
                                              <h2 className="text-lg font-semibold text-white">Need help before enrolling?</h2>h2>
                                              <p className="mt-2">
                                                            If you have questions about which program is right for you, contact the Wiser Generations team before
                                                            completing checkout.
                                              </p>p>
                                              <div className="mt-4 flex flex-wrap gap-3">
                                                            <Link href="/contact" className="rounded-full bg-white px-4 py-2 font-semibold text-slate-900">
                                                                            Contact us
                                                            </Link>Link>
                                                            <Link href="/" className="rounded-full border border-white/20 px-4 py-2 font-semibold text-white">
                                                                            Back to home
                                                            </Link>Link>
                                              </div>div>
                                  </div>div>
                        </aside>aside>
                </div>div>
          </main>main>
        )
}
</div>

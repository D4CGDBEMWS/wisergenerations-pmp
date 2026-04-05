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
          description:
                  'Our flagship PMP® prep experience with live instruction, accountability, and application support.',
    },
    'capm-launcher': {
          id: 'capm-launcher',
          name: 'CAPM® Career Launcher',
          price: 997,
          description:
                  'Foundational project management training for early-career professionals and career changers.',
    },
    'veterans-pathway': {
          id: 'veterans-pathway',
          name: 'Veterans PM Pathway',
          price: 797,
          description:
                  'A mission-aligned transition pathway designed for veterans moving into project management roles.',
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

function PaymentForm({
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
              setErrorMessage('Stripe has not loaded yet. Please wait a moment and try again.')
              return
      }

      setIsSubmitting(true)
        setErrorMessage('')

      const returnUrl = `${window.location.origin}/checkout?payment=processing&program=${encodeURIComponent(programName)}`

      const { error } = await stripe.confirmPayment({
              elements,
              confirmParams: {
                        receipt_email: customerEmail,
                        return_url: returnUrl,
              },
      })

      if (error) {
              setErrorMessage(error.message || 'Payment could not be completed. Please try again.')
              setIsSubmitting(false)
              return
      }
  }

  return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Payment details
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-900">Complete your enrollment</h2>h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                                Your payment is securely processed by Stripe.
                      </p>
              </div>
        
              <form onSubmit={handleSubmit} className="space-y-6">
                      <PaymentElement />
              
                {errorMessage ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {errorMessage}
                    </div>
                  ) : null}
              
                      <button
                                  type="submit"
                                  disabled={!stripe || !elements || isSubmitting}
                                  className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                        {isSubmitting ? 'Processing payment…' : `Pay for ${programName}`}
                      </button>
              </form>
        </div>
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
                  
                    const selectedProgram = PROGRAMS[form.programId]
                      
                        const elementsOptions = useMemo(
                              () => ({
                                      clientSecret,
                                      appearance: {
                                                theme: 'stripe' as const,
                                      },
                              }),
                              [clientSecret]
                            )
                          
                            function updateField<K extends keyof CheckoutFormState>(field: K, value: CheckoutFormState[K]) {
                                  setForm((current) => ({
                                          ...current,
                                          [field]: value,
                                  }))
                            }
  
    async function handleContinue(event: FormEvent<HTMLFormElement>) {
          event.preventDefault()
            
                if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) {
                        setFormError('Please complete all fields before continuing to payment.')
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
                                                                        firstName: form.firstName.trim(),
                                                                        lastName: form.lastName.trim(),
                                                                        email: form.email.trim(),
                                                                        phone: form.phone.trim(),
                                                          },
                                              }),
                                    })
                                      
                                            const data = await response.json().catch(() => null)
                                              
                                                    if (!response.ok) {
                                                              setFormError(data?.error || 'We could not initialize your secure payment. Please try again.')
                                                                        return
                                                    }
                              
                                    if (!data?.client_secret) {
                                              setFormError('Payment setup completed, but no client secret was returned.')
                                                        return
                                    }
                              
                                    setClientSecret(data.client_secret)
                            } catch {
                                    setFormError('Something went wrong while preparing payment. Please try again.')
                            } finally {
                                    setIsInitializingPayment(false)
                            }
    }
  
    return (
          <main className="min-h-screen bg-slate-50">
                <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                  <div>
                                              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                            Secure checkout
                                              </p>
                                              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                                                            Enroll in your next project management program
                                              </h1>h1>
                                              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                                                            Choose your program, enter your details, and continue to secure Stripe payment.
                                              </p>
                                  </div>
                        
                                  <div className="flex gap-3">
                                              <Link
                                                              href="/"
                                                              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                                            >
                                                            Back home
                                              </Link>
                                              <Link
                                                              href="/contact"
                                                              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
                                                            >
                                                            Contact us
                                              </Link>
                                  </div>
                        </div>
                
                        <section className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
                                  <div className="space-y-8">
                                              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                                            Choose a program
                                                            </p>
                                              
                                                            <div className="mt-6 grid gap-4">
                                                              {Object.values(PROGRAMS).map((program) => {
                              const isSelected = program.id === form.programId
                                
                                                  return (
                                                                        <button
                                                                                                key={program.id}
                                                                                                type="button"
                                                                                                onClick={() => updateField('programId', program.id)}
                                                                                                className={`rounded-2xl border p-5 text-left transition ${
                                                                                                                          isSelected
                                                                                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                                                                                                            : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                                                                                                  }`}
                                                                                              >
                                                                                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                                                                                      <div>
                                                                                                                                                <h2 className="text-xl font-semibold">{program.name}</h2>h2>
                                                                                                                                                <p
                                                                                                                                                                              className={`mt-2 text-sm leading-6 ${
                                                                                                                                                                                                              isSelected ? 'text-slate-200' : 'text-slate-600'
                                                                                                                                                                                                            }`}
                                                                                                                                                                            >
                                                                                                                                                  {program.description}
                                                                                                                                                  </p>
                                                                                                                        </div>
                                                                                              
                                                                                                                      <div
                                                                                                                                                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                                                                                                                                                                                isSelected
                                                                                                                                                                                  ? 'bg-white text-slate-900'
                                                                                                                                                                                  : 'bg-slate-100 text-slate-700'
                                                                                                                                                    }`}
                                                                                                                                                >
                                                                                                                        {formatPrice(program.price)}
                                                                                                                        </div>
                                                                                                </div>
                                                                        </button>
                                                                      )
                                                              })}
                                                            </div>
                                              </div>
                                  
                                              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                                            Student information
                                                            </p>
                                              
                                                            <form onSubmit={handleContinue} className="mt-6 space-y-5">
                                                                            <div className="grid gap-4 md:grid-cols-2">
                                                                                              <label className="space-y-2 text-sm font-medium text-slate-700">
                                                                                                                  <span>First name</span>
                                                                                                                  <input
                                                                                                                                          required
                                                                                                                                          type="text"
                                                                                                                                          autoComplete="given-name"
                                                                                                                                          value={form.firstName}
                                                                                                                                          onChange={(event) => updateField('firstName', event.target.value)}
                                                                                                                                          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                                                                                                                        />
                                                                                                </label>
                                                                            
                                                                                              <label className="space-y-2 text-sm font-medium text-slate-700">
                                                                                                                  <span>Last name</span>
                                                                                                                  <input
                                                                                                                                          required
                                                                                                                                          type="text"
                                                                                                                                          autoComplete="family-name"
                                                                                                                                          value={form.lastName}
                                                                                                                                          onChange={(event) => updateField('lastName', event.target.value)}
                                                                                                                                          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                                                                                                                        />
                                                                                                </label>
                                                                            </div>
                                                            
                                                                            <div className="grid gap-4 md:grid-cols-2">
                                                                                              <label className="space-y-2 text-sm font-medium text-slate-700">
                                                                                                                  <span>Email</span>
                                                                                                                  <input
                                                                                                                                          required
                                                                                                                                          type="email"
                                                                                                                                          autoComplete="email"
                                                                                                                                          value={form.email}
                                                                                                                                          onChange={(event) => updateField('email', event.target.value)}
                                                                                                                                          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                                                                                                                        />
                                                                                                </label>
                                                                            
                                                                                              <label className="space-y-2 text-sm font-medium text-slate-700">
                                                                                                                  <span>Phone</span>
                                                                                                                  <input
                                                                                                                                          required
                                                                                                                                          type="tel"
                                                                                                                                          autoComplete="tel"
                                                                                                                                          value={form.phone}
                                                                                                                                          onChange={(event) => updateField('phone', event.target.value)}
                                                                                                                                          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                                                                                                                        />
                                                                                                </label>
                                                                            </div>
                                                            
                                                              {formError ? (
                              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {formError}
                              </div>
                            ) : null}
                                                            
                                                                            <button
                                                                                                type="submit"
                                                                                                disabled={isInitializingPayment}
                                                                                                className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                                                                                              >
                                                                              {isInitializingPayment
                                                                                                    ? 'Preparing secure payment…'
                                                                                                    : `Continue to payment for ${formatPrice(selectedProgram.price)}`}
                                                                            </button>
                                                            </form>
                                              </section>
                                  
                                    {clientSecret ? (
                          stripePromise ? (
                                            <Elements stripe={stripePromise} options={elementsOptions}>
                                                              <PaymentForm
                                                                                    customerEmail={form.email}
                                                                                    programName={selectedProgram.name}
                                                                                  />
                                            </Elements>
                                          ) : (
                                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                                                              Stripe is not configured yet. Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable payments.
                                            </div>
                                          )
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                                          Complete your student information above to load the secure payment form.
                          </div>
                                              )}
                                  </div>
                        
                                  <aside className="space-y-6">
                                              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                                            Selected program
                                                            </p>
                                                            <h2 className="mt-3 text-2xl font-semibold text-slate-900">{selectedProgram.name}</h2>h2>
                                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                              {selectedProgram.description}
                                                            </p>
                                              
                                                            <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-200 pt-6">
                                                                            <div>
                                                                                              <p className="text-sm text-slate-500">Total due today</p>
                                                                                              <p className="text-4xl font-semibold tracking-tight text-slate-900">
                                                                                                {formatPrice(selectedProgram.price)}
                                                                                                </p>
                                                                            </div>
                                                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                                                              Stripe secured
                                                                            </span>
                                                            </div>
                                              </div>
                                  
                                              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                                            <h3 className="text-lg font-semibold text-slate-900">Need help before enrolling?</h3>h3>
                                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                                            If you have questions about which program fits best, contact the Wiser Generations team before checking out.
                                                            </p>
                                                            <div className="mt-4 flex flex-wrap gap-3">
                                                                            <Link
                                                                                                href="/contact"
                                                                                                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                                                                                              >
                                                                                              Contact support
                                                                            </Link>
                                                                            <Link
                                                                                                href="/"
                                                                                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                                                                              >
                                                                                              Return home
                                                                            </Link>
                                                            </div>
                                              </div>
                                  </aside>
                        </section>
                </section>
          </main>
        )
}
</div>

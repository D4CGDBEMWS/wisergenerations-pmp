'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

// ---------------------------------------------------------------------------
// Stripe — only initialise once, at module level (correct pattern).
// If the env var is missing we keep null and surface a banner immediately
// on page load (fix #1) instead of hiding it until post-form-submission.
// ---------------------------------------------------------------------------
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

// ---------------------------------------------------------------------------
// Programs — single source of truth for names AND prices.
// Prices should ultimately come from the backend/CMS (fix #8), but until
// that migration happens these values are at least consistent with the
// /programs page ($1,497 PMP, $997 CAPM, $797 Veterans).
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

// Fix #9 — removed unnecessary fallback; crypto.randomUUID() is available in
// every browser that supports Next.js 13+ App Router.
function createIdempotencyKey() {
  return crypto.randomUUID()
}

// Fix #3 — lightweight email validation beyond browser type="email".
function isValidEmail(value: string) {
  const at = value.indexOf('@')
  if (at < 1) return false
  const dot = value.lastIndexOf('.')
  return dot > at + 1 && dot < value.length - 1
}

// Fix #4 — phone validation: 7–15 digits, spaces, dashes, parens, plus sign.
const PHONE_PATTERN = /^[0-9\s\-+()]{7,15}$/

// ---------------------------------------------------------------------------
// Spinner — used for fix #7 (loading indicator during Stripe confirmPayment).
// ---------------------------------------------------------------------------
function Spinner() {
  return (
    <svg
      className="inline-block h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// StudyAccessCard — $47/month recurring tier (Stripe Checkout subscription)
// ---------------------------------------------------------------------------
const STUDY_ACCESS_INCLUDED = [
  'Self-paced PMP® / CAPM® study library',
  'Practice question bank with explanations',
  'Monthly live Q&A office hours',
  'Private study community access',
  '🎁 Branded PM templates (Agile + Waterfall) — new template every month',
  'Cancel anytime — no contract',
] as const

const STUDY_ACCESS_NOT_INCLUDED = [
  'Live mentor-led cohort instruction',
  '1:1 application & audit support',
  'Personalized exam-readiness coaching',
  'Certificate of completion',
] as const

function StudyAccessCard() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleStart() {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/checkout-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.url) {
        setError(data?.error || 'Could not start Study Access checkout. Please try again.')
        setIsLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-white to-amber-50 p-8 shadow-lg">
      {/* Most Flexible badge */}
      <div className="absolute right-6 top-6">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-sm">
          ★ Most Flexible
        </span>
      </div>

      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
          Wiser Generations Int’l™ Study Access
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Study month-to-month
        </h2>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-5xl font-bold tracking-tight text-slate-900">$47</span>
          <span className="text-base font-medium text-slate-600">/month · recurring</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Get instant access to the Wiser Generations Int’l™ self-study library and monthly office
          hours. Cancel anytime.
        </p>
      </div>

      {/* Templates perk highlight */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-100/60 p-4">
        <span aria-hidden className="text-2xl">🎁</span>
        <div className="flex-1 text-sm">
          <p className="font-bold text-slate-900">
            Bonus: branded PM templates every month
          </p>
          <p className="mt-1 text-slate-700">
            13+ Agile &amp; Waterfall templates (Project Charter, Risk Register, Sprint Planner,
            Retrospective Board, and more) — plus a fresh new template delivered to your inbox on
            the 1st of every month.{' '}
            <a
              href="/resources/pm-templates"
              className="font-bold text-amber-800 underline hover:text-amber-900"
            >
              See the library →
            </a>
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {/* Included */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            What&apos;s included
          </p>
          <ul className="mt-3 space-y-2">
            {STUDY_ACCESS_INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-800">
                <span aria-hidden className="mt-0.5 text-emerald-600">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Not included */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Not included
          </p>
          <ul className="mt-3 space-y-2">
            {STUDY_ACCESS_NOT_INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-400 line-through">
                <span aria-hidden className="mt-0.5">×</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Upsell nudge */}
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-100/60 px-4 py-3 text-sm text-slate-800">
        <strong className="font-semibold">Want live mentorship and accountability?</strong>{' '}
        Our full PMP®, CAPM®, and Veterans programs below include cohort coaching and 1:1
        support. <a href="#full-programs" className="font-semibold text-amber-700 underline">See full programs ↓</a>
      </div>

      {error ? (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleStart}
        disabled={isLoading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-4 text-base font-bold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-8"
      >
        {isLoading ? (
          <>
            <Spinner />
            Starting Study Access…
          </>
        ) : (
          'Start Study Access — $47/month'
        )}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PaymentForm
// ---------------------------------------------------------------------------
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

    // Fix #2 — redirect to a dedicated success/confirmation page instead of
    // looping back to /checkout with a ?payment=processing param that nothing handles.
    const returnUrl = `${window.location.origin}/checkout/success?program=${encodeURIComponent(programName)}`

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        receipt_email: customerEmail,
        return_url: returnUrl,
      },
    })

    // confirmPayment only resolves here when there IS an error.
    // On success Stripe redirects the browser to return_url automatically.
    if (error) {
      setErrorMessage(error.message || 'Payment could not be completed. Please try again.')
      setIsSubmitting(false)
    }
    // Note: do NOT reset isSubmitting on success — the page is navigating away.
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Payment details
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Complete your enrollment</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your payment is securely processed by Stripe.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement />

        {errorMessage ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!stripe || !elements || isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {/* Fix #7 — spinner shown during Stripe confirmPayment processing */}
          {isSubmitting ? (
            <>
              <Spinner />
              Processing payment…
            </>
          ) : (
            `Pay for ${programName}`
          )}
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CheckoutPage
// ---------------------------------------------------------------------------
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

  // Fix #5 — ref-based guard to prevent race condition on rapid "Continue" clicks.
  const isSubmittingRef = useRef(false)

  const selectedProgram = PROGRAMS[form.programId]

  const elementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: { theme: 'stripe' as const },
    }),
    [clientSecret]
  )

  // Fix #6 — clear the existing PaymentIntent client secret whenever the user
  // switches program after already reaching step 2.  Without this they would
  // pay the wrong amount on the previously-created intent.
  const updateField = useCallback(
    <K extends keyof CheckoutFormState>(field: K, value: CheckoutFormState[K]) => {
      if (field === 'programId') {
        setClientSecret('')
        setFormError('')
      }
      setForm((current) => ({ ...current, [field]: value }))
    },
    []
  )

  async function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Fix #5 — ref guard (in addition to the button's disabled state).
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    // Fix #3 — validate email more strictly than type="email" alone.
    if (!isValidEmail(form.email.trim())) {
      setFormError('Please enter a valid email address (e.g. name@example.com).')
      isSubmittingRef.current = false
      return
    }

    // Fix #4 — validate phone format.
    if (!PHONE_PATTERN.test(form.phone.trim())) {
      setFormError('Please enter a valid phone number (7–15 digits, e.g. (404) 555-0100).')
      isSubmittingRef.current = false
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
          name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          programId: form.programId,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setFormError(data?.error || 'We could not initialise your secure payment. Please try again.')
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
      isSubmittingRef.current = false
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Fix #1 — surface the missing Stripe key immediately at the top of the
          page so the user (and developer) don't discover it only after filling
          in the entire form. */}
      {!stripePromise ? (
        <div role="alert" className="bg-amber-400 px-4 py-3 text-center text-sm font-semibold text-slate-950">
          ⚠️ Payments are not configured. Add{' '}
          <code className="rounded bg-amber-300 px-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to
          your environment variables to enable checkout.
        </div>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Secure checkout
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              Choose how you want to study with Wiser Generations Int’l™
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Start month-to-month with Study Access, or enroll in a full mentor-led program below.
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

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* SECTION 1 — Wiser Generations Int’l™ Study Access ($47/month)        */}
        {/* ──────────────────────────────────────────────────────────────── */}
        <StudyAccessCard />

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* DIVIDER + SECTION 2 header                                      */}
        {/* ──────────────────────────────────────────────────────────────── */}
        <div className="my-12 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            or
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div id="full-programs" className="mb-8 scroll-mt-24">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Full Programs
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            One-Time Investment
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Mentor-led cohorts with live instruction, accountability, and application support.
          </p>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-8">
            {/* Program selection */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Choose a program
              </p>

              <div className="mt-6 grid gap-4" role="radiogroup" aria-label="Select a program">
                {Object.values(PROGRAMS).map((program) => {
                  const isSelected = program.id === form.programId

                  return (
                    <button
                      key={program.id}
                      type="button"
                      // Fix #11 — aria-pressed communicates toggle/selected state to
                      // screen readers; role="radio" would also work but aria-pressed
                      // is simpler for a single-select button group.
                      aria-pressed={isSelected}
                      onClick={() => updateField('programId', program.id)}
                      className={`rounded-2xl border p-5 text-left transition ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-xl font-semibold">{program.name}</h2>
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
                            isSelected ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700'
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

            {/* Student information */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Student information
              </p>

              <form onSubmit={handleContinue} className="mt-6 space-y-5" noValidate>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    <span>First name</span>
                    <input
                      required
                      type="text"
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
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
                      onChange={(e) => updateField('lastName', e.target.value)}
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
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                    />
                  </label>

                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    <span>Phone</span>
                    {/* Fix #4 — pattern attribute + helper text so users know the format */}
                    <input
                      required
                      type="tel"
                      autoComplete="tel"
                      pattern="[0-9\s\-+()]{7,15}"
                      placeholder="(404) 555-0100"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                    />
                    <span className="text-xs text-slate-400">e.g. (404) 555-0100</span>
                  </label>
                </div>

                {formError ? (
                  <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isInitializingPayment}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isInitializingPayment ? (
                    <>
                      <Spinner />
                      Preparing secure payment…
                    </>
                  ) : (
                    `Continue to payment for ${formatPrice(selectedProgram.price)}`
                  )}
                </button>
              </form>
            </section>

            {/* Stripe payment form — only rendered when we have a valid clientSecret */}
            {clientSecret ? (
              stripePromise ? (
                <Elements stripe={stripePromise} options={elementsOptions}>
                  <PaymentForm
                    customerEmail={form.email}
                    programName={selectedProgram.name}
                  />
                </Elements>
              ) : (
                // stripePromise is null — already shown in the top banner (fix #1),
                // but we keep a local message here for in-context clarity.
                <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                  Stripe is not configured. Add{' '}
                  <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{' '}
                  to your environment to enable payments.
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                Complete your student information above to load the secure payment form.
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Selected program
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">{selectedProgram.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selectedProgram.description}</p>

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

              {/* Fix #6 — hint to the user that switching program resets payment step */}
              {clientSecret ? (
                <p className="mt-4 text-xs text-slate-400">
                  Switching programs will reset the payment form.
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Need help before enrolling?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                If you have questions about which program fits best, contact the Wiser Generations Int’l
                team before checking out.
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
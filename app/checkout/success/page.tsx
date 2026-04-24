'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'

// We re-use the same stripePromise to check payment_intent status.
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

type PaymentStatus = 'loading' | 'succeeded' | 'processing' | 'failed'

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-10 shadow-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-8 w-8 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Loading…</h1>
        </div>
      </main>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}

// decodeURIComponent throws on malformed input (e.g. ?program=%E0%A4%A),
// which would crash the entire success page render. Anyone can craft such a
// URL and link it to a customer to break this page. Wrap and fall back.
function safeDecode(value: string, fallback: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return fallback
  }
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const rawProgram = searchParams.get('program') ?? 'your program'
  const programName = safeDecode(rawProgram, 'your program')
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret')
  // New: Study Access subscription flow uses ?tier=study&session_id=...
  const tier = searchParams.get('tier')
  const isStudyAccess = tier === 'study'

  const [status, setStatus] = useState<PaymentStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Subscription mode: Stripe Checkout already verified the payment server-side
    // before redirecting here. No client-side verification needed.
    if (isStudyAccess) {
      setStatus('succeeded')
      return
    }

    // One-time program flow: Stripe appends ?payment_intent_client_secret=... to
    // the return_url. We use it to retrieve the PaymentIntent and confirm status.
    if (!paymentIntentClientSecret || !stripePromise) {
      // No secret means the user navigated here directly — treat as success
      // display (they may have bookmarked the URL after a real payment).
      setStatus('succeeded')
      return
    }

    stripePromise.then((stripe) => {
      if (!stripe) {
        setStatus('failed')
        setErrorMessage('Could not connect to Stripe to verify your payment.')
        return
      }

      stripe.retrievePaymentIntent(paymentIntentClientSecret).then(({ paymentIntent }) => {
        switch (paymentIntent?.status) {
          case 'succeeded':
            setStatus('succeeded')
            break
          case 'processing':
            setStatus('processing')
            break
          default:
            setStatus('failed')
            setErrorMessage(
              'Your payment was not completed. Please return to checkout and try again.'
            )
        }
      })
    })
  }, [paymentIntentClientSecret, isStudyAccess])

  // Study Access (subscription) success view — different copy + templates perk
  if (isStudyAccess && status === 'succeeded') {
    return <StudyAccessSuccess />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-10 shadow-sm text-center">

        {status === 'loading' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-8 w-8 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Verifying your payment…</h1>
            <p className="mt-3 text-sm text-slate-500">This will only take a moment.</p>
          </>
        )}

        {status === 'succeeded' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-slate-900">You're enrolled!</h1>
            <p className="mt-3 text-base text-slate-600">
              Welcome to <strong>{programName}</strong>. A confirmation and
              receipt have been sent to your email address.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Crystal's team will reach out within one business day with next steps.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Return home
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Contact us
              </Link>
            </div>
          </>
        )}

        {status === 'processing' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Payment processing</h1>
            <p className="mt-3 text-sm text-slate-600">
              Your payment is being processed. You'll receive a confirmation email once it clears —
              usually within a few minutes.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              If you don't hear from us within 24 hours, please contact support.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Contact support
              </Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Payment not completed</h1>
            {errorMessage ? (
              <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
            ) : null}
            <p className="mt-3 text-sm text-slate-500">
              No charge has been made. Please try again or contact us if the problem persists.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/checkout"
                className="rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Return to checkout
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Contact support
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// StudyAccessSuccess — dedicated post-subscription welcome view for the
// $47/mo Wiser Generations Int’l™ Study Access tier. Highlights the monthly PM
// templates perk and points members to the templates landing page.
// ---------------------------------------------------------------------------
function StudyAccessSuccess() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Welcome card */}
        <div className="overflow-hidden rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-white to-amber-50 p-10 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-400 text-2xl">
              ⭐
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                Wiser Generations Int’l™ Study Access
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                You&rsquo;re in. Welcome to Study Access.
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-700">
                Your $47/month subscription is active. A confirmation receipt is on its way to
                your inbox from Stripe.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-100/60 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
              🎁 Your member bonus this month
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Branded PM templates — Agile &amp; Waterfall
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              As a Study Access member, you get a fresh Wiser Generations Int’l™ branded PM template
              every month — Project Charter, Sprint Planner, Risk Register, RACI matrix, and
              more. <strong>This month&rsquo;s template will land in your inbox within 24 hours.</strong>
            </p>
            <Link
              href="/resources/pm-templates"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              See the full template library →
            </Link>
          </div>
        </div>

        {/* What happens next */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">What happens next</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">1</span>
              <span>
                <strong>Welcome email (within minutes):</strong> Stripe receipt + access to your
                Study Access library and community.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">2</span>
              <span>
                <strong>Templates email (within 24 hours):</strong> This month&rsquo;s branded PM
                template, ready to use on your next project.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">3</span>
              <span>
                <strong>Monthly cadence:</strong> A new template drops on the 1st of each month
                for as long as your subscription is active.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">4</span>
              <span>
                <strong>Need more?</strong> Upgrade to live mentor coaching anytime — your
                Study Access tuition counts toward a full program.
              </span>
            </li>
          </ol>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/resources"
            className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
          >
            Browse free resources
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400"
          >
            Contact support
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Manage or cancel your subscription anytime by replying to your Stripe receipt or
          contacting{' '}
          <a href="mailto:info@wisergenerations.com" className="underline hover:text-slate-700">
            info@wisergenerations.com
          </a>
          .
        </p>
      </div>
    </main>
  )
}
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

  const [status, setStatus] = useState<PaymentStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Stripe appends ?payment_intent_client_secret=... to the return_url.
    // We use it to retrieve the PaymentIntent and confirm its status.
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
  }, [paymentIntentClientSecret])

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
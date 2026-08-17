'use client'

import { FormEvent, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/components/Analytics'
import { useTurnstile } from '@/components/useTurnstile'

type Status = 'idle' | 'submitting' | 'success' | 'already' | 'error'

export default function GiveawayEntryForm({ rulesHref }: { rulesHref: string }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const turnstileRef = useRef<HTMLDivElement | null>(null)
  const { token, reset, required } = useTurnstile(turnstileRef)

  const uid = useId()
  const firstId = `${uid}-first`
  const lastId = `${uid}-last`
  const emailId = `${uid}-email`
  const consentId = `${uid}-consent`
  const errorId = `${uid}-error`

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'submitting') return

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('Please fill in your first name, last name, and email address.')
      setStatus('error')
      return
    }

    if (required && !token) {
      setError('Please complete the security check below.')
      setStatus('error')
      return
    }

    setStatus('submitting')
    setError('')

    try {
      const response = await fetch('/api/giveaway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          marketingConsent,
          turnstileToken: token,
        }),
      })

      const data = (await response.json().catch(() => null)) as
        | { error?: string; alreadyEntered?: boolean }
        | null

      if (!response.ok) {
        setError(data?.error || 'Something went wrong. Please try again.')
        setStatus('error')
        reset()
        return
      }

      if (data?.alreadyEntered) {
        setStatus('already')
        return
      }

      // Category-level only — no name or email in analytics.
      trackEvent('giveaway_entry', { marketing_consent: marketingConsent })
      trackEvent('lead_captured', { source: 'giveaway', interest: 'giveaway' })
      setStatus('success')
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('error')
      reset()
    }
  }

  // ---- Confirmation states ------------------------------------------------
  // Deliberately never says or implies anything about winning.
  if (status === 'success' || status === 'already') {
    return (
      <div
        role="status"
        className="rounded-3xl border-2 border-leaf bg-leaf-soft p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white">
          <svg
            className="h-7 w-7 text-leaf"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-navy">
          {status === 'already' ? "You're already entered!" : "You're entered!"}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-700">
          {status === 'already'
            ? 'We already have an entry for that email address — no need to enter again. Watch your email for Wiser Generations updates and the winner announcement.'
            : 'Watch your email for Wiser Generations updates and the winner announcement.'}
        </p>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-lg border border-line bg-white px-4 py-3 text-sm text-navy outline-none transition ' +
    'focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30 aria-[invalid=true]:border-red-500'

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={`${uid}-heading`}
      className="rounded-3xl border-2 border-gold bg-white p-6 shadow-sm sm:p-8"
    >
      <h3 id={`${uid}-heading`} className="text-xl font-bold text-navy">
        Enter the giveaway
      </h3>
      <p className="mt-1 text-sm text-gray-500">One entry per person. No purchase necessary.</p>

      <div className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={firstId} className="block text-xs font-bold text-navy">
              First name
            </label>
            <input
              id={firstId}
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              aria-invalid={status === 'error' && !firstName.trim()}
              aria-describedby={error ? errorId : undefined}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor={lastId} className="block text-xs font-bold text-navy">
              Last name
            </label>
            <input
              id={lastId}
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              aria-invalid={status === 'error' && !lastName.trim()}
              aria-describedby={error ? errorId : undefined}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>

        <div>
          <label htmlFor={emailId} className="block text-xs font-bold text-navy">
            Email address
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={status === 'error' && !email.trim()}
            aria-describedby={error ? errorId : undefined}
            className={`mt-1.5 ${inputClass}`}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            The winner is notified at this address, so please use one you check.
          </p>
        </div>

        {/* Marketing consent is captured separately and entry never depends on
            it — required in several jurisdictions and simply the right default. */}
        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="flex items-start gap-3">
            <input
              id={consentId}
              name="marketingConsent"
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-brand-blue focus:ring-2 focus:ring-brand-blue/30"
            />
            <label htmlFor={consentId} className="text-xs leading-relaxed text-gray-700">
              <span className="font-semibold text-navy">Optional:</span> Yes, email me PMP® exam
              tips, cohort announcements, and offers from Wiser Generations Int&apos;l. Unsubscribe
              anytime.{' '}
              <span className="text-gray-500">
                You do not need to tick this to enter the giveaway.
              </span>
            </label>
          </div>
        </div>
      </div>

      {required && <div ref={turnstileRef} className="mt-4" />}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting' || (required && !token)}
        className="mt-6 w-full rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-navy transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === 'submitting' ? 'Entering…' : 'Enter the giveaway'}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
        By entering you agree to the{' '}
        <Link href={rulesHref} className="font-semibold underline hover:no-underline">
          official rules
        </Link>{' '}
        and our{' '}
        <Link href="/privacy-policy" className="font-semibold underline hover:no-underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  )
}

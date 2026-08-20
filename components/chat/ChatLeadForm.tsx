'use client'

import { FormEvent, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/components/Analytics'
import { useTurnstile } from '@/components/useTurnstile'

// ---------------------------------------------------------------------------
// ChatLeadForm — the form the AI Guide renders when it calls `show_lead_form`.
//
// Collects the minimum viable lead (first name + email) plus an optional
// timeframe, which is what upgrades a lead to `high-intent` in Mailchimp.
// No other personally identifiable information is requested.
// ---------------------------------------------------------------------------

export type LeadInterest =
  | 'course'
  | 'coaching'
  | 'course_and_coaching'
  | 'ebook'
  | 'giveaway'
  | 'corporate'
  | 'veterans'
  | 'general'

const TIMEFRAMES = [
  { value: 'right_away', label: 'Right away' },
  { value: 'within_30_days', label: 'Within 30 days' },
  { value: 'within_3_months', label: 'Within 3 months' },
  { value: 'exploring', label: "I'm still exploring" },
]

type Status = 'idle' | 'submitting' | 'error'

export default function ChatLeadForm({
  interest,
  reason,
  privacyHref,
  onSuccess,
  onDismiss,
}: {
  interest: LeadInterest
  reason: string
  privacyHref: string
  onSuccess: (timeframe: string) => void
  onDismiss: () => void
}) {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [timeframe, setTimeframe] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const turnstileRef = useRef<HTMLDivElement | null>(null)
  const { token, reset, required } = useTurnstile(turnstileRef)

  const uid = useId()
  const nameId = `${uid}-name`
  const emailId = `${uid}-email`
  const timeframeId = `${uid}-timeframe`
  const errorId = `${uid}-error`

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'submitting') return

    if (!firstName.trim() || !email.trim()) {
      setError('Please enter your first name and email address.')
      setStatus('error')
      return
    }

    if (required && !token) {
      setError('Please complete the security check just above the button.')
      setStatus('error')
      return
    }

    setStatus('submitting')
    setError('')

    try {
      const response = await fetch('/api/chat/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim(),
          interest,
          timeframe,
          sourcePage: window.location.pathname,
          turnstileToken: token,
        }),
      })

      const data = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        setError(data?.error || 'Something went wrong. Please try again.')
        setStatus('error')
        reset()
        return
      }

      // Category-level analytics only — no name, email, or message content.
      trackEvent('lead_captured', { source: 'ai_chat', interest })
      if (timeframe) {
        trackEvent('qualified_lead', { source: 'ai_chat', interest, timeframe })
      }
      if (timeframe === 'right_away' || timeframe === 'within_30_days') {
        trackEvent('high_intent_lead', { source: 'ai_chat', interest })
      }
      if (interest === 'course' || interest === 'course_and_coaching') {
        trackEvent('course_interest', { source: 'ai_chat' })
      }
      if (interest === 'coaching' || interest === 'course_and_coaching') {
        trackEvent('coaching_interest', { source: 'ai_chat' })
      }

      onSuccess(timeframe)
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('error')
      reset()
    }
  }

  const inputClass =
    'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy outline-none transition ' +
    'focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30 aria-[invalid=true]:border-red-500'

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-line bg-paper p-4"
      aria-label="Send me the information"
    >
      {reason ? (
        <p className="mb-3 text-sm font-semibold text-navy">{reason}</p>
      ) : (
        <p className="mb-3 text-sm font-semibold text-navy">
          Where should we send the information?
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label htmlFor={nameId} className="block text-xs font-bold text-navy">
            First name
          </label>
          <input
            id={nameId}
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            aria-invalid={status === 'error' && !firstName.trim()}
            aria-describedby={error ? errorId : undefined}
            className={`mt-1 ${inputClass}`}
          />
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
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <div>
          <label htmlFor={timeframeId} className="block text-xs font-bold text-navy">
            When would you like to begin?{' '}
            <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <select
            id={timeframeId}
            name="timeframe"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className={`mt-1 ${inputClass}`}
          >
            <option value="">Prefer not to say</option>
            {TIMEFRAMES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {required && <div ref={turnstileRef} className="mt-3" />}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
        >
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="flex-1 rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-navy transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'submitting' ? 'Sending…' : 'Send it to me'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-line px-3 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-brand-blue hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          Not now
        </button>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
        We&apos;ll email you about Wiser Generations programs. Unsubscribe anytime. See our{' '}
        <Link href={privacyHref} className="underline hover:no-underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  )
}

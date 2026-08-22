'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTurnstile } from '@/components/useTurnstile'
import { CONSENT_VERSION } from '@/lib/consent'

// ---------------------------------------------------------------------------
// The retreat interest list.
//
// The retreat has no public "Buy Now" path and this form is the entire public
// surface of it. It is deliberately unglamorous: it takes a few details and
// says somebody will be in touch. It quotes no price, confirms no place,
// offers no date and calculates no group discount — every one of those is a
// decision a person makes after reading what was submitted here.
//
// The partner code is read from the URL rather than a cookie. Somebody who
// scanned a QR code in a barbershop arrived at /living-is-a-project/retreat?p=CODE,
// and submitting this form is an intentional act, so attribution attaches
// without any tracking cookie and therefore without depending on what they
// chose in the consent banner.
// ---------------------------------------------------------------------------

export type InquiryType = 'individual' | 'group' | 'sponsor'

interface Props {
  inquiryType: InquiryType
  /** What the submit button says. Owner-approved copy lives in the page. */
  submitLabel: string
  /** Shown after a successful submission. */
  confirmation: string
}

export function RetreatInterestForm({ inquiryType, submitLabel, confirmation }: Props) {
  const turnstileRef = useRef<HTMLDivElement>(null)
  const { token, reset, required } = useTurnstile(turnstileRef)
  const params = useSearchParams()

  const [partner, setPartner] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    groupSize: '',
    message: '',
  })
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Read once on mount. Kept in state rather than read at submit time so that
  // a client-side navigation that drops the query string does not lose the
  // partner who sent this person here.
  useEffect(() => {
    setPartner(params.get('p'))
  }, [params])

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (required && !token) {
      setError('Please complete the verification check below before submitting.')
      return
    }

    setState('sending')
    try {
      const res = await fetch('/api/liap/retreat-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          inquiryType,
          partner,
          marketingConsent,
          consentVersion: CONSENT_VERSION,
          turnstileToken: token,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'We could not send that. Please check the details and try again.')
        setState('idle')
        reset()
        return
      }
      setState('sent')
    } catch {
      setError('You appear to be offline. Please try again once reconnected.')
      setState('idle')
      reset()
    }
  }

  if (state === 'sent') {
    return (
      <div
        role="status"
        className="rounded-xl border border-green-700/40 bg-green-50 p-6 text-green-900"
      >
        <p className="font-semibold">Thank you — that has reached us.</p>
        <p className="mt-2 text-sm">{confirmation}</p>
      </div>
    )
  }

  const isGroup = inquiryType === 'group'
  const isSponsor = inquiryType === 'sponsor'

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="ri-name" className="block text-sm font-semibold">
          Your name
        </label>
        <input
          id="ri-name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="ri-email" className="block text-sm font-semibold">
          Email address <span className="text-red-700">*</span>
        </label>
        <input
          id="ri-email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="ri-phone" className="block text-sm font-semibold">
          Phone <span className="font-normal text-gray-600">(optional)</span>
        </label>
        <input
          id="ri-phone"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      {(isGroup || isSponsor) && (
        <div>
          <label htmlFor="ri-org" className="block text-sm font-semibold">
            {isSponsor ? 'Organisation' : 'Group or organisation'}{' '}
            <span className="font-normal text-gray-600">(optional)</span>
          </label>
          <input
            id="ri-org"
            type="text"
            autoComplete="organization"
            value={form.organization}
            onChange={(e) => set('organization', e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      )}

      {isGroup && (
        <div>
          <label htmlFor="ri-size" className="block text-sm font-semibold">
            Roughly how many people?
          </label>
          <input
            id="ri-size"
            type="number"
            min={1}
            max={500}
            inputMode="numeric"
            value={form.groupSize}
            onChange={(e) => set('groupSize', e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-gray-600">
            An estimate is fine. Nothing is confirmed at this stage.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="ri-message" className="block text-sm font-semibold">
          Anything you would like us to know{' '}
          <span className="font-normal text-gray-600">(optional)</span>
        </label>
        <textarea
          id="ri-message"
          rows={4}
          maxLength={2000}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      {/* Separate from the enquiry itself and off by default. Asking about a
          retreat is not agreeing to a newsletter. */}
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(e) => setMarketingConsent(e.target.checked)}
          className="mt-1"
        />
        <span>
          Send me occasional Living Is a Project...Are You Ready?™ updates by email. You can
          unsubscribe at any time, and we will reply to this enquiry either way.
        </span>
      </label>

      <div ref={turnstileRef} className="min-h-[65px]" />

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'sending'}
        className="w-full rounded-lg bg-navy px-6 py-3 font-bold text-white disabled:opacity-60"
      >
        {state === 'sending' ? 'Sending…' : submitLabel}
      </button>

      <p className="text-xs text-gray-600">
        This is an enquiry, not a booking. No payment is taken here and no place
        is reserved.
      </p>
    </form>
  )
}

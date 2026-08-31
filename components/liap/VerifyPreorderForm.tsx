'use client'

import { useRef, useState } from 'react'
import { useTurnstile } from '@/components/useTurnstile'

// ---------------------------------------------------------------------------
// §25. Collects only what §25 lists: name, email, retailer, order number.
//
// No proof upload. §25 permits one "only if securely supported", and accepting
// arbitrary files from unauthenticated visitors is a meaningful new attack
// surface — storage, scanning, serving — for a Phase I convenience. Whoever
// reviews the claim can ask for a screenshot by reply if they need one.
// ---------------------------------------------------------------------------

const RETAILERS = [
  { key: 'amazon', label: 'Amazon' },
  { key: 'barnes_noble', label: 'Barnes & Noble' },
  { key: 'bookshop', label: 'Bookshop.org' },
  { key: 'independent', label: 'An independent bookshop' },
  { key: 'other', label: 'Somewhere else' },
]

export function VerifyPreorderForm() {
  const turnstileRef = useRef<HTMLDivElement>(null)
  const { token, reset, required } = useTurnstile(turnstileRef)

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', retailer: '', orderRef: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

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
      const res = await fetch('/api/liap/verify-preorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, turnstileToken: token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'We could not submit that. Please check the details and try again.')
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
        className="mt-10 rounded-xl border-l-4 border-emerald-600 bg-emerald-50 p-5"
      >
        <h2 className="font-bold text-emerald-900">Thank you — we have your details.</h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900">
          Someone will check the order and email you when your assessment is unlocked, usually
          within two business days. You don&rsquo;t need to do anything else.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-6" noValidate>
      {error && (
        <div
          role="alert"
          className="rounded-lg border-l-4 border-red-600 bg-red-50 p-4 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}

      {/* First and last collected separately rather than as one "Your name"
          box. A single field has to be split on a space to reach a CRM merge
          field, and that guess is wrong for anyone whose name does not have
          exactly one. Asking is cheaper than guessing. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="vp-first-name" className="block font-semibold text-navy">
            First name <span className="font-normal text-gray-500">(required)</span>
          </label>
          <input
            id="vp-first-name"
            type="text"
            required
            autoComplete="given-name"
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            className="mt-2 min-h-[48px] w-full rounded-lg border border-gray-300 px-4 text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          />
        </div>
        <div>
          <label htmlFor="vp-last-name" className="block font-semibold text-navy">
            Last name <span className="font-normal text-gray-500">(required)</span>
          </label>
          <input
            id="vp-last-name"
            type="text"
            required
            autoComplete="family-name"
            value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            className="mt-2 min-h-[48px] w-full rounded-lg border border-gray-300 px-4 text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          />
        </div>
      </div>

      <div>
        <label htmlFor="vp-email" className="block font-semibold text-navy">
          Email address <span className="font-normal text-gray-500">(required)</span>
        </label>
        <p id="vp-email-hint" className="mt-1 text-sm text-gray-500">
          We&rsquo;ll unlock the assessment on this address, so use the one you&rsquo;ll sign in
          with.
        </p>
        <input
          id="vp-email"
          type="email"
          required
          autoComplete="email"
          aria-describedby="vp-email-hint"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          className="mt-2 min-h-[48px] w-full rounded-lg border border-gray-300 px-4 text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        />
      </div>

      <div>
        <label htmlFor="vp-retailer" className="block font-semibold text-navy">
          Where did you preorder? <span className="font-normal text-gray-500">(required)</span>
        </label>
        <select
          id="vp-retailer"
          required
          value={form.retailer}
          onChange={(e) => set('retailer', e.target.value)}
          className="mt-2 min-h-[48px] w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          <option value="">Choose one…</option>
          {RETAILERS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="vp-order" className="block font-semibold text-navy">
          Order or confirmation number <span className="font-normal text-gray-500">(required)</span>
        </label>
        <input
          id="vp-order"
          type="text"
          required
          value={form.orderRef}
          onChange={(e) => set('orderRef', e.target.value)}
          className="mt-2 min-h-[48px] w-full rounded-lg border border-gray-300 px-4 font-mono text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        />
      </div>

      <div ref={turnstileRef} className="min-h-[65px]" />

      <button
        type="submit"
        disabled={state === 'sending'}
        className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-navy px-8 font-bold text-white transition-colors hover:bg-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60 sm:w-auto"
      >
        {state === 'sending' ? 'Submitting…' : 'Submit for verification'}
      </button>
    </form>
  )
}

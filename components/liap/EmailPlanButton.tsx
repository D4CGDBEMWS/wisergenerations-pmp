'use client'

import { useState } from 'react'
import { trackLiap } from '@/lib/liap/analytics'

// ---------------------------------------------------------------------------
// §24. The customer already gave us their address at checkout; asking again is
// friction with no benefit, and a second address is a second place for the
// plan to go astray. The button sends to the address on the account and the
// page shows a masked version of it so they can see where.
//
// The token identifies the assessment. The address is never accepted from the
// browser — otherwise this endpoint would happily mail somebody's plan
// anywhere, which is exactly the shape of leak the opaque URL exists to avoid.
// ---------------------------------------------------------------------------

export function EmailPlanButton({ token }: { token: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function send() {
    setState('sending')
    setError(null)
    try {
      const res = await fetch('/api/liap/results/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'We could not send it just now. Please try again in a moment.')
        setState('idle')
        return
      }
      trackLiap('liap_results_email_sent')
      setState('sent')
    } catch {
      setError('You appear to be offline. Your plan is safe here — try again once reconnected.')
      setState('idle')
    }
  }

  if (state === 'sent') {
    return (
      <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
        Sent. It should arrive within a minute — check spam if it does not.
      </p>
    )
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={send}
        disabled={state === 'sending'}
        className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-navy px-6 font-bold text-white transition-colors hover:bg-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60 sm:w-auto"
      >
        {state === 'sending' ? 'Sending…' : 'Send my plan'}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

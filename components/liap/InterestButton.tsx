'use client'

import { useState } from 'react'
import { trackLiap } from '@/lib/liap/analytics'

// ---------------------------------------------------------------------------
// §30. Registers interest in something that does not exist yet.
//
// One button, no price, no date, no checkout. "Do not sell unfinished
// products" is easy to violate by accident — a pre-order button for a workshop
// with no date is a sale, whatever the label says — so this only records that
// someone asked to be told.
// ---------------------------------------------------------------------------

export function InterestButton({
  interest,
  label,
}: {
  interest: 'workshop' | 'starter_kit'
  label: string
}) {
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function join() {
    setState('saving')
    setError(null)
    try {
      const res = await fetch('/api/liap/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interest }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'We could not add you just now. Please try again.')
        setState('idle')
        return
      }
      trackLiap('liap_next_offer_clicked')
      setState('done')
    } catch {
      setError('You appear to be offline. Please try again once reconnected.')
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <p role="status" className="mt-4 text-sm font-medium text-emerald-800">
        You&rsquo;re on the list. We&rsquo;ll email you when it opens.
      </p>
    )
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={join}
        disabled={state === 'saving'}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-navy px-5 text-sm font-bold text-navy transition-colors hover:bg-navy hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:opacity-60"
      >
        {state === 'saving' ? 'Adding…' : label}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'

// ---------------------------------------------------------------------------
// The Retreat registration button. Server-side checkout, like the book
// pre-buy: the price comes from lib/liap/product.ts. A failure says what
// happened and leaves the button usable.
// ---------------------------------------------------------------------------

function referralFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return new URLSearchParams(window.location.search).get('p')
  } catch {
    return null
  }
}

export function RetreatCta({ label, className = '' }: { label: string; className?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setLoading(true)
    setError(null)
    try {
      const referral = referralFromUrl()
      const res = await fetch('/api/liap/retreat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referral ? { p: referral } : {}),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'We could not start checkout. Please try again in a moment.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('We could not reach the payment service. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gold px-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-navy disabled:opacity-60"
      >
        {loading ? 'Opening secure checkout…' : label}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  )
}

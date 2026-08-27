'use client'

import { useState } from 'react'
import { trackLiap } from '@/lib/liap/analytics'

// ---------------------------------------------------------------------------
// The preorder button.
//
// A button rather than a link because checkout is created server-side: the
// price must come from lib/liap/product.ts, not from anything the browser can
// change on the way past.
//
// The failure path is as considered as the success path. §35 asks that no raw
// system error reaches a customer, and a payment button that silently does
// nothing is the version people abandon — so a failure says what happened and
// leaves the button usable.
//
// ── CARRYING THE PARTNER CODE ──────────────────────────────────────────────
//
// A visitor who scanned a partner's QR arrived here via /liap/go/{code},
// which put `?p={code}` on the URL. That code is posted with the checkout
// request so the sale can be credited to the shop, church or barbershop whose
// sign they scanned.
//
// Read from the URL at click time rather than held in state, because that is
// where it actually is and there is nothing to keep in sync. No cookie is
// involved: pressing a preorder button is an intentional act, and an
// intentional act needs no tracking to attribute.
//
// The code is a public string off a postcard. It selects who gets credit and
// nothing else — the price and the product come from the server.
// ---------------------------------------------------------------------------

/** The partner code on the current URL, if the visitor arrived with one. */
function referralFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return new URLSearchParams(window.location.search).get('p')
  } catch {
    return null
  }
}

export function LiapCta({
  label = 'Preorder + unlock my assessment',
  className = '',
}: {
  label?: string
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setLoading(true)
    setError(null)
    trackLiap('liap_preorder_clicked')

    try {
      const referral = referralFromUrl()
      const res = await fetch('/api/liap/preorder', {
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
      // Deliberately not resetting loading: the page is navigating away, and
      // a button that flicks back to "ready" mid-redirect invites a second tap
      // and a second checkout session.
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
        className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-gold px-8 text-base font-bold text-navy transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {loading ? 'Opening secure checkout…' : label}
      </button>

      {/* role="alert" so a screen reader is told, rather than the message
          appearing silently below a button the user is still focused on. */}
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

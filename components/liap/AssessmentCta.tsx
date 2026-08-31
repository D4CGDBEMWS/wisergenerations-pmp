'use client'

import { useState } from 'react'
import { trackLiap } from '@/lib/liap/analytics'

// ---------------------------------------------------------------------------
// The standalone Life Project-Ready™ Assessment button. $29.
//
// A button rather than a link, for the same reason the preorder button is one:
// the checkout session is created server-side so the price comes from
// lib/liap/product.ts and not from anything the browser can edit on the way
// past. This component names no amount at all — the price beside it is display
// text, and the charge is decided by the server that never reads this page.
//
// No partner code. Referral codes are printed on book collateral and credit a
// book sale; a standalone assessment purchase is not a book sale.
//
// The failure path matters as much as the success path: a payment button that
// silently does nothing is the version people abandon, so a failure says what
// happened and leaves the button usable.
// ---------------------------------------------------------------------------

export function AssessmentCta({
  label = 'TAKE THE ASSESSMENT',
  priceLabel,
  className = '',
}: {
  label?: string
  /** Shown with the button, never beside the page title. */
  priceLabel?: string
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setLoading(true)
    setError(null)
    trackLiap('liap_assessment_purchase_clicked')

    try {
      const res = await fetch('/api/liap/assessment-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = (await res.json()) as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        setError(data.error ?? 'We could not start checkout. Please try again in a moment.')
        setLoading(false)
        return
      }
      // Deliberately not resetting loading: the page is navigating away, and a
      // button that flicks back to "ready" mid-redirect invites a second tap
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
        className="inline-flex min-h-[56px] w-full items-center justify-center gap-3 rounded-xl bg-navy px-8 text-base font-bold tracking-wide text-white transition-colors hover:bg-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {loading ? (
          'Opening secure checkout…'
        ) : (
          <>
            <span>{label}</span>
            {priceLabel && (
              // The price lives HERE, with the action, and nowhere near the
              // page title. Owner visual requirement.
              <span
                aria-hidden="true"
                className="h-5 w-px shrink-0 bg-white/30"
              />
            )}
            {priceLabel && <span className="text-gold">{priceLabel}</span>}
          </>
        )}
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

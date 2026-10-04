'use client'

import { useId, useState } from 'react'
import {
  LEGACY_KIT_CHECKOUT_OPEN,
  LEGACY_KIT_CONSENT_VERSION,
  LEGACY_KIT_CONSENTS,
  LEGACY_KIT_PRICE_DISPLAY,
} from '@/lib/legacy-kit/product'

// ---------------------------------------------------------------------------
// The purchase box: price, the two required consent boxes, and the Buy button.
//
// Both boxes are shown to every buyer. Stripe's hosted checkout cannot show a
// box only to EU/UK buyers, and the country is not known before checkout, so
// the waiver box is shown to everyone — the owner's stated fallback.
//
// The button stays disabled until both are ticked. That is a convenience only:
// app/api/legacy-kit/checkout re-checks both on the server, and the wording
// version, and refuses otherwise.
// ---------------------------------------------------------------------------

export function BuyBox() {
  const [notices, setNotices] = useState(false)
  const [waiver, setWaiver] = useState(false)
  const noticesId = useId()
  const waiverId = useId()
  const statusId = useId()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ready = notices && waiver
  const canBuy = LEGACY_KIT_CHECKOUT_OPEN && ready && !busy

  async function buy() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/legacy-kit/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notices, waiver, consentVersion: LEGACY_KIT_CONSENT_VERSION }),
      })
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null
      if (res.ok && data?.url) {
        window.location.assign(data.url)
        return
      }
      setError(data?.error ?? 'We could not start checkout. Please try again in a moment.')
    } catch {
      setError('We could not reach checkout. Check your connection and try again.')
    }
    setBusy(false)
  }

  return (
    <div className="min-w-0 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sand sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-gray-600">One household</p>
      <p className="mt-1 text-4xl font-bold text-evergreen">
        {LEGACY_KIT_PRICE_DISPLAY}
        <span className="ml-2 text-base font-medium text-gray-600">USD, one-time</span>
      </p>
      <p className="mt-2 text-base text-gray-700">
        Fillable PDF workbook, delivered by email right after purchase. Taxes are calculated at
        checkout based on where you live.
      </p>

      <fieldset className="mt-6 space-y-4">
        <legend className="sr-only">Before you buy</legend>
        <div className="flex gap-3">
          <input
            id={noticesId}
            type="checkbox"
            checked={notices}
            onChange={(e) => setNotices(e.target.checked)}
            className="mt-1 h-5 w-5 flex-none accent-evergreen"
          />
          <label htmlFor={noticesId} className="text-base leading-relaxed text-gray-800">
            {LEGACY_KIT_CONSENTS.notices}{' '}
            <span>
              (<a
                href="#important-notices"
                // The notices sit in a tap-to-open panel; open it on the way
                // there so the buyer lands on the text, not a closed heading.
                onClick={() => {
                  const panel = document.getElementById('important-notices')
                  if (panel instanceof HTMLDetailsElement) panel.open = true
                }}
                className="font-semibold text-evergreen underline"
              >
                Important Notices
              </a>
              {' · '}
              <a href="/legacy-kit/terms-of-sale" target="_blank" className="font-semibold text-evergreen underline">
                Terms of Sale
              </a>
              )
            </span>
          </label>
        </div>
        <div className="flex gap-3">
          <input
            id={waiverId}
            type="checkbox"
            checked={waiver}
            onChange={(e) => setWaiver(e.target.checked)}
            className="mt-1 h-5 w-5 flex-none accent-evergreen"
          />
          <label htmlFor={waiverId} className="text-base leading-relaxed text-gray-800">
            {LEGACY_KIT_CONSENTS.waiver}
          </label>
        </div>
      </fieldset>

      <button
        type="button"
        onClick={buy}
        disabled={!canBuy}
        aria-describedby={statusId}
        className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-gold px-7 text-lg font-bold text-evergreen transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-evergreen disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-600"
      >
        {!LEGACY_KIT_CHECKOUT_OPEN
          ? 'Checkout opens soon'
          : busy
            ? 'Opening secure checkout…'
            : `Buy the Legacy Kit — ${LEGACY_KIT_PRICE_DISPLAY}`}
      </button>
      <p id={statusId} role="status" className={`mt-3 text-sm ${error ? 'font-semibold text-red-700' : 'text-gray-600'}`}>
        {error
          ? error
          : !LEGACY_KIT_CHECKOUT_OPEN
          ? 'Purchasing is not open yet.'
          : ready
            ? 'You will finish payment on Stripe’s secure checkout page.'
            : 'Tick both boxes to continue.'}
      </p>
    </div>
  )
}

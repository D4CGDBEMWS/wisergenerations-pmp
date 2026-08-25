'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { writeConsent } from '@/lib/consent'
import { useConsent } from '@/components/useConsent'
import { isBareSurface } from '@/lib/shell'

export default function CookieBanner() {
  // The banner now writes the value Analytics actually reads. Previously it
  // wrote 'cookie-consent' and nothing consulted it, so declining changed
  // nothing — GA4 was already running.
  const consent = useConsent()
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(false)

  function accept() {
    writeConsent('accepted')
    setDismissed(true)
  }

  function decline() {
    writeConsent('essential')
    setDismissed(true)
  }

  // Never over a projected wall. A consent dialog covering a team's Road Event
  // in a paid Intensive is the wrong company showing up mid-session — and the
  // bare surfaces set no cookies of their own to consent to.
  if (isBareSurface(pathname)) return null

  if (consent !== null || dismissed) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      // Lets the AI Guide launcher measure this banner and sit above it
      // instead of covering the consent buttons.
      data-wg-bottom-chrome=""
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md sm:rounded-2xl sm:border"
    >
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-navy mb-1">We use cookies</p>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">
          We use cookies and similar technologies to improve your experience, analyze site traffic,
          and support our payment and scheduling tools. See our{' '}
          <Link href="/privacy-policy" className="text-gold underline hover:no-underline">
            Privacy Policy
          </Link>{' '}
          for details.
        </p>
        <div className="flex gap-3">
          <button
            onClick={accept}
            className="flex-1 rounded-lg bg-navy px-4 py-3 text-xs font-bold text-white transition hover:bg-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Accept All
          </button>
          <button
            onClick={decline}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-xs font-bold text-gray-600 transition hover:border-navy hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  )
}

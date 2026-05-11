'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie-consent')
      if (!consent) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  function accept() {
    try {
      localStorage.setItem('cookie-consent', 'accepted')
    } catch {}
    setVisible(false)
  }

  function decline() {
    try {
      localStorage.setItem('cookie-consent', 'declined')
    } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
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
            className="flex-1 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white transition hover:bg-navy/90"
          >
            Accept All
          </button>
          <button
            onClick={decline}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-xs font-bold text-gray-600 transition hover:border-navy hover:text-navy"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  )
}

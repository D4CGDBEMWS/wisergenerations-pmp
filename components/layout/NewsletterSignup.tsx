'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// NewsletterSignup
// Navy section that sits directly above the Footer. POSTs to the existing
// /api/subscribe Mailchimp route, tagging subscribers as "newsletter" so they
// can be segmented separately from enrollment leads.
// Includes Cloudflare Turnstile CAPTCHA to block bot submissions.
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

  useEffect(() => {
    if (!siteKey || !widgetRef.current) return

    function renderWidget() {
      if (!window.turnstile || !widgetRef.current) return
      if (widgetIdRef.current) return // already rendered
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        theme: 'dark',
        callback: (token: string) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(null),
        'error-callback': () => {
          setTurnstileToken(null)
          setStatus('error')
          setMessage('Security check failed. Please refresh and try again.')
        },
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      const existing = document.querySelector('script[src*="turnstile"]')
      if (!existing) {
        const script = document.createElement('script')
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
        script.async = true
        script.defer = true
        script.onload = renderWidget
        document.head.appendChild(script)
      } else {
        existing.addEventListener('load', renderWidget)
      }
    }

    return () => {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey])

  function resetWidget() {
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current)
    }
    setTurnstileToken(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'submitting') return

    if (siteKey && !turnstileToken) {
      setStatus('error')
      setMessage('Please complete the security check.')
      return
    }

    setStatus('submitting')
    setMessage('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          tags: ['newsletter'],
          source: 'newsletter',
          turnstileToken,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setStatus('error')
        setMessage(data?.error || 'Could not sign you up. Please try again.')
        resetWidget()
        return
      }

      setStatus('success')
      setMessage('\u2713 You\u2019re in! Check your inbox for a welcome from Crystal.')
      setEmail('')
      setTurnstileToken(null)
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
      resetWidget()
    }
  }

  return (
    <section className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-gold text-xs font-bold uppercase tracking-[0.18em]">
              Free Weekly Insights
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight">
              PM Tips from Crystal &mdash; Straight to Your Inbox
            </h2>
            <p className="mt-3 text-sm text-gray-300 max-w-md">
              Exam tips, cohort announcements, and real-world PM wisdom. No spam. Unsubscribe anytime.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'submitting' || status === 'success'}
                className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-400 outline-none transition focus:border-gold focus:bg-white/15 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === 'submitting' || status === 'success' || (!!siteKey && !turnstileToken)}
                className="rounded-lg bg-gold px-5 py-3 text-sm font-bold text-navy transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === 'submitting' ? 'Subscribing\u2026' : 'Subscribe'}
              </button>
            </div>

            {siteKey && (
              <div ref={widgetRef} className="mt-1" />
            )}

            {message ? (
              <p
                role={status === 'error' ? 'alert' : 'status'}
                className={`text-sm ${status === 'error' ? 'text-red-300' : 'text-emerald-300'}`}
              >
                {message}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  )
}

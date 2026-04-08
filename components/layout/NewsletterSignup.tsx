'use client'

import { FormEvent, useState } from 'react'

// ---------------------------------------------------------------------------
// NewsletterSignup
// Navy section that sits directly above the Footer.  POSTs to the existing
// /api/subscribe Mailchimp route, tagging subscribers as "newsletter" so they
// can be segmented separately from enrollment leads.
// ---------------------------------------------------------------------------
export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'submitting') return

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
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setStatus('error')
        setMessage(data?.error || 'Could not sign you up. Please try again.')
        return
      }

      setStatus('success')
      setMessage('You\u2019re subscribed! Check your inbox for confirmation.')
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <section className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-gold text-xs font-bold uppercase tracking-[0.18em]">
              Stay in the loop
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight">
              PMP® tips, exam updates, and study resources — straight to your inbox.
            </h2>
            <p className="mt-3 text-sm text-gray-300 max-w-md">
              Monthly newsletter from Wiser Generations™. No spam. Unsubscribe anytime.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-400 outline-none transition focus:border-gold focus:bg-white/15"
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="rounded-lg bg-gold px-5 py-3 text-sm font-bold text-navy transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === 'submitting' ? 'Subscribing\u2026' : 'Subscribe'}
              </button>
            </div>
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

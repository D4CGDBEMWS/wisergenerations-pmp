'use client'

import { FormEvent, useRef, useState } from 'react'
import Turnstile, { useTurnstile } from 'react-turnstile'

// ---------------------------------------------------------------------------
// NewsletterSignup
// Navy section that sits directly above the Footer. POSTs to the existing
// /api/subscribe Mailchimp route, tagging subscribers as "newsletter" so they
// can be segmented separately from enrollment leads.
// Includes Cloudflare Turnstile CAPTCHA to block bot submissions.
// ---------------------------------------------------------------------------
export default function NewsletterSignup() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
    const turnstile = useTurnstile()
    const turnstileRef = useRef<HTMLDivElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (status === 'submitting') return

      if (!turnstileToken) {
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
                    turnstile.reset()
                    setTurnstileToken(null)
                    return
          }

          setStatus('success')
              setMessage('\u2713 You\u2019re in! Check your inbox for a welcome from Crystal.')
              setEmail('')
              setTurnstileToken(null)
      } catch {
              setStatus('error')
              setMessage('Something went wrong. Please try again.')
              turnstile.reset()
              setTurnstileToken(null)
      }
  }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

  return (
        <section className="bg-navy text-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                      <div className="grid gap-8 md:grid-cols-2 md:items-center">
                                <div>
                                            <p className="text-gold text-xs font-bold uppercase tracking-[0.18em]">
                                                          Free Weekly Insights
                                            </p>p>
                                            <h2 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight">
                                                          PM Tips from Crystal &mdash; Straight to Your Inbox
                                            </h2>h2>
                                            <p className="mt-3 text-white/70 text-sm leading-relaxed">
                                                          Exam tips, cohort announcements, and real-world PM wisdom. No spam.
                                                          Unsubscribe anytime.
                                            </p>p>
                                </div>div>
                      
                                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                            <label htmlFor="newsletter-email" className="sr-only">
                                                          Email address
                                            </label>label>
                                            <input
                                                            id="newsletter-email"
                                                            name="email"
                                                            type="email"
                                                            required
                                                            placeholder="you@example.com"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            disabled={status === 'submitting' || status === 'success'}
                                                            className="w-full rounded-md px-4 py-3 text-navy text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50"
                                                          />
                                
                                  {siteKey && (
                        <div ref={turnstileRef}>
                                        <Turnstile
                                                            sitekey={siteKey}
                                                            onSuccess={(token) => setTurnstileToken(token)}
                                                            onExpire={() => setTurnstileToken(null)}
                                                            onError={() => {
                                                                                  setTurnstileToken(null)
                                                                                                        setStatus('error')
                                                                                                                              setMessage('Security check failed. Please refresh and try again.')
                                                              }}
                                                            theme="dark"
                                                          />
                        </div>div>
                                            )}
                                
                                            <button
                                                            type="submit"
                                                            disabled={status === 'submitting' || status === 'success' || !turnstileToken}
                                                            className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-navy hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                          >
                                              {status === 'submitting' ? 'Subscribing\u2026' : 'Subscribe'}
                                            </button>button>
                                
                                  {message && (
                        <p
                                          className={`text-sm ${
                                                              status === 'success' ? 'text-green-400' : 'text-red-400'
                                          }`}
                                        >
                          {message}
                        </p>p>
                                            )}
                                </form>form>
                      </div>div>
              </div>div>
        </section>section>
      )
}</section>

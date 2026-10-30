'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// The author page's email sign-up: the free Words to Know guide, plus the
// Tuesday letter and the Saturday Weekly Tips.
//
// Its own component rather than a variant of NewsletterSignup, because the
// owner ruling of 22 August 2026 keeps book readers out of the PMP
// `newsletter` tag. These subscribers go into the same Mailchimp audience
// (owner decision, 2026-10-29) under Living Is a Project tags only:
//
//   liap-newsletter  — the Tuesday letter
//   liap-tips        — Saturday Weekly Tips
//   liap-words-to-know — always applied; it is what the visitor asked for
//
// Same /api/subscribe route, same Turnstile check, same double opt-in.
// ---------------------------------------------------------------------------

export const AUTHOR_SIGNUP_BASE_TAG = 'liap-words-to-know'
export const AUTHOR_SIGNUP_TAGS = { letter: 'liap-newsletter', tips: 'liap-tips' } as const

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export function AuthorSignup() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [letter, setLetter] = useState(true)
  const [tips, setTips] = useState(true)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

  useEffect(() => {
    if (!siteKey || !widgetRef.current) return

    function renderWidget() {
      if (!window.turnstile || !widgetRef.current || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        theme: 'light',
        callback: (token: string) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(null),
        'error-callback': () => setTurnstileToken(null),
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
    if (window.turnstile && widgetIdRef.current) window.turnstile.reset(widgetIdRef.current)
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

    const tags: string[] = [AUTHOR_SIGNUP_BASE_TAG]
    if (letter) tags.push(AUTHOR_SIGNUP_TAGS.letter)
    if (tips) tags.push(AUTHOR_SIGNUP_TAGS.tips)

    setStatus('submitting')
    setMessage('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, tags, source: 'liap-author-page', turnstileToken }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setStatus('error')
        setMessage(data?.error || 'Could not sign you up. Please try again.')
        resetWidget()
        return
      }

      setStatus('success')
      setMessage('Your guide is ready. Download it below — we’ve also emailed you the link.')
      setEmail('')
      setFirstName('')
      setLastName('')
      setTurnstileToken(null)
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
      resetWidget()
    }
  }

  const done = status === 'success'

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto mt-8 flex max-w-xl flex-col gap-4 rounded-2xl border-2 border-[#CC9C48] bg-white p-6 text-left sm:p-7"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="author-signup-first" className="text-sm font-semibold text-navy">
            First name
          </label>
          <input
            id="author-signup-first"
            name="firstName"
            type="text"
            autoComplete="given-name"
            maxLength={80}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={status === 'submitting' || done}
            className="min-h-[48px] rounded-full border border-[#CDBFA6] bg-white px-4 text-base text-navy outline-none focus:border-[#A86F14] focus:ring-2 focus:ring-[#CC9C48]/40 disabled:opacity-60"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="author-signup-last" className="text-sm font-semibold text-navy">
            Last name
          </label>
          <input
            id="author-signup-last"
            name="lastName"
            type="text"
            autoComplete="family-name"
            maxLength={80}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={status === 'submitting' || done}
            className="min-h-[48px] rounded-full border border-[#CDBFA6] bg-white px-4 text-base text-navy outline-none focus:border-[#A86F14] focus:ring-2 focus:ring-[#CC9C48]/40 disabled:opacity-60"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="author-signup-email" className="text-sm font-semibold text-navy">
          Email address
        </label>
        <input
          id="author-signup-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'submitting' || done}
          className="min-h-[48px] rounded-full border border-[#CDBFA6] bg-white px-4 text-base text-navy outline-none focus:border-[#A86F14] focus:ring-2 focus:ring-[#CC9C48]/40 disabled:opacity-60"
        />
      </div>

      <fieldset className="flex flex-wrap gap-x-7 gap-y-1">
        <legend className="mb-1 text-sm font-semibold text-navy">Also send me</legend>
        <label className="flex min-h-[44px] items-center gap-2.5 text-[15px] text-[#1E2F55]">
          <input
            type="checkbox"
            checked={letter}
            onChange={(e) => setLetter(e.target.checked)}
            disabled={done}
            className="h-5 w-5 accent-navy"
          />
          The Tuesday letter
        </label>
        <label className="flex min-h-[44px] items-center gap-2.5 text-[15px] text-[#1E2F55]">
          <input
            type="checkbox"
            checked={tips}
            onChange={(e) => setTips(e.target.checked)}
            disabled={done}
            className="h-5 w-5 accent-navy"
          />
          Saturday Weekly Tips
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={status === 'submitting' || done || (!!siteKey && !turnstileToken)}
        className="min-h-[52px] rounded-full bg-navy px-6 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#12305e] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === 'submitting' ? 'Sending…' : 'Send me the free guide'}
      </button>

      {siteKey && <div ref={widgetRef} />}

      {message ? (
        <p
          role={status === 'error' ? 'alert' : 'status'}
          className={`text-sm ${status === 'error' ? 'text-red-700' : 'font-medium text-navy'}`}
        >
          {message}
        </p>
      ) : null}

      {done ? (
        <a
          href="/liap/author/words-to-know.pdf"
          download
          className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#CC9C48] px-6 text-sm font-semibold uppercase tracking-[0.14em] text-navy"
        >
          Download Words to Know (PDF)
        </a>
      ) : null}

      <p className="text-[13px] text-[#5A5F70]">
        Living Is a Project emails only — separate from PMP updates. Unsubscribe anytime.{' '}
        <a href="/privacy-policy" className="text-[#8A5A0C] underline">
          Privacy policy
        </a>
      </p>
    </form>
  )
}

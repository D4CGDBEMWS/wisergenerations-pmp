'use client'

import { FormEvent, useState } from 'react'

// ---------------------------------------------------------------------------
// PracticeQuestionsLeadForm
// Mid-page lead magnet on /resources/practice-questions.
// Posts to /api/subscribe with the "practice-questions" tag so Crystal can
// segment these leads in Mailchimp separately from the newsletter.
// ---------------------------------------------------------------------------
export default function PracticeQuestionsLeadForm() {
  const [firstName, setFirstName] = useState('')
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
          firstName,
          tags: ['practice-questions'],
          source: 'practice-questions',
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setStatus('error')
        setMessage(data?.error || 'Could not sign you up. Please try again.')
        return
      }
      setStatus('success')
      setMessage(
        'Check your inbox — a fresh batch of PMP® practice questions is on the way.'
      )
      setFirstName('')
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="rounded-3xl border-2 border-gold bg-gradient-to-br from-navy to-slate-900 p-8 text-white shadow-lg">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
        Want 25 more practice questions?
      </p>
      <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        Get the next batch sent to your inbox — free.
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">
        Drop your name and email and we&rsquo;ll send 25 more PMP® exam-style questions with full
        answer explanations. No spam, unsubscribe anytime.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" noValidate>
        <label className="sr-only" htmlFor="pq-firstName">First name</label>
        <input
          id="pq-firstName"
          type="text"
          required
          autoComplete="given-name"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-400 outline-none transition focus:border-gold focus:bg-white/15"
        />
        <label className="sr-only" htmlFor="pq-email">Email address</label>
        <input
          id="pq-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-400 outline-none transition focus:border-gold focus:bg-white/15"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="rounded-lg bg-gold px-6 py-3 text-sm font-bold text-navy transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'submitting' ? 'Sending\u2026' : 'Send me 25 more'}
        </button>
      </form>

      {message ? (
        <p
          role={status === 'error' ? 'alert' : 'status'}
          className={`mt-3 text-sm ${status === 'error' ? 'text-red-300' : 'text-emerald-300'}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}

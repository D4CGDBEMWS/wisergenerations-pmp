'use client'

import { FormEvent, useState } from 'react'

// ---------------------------------------------------------------------------
// BlogLaunchSignup
// Email capture for the /resources/blog launch list. Posts to /api/subscribe
// with the "blog-launch" tag so Crystal can notify these subscribers when
// the first post drops.
// ---------------------------------------------------------------------------
export default function BlogLaunchSignup() {
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
          tags: ['blog-launch'],
          source: 'blog-launch-list',
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setStatus('error')
        setMessage(data?.error || 'Could not sign you up. Please try again.')
        return
      }
      setStatus('success')
      setMessage('You\u2019re on the list. We\u2019ll email you the moment the first post lands.')
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start"
      noValidate
    >
      <label className="sr-only" htmlFor="blog-launch-email">
        Email address
      </label>
      <input
        id="blog-launch-email"
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
        className="rounded-lg bg-gold px-6 py-3 text-sm font-bold text-navy transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === 'submitting' ? 'Subscribing\u2026' : 'Notify me at launch'}
      </button>
      {message ? (
        <p
          role={status === 'error' ? 'alert' : 'status'}
          className={`mt-1 text-sm sm:basis-full ${
            status === 'error' ? 'text-red-300' : 'text-emerald-300'
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  )
}

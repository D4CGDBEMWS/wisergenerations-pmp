'use client'

import { useState } from 'react'

// ---------------------------------------------------------------------------
// The LIAP sign-in form.
//
// One field, and the word "password" appears only to say there is not one.
// Every extra field here is a reader standing in a bookshop deciding whether
// it is worth it.
//
// ── WHAT THE `program` FIELD IS AND IS NOT ─────────────────────────────────
//
// It selects LIAP language, the LIAP entitlement check and a LIAP destination.
// It is NOT a claim of access: the server looks up which entitlement the LIAP
// program requires and asks whether this address holds it. Sending
// `program: 'study'` from here would not obtain Study Access — it would ask a
// different question and, for a reader who has not bought it, get the same
// silence back.
//
// ── WHY THE ANSWER IS ALWAYS THE SAME ──────────────────────────────────────
//
// A wrong address, an address with no LIAP access, and an address in a program
// this form does not serve all produce the identical confirmation. Anything
// else would let the form be used to discover who is a customer — and, now
// that there is more than one program, which programs they belong to.
// ---------------------------------------------------------------------------

export function LiapAccessForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const address = email.trim().toLowerCase()
    if (!address) {
      setError('Please enter your email address.')
      return
    }

    setState('sending')
    try {
      const res = await fetch('/api/access/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: address, program: 'liap' }),
      })
      if (res.ok) {
        setState('sent')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Something went wrong. Please try again.')
        setState('idle')
      }
    } catch {
      setError('Network error. Please try again.')
      setState('idle')
    }
  }

  if (state === 'sent') {
    return (
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-navy">Check your inbox</h2>
        <p className="mt-2 leading-relaxed text-gray-600">
          If that address has LIAP access, a secure link is on its way to it. Open it on this
          device and you&rsquo;ll pick up where you left off.
        </p>
        <p className="mt-3 text-sm text-gray-500">
          The link works once and expires in 15 minutes.
        </p>
        <button
          type="button"
          onClick={() => {
            setState('idle')
            setEmail('')
          }}
          className="mt-4 text-sm font-semibold text-gold underline underline-offset-4"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="liap-email" className="text-sm font-semibold text-navy">
          Email address
        </label>
        <input
          id="liap-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={state === 'sending'}
        className="rounded-xl bg-gold px-6 py-4 text-base font-bold uppercase tracking-wide text-navy transition-colors disabled:opacity-60"
      >
        {state === 'sending' ? 'Sending…' : 'Send my secure link'}
      </button>

      <p className="text-sm text-gray-500">No password to remember.</p>
    </form>
  )
}

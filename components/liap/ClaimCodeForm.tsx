'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useTurnstile } from '@/components/useTurnstile'

// ---------------------------------------------------------------------------
// Registering the access code printed inside the book.
//
// Two fields, and the reason there are only two is the gift case: whoever is
// holding the book may never have bought anything from Wiser Generations, so
// the form cannot ask them to sign in first and cannot ask about an order.
// The code establishes that they hold a copy; the address is where their
// access will live.
//
// The code input is deliberately forgiving — case, spaces and dashes are all
// normalised on the server — because the alternative is a reader who typed
// their own code correctly being told it is wrong.
// ---------------------------------------------------------------------------

type Result = { alreadyEntitled?: boolean; message: string }

export function ClaimCodeForm() {
  const turnstileRef = useRef<HTMLDivElement>(null)
  const { token, reset, required } = useTurnstile(turnstileRef)

  const [form, setForm] = useState({ name: '', email: '', code: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (required && !token) {
      setError('Please complete the verification check below before submitting.')
      return
    }

    setState('sending')
    try {
      const res = await fetch('/api/liap/claim-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, turnstileToken: token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'We could not register that code. Please check it and try again.')
        setState('idle')
        reset()
        return
      }
      setResult({ alreadyEntitled: data.alreadyEntitled, message: data.message })
      setState('done')
    } catch {
      setError('You appear to be offline. Please try again once reconnected.')
      setState('idle')
      reset()
    }
  }

  if (state === 'done' && result) {
    return (
      <div
        role="status"
        className="mt-10 rounded-xl border-l-4 border-emerald-600 bg-emerald-50 p-5"
      >
        <h2 className="font-bold text-emerald-900">
          {result.alreadyEntitled ? 'You already have access.' : 'Your book is registered.'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900">{result.message}</p>
        <Link
          href="/living-is-a-project/access"
          className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-navy px-6 font-bold text-white transition-colors hover:bg-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Sign in to your assessment
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-6" noValidate>
      <div>
        <label htmlFor="claim-code" className="block text-sm font-semibold text-navy">
          Access code
        </label>
        <p className="mt-1 text-sm text-gray-500">
          On the card inside your book. Capitals, spaces and dashes don&rsquo;t matter.
        </p>
        <input
          id="claim-code"
          name="code"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="LIAP-XXXX-XXXX-XXXX-XXXX"
          value={form.code}
          onChange={(e) => set('code', e.target.value)}
          className="mt-2 min-h-[48px] w-full rounded-xl border border-gray-300 px-4 font-mono tracking-wider text-navy outline-none transition focus:border-navy"
        />
      </div>

      <div>
        <label htmlFor="claim-email" className="block text-sm font-semibold text-navy">
          Your email address
        </label>
        <p className="mt-1 text-sm text-gray-500">
          This is where your assessment will live. Use your own address, even if somebody else
          bought the book for you.
        </p>
        <input
          id="claim-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          className="mt-2 min-h-[48px] w-full rounded-xl border border-gray-300 px-4 text-navy outline-none transition focus:border-navy"
        />
      </div>

      <div>
        <label htmlFor="claim-name" className="block text-sm font-semibold text-navy">
          Your name <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <input
          id="claim-name"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="mt-2 min-h-[48px] w-full rounded-xl border border-gray-300 px-4 text-navy outline-none transition focus:border-navy"
        />
      </div>

      <div ref={turnstileRef} />

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'sending'}
        className="min-h-[48px] w-full rounded-xl bg-gold px-6 font-bold text-navy transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        {state === 'sending' ? 'Registering…' : 'Register my book'}
      </button>

      <p className="text-sm leading-relaxed text-gray-500">
        Each code registers one reader. Once it is registered it stays with that reader, even if
        the book is later lent or passed on.
      </p>
    </form>
  )
}

'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/components/Analytics'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export default function FreeGuidePage() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!firstName.trim() || !email.trim()) {
      setErrorMessage('Please enter your first name and email.')
      return
    }

    setFormState('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/free-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Something went wrong.')
      }

      setFormState('success')
      trackEvent('free_guide_download')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setFormState('error')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-slate-900">
            ← Wiser Generations Int’l™
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_420px] lg:items-start">

          {/* Left — Guide info */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-800">
              Free Download · 9-Page PDF
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              The PMP® Exam Is Changing<br />
              <span className="text-amber-500">July 8, 2026</span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              PMI confirmed a major exam overhaul. This free 9-page guide breaks down every
              domain change, new question format, and explains why certifying NOW is your
              smartest career move — before the format shifts.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                'Domain weight shifts & new ECO breakdown',
                'New AI & Sustainability content areas explained',
                'New question formats and what they mean for your prep',
                'Decision table: should YOU certify before July 8?',
                'Current exam vs. new exam — side-by-side comparison',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex items-center gap-4">
              <img
                src="/crystal-stewart.jpg"
                alt="Crystal Stewart, PMP®"
                className="h-14 w-14 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">Crystal Stewart, PMP®</p>
                <p className="text-xs text-slate-500">
                  The Project Management Evangelist™ · Founder, Enterprise Academy™
                </p>
              </div>
            </div>
          </div>

          {/* Right — Opt-in form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            {formState === 'success' ? (
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">Check your inbox!</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Your free guide is on its way to <strong>{email}</strong>. Check your spam
                  folder if it doesn't arrive within a few minutes.
                </p>
                <div className="mt-6 space-y-3">
                  <Link
                    href="/programs"
                    className="block w-full rounded-xl bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                  >
                    View Programs →
                  </Link>
                  <Link
                    href="https://calendly.com/space4grace/15min"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                  >
                    Book a Free Strategy Call
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white text-lg font-bold">
                      📋
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Free Guide</p>
                      <p className="text-sm font-semibold text-slate-900">The PMP® Exam Is Changing · 9-Page PDF</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                    <span>First name</span>
                    <input
                      required
                      type="text"
                      autoComplete="given-name"
                      placeholder="Crystal"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    />
                  </label>

                  <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                    <span>Email address</span>
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    />
                  </label>

                  {(formState === 'error' || errorMessage) ? (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {errorMessage}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={formState === 'submitting'}
                    className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {formState === 'submitting' ? 'Sending your guide…' : 'Get the Free Guide →'}
                  </button>

                  <p className="text-center text-xs text-slate-400">
                    No spam. Unsubscribe anytime.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Bottom CTA strip */}
      <section className="border-t border-slate-200 bg-white px-4 py-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm text-slate-500">
            Ready to certify before July 8?{' '}
            <Link href="https://calendly.com/space4grace/15min" className="font-semibold text-slate-900 underline underline-offset-2">
              Book a free 15-minute strategy call with Crystal →
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}

'use client'

import { FormEvent, useState } from 'react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  // Honeypot — must stay empty. Real users won't see it; bots will fill it.
  const [_hp, setHp] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage('Please fill in your name, email, and message.')
      setFormState('error')
      return
    }

    setFormState('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          _hp,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Something went wrong. Please try again.')
      }

      setFormState('success')
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
      setFormState('error')
    }
  }

  if (formState === 'success') {
    return (
      <div className="bg-light-navy rounded-2xl p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-navy">Message sent!</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Thanks for reaching out. Crystal or someone on the team will respond within 2 business days.
        </p>
        <button
          type="button"
          onClick={() => setFormState('idle')}
          className="mt-6 inline-flex rounded-lg border-2 border-navy text-navy font-semibold px-5 py-2 text-sm hover:bg-navy hover:text-white transition-colors"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <div className="bg-light-navy rounded-2xl p-8">
      <p className="font-bold text-navy mb-6">Send a Message</p>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Honeypot field — visually hidden, accessible-hidden, and tab-skipped. */}
        <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
          <label>
              <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={_hp}
              onChange={(e) => setHp(e.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5 text-sm font-medium text-navy">
            <span>Name</span>
            <input
              required
              type="text"
              autoComplete="name"
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-navy outline-none transition focus:border-gold"
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-navy">
            <span>Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-navy outline-none transition focus:border-gold"
            />
          </label>
        </div>

        <label className="block space-y-1.5 text-sm font-medium text-navy">
          <span>Subject <span className="text-gray-400 font-normal">(optional)</span></span>
          <input
            type="text"
            maxLength={200}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-navy outline-none transition focus:border-gold"
          />
        </label>

        <label className="block space-y-1.5 text-sm font-medium text-navy">
          <span>Message</span>
          <textarea
            required
            rows={6}
            maxLength={5000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-navy outline-none transition focus:border-gold resize-y"
          />
        </label>

        {formState === 'error' && errorMessage ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={formState === 'submitting'}
          className="w-full rounded-lg bg-gold text-navy font-bold px-4 py-3 text-sm hover:bg-amber-400 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
        >
          {formState === 'submitting' ? 'Sending…' : 'Send Message'}
        </button>

        <p className="text-center text-xs text-gray-500">
          Crystal or a team member responds within 2 business days.
        </p>
      </form>
    </div>
  )
}

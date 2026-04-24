'use client'

import type { Metadata } from 'next'
import { FormEvent, useState } from 'react'

// Note: metadata must be in a separate server component when using 'use client'.
// For this page we rely on the layout metadata. The title is set via generateMetadata
// in a wrapper or via the default layout title template.

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setMessage('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setStatus('error')
        setMessage(data?.error || 'Could not send your message. Please try again.')
        return
      }

      setStatus('success')
      setMessage('Your message was sent! Crystal or a team member will respond within 2 business days.')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again or email us directly.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

        {/* Contact info */}
        <div>
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Contact</p>
          <h1 className="text-3xl font-bold text-navy mb-4">Talk to Crystal</h1>
          <p className="text-gray-600 leading-relaxed mb-8">
            Questions about certification pathways, corporate packages, veteran benefits, or scheduling?
            Crystal or a team member responds within 2 business days.
          </p>
          <div className="space-y-5">
            {[
              ['Email', 'info@wisergenerations.com'],
              ['Location', 'Smyrna, GA (Metro Atlanta)'],
              ['Virtual', 'Nationwide via Zoom'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gold font-bold uppercase tracking-wider">{label}</p>
                <p className="text-navy font-medium text-sm mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 p-5 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-sm font-bold text-navy mb-2">Prefer to book directly?</p>
            <p className="text-xs text-gray-500 mb-3">
              Skip the form and schedule a free 15-minute strategy call with Crystal right now.
            </p>
            <a
              href="https://calendly.com/space4grace/15min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-xl bg-navy px-5 py-3 text-xs font-bold text-white transition hover:bg-navy/90"
            >
              Book a Free Call
            </a>
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-light-navy rounded-2xl p-8">
          <p className="font-bold text-navy mb-6">Send a Message</p>

          {status === 'success' ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
              <p className="text-emerald-800 text-sm font-medium">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1" htmlFor="contact-name">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Crystal Stewart"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1" htmlFor="contact-email">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1" htmlFor="contact-subject">
                  Subject
                </label>
                <select
                  id="contact-subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-1 focus:ring-gold bg-white"
                >
                  <option value="">Select a topic...</option>
                  <option value="PMP Program">PMP Program Inquiry</option>
                  <option value="CAPM Program">CAPM Program Inquiry</option>
                  <option value="Veterans Program">Veterans Program</option>
                  <option value="Corporate Training">Corporate Training</option>
                  <option value="Scheduling">Scheduling / Availability</option>
                  <option value="General">General Question</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1" htmlFor="contact-message">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us about your certification goals, timeline, or questions..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-1 focus:ring-gold resize-none"
                />
              </div>

              {status === 'error' && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 border border-red-200">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full rounded-xl bg-navy px-6 py-4 text-sm font-bold text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === 'submitting' ? 'Sending...' : 'Send Message'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                We respond within 2 business days. For faster help,{' '}
                <a href="https://calendly.com/space4grace/15min" className="text-gold hover:underline">
                  book a call directly
                </a>
                .
              </p>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}

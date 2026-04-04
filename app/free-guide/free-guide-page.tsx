'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function FreeGuidePage() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setStatus('success')
      // Trigger download
      const link = document.createElement('a')
      link.href = '/PMP-Exam-Change-Guide-WiserGenerations.pdf'
      link.download = 'PMP-Exam-Change-Guide-WiserGenerations.pdf'
      link.click()
    } catch (err: any) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-navy">
      {/* Top bar */}
      <div className="bg-gold text-navy text-center py-2.5 px-4 text-sm font-bold">
        ⚠️ PMP® exam changes July 8, 2026 — Get the free guide and certify before the format shifts.
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left — What they get */}
          <div className="text-white">
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-4">Free Download</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              The PMP® Exam Is Changing.<br />
              <span className="text-gold">Are You Ready?</span>
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              PMI is overhauling the PMP® exam on July 8, 2026. Download this free guide to understand
              exactly what is changing, what stays the same, and why certifying NOW on proven materials
              is your smartest career move.
            </p>

            <div className="space-y-4 mb-8">
              {[
                'Domain weight shifts — People, Process & Business Environment',
                'New question formats — case sets, graphics, pull-down lists',
                '6 new content areas including AI & Sustainability',
                'Decision table — should YOU certify before July 8?',
                'Wiser Generations cohort dates & what is included',
                'Real testimonials from PMP® certified graduates',
              ].map(item => (
                <div key={item} className="flex items-start gap-3">
                  <span className="text-gold font-bold text-lg mt-0.5">✓</span>
                  <p className="text-gray-200 text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-4">
              <p className="text-gray-200 text-sm italic leading-relaxed">
                "Her knowledge, training and mentorship helped me to clear my PMP on the very first try!"
              </p>
              <p className="text-gold text-xs font-bold mt-2">— Tai Cochran, MA Ed. HD, PMP® · CEO, HER PM</p>
            </div>
          </div>

          {/* Right — Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {status === 'success' ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-navy mb-3">Your Guide Is Downloading!</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Check your email — we also sent a copy to <strong>{email}</strong>.
                  Welcome to the Wiser Generations community!
                </p>
                <div className="bg-amber-50 border border-gold rounded-xl p-4 mb-6 text-left">
                  <p className="text-navy font-bold text-sm mb-1">⚡ Next Step</p>
                  <p className="text-gray-600 text-sm">
                    Book your free 15-minute strategy call with Crystal to map out your
                    personalized path to PMP® certification before July 8.
                  </p>
                </div>
                <a
                  href="https://calendly.com/space4grace/15min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gold text-navy font-bold py-4 rounded-xl text-center hover:bg-amber-400 transition-colors text-lg mb-3"
                >
                  Book My Free Strategy Call →
                </a>
                <Link href="/" className="text-sm text-gray-400 hover:text-navy transition-colors">
                  Back to home
                </Link>
              </div>
            ) : (
              <>
                {/* Ebook cover preview */}
                <div className="bg-navy rounded-xl p-6 mb-6 text-center">
                  <p className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Free Guide</p>
                  <p className="text-white font-bold text-lg leading-tight mb-1">
                    The PMP® Exam Is Changing July 8, 2026
                  </p>
                  <p className="text-gray-400 text-xs">What Every Aspiring PMP® Needs to Know</p>
                  <div className="mt-3 inline-block bg-gold text-navy text-xs font-bold px-3 py-1 rounded-full">
                    9-Page PDF • Free Instant Download
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-navy mb-2 text-center">
                  Get Instant Access
                </h2>
                <p className="text-gray-500 text-sm text-center mb-6">
                  Enter your info below and your free guide downloads immediately.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-navy mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Your first name"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-navy focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-navy mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-navy focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  {status === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                      {errorMsg || 'Something went wrong. Please try again.'}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-gold text-navy font-bold py-4 rounded-xl hover:bg-amber-400 transition-colors text-lg disabled:opacity-60"
                  >
                    {status === 'loading' ? 'Sending...' : 'Send Me the Free Guide →'}
                  </button>

                  <p className="text-xs text-gray-400 text-center leading-relaxed">
                    By submitting you agree to receive emails from Wiser Generations™.
                    We respect your privacy and never spam. Unsubscribe anytime.
                  </p>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-400">
                    Questions? Email us at{' '}
                    <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline">
                      info@wisergenerations.com
                    </a>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom trust bar */}
      <div className="border-t border-white/10 py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-center">
          {[
            { icon: '🏆', label: '87% First-Attempt Pass Rate' },
            { icon: '🎖️', label: 'Veterans Welcome' },
            { icon: '📋', label: 'PMI-Aligned Training' },
            { icon: '📍', label: 'Smyrna, GA · Virtual Nationwide' },
          ].map(item => (
            <div key={item.label} className="text-white">
              <p className="text-2xl mb-1">{item.icon}</p>
              <p className="text-xs text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

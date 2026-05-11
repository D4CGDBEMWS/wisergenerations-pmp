'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function AccessPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function go(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Please enter your email.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim().toLowerCase() }) })
      const data = await res.json()
      if (data.url) { window.location.href = data.url }
      else { setError(data.error || 'Something went wrong.'); setLoading(false) }
    } catch { setError('Network error.'); setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#0a1628] text-white py-16 px-4 text-center">
        <span className="inline-block bg-yellow-400 text-[#0a1628] text-sm font-bold px-4 py-1 rounded-full mb-4 uppercase">Study Access Package</span>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">PMP Study Tools<br /><span className="text-yellow-400">Exam Simulator + Flashcards</span></h1>
        <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">Interactive tools built for the current PMP exam. Practice smarter and pass faster.</p>
        <div className="flex items-center justify-center gap-4">
          <span className="text-5xl font-bold text-yellow-400">$47</span>
          <div className="text-left"><div className="text-gray-400 line-through">$97</div><div className="text-green-400 font-semibold">One-time - Lifetime access</div></div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <div id="checkout" className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-[#0a1628] mb-2">Get Instant Access</h2>
            <p className="text-gray-600 mb-6">Enter your email to proceed to secure Stripe checkout. Access activates immediately after payment.</p>
            <form onSubmit={go} className="space-y-4">
              <div>
                <label htmlFor="em" className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input id="em" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-[#0a1628] font-bold py-4 rounded-xl text-lg transition-colors disabled:opacity-60">
                {loading ? 'Redirecting...' : 'Get Access for $47'}
              </button>
              <p className="text-center text-xs text-gray-500">Secure checkout by Stripe. 30-day money-back guarantee.</p>
            </form>
            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-gray-600">Already purchased? <Link href="/access/login" className="text-yellow-600 font-semibold hover:underline">Sign in here</Link></p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#0a1628]">What is included:</h2>
            {[
              ['PMP Exam Simulator', '40+ practice questions across all 3 ECO domains with explanations and timed mode.'],
              ['PMBOK Flashcards', '85+ terms with flip-cards, mastery tracking, search, and category filters.'],
              ['Unlimited Retakes', 'Questions shuffle every session so you learn concepts, not just answers.'],
              ['Lifetime Access', 'One-time payment. Access forever including all future content updates.'],
              ['Credit Toward Full Program', '$47 is credited if you later enroll in the full PMP Prep coaching program.'],
            ].map(([t, d]) => (
              <div key={t} className="flex gap-4 items-start p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <div><h3 className="font-bold text-[#0a1628]">{t}</h3><p className="text-gray-600 text-sm">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-[#0a1628] text-white text-center">
        <h2 className="text-2xl font-bold mb-2">30-Day Money-Back Guarantee</h2>
        <p className="text-gray-300 mb-6">Not satisfied within 30 days? Email info@wisergenerations.com for a full refund. No questions asked.</p>
        <a href="#checkout" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-[#0a1628] font-bold py-4 px-10 rounded-xl text-lg">Get Access for $47</a>
      </section>
    </main>
  )
}

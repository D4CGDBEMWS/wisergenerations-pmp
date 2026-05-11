'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function AccessLoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Please enter your email.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/access/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      if (res.ok) { setSent(true) }
      else { const d = await res.json(); setError(d.error || 'Something went wrong.') }
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">📧</div>
          <h1 className="text-3xl font-bold text-[#0a1628] mb-4">Check Your Email</h1>
          <p className="text-gray-600 mb-6">If your email is registered, you will receive a sign-in link. Check your spam folder too.</p>
          <button onClick={() => setSent(false)} className="text-yellow-600 underline text-sm">Try a different email</button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔑</div>
          <h1 className="text-3xl font-bold text-[#0a1628] mb-2">Sign In to Study Tools</h1>
          <p className="text-gray-600">Enter the email you used to purchase the Study Access Package.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-[#0a1628] font-bold py-4 px-6 rounded-xl text-lg transition-colors disabled:opacity-60">
              {loading ? 'Sending...' : 'Send Sign-In Link'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            Do not have access yet?{' '}
            <Link href="/access" className="text-yellow-600 font-semibold hover:underline">Get the $47 Study Package</Link>
          </div>
        </div>
      </div>
    </main>
  )
}

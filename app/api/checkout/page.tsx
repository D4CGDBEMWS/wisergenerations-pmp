'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const PAYPAL_CLIENT_ID = 'Adm4lG0k4RQBveuuMNO8gvvwUUy-0PCNonB63A7wIBI-7dv5D5sPM9Wd4OBSzdTty0IOXq-WWmS85wy0'
const CALENDLY = 'https://calendly.com/space4grace/15min'

const PLANS = [
  {
    id: 'deposit',
    name: 'Reserve My Spot',
    price: 297,
    description: 'Secure your seat now — pay the balance before your cohort starts.',
    badge: 'Low Commitment',
    badgeColor: 'bg-blue-100 text-blue-800',
    features: [
      'Reserves your cohort seat',
      'Balance of $1,200 due before start',
      'Full access once balance is paid',
      'Refundable if cohort is cancelled',
    ],
  },
  {
    id: 'full',
    name: 'Pay in Full',
    price: 1497,
    description: 'Best value — full access immediately, no balance due.',
    badge: 'Most Popular',
    badgeColor: 'bg-gold text-navy',
    features: [
      '36 PMI-required contact hours',
      'Live weekly sessions + replay access',
      'Application & audit support',
      '500+ practice exam questions',
      'Private cohort community',
      'Direct access to Crystal, PMP®',
    ],
  },
]

export default function CheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState('full')
  const [step, setStep] = useState<'plan' | 'payment' | 'success'>('plan')
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe')
  const [loading, setLoading] = useState(false)
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const plan = PLANS.find(p => p.id === selectedPlan)!

  // Load PayPal SDK
  useEffect(() => {
    if (step === 'payment' && paymentMethod === 'paypal' && !paypalLoaded) {
      const script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`
      script.onload = () => setPaypalLoaded(true)
      document.body.appendChild(script)
    }
  }, [step, paymentMethod, paypalLoaded])

  // Render PayPal buttons
  useEffect(() => {
    if (paypalLoaded && paymentMethod === 'paypal' && (window as any).paypal) {
      const container = document.getElementById('paypal-button-container')
      if (container) container.innerHTML = ''
      ;(window as any).paypal.Buttons({
        createOrder: (_data: any, actions: any) => actions.order.create({
          purchase_units: [{
            amount: { value: plan.price.toString() },
            description: `Wiser Generations - PMP® Prep - ${plan.name}`,
          }],
        }),
        onApprove: async (_data: any, actions: any) => {
          await actions.order.capture()
          // Subscribe to Mailchimp
          await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName: name.split(' ')[0], email, tag: 'PMP Paid - PayPal' }),
          })
          setStep('success')
        },
        onError: () => setError('PayPal payment failed. Please try again.'),
      }).render('#paypal-button-container')
    }
  }, [paypalLoaded, paymentMethod, plan])

  const handleStripeCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, name, email }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error || 'Failed to create checkout session')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-navy mb-3">You're In!</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Welcome to Wiser Generations! A confirmation has been sent to <strong>{email}</strong>.
            Crystal will be in touch within 24 hours with your next steps.
          </p>
          <div className="bg-amber-50 border border-gold rounded-xl p-4 mb-6 text-left">
            <p className="text-navy font-bold mb-1">⚡ Book Your Kickoff Call</p>
            <p className="text-gray-600 text-sm">Schedule your onboarding call with Crystal to get your personalized study plan.</p>
          </div>
          <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
            className="block w-full bg-gold text-navy font-bold py-4 rounded-xl hover:bg-amber-400 transition-colors text-lg mb-4">
            Book My Kickoff Call →
          </a>
          <Link href="/" className="text-sm text-gray-400 hover:text-navy transition-colors">
            Return to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy text-white py-4 px-4 text-center">
        <p className="text-gold font-bold text-sm">⚡ Limited spots — April & May cohorts filling fast</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Enroll Now</p>
          <h1 className="text-4xl font-bold text-navy mb-3">PMP® Certification Prep</h1>
          <p className="text-gray-600 text-lg">Delivered by Crystal Stewart, PMP® — Wiser Generations™</p>
        </div>

        {step === 'plan' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {PLANS.map(p => (
                <div key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`rounded-2xl p-6 border-2 cursor-pointer transition-all ${
                    selectedPlan === p.id ? 'border-gold shadow-lg bg-white' : 'border-gray-200 bg-white hover:border-gold/50'
                  }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.badgeColor}`}>{p.badge}</span>
                      <h3 className="text-xl font-bold text-navy mt-2">{p.name}</h3>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                      selectedPlan === p.id ? 'border-gold bg-gold' : 'border-gray-300'
                    }`}>
                      {selectedPlan === p.id && <div className="w-2.5 h-2.5 rounded-full bg-navy" />}
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-navy mb-1">${p.price.toLocaleString()}</p>
                  <p className="text-gray-500 text-sm mb-4">{p.description}</p>
                  <ul className="space-y-2">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-gold font-bold mt-0.5">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Contact info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h3 className="font-bold text-navy mb-4">Your Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-navy mb-1">Full Name</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-navy mb-1">Email Address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors" />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!name || !email) { setError('Please enter your name and email.'); return }
                setError('')
                setStep('payment')
              }}
              className="w-full bg-gold text-navy font-bold py-4 rounded-xl hover:bg-amber-400 transition-colors text-lg">
              Continue to Payment →
            </button>
            {error && <p className="text-red-500 text-sm text-center mt-3">{error}</p>}
          </>
        )}

        {step === 'payment' && (
          <div className="max-w-lg mx-auto">
            {/* Order summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h3 className="font-bold text-navy mb-3">Order Summary</h3>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <p className="font-bold text-navy">PMP® Certification Prep</p>
                  <p className="text-gray-500 text-sm">{plan.name}</p>
                </div>
                <p className="text-2xl font-bold text-navy">${plan.price.toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center pt-3">
                <p className="text-gray-500 text-sm">Student: {name}</p>
                <p className="text-gray-500 text-sm">{email}</p>
              </div>
            </div>

            {/* Payment method toggle */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h3 className="font-bold text-navy mb-4">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('stripe')}
                  className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                    paymentMethod === 'stripe' ? 'border-gold bg-amber-50 text-navy' : 'border-gray-200 text-gray-600'
                  }`}>
                  💳 Credit / Debit Card
                </button>
                <button
                  onClick={() => setPaymentMethod('paypal')}
                  className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                    paymentMethod === 'paypal' ? 'border-gold bg-amber-50 text-navy' : 'border-gray-200 text-gray-600'
                  }`}>
                  🅿️ PayPal
                </button>
              </div>

              {paymentMethod === 'stripe' && (
                <>
                  {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm mb-4">{error}</div>}
                  <button
                    onClick={handleStripeCheckout}
                    disabled={loading}
                    className="w-full bg-navy text-white font-bold py-4 rounded-xl hover:bg-blue-900 transition-colors text-lg disabled:opacity-60">
                    {loading ? 'Redirecting to secure checkout...' : `Pay $${plan.price.toLocaleString()} with Card →`}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">🔒 Secured by Stripe — your card info never touches our servers</p>
                </>
              )}

              {paymentMethod === 'paypal' && (
                <>
                  {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm mb-4">{error}</div>}
                  <div id="paypal-button-container" className="min-h-[50px]">
                    {!paypalLoaded && <p className="text-center text-gray-400 text-sm py-4">Loading PayPal...</p>}
                  </div>
                </>
              )}
            </div>

            <button onClick={() => setStep('plan')} className="text-sm text-gray-400 hover:text-navy transition-colors">
              ← Back to plan selection
            </button>
          </div>
        )}

        {/* Trust signals */}
        <div className="mt-10 flex flex-wrap justify-center gap-8 text-center">
          {[
            { icon: '🏆', label: '87% First-Attempt Pass Rate' },
            { icon: '🔒', label: 'Secure Checkout' },
            { icon: '🎖️', label: 'Veterans Welcome' },
            { icon: '📋', label: 'PMI-Aligned' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-2xl mb-1">{item.icon}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const PAYPAL_CLIENT_ID = 'Adm4lG0k4RQBveuuMNO8gvvwUUy-0PCNonB63A7wIBI-7dv5D5sPM9Wd4OBSzdTty0IOXq-WWmS85wy0'
const CALENDLY = 'https://calendly.com/space4grace/15min'

const PLANS = [
  {
    id: 'deposit',
    name: 'Reserve My Spot',
    price: 297,
    description: 'Secure your seat now — pay the balance before your cohort starts.',
    badge: 'Low Commitment',
    badgeColor: 'bg-blue-100 text-blue-800',
    features: [
      'Reserves your cohort seat',
      'Balance of $1,200 due before start',
      'Full access once balance is paid',
      'Refundable if cohort is cancelled',
    ],
  },
  {
    id: 'full',
    name: 'Pay in Full',
    price: 1497,
    description: 'Best value — full access immediately, no balance due.',
    badge: 'Most Popular',
    badgeColor: 'bg-gold text-navy',
    features: [
      '36 PMI-required contact hours',
      'Live weekly sessions + replay access',
      'Application & audit support',
      '500+ practice exam questions',
      'Private cohort community',
      'Direct access to Crystal, PMP®',
    ],
  },
]

export default function CheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState('full')
  const [step, setStep] = useState<'plan' | 'payment' | 'success'>('plan')
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe')
  const [loading, setLoading] = useState(false)
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const plan = PLANS.find(p => p.id === selectedPlan)!

  // Load PayPal SDK
  useEffect(() => {
    if (step === 'payment' && paymentMethod === 'paypal' && !paypalLoaded) {
      const script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`
      script.onload = () => setPaypalLoaded(true)
      document.body.appendChild(script)
    }
  }, [step, paymentMethod, paypalLoaded])

  // Render PayPal buttons
  useEffect(() => {
    if (paypalLoaded && paymentMethod === 'paypal' && (window as any).paypal) {
      const container = document.getElementById('paypal-button-container')
      if (container) container.innerHTML = ''
      ;(window as any).paypal.Buttons({
        createOrder: (_data: any, actions: any) => actions.order.create({
          purchase_units: [{
            amount: { value: plan.price.toString() },
            description: `Wiser Generations - PMP® Prep - ${plan.name}`,
          }],
        }),
        onApprove: async (_data: any, actions: any) => {
          await actions.order.capture()
          // Subscribe to Mailchimp
          await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName: name.split(' ')[0], email, tag: 'PMP Paid - PayPal' }),
          })
          setStep('success')
        },
        onError: () => setError('PayPal payment failed. Please try again.'),
      }).render('#paypal-button-container')
    }
  }, [paypalLoaded, paymentMethod, plan])

  const handleStripeCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, name, email }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error || 'Failed to create checkout session')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-navy mb-3">You're In!</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Welcome to Wiser Generations! A confirmation has been sent to <strong>{email}</strong>.
            Crystal will be in touch within 24 hours with your next steps.
          </p>
          <div className="bg-amber-50 border border-gold rounded-xl p-4 mb-6 text-left">
            <p className="text-navy font-bold mb-1">⚡ Book Your Kickoff Call</p>
            <p className="text-gray-600 text-sm">Schedule your onboarding call with Crystal to get your personalized study plan.</p>
          </div>
          <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
            className="block w-full bg-gold text-navy font-bold py-4 rounded-xl hover:bg-amber-400 transition-colors text-lg mb-4">
            Book My Kickoff Call →
          </a>
          <Link href="/" className="text-sm text-gray-400 hover:text-navy transition-colors">
            Return to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy text-white py-4 px-4 text-center">
        <p className="text-gold font-bold text-sm">⚡ Limited spots — April & May cohorts filling fast</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Enroll Now</p>
          <h1 className="text-4xl font-bold text-navy mb-3">PMP® Certification Prep</h1>
          <p className="text-gray-600 text-lg">Delivered by Crystal Stewart, PMP® — Wiser Generations™</p>
        </div>

        {step === 'plan' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {PLANS.map(p => (
                <div key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`rounded-2xl p-6 border-2 cursor-pointer transition-all ${
                    selectedPlan === p.id ? 'border-gold shadow-lg bg-white' : 'border-gray-200 bg-white hover:border-gold/50'
                  }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.badgeColor}`}>{p.badge}</span>
                      <h3 className="text-xl font-bold text-navy mt-2">{p.name}</h3>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                      selectedPlan === p.id ? 'border-gold bg-gold' : 'border-gray-300'
                    }`}>
                      {selectedPlan === p.id && <div className="w-2.5 h-2.5 rounded-full bg-navy" />}
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-navy mb-1">${p.price.toLocaleString()}</p>
                  <p className="text-gray-500 text-sm mb-4">{p.description}</p>
                  <ul className="space-y-2">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-gold font-bold mt-0.5">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Contact info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h3 className="font-bold text-navy mb-4">Your Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-navy mb-1">Full Name</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-navy mb-1">Email Address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors" />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!name || !email) { setError('Please enter your name and email.'); return }
                setError('')
                setStep('payment')
              }}
              className="w-full bg-gold text-navy font-bold py-4 rounded-xl hover:bg-amber-400 transition-colors text-lg">
              Continue to Payment →
            </button>
            {error && <p className="text-red-500 text-sm text-center mt-3">{error}</p>}
          </>
        )}

        {step === 'payment' && (
          <div className="max-w-lg mx-auto">
            {/* Order summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h3 className="font-bold text-navy mb-3">Order Summary</h3>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <p className="font-bold text-navy">PMP® Certification Prep</p>
                  <p className="text-gray-500 text-sm">{plan.name}</p>
                </div>
                <p className="text-2xl font-bold text-navy">${plan.price.toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center pt-3">
                <p className="text-gray-500 text-sm">Student: {name}</p>
                <p className="text-gray-500 text-sm">{email}</p>
              </div>
            </div>

            {/* Payment method toggle */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h3 className="font-bold text-navy mb-4">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('stripe')}
                  className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                    paymentMethod === 'stripe' ? 'border-gold bg-amber-50 text-navy' : 'border-gray-200 text-gray-600'
                  }`}>
                  💳 Credit / Debit Card
                </button>
                <button
                  onClick={() => setPaymentMethod('paypal')}
                  className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                    paymentMethod === 'paypal' ? 'border-gold bg-amber-50 text-navy' : 'border-gray-200 text-gray-600'
                  }`}>
                  🅿️ PayPal
                </button>
              </div>

              {paymentMethod === 'stripe' && (
                <>
                  {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm mb-4">{error}</div>}
                  <button
                    onClick={handleStripeCheckout}
                    disabled={loading}
                    className="w-full bg-navy text-white font-bold py-4 rounded-xl hover:bg-blue-900 transition-colors text-lg disabled:opacity-60">
                    {loading ? 'Redirecting to secure checkout...' : `Pay $${plan.price.toLocaleString()} with Card →`}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">🔒 Secured by Stripe — your card info never touches our servers</p>
                </>
              )}

              {paymentMethod === 'paypal' && (
                <>
                  {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm mb-4">{error}</div>}
                  <div id="paypal-button-container" className="min-h-[50px]">
                    {!paypalLoaded && <p className="text-center text-gray-400 text-sm py-4">Loading PayPal...</p>}
                  </div>
                </>
              )}
            </div>

            <button onClick={() => setStep('plan')} className="text-sm text-gray-400 hover:text-navy transition-colors">
              ← Back to plan selection
            </button>
          </div>
        )}

        {/* Trust signals */}
        <div className="mt-10 flex flex-wrap justify-center gap-8 text-center">
          {[
            { icon: '🏆', label: '87% First-Attempt Pass Rate' },
            { icon: '🔒', label: 'Secure Checkout' },
            { icon: '🎖️', label: 'Veterans Welcome' },
            { icon: '📋', label: 'PMI-Aligned' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-2xl mb-1">{item.icon}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

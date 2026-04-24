import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Fractional PM Leadership | Enterprise Academy™ Pods",
  description: "Fractional senior project management for growing teams. Starting at $5,000/month, 3-month minimum. LIAP™ framework. Delivered by Crystal Stewart and vetted pod leaders.",
}

const CALENDLY = 'https://calendly.com/space4grace/30min-pod'

const WHO_ITS_FOR = [
  {
    title: 'Growing Companies (Series A–C)',
    desc: "Need PM discipline you haven't hired yet. Get a seasoned pod leader embedded with your team—without the overhead of a full-time senior hire.",
    icon: '🚀',
  },
  {
    title: 'Established Teams',
    desc: 'Have a critical project without internal PM bandwidth. We step in, stabilize delivery, and hand off cleanly.',
    icon: '🏗️',
  },
  {
    title: 'PMOs in Transition',
    desc: 'Need senior expertise for stabilization or transformation. We bring the framework, the artifacts, and the muscle.',
    icon: '📊',
  },
]

const WHAT_INCLUDES = [
  'Weekly delivery cadence embedded with your team',
  'LIAP™ framework applied to your specific project',
  'Monthly executive reporting',
  'Team mentoring — we upskill your people while we execute',
  'Access to the full 17-artifact template library',
  '3-month minimum engagement; typically 6–12 months',
]

const HOW_WE_START = [
  { step: '01', title: 'Discovery call (30 min)', desc: "We listen, you decide if there's fit. No pitch deck. No pressure." },
  { step: '02', title: 'Scoping session (90 min)', desc: 'We dig into your specific project, team structure, and success criteria.' },
  { step: '03', title: 'Proposal and agreement', desc: 'You receive a clear scope, timeline, and investment summary within 5 business days.' },
  { step: '04', title: 'Kickoff', desc: "We're embedded with your team within 2 weeks of signature." },
]

export default function PodsPage() {
  return (
    <>
    <script dangerouslySetInnerHTML={{ __html: `if(typeof gtag==='function'){gtag('event','pod_discovery_click')}` }} />
      {/* Hero */}
      <section className="bg-navy text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-4">Enterprise Academy™ · Delivery Pods</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 max-w-4xl">
            Fractional Project Management Leadership for Growing Teams
          </h1>
          <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8 max-w-3xl">
            Senior PM capacity when you need it, without the full-time hire. Delivered by Enterprise Academy&apos;s vetted pod leaders, using the LIAP™ framework.
          </p>
          <a
            href={CALENDLY}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-amber-400 transition-colors text-lg"
          >
            Schedule a 30-Minute Discovery Call
          </a>
          <p className="text-gray-400 text-sm mt-4">B2B engagements only · Starting at $5,000/month · 3-month minimum</p>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Who It&apos;s For</p>
            <h2 className="text-3xl font-bold text-navy">Is a Delivery Pod Right for Your Team?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHO_ITS_FOR.map((item) => (
              <div key={item.title} className="bg-light-navy border border-navy/10 rounded-2xl p-6">
                <p className="text-4xl mb-4">{item.icon}</p>
                <h3 className="text-lg font-bold text-navy mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What a Pod Includes */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">The Engagement</p>
            <h2 className="text-3xl font-bold">What a Pod Includes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WHAT_INCLUDES.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                <span className="text-gold font-bold mt-0.5 flex-shrink-0">✓</span>
                <p className="text-gray-200 text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment */}
      <section className="py-16 bg-gold">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-navy text-sm font-bold uppercase tracking-widest mb-2">Investment</p>
          <h2 className="text-3xl font-bold text-navy mb-8">Transparent, Scalable Pricing</h2>
          <div className="bg-navy rounded-2xl p-8 mb-8 text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <p className="text-4xl font-bold text-gold">$5,000</p>
                <div>
                  <p className="text-white font-bold">per month</p>
                  <p className="text-gray-400 text-sm">Starting rate for a single pod leader</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {[
                  { label: 'Minimum Engagement', value: '3 months' },
                  { label: 'Typical Engagement', value: '6–12 months' },
                  { label: 'Larger Engagements', value: 'Custom scoping' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-gold font-bold text-lg">{item.value}</p>
                    <p className="text-gray-400 text-xs mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <a
            href={CALENDLY}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-navy text-white font-bold px-8 py-4 rounded-lg hover:bg-blue-900 transition-colors text-lg"
          >
            Schedule a 30-Minute Discovery Call
          </a>
        </div>
      </section>

      {/* How We Start */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">The Process</p>
            <h2 className="text-3xl font-bold text-navy">How We Start</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HOW_WE_START.map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gold rounded-xl flex items-center justify-center">
                  <span className="text-navy font-bold text-sm">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-bold text-navy mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* A New Offering */}
      <section className="py-16 bg-light-navy">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-4">Honest Framing</p>
          <h2 className="text-2xl font-bold text-navy mb-4">A New Offering</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Delivery Pods are a new Enterprise Academy service launching November 2026. Early clients receive founding-partner pricing and personal engagement from Crystal Stewart.
          </p>
          <p className="text-gray-500 text-sm">
            Questions?{' '}
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="text-gold font-bold hover:underline">
              Schedule a 30-minute discovery call
            </a>{' '}
            — no commitment required.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-navy">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Talk?</h2>
          <p className="text-gray-300 text-lg mb-8">
            A 30-minute call is all it takes to know if there&apos;s fit. No pitch. No pressure. Just a real conversation about your project.
          </p>
          <a
            href={CALENDLY}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-amber-400 transition-colors text-lg"
          >
            Schedule a 30-Minute Discovery Call
          </a>
          <p className="text-gray-500 text-sm mt-4">
            Or email us at{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline">
              info@wisergenerations.com
            </a>
          </p>
        </div>
      </section>
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Corporate Training — PMP® & CAPM® for Teams | Wiser Generations',
  description: 'Upskill your project management teams with PMI-aligned corporate training. Group rates, custom delivery, and measurable results for organizations of all sizes.',
}

const PACKAGES = [
  {
    id: 'corporate-team',
    icon: '🏢',
    name: 'Team Cohort Program',
    audience: 'Teams of 5–25 Professionals',
    color: 'border-gold',
    badge: 'Best Value',
    price: 0,
    description:
      'Send your team through a dedicated cohort of our PMP® or CAPM® program. Everyone learns the same framework, speaks the same language, and returns to work immediately more aligned and effective.',
    features: [
      'Dedicated cohort for your organization',
      'Live instructor-led sessions (virtual or on-site)',
      '35 PMI contact hours per participant',
      'Group exam application support',
      'Customized case studies from your industry',
      'Progress reporting for managers & HR',
    ],
  },
  {
    id: 'corporate-custom',
    icon: '⚙️',
    name: 'Custom Training Design',
    audience: 'Organizations with Specific PM Frameworks',
    color: 'border-navy',
    badge: '',
    price: 0,
    description:
      'Already using Agile, Scrum, or a proprietary PM methodology? We build training that bridges your internal processes with PMI standards — so your team gets certified without abandoning what works.',
    features: [
      'Curriculum aligned to your internal frameworks',
      'Hybrid Agile + Predictive content available',
      'CAPM® pathway for emerging PMs on your team',
      'Executive briefing sessions available',
      'LMS integration or standalone delivery',
      'Train-the-trainer option available',
    ],
  },
  {
    id: 'corporate-lunch',
    icon: '🎤',
    name: 'Lunch & Learn / Workshop',
    audience: 'Organizations Exploring PM Development',
    color: 'border-gold',
    badge: 'Quick Win',
    price: 0,
    description:
      'A 90-minute to half-day workshop introducing your team to project management fundamentals, PMP® certification pathways, and how structured PM improves delivery across your organization.',
    features: [
      '90-min, half-day, or full-day formats',
      'Virtual or on-site delivery',
      'Customized to your team\'s challenges',
      'Interactive exercises and Q&A',
      'Participant workbooks included',
      'Follow-up resource package',
    ],
  },
]

const BENEFITS = [
  { icon: '📈', title: 'Measurable ROI', desc: 'Certified PMs deliver projects on time and on budget more consistently. PMI research shows certified teams outperform uncertified peers.' },
  { icon: '🔗', title: 'Shared Language', desc: 'When your whole team speaks PMI — risk, scope, stakeholder, charter — collaboration improves and handoffs stop falling apart.' },
  { icon: '🎯', title: 'Retention Tool', desc: 'Offering PMP® training signals investment in your people. It\'s one of the highest-impact benefits you can offer high-performing PMs.' },
  { icon: '🏆', title: 'Competitive Advantage', desc: 'Clients and partners notice when your team holds credentials. It builds trust before a project even kicks off.' },
]

export default function CorporatePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-navy text-white py-20">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-3">
            Corporate Training
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Upskill Your Team.<br />
            <span className="text-gold">Deliver Better Projects.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mb-8">
            PMI-aligned PMP® and CAPM® training designed for organizations that are serious about project delivery. Group cohorts, custom curricula, and measurable outcomes — built around your team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className="bg-gold text-navy font-bold py-4 px-8 rounded-xl text-center hover:bg-yellow-400 transition-colors"
            >
              Request a Proposal
            </Link>
            <Link
              href="/programs"
              className="border-2 border-white text-white font-bold py-4 px-8 rounded-xl text-center hover:bg-white hover:text-navy transition-colors"
            >
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="bg-gold py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: 'Group', label: 'Rates for teams of 5 or more' },
              { stat: 'Virtual', label: 'or on-site delivery available' },
              { stat: 'PMI', label: 'Aligned — 35 contact hours included' },
              { stat: 'Custom', label: 'Curriculum options available' },
            ].map((o) => (
              <div key={o.stat}>
                <p className="text-3xl font-bold text-navy">{o.stat}</p>
                <p className="text-navy text-sm mt-1 leading-snug">{o.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-3">Corporate Training Options</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Every program is built on PMI standards and delivered by Crystal Stewart, PMP®. All packages include group pricing — contact us for a custom quote.
            </p>
          </div>

          <div className="space-y-8">
            {PACKAGES.map((p) => (
              <div key={p.id} className={`border-2 ${p.color} rounded-2xl p-8 md:p-10`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">{p.icon}</span>
                      <div>
                        <h2 className="text-2xl font-bold text-navy">{p.name}</h2>
                        <p className="text-gold text-sm font-medium">{p.audience}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-6">{p.description}</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-gold flex-shrink-0">✓</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div className="bg-light-navy rounded-xl p-6 text-center mb-4">
                      {p.badge && (
                        <p className="text-xs font-bold text-gold uppercase tracking-wider mb-2">{p.badge}</p>
                      )}
                      <p className="text-xl font-bold text-navy">Custom Pricing</p>
                      <p className="text-gray-500 text-sm mt-1">based on team size & format</p>
                    </div>
                    <div className="space-y-3">
                      <a
                        href="https://calendly.com/space4grace/15min"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-navy text-white font-bold py-3 rounded-xl text-center hover:bg-blue-900 transition-colors"
                      >
                        Request a Proposal
                      </a>
                      <a
                        href="https://calendly.com/space4grace/15min"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full border-2 border-gold text-gold font-bold py-3 rounded-xl text-center hover:bg-gold hover:text-navy transition-colors"
                      >
                        Learn More
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Invest */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Why Invest in PM Certification?</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              PMP® certification isn't just a credential — it's a shared operating system for how your team plans, executes, and delivers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {BENEFITS.map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <p className="text-4xl mb-4">{item.icon}</p>
                <h3 className="text-lg font-bold text-navy mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy text-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Let's Build Something for Your Team</h2>
          <p className="text-gray-300 text-lg mb-8">
            Tell us about your organization and goals. We'll put together a proposal within 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://calendly.com/space4grace/15min"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gold text-navy font-bold py-4 px-10 rounded-xl text-center hover:bg-yellow-400 transition-colors"
            >
              Request a Proposal
            </a>
            <Link
              href="/programs"
              className="border-2 border-white text-white font-bold py-4 px-10 rounded-xl text-center hover:bg-white hover:text-navy transition-colors"
            >
              Browse All Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

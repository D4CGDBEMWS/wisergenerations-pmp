import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Enroll — Wiser Generations Int’l™',
  description: 'Choose your PMP® or CAPM® certification program and book a free discovery call with Crystal Stewart.',
}

const PROGRAMS = [
  {
    id: 'pmp-accelerator',
    icon: '🎯',
    name: 'PMP® Accelerator',
    audience: 'Working Professionals & Career Transitioners',
    price: '$1,997',
    badge: 'Most Popular',
    features: ['35 PMI contact hours included', 'Live weekly sessions + replay', 'Practice exams & debrief', 'Cohort community access'],
  },
  {
    id: 'pmp-self-paced',
    icon: '📚',
    name: 'PMP® Self-Paced Prep',
    audience: 'Independent Learners',
    price: '$797',
    badge: '',
    features: ['35 contact hours certificate', 'Full video lesson library', '500+ practice questions', '6 months content access'],
  },
  {
    id: 'capm',
    icon: '🌱',
    name: 'CAPM® Career Launcher',
    audience: 'Early-Career & Career Changers',
    price: 'From $597',
    badge: '',
    features: ['23 PMI contact hours included', 'Beginner-friendly curriculum', 'Exam application support', 'Mentor check-ins'],
  },
  {
    id: 'veterans',
    icon: '🎖️',
    name: 'Veterans Pathway',
    audience: 'Military Veterans & Transitioning Service Members',
    price: 'Discounted',
    badge: 'Special Rate',
    features: ['Veteran-discounted tuition', 'Military experience translation', 'Peer veteran cohort', 'GI Bill guidance support'],
  },
  {
    id: 'corporate',
    icon: '🏢',
    name: 'Corporate Training',
    audience: 'Teams of 5 or More',
    price: 'Custom',
    badge: '',
    features: ['Dedicated team cohort', 'Custom curriculum options', 'Progress reporting for HR', 'Virtual or on-site delivery'],
  },
  {
    id: 'coaching',
    icon: '🤝',
    name: 'PMP® 1-on-1 Coaching',
    audience: 'Professionals Who Want Personal Support',
    price: 'Custom',
    badge: 'Premium',
    features: ['Bi-weekly coaching sessions', 'Custom study plan', 'Direct mentor access', 'Flexible 4 or 8 week packages'],
  },
]

export default function EnrollPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-navy text-white py-16">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-3">Enrollment</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Program
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Pick the path that fits your goals, then book a free 15-minute discovery call with Crystal to confirm your fit and get started.
          </p>
        </div>
      </section>

      {/* Program Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {PROGRAMS.map((p) => (
              <div key={p.id} className="border-2 border-gray-100 rounded-2xl p-6 hover:border-gold transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{p.icon}</span>
                    <div>
                      <h2 className="text-lg font-bold text-navy">{p.name}</h2>
                      <p className="text-gold text-xs font-medium">{p.audience}</p>
                    </div>
                  </div>
                  {p.badge && (
                    <span className="text-xs font-bold text-gold uppercase tracking-wider bg-light-navy px-2 py-1 rounded-lg">{p.badge}</span>
                  )}
                </div>
                <ul className="space-y-1 mb-4">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-gold flex-shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <p className="text-2xl font-bold text-navy">{p.price}</p>
                  <a
                    href="#book"
                    className="bg-navy text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-900 transition-colors"
                  >
                    Book a Call
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Calendly Embed */}
          <div id="book" className="scroll-mt-24">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-navy mb-3">Book Your Free Discovery Call</h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                15 minutes with Crystal to confirm your program fit, answer your questions, and get you set up to start. No pressure — just clarity.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm">
              <iframe
                src="https://calendly.com/space4grace/15min"
                width="100%"
                height="700"
                frameBorder="0"
                title="Book a discovery call with Crystal Stewart"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Reassurance */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-navy font-bold text-lg mb-2">Not sure which program is right for you?</p>
          <p className="text-gray-600 text-sm mb-4">That's exactly what the discovery call is for. Crystal will help you figure out the best path based on your experience, timeline, and goals.</p>
          <a href="mailto:info@wisergenerations.com" className="text-gold font-medium text-sm hover:underline">Or email us at info@wisergenerations.com</a>
        </div>
      </section>
    </div>
  )
}

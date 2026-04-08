import type { Metadata } from 'next'
import Link from 'next/link'
import TrustSignals from '@/components/marketing/TrustSignals'
import Faq from '@/components/marketing/Faq'

export const metadata: Metadata = {
  title: 'PMP® Certification Prep — Wiser Generations',
  description: 'Earn your PMP® credential with instructor-led training built for working professionals. PMI-aligned curriculum, exam prep, and ongoing coaching.',
}

const TRACKS = [
  {
    id: 'pmp-accelerator',
    icon: '🎯',
    name: 'PMP® Accelerator',
    audience: 'Working Professionals & Career Transitioners',
    color: 'border-gold',
    badge: 'Most Popular',
    price: 1997,
    description:
      'A focused, instructor-led program that takes you from application to exam-ready in 12 weeks. Built around real project scenarios so the content clicks — not just for the exam, but for your career.',
    features: [
      '35 PMI-required contact hours (included)',
      'Live weekly sessions + on-demand replay',
      'Application assistance & audit support',
      'Full-length practice exams with debrief',
      'Private cohort community access',
      'Exam attempt guarantee support',
    ],
  },
  {
    id: 'pmp-self-paced',
    icon: '📚',
    name: 'PMP® Self-Paced Prep',
    audience: 'Independent Learners',
    color: 'border-navy',
    badge: '',
    price: 797,
    description:
      'All the structure of the Accelerator — at your own pace. Access every lesson, practice exam, and resource on your schedule. Ideal if you already have PM experience and need focused exam prep.',
    features: [
      '35 contact hours certificate',
      'Full video lesson library',
      '500+ practice questions',
      'Downloadable study guides & templates',
      'Community forum access',
      '6 months of content access',
    ],
  },
  {
    id: 'pmp-coaching',
    icon: '🤝',
    name: 'PMP® 1-on-1 Coaching',
    audience: 'Professionals Who Want Personalized Support',
    color: 'border-gold',
    badge: 'Premium',
    price: 0,
    description:
      'Work directly with a certified PMP® mentor for personalized study planning, accountability check-ins, and targeted help on your weak areas. Best combined with the Accelerator or Self-Paced track.',
    features: [
      'Bi-weekly 1-on-1 coaching sessions',
      'Custom study plan built around your schedule',
      'Application & experience documentation support',
      'Targeted weak-area drills',
      'Direct mentor access via messaging',
      'Flexible 4- or 8-week packages',
    ],
  },
]

const OUTCOMES = [
  { stat: '87%', label: 'First-attempt pass rate among our students' },
  { stat: '35', label: 'PMI contact hours included — no extra cost' },
  { stat: '12 wks', label: 'Average time from enrollment to exam-ready' },
  { stat: '100%', label: 'PMI Exam Content Outline (ECO) aligned' },
]

const PMP_FAQ = [
  {
    q: 'Am I eligible to sit for the PMP® exam?',
    a: 'PMI® requires a 4-year degree plus 36 months of project leadership experience and 35 contact hours of project management education — OR a high school diploma plus 60 months of leadership experience and 35 contact hours. Our PMP® Accelerator includes the 35 contact hours and we walk you through the application process, including how to document your experience correctly.',
  },
  {
    q: 'How long does it take to prepare for the PMP® exam?',
    a: 'Most of our students go from enrollment to exam-ready in about 12 weeks, studying 8–12 hours per week. Working professionals with prior PM experience often move faster; career transitioners may take longer. We build a personalized study plan with you during onboarding.',
  },
  {
    q: 'What is the PMP® exam pass rate for Wiser Generations™ students?',
    a: 'Our students have an 87% first-attempt pass rate. The global average for first-attempt PMP® takers is significantly lower, which is why mentor-led prep, accountability, and full-length practice exams matter — and why we include all three in our Accelerator program.',
  },
  {
    q: 'What happens if I don\u2019t pass on the first try?',
    a: 'You retain access to your full course materials, practice exams, and community for re-take preparation. We also schedule a debrief with Crystal to identify weak areas and build a focused 2–4 week re-test plan. PMI® allows up to 3 attempts within one eligibility year.',
  },
  {
    q: 'Is your curriculum aligned to the 2026 PMP® exam changes?',
    a: 'Yes. PMI® updates the PMP® Exam Content Outline (ECO) periodically, and our curriculum is built directly from the current ECO. The 2026 update emphasizes AI in project management, sustainability, and value delivery — topics we now cover explicitly. See our free PMP® Exam Changes 2026 guide for details.',
  },
  {
    q: 'Can I pay in installments or does my employer reimburse?',
    a: 'Yes to both. We offer payment plans on the Accelerator program, and we provide a tuition justification letter and itemized invoice you can submit to your employer for L&D reimbursement. Many corporate L&D programs cover 100% of professional certification training.',
  },
  {
    q: 'What\u2019s the difference between PMP® and CAPM®?',
    a: 'PMP® is for experienced project managers (3–5+ years of leadership experience required) and is the industry gold standard. CAPM® is the entry-level credential — no PM experience required, just 23 hours of project management education. If you\u2019re new to PM, start with CAPM® or our Veterans Pathway. If you have experience, go straight to PMP®.',
  },
] as const

export default function PMPPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-navy text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-gold text-sm font-bold uppercase tracking-widest mb-3">
                PMP® Certification Prep
              </p>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Earn Your PMP®.<br />
                <span className="text-gold">Lead With Credentials.</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mb-8">
                Instructor-led PMP® training designed for working professionals, career transitioners, and leaders ready to make their experience official. PMI-aligned. Exam-focused. Career-transforming.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/enroll"
                  className="bg-gold text-navy font-bold py-4 px-8 rounded-xl text-center hover:bg-yellow-400 transition-colors"
                >
                  Enroll Now
                </Link>
                <Link
                  href="/programs"
                  className="border-2 border-white text-white font-bold py-4 px-8 rounded-xl text-center hover:bg-white hover:text-navy transition-colors"
                >
                  View All Programs
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <img
                src="/pexels-rdne-7092460.jpg"
                alt="Project management professionals collaborating"
                className="rounded-2xl shadow-2xl w-full max-w-md object-cover h-[480px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals strip */}
      <TrustSignals />

      {/* Outcomes Bar */}
      <section className="bg-gold py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {OUTCOMES.map((o) => (
              <div key={o.stat}>
                <p className="text-3xl font-bold text-navy">{o.stat}</p>
                <p className="text-navy text-sm mt-1 leading-snug">{o.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-3">Choose Your Path to PMP®</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Every track is built on PMI standards and delivered by Crystal Stewart, PMP®. Pick the format that fits your life.
            </p>
          </div>

          <div className="space-y-8">
            {TRACKS.map((p) => (
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
                      {p.price > 0 ? (
                        <>
                          <p className="text-3xl font-bold text-navy">${p.price.toLocaleString()}</p>
                          <p className="text-gray-500 text-sm">one-time investment</p>
                        </>
                      ) : (
                        <p className="text-xl font-bold text-navy">Custom Pricing</p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <a
                        href="https://calendly.com/space4grace/15min"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-navy text-white font-bold py-3 rounded-xl text-center hover:bg-blue-900 transition-colors"
                      >
                        {p.id === 'pmp-coaching' ? 'Schedule a Call' : 'Get Started'}
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

      {/* Why Wiser Generations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-navy mb-4">Why Wiser Generations?</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-10">
            We don't just teach you to pass an exam — we help you become the kind of project leader organizations trust with their most important work.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🏅', title: 'PMI-Aligned Curriculum', desc: 'Every lesson maps directly to the PMI Exam Content Outline so there are no surprises on exam day.' },
              { icon: '👩‍🏫', title: 'Expert Instruction', desc: 'Learn from Crystal Stewart, PMP® — a practitioner who has managed real projects and passed the real exam.' },
              { icon: '🎖️', title: 'Built for Experience', desc: 'Our programs honor what you already know and help you frame your experience in the language PMI values.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <p className="text-4xl mb-4">{item.icon}</p>
                <h3 className="text-lg font-bold text-navy mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — emits FAQPage JSON-LD for Google rich snippets */}
      <Faq items={PMP_FAQ} heading="PMP® Prep FAQ" />

      {/* CTA */}
      <section className="bg-navy text-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make It Official?</h2>
          <p className="text-gray-300 text-lg mb-8">
            Your experience is already there. Let's give it the credential it deserves.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://calendly.com/space4grace/15min"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gold text-navy font-bold py-4 px-10 rounded-xl text-center hover:bg-yellow-400 transition-colors"
            >
              Enroll Today
            </a>
            <Link
              href="/contact"
              className="border-2 border-white text-white font-bold py-4 px-10 rounded-xl text-center hover:bg-white hover:text-navy transition-colors"
            >
              Ask a Question
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

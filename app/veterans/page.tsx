import type { Metadata } from 'next'
import Link from 'next/link'
import TrustSignals from '@/components/marketing/TrustSignals'
import Faq from '@/components/marketing/Faq'

export const metadata: Metadata = {
  title: 'Veterans PM Pathway — PMP® & CAPM® for Military Veterans',
  description: 'Translate your military leadership into a PMP® or CAPM® credential. Veteran-discounted tuition and a veteran peer cohort.',
  openGraph: { images: ['/og-image.png'] },
}

const CALENDLY = 'https://calendly.com/space4grace/30min-pod'

const VETERANS_FAQ = [
  {
    q: 'Should I pursue PMP® or CAPM® first as a transitioning veteran?',
    a: "It depends on your service experience. If you led teams or managed operations for 36+ months as E-5 or above, you likely qualify for PMP® directly. If you're newer to leadership, CAPM® is the faster on-ramp. Book a free call and Crystal and team will help you decide.",
  },
  {
    q: 'How does my MOS / rate / AFSC translate to project management?',
    a: 'Almost every military role maps to PM competencies. Logistics, signal, ops, engineering, supply, intel — all involve scope, schedule, cost, risk, and stakeholder management. Our Military-to-PM Skills Translation Guide maps your experience into PMI® language.',
  },
  {
    q: "I'm still on active duty / in the Reserves. Can I still enroll?",
    a: 'Yes. Many students are still in uniform — active, Guard, or Reserve. Sessions are virtual and recorded so you can keep up around training, drill weekends, and deployments.',
  },
  {
    q: 'Do you have a veteran-only cohort or do I study with civilians?',
    a: "Both. We run a veteran peer cohort each quarter alongside other transitioning service members. You can also join our standard mentor-led cohort if the timing works better.",
  },
  {
    q: 'How long until I am exam-ready?',
    a: 'Most veterans go from enrollment to exam-ready in 10–14 weeks. Military experience usually accelerates the People and Process domains.',
  },
] as const

const ITEMS = [
  { icon: '📋', title: 'Military-to-PM Skills Translation Guide', body: 'A personalized document mapping your MOS/rate and service experience to PMI competency areas.' },
  { icon: '📚', title: 'PMP® or CAPM® Prep (Your Choice)', body: 'Full certification prep course with live study sessions, practice exams, and Crystal and team as your mentors.' },
  { icon: '👥', title: 'Veteran Peer Cohort', body: 'Study and grow alongside other veterans who understand your background and mission-first mindset.' },
  { icon: '💼', title: 'Employer Introduction Program', body: "Access to Enterprise Academy's network of PM-hiring employers. Resume review and interview prep included." },
  { icon: '🎖️', title: 'Veteran-Discounted Tuition', body: 'Discounted rate for all honorably discharged veterans. Bring your DD-214 at enrollment.' },
]

const MIL_MAP: [string, string][] = [
  ['Mission Planning', 'Project Charter & Scope Management'],
  ['Operations Order', 'Work Breakdown Structure (WBS)'],
  ['Battle Rhythm', 'Sprint Planning & Critical Path'],
  ['Chain of Command', 'Stakeholder Management & RACI'],
  ['AAR (After Action Review)', 'Project Retrospective & Lessons Learned'],
  ['Intel & Comms', 'Requirements Gathering & Communications'],
  ['Unit Readiness', 'Resource & Risk Management'],
  ['Mission Debrief', 'Project Close & Documentation'],
]

export default function VeteransPage() {
  return (
    <div>
      <section className="relative bg-navy text-white py-24">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/veterans-hero.jpg"
            alt="Instructor mentoring a student one-on-one in a project management class"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-3">Veterans PM Pathway</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">You Already Lead Projects.<br />Now Get the Credential.</h1>
          <p className="text-gray-300 text-xl leading-relaxed max-w-2xl mb-8">
            Every mission you led was a project. Every team you commanded was a stakeholder group.
            Every operation you executed had a critical path. Translate that into the PMP&reg; or CAPM&reg;
            certification that civilian employers recognize &mdash; and respect.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/checkout" className="bg-gold text-white font-bold px-8 py-4 rounded-lg hover:bg-amber-600 transition-colors text-lg">Start Your Pathway</Link>
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="border-2 border-white text-white font-bold px-8 py-4 rounded-lg hover:bg-white/10 transition-colors text-lg">Talk to Crystal and Team</a>
          </div>
        </div>
      </section>
      <TrustSignals headline="Veteran-built. Mission-tested. Trusted nationwide." />
      <section className="py-16 bg-light-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy mb-8 text-center">Your Military Experience Already Speaks PM</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MIL_MAP.map(([mil, pm]) => (
              <div key={mil} className="bg-white rounded-lg p-4 flex items-center gap-4 border border-gray-100">
                <div className="text-center min-w-[120px]">
                  <p className="text-xs font-bold text-gold uppercase tracking-wider mb-1">Military</p>
                  <p className="text-navy font-semibold text-sm">{mil}</p>
                </div>
                <div className="text-2xl text-gray-400">&rarr;</div>
                <div>
                  <p className="text-xs font-bold text-navy uppercase tracking-wider mb-1">PM Equivalent</p>
                  <p className="text-gray-700 text-sm">{pm}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-bold text-navy mb-2">Veterans PM Pathway &mdash; What&apos;s Included</h2>
              <p className="text-gold font-medium mb-8">From $799 (Professional tier with veteran discount) &middot; Veteran discount applied at enrollment</p>
              <div className="space-y-5">
                {ITEMS.map(item => (
                  <div key={item.title} className="flex gap-4">
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <h3 className="font-bold text-navy mb-1">{item.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="sticky top-24">
              <img
                src="/veterans-hero.jpg"
                alt="Instructor mentoring a student one-on-one in a project management class"
                className="w-full rounded-xl object-cover mb-6"
                style={{ maxHeight: '280px' }}
              />
              <div className="mt-4 bg-navy rounded-xl p-5 text-white text-center">
                <p className="font-bold text-gold mb-1">Ready to start?</p>
                <p className="text-sm text-gray-300 mb-3">Book a free strategy call with Crystal and team</p>
                <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="block bg-gold text-navy font-bold py-2 rounded-lg hover:bg-amber-400 transition-colors">Book Your Call &rarr;</a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-navy text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-gold font-bold uppercase text-sm tracking-wider mb-4">From Crystal</p>
          <blockquote className="text-xl italic text-gray-200 leading-relaxed mb-4">
            &ldquo;I served. I know what it means to transition &mdash; to walk out of a world where your competence is
            unquestioned into a civilian environment where no one speaks your language yet. This program
            is the bridge I wish I&apos;d had.&rdquo;
          </blockquote>
          <p className="text-gold font-bold">&mdash; Crystal Stewart, PMP&reg; &middot; U.S. Army Veteran</p>
        </div>
      </section>
      <Faq items={VETERANS_FAQ} heading="Veterans Pathway FAQ" />
      <section className="py-12 bg-light-gold">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">Start Your Veterans Pathway</h2>
          <p className="text-gray-600 mb-6">Tell us your branch, your timeline, and your goal. We&apos;ll take it from there.</p>
          <Link href="/checkout" className="bg-gold text-white font-bold px-8 py-3 rounded-lg hover:bg-amber-600 transition-colors inline-block">Apply Now &rarr;</Link>
        </div>
      </section>
    </div>
  )
}

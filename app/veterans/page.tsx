import type { Metadata } from 'next'
import Link from 'next/link'
import TrustSignals from '@/components/marketing/TrustSignals'
import Faq from '@/components/marketing/Faq'

export const metadata: Metadata = {
  title: 'Veterans PM Pathway — PMP® & CAPM® for Military Veterans',
  description: 'Translate your military leadership into a PMP® or CAPM® credential. Veteran-discounted tuition, peer cohort, VA benefit guidance. Enterprise Academy™.',
}

const CALENDLY = 'https://calendly.com/space4grace/30min-pod'

const VETERANS_FAQ = [
  {
    q: 'Can I use my GI Bill® or VA education benefits for this program?',
    a: 'Wiser Generations Int’l™ is not currently a GI Bill® approved facility, so direct VA tuition payment isn\u2019t available. However, many veterans use TA, employer L&D budgets, VR&E (Chapter 31) sponsorship, or workforce development grants. We provide a tuition justification letter and itemized invoice you can submit, and we walk every veteran through the available options during onboarding.',
  },
  {
    q: 'Should I pursue PMP® or CAPM® first as a transitioning veteran?',
    a: 'It depends on your service experience. If you led teams, ran missions, or managed operations for 36+ months as an E-5 or above (or as an officer), your experience usually qualifies you directly for PMP®. If you\u2019re newer to leadership or don\u2019t yet have documented "project leadership" hours, CAPM® is the faster on-ramp and PMP® comes next. Crystal will help you decide on a free 15-min call.',
  },
  {
    q: 'How does my MOS / rate / AFSC translate to project management?',
    a: 'Almost every military role maps to PM competencies. Logistics, signal, ops, engineering, aviation maintenance, supply, intel — all involve scope, schedule, cost, risk, communications, and stakeholder management. Our Military-to-PM Skills Translation Guide maps your specific experience into PMI® language so you can use it on your application and resume.',
  },
  {
    q: 'I\u2019m still on active duty / in the Reserves. Can I still enroll?',
    a: 'Yes. Many of our veteran students are still in uniform — active, Guard, or Reserve — and use the program to prep for their next chapter. Sessions are virtual and recorded so you can keep up around training, drill weekends, and deployments.',
  },
  {
    q: 'Do you have a veteran-only cohort or do I study with civilians?',
    a: 'Both. We run a veteran peer cohort each quarter where you\u2019ll study alongside other transitioning service members who understand your background and communication style. You can also join our standard mentor-led cohort if the timing works better — many veterans choose this for the broader networking.',
  },
  {
    q: 'How long until I\u2019m exam-ready and certified?',
    a: 'Most veterans go from enrollment to exam-ready in 10–14 weeks. Your military experience usually accelerates the People and Process domains. We schedule weekly check-ins so you stay on track even when life — or duty — gets in the way.',
  },
] as const

// U.S. Army public domain photos (no copyright restrictions)
const ARMY_PHOTOS = {
  classroom1: 'https://api.army.mil/e2/c/images/2020/12/09/7ae5443e/original.jpg',
  classroom2: 'https://api.army.mil/e2/c/images/2020/12/09/2f2d4e92/original.jpg',
  classroom3: 'https://api.army.mil/e2/c/images/2020/12/09/d1b44f38/original.jpg',
  classroom4: 'https://api.army.mil/e2/c/images/2020/12/09/d845df59/original.jpg',
}

export default function VeteransPage() {
  return (
    <div>
      {/* Hero with background image */}
      <section className="relative bg-navy text-white py-24">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={ARMY_PHOTOS.classroom2}
            alt="Military classroom training"
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-4xl mb-6">🎖️</div>
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-3">Veterans PM Pathway</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">You Already Lead Projects.<br/>Now Get the Credential.</h1>
          <p className="text-gray-300 text-xl leading-relaxed max-w-2xl mb-8">
            Every mission you led was a project. Every team you commanded was a stakeholder group.
            Every operation you executed had a critical path. Now translate that into the PMP® or CAPM®
            certification that civilian employers recognize — and respect.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/checkout" className="bg-gold text-white font-bold px-8 py-4 rounded-lg hover:bg-amber-600 transition-colors text-lg">Start Your Pathway</Link>
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="border-2 border-white text-white font-bold px-8 py-4 rounded-lg hover:bg-white/10 transition-colors text-lg">Talk to Crystal</a>
          </div>
        </div>
      </section>



      {/* Trust signals strip — veteran-focused headline */}
      <TrustSignals headline="Veteran-built. Mission-tested. Trusted nationwide." />

      {/* Translation */}
      <section className="py-16 bg-light-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy mb-8 text-center">Your Military Experience Already Speaks PM</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['Mission Planning', 'Project Charter & Scope Management'],
              ['Operations Order', 'Work Breakdown Structure (WBS)'],
              ['Battle Rhythm', 'Sprint Planning & Critical Path'],
              ['Chain of Command', 'Stakeholder Management & RACI'],
              ['AAR (After Action Review)', 'Project Retrospective & Lessons Learned'],
              ['Intel & Comms', 'Requirements Gathering & Communications'],
              ['Unit Readiness', 'Resource & Risk Management'],
              ['Mission Debrief', 'Project Close & Documentation'],
            ].map(([mil, pm]) => (
              <div key={mil} className="bg-white rounded-lg p-4 flex items-center gap-4 border border-gray-100">
                <div className="text-center min-w-[120px]">
                  <p className="text-xs font-bold text-gold uppercase tracking-wider mb-1">Military</p>
                  <p className="text-navy font-semibold text-sm">{mil}</p>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div>
                  <p className="text-xs font-bold text-navy uppercase tracking-wider mb-1">PM Equivalent</p>
                  <p className="text-gray-700 text-sm">{pm}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-bold text-navy mb-2">Veterans PM Pathway — What's Included</h2>
              <p className="text-gold font-medium mb-8">From $797 (Professional tier with veteran discount) · Veteran discount applied at enrollment</p>
              <div className="space-y-5">
                {[
                  { icon: '📋', title: 'Military-to-PM Skills Translation Guide', body: 'A personalized document mapping your MOS/rate and service experience to PMI competency areas. Use this in interviews and on your resume.' },
                  { icon: '📚', title: 'PMP® or CAPM® Prep (Your Choice)', body: 'Full certification prep course with live study sessions, practice exams, and Crystal as your mentor. You choose the credential that fits your timeline.' },
                  { icon: '💰', title: 'VA Benefit Compatibility Guidance', body: 'We help you understand which VA education benefits may apply to your tuition. Not a guarantee — but we navigate it with you.' },
                  { icon: '👥', title: 'Veteran Peer Cohort', body: 'Study and grow alongside other veterans who understand your background, your communication style, and your mission-first mindset.' },
                  { icon: '💼', title: 'Employer Introduction Program', body: "Access to Enterprise Academy's network of PM-hiring employers who actively seek veteran talent. Resume review and interview prep included." },
                  { icon: '🎖️', title: 'Veteran-Discounted Tuition', body: 'Discounted rate for all honorably discharged veterans. Bring your DD-214 verification at enrollment.' },
                ].map(item => (
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
              <div className="mt-4 bg-navy rounded-xl p-5 text-white text-center">
                <p className="font-bold text-gold mb-1">Ready to start?</p>
                <p className="text-sm text-gray-300 mb-3">Book a free 15-min call with Crystal</p>
                <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="block bg-gold text-navy font-bold py-2 rounded-lg hover:bg-amber-400 transition-colors">Book Your Call →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Crystal veteran note */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-gold font-bold uppercase text-sm tracking-wider mb-4">From Crystal</p>
          <blockquote className="text-xl italic text-gray-200 leading-relaxed mb-4">
            "I served. I know what it means to transition — to walk out of a world where your competence is
            unquestioned into a civilian environment where no one speaks your language yet. This program
            is the bridge I wish I'd had."
          </blockquote>
          <p className="text-gold font-bold">— Crystal Stewart, PMP® · U.S. Army Veteran</p>
        </div>
      </section>

      {/* FAQ — emits FAQPage JSON-LD for Google rich snippets */}
      <Faq items={VETERANS_FAQ} heading="Veterans Pathway FAQ" />

      <section className="py-12 bg-light-gold">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">Start Your Veterans Pathway</h2>
          <p className="text-gray-600 mb-6">Tell us your branch, your timeline, and your goal. We'll take it from there.</p>
          <Link href="/checkout" className="bg-gold text-white font-bold px-8 py-3 rounded-lg hover:bg-amber-600 transition-colors inline-block">Apply Now →</Link>
        </div>
      </section>
    </div>
  )
}

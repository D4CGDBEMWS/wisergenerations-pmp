import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Veterans PM Pathway — PMP® & CAPM® for Military Veterans',
  description: 'Translate your military leadership into a PMP® or CAPM® credential. Veteran-discounted tuition, peer cohort, VA benefit guidance. Enterprise Academy™.',
}

export default function VeteransPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-navy text-white py-20">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-4xl mb-6">🎖️</div>
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-3">Veterans PM Pathway</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">You Already Lead Projects.<br/>Now Get the Credential.</h1>
          <p className="text-gray-300 text-xl leading-relaxed max-w-2xl mb-8">
            Every mission you led was a project. Every team you commanded was a stakeholder group.
            Every operation you executed had a critical path. Now translate that into the PMP® or CAPM®
            certification that civilian employers recognize — and respect.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/enroll" className="bg-gold text-white font-bold px-8 py-4 rounded-lg hover:bg-amber-600 transition-colors text-lg">Start Your Pathway</Link>
            <Link href="/contact" className="border-2 border-white text-white font-bold px-8 py-4 rounded-lg hover:bg-white/10 transition-colors text-lg">Talk to Crystal</Link>
          </div>
        </div>
      </section>

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
          <h2 className="text-2xl font-bold text-navy mb-2 text-center">Veterans PM Pathway — What's Included</h2>
          <p className="text-center text-gold font-medium mb-10">Starting from $797 · Veteran discount applied at enrollment</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: '📋', title: 'Military-to-PM Skills Translation Guide', body: 'A personalized document mapping your MOS/rate and service experience to PMI competency areas. Use this in interviews and on your resume.' },
              { icon: '📚', title: 'PMP® or CAPM® Prep (Your Choice)', body: 'Full certification prep course with live study sessions, practice exams, and Crystal as your mentor. You choose the credential that fits your timeline.' },
              { icon: '💰', title: 'VA Benefit Compatibility Guidance', body: 'We help you understand which VA education benefits may apply to your tuition. Not a guarantee — but we navigate it with you.' },
              { icon: '👥', title: 'Veteran Peer Cohort', body: 'Study and grow alongside other veterans who understand your background, your communication style, and your mission-first mindset.' },
              { icon: '💼', title: 'Employer Introduction Program', body: 'Access to Enterprise Academy\'s network of PM-hiring employers who actively seek veteran talent. Resume review and interview prep included.' },
              { icon: '🎖️', title: 'Veteran-Discounted Tuition', body: 'Discounted rate for all honorably discharged veterans. Bring your DD-214 verification at enrollment.' },
            ].map(item => (
              <div key={item.title} className="border border-gray-200 rounded-xl p-6">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-navy mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Crystal veteran note */}
      <section className="py-12 bg-navy text-white">
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

      <section className="py-12 bg-light-gold">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">Start Your Veterans Pathway</h2>
          <p className="text-gray-600 mb-6">Tell us your branch, your timeline, and your goal. We'll take it from there.</p>
          <Link href="/enroll" className="bg-gold text-white font-bold px-8 py-3 rounded-lg hover:bg-amber-600 transition-colors inline-block">Apply Now →</Link>
        </div>
      </section>
    </div>
  )
}

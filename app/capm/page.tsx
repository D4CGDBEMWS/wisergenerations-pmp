import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'CAPM Certification Prep',
  description: 'Earn your CAPM certification with Wiser Generations Int\'l mentor-led training. Designed for career changers and early-career professionals. PMI-aligned curriculum.',
}

export default function CAPMPage() {
  return (
    <div className="bg-white">

      {/* Hero */}
      <section className="bg-navy text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-3">CAPM Certification Prep</p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Start Your PM Career.<br />
            <span className="text-gold">Earn Your CAPM.</span>
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl leading-relaxed">
            The Certified Associate in Project Management (CAPM) is your entry point into the global project
            management profession. Wiser Generations Int&apos;l mentor-led training gives you the structure,
            support, and 23 PMI contact hours to pass on your first attempt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="https://calendly.com/space4grace/30min-pod"
              className="inline-block rounded-xl bg-gold px-8 py-4 text-base font-bold text-navy transition hover:bg-amber-400"
            >
              Book a Free Strategy Call
            </Link>
            <Link
              href="/checkout"
              className="inline-block rounded-xl border border-white/30 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
            >
              Enroll Now — from $997
            </Link>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-navy mb-8 text-center">Who the CAPM Is For</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '🎓', title: 'Recent Graduates', desc: 'BS or BA grads entering the workforce who want a recognized PM credential before their first role.' },
              { icon: '🔄', title: 'Career Changers', desc: 'Professionals moving into PM from another field who need to establish formal credentials quickly.' },
              { icon: '🚀', title: 'Early-Career PMs', desc: 'Those with under 3 years of PM experience who are not yet eligible for the PMP®.' },
              { icon: '🎖️', title: 'Veterans', desc: 'Transitioning service members building civilian PM credentials alongside military experience.' },
              { icon: '💼', title: 'Project Coordinators', desc: 'Coordinators and admins who support projects and want to formalize their PM knowledge.' },
              { icon: '📋', title: 'PMI Pathway Starters', desc: 'Anyone who wants a stepping stone on the path to earning the PMP® in the future.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-navy mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">What You Get</p>
            <h2 className="text-3xl font-bold text-navy mb-6">CAPM Career Launcher — What&apos;s Included</h2>
            <ul className="space-y-4">
              {[
                '23 PMI contact hours (satisfies CAPM eligibility requirement)',
                'Live, mentor-led virtual sessions with Crystal Stewart, PMP',
                'Beginner-friendly curriculum aligned with the current CAPM exam',
                'PMI application support — we help you complete the paperwork',
                'Practice exam question bank with full answer explanations',
                'Career transition roadmap — from wherever you are to PM',
                'Resume and LinkedIn profile review for PM positioning',
                'Private cohort community access',
                'Certificate of completion from Wiser Generations Int\'l',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold">✓</span>
                  <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-navy text-white rounded-2xl p-8">
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Investment</p>
            <p className="text-4xl font-bold mb-1">from $997</p>
            <p className="text-gray-300 text-sm mb-6">One-time investment. Payment plans available.</p>
            <ul className="space-y-2 mb-8 text-sm text-gray-300">
              <li>✓ Live cohort instruction</li>
              <li>✓ 23 PMI contact hours certificate</li>
              <li>✓ Application support included</li>
              <li>✓ Veteran discount available</li>
            </ul>
            <Link
              href="/checkout"
              className="block w-full text-center rounded-xl bg-gold px-6 py-4 text-base font-bold text-navy transition hover:bg-amber-400"
            >
              Enroll Now
            </Link>
            <p className="mt-4 text-center text-xs text-gray-400">
              Not sure yet?{' '}
              <Link href="https://calendly.com/space4grace/30min-pod" className="text-gold hover:underline">
                Book a free call first
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* CAPM vs PMP */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-navy mb-8 text-center">CAPM vs. PMP — Which Is Right for You?</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-navy text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Criteria</th>
                  <th className="px-6 py-4 text-center font-semibold">CAPM®</th>
                  <th className="px-6 py-4 text-center font-semibold">PMP®</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {[
                  ['Experience required', 'None (HS diploma)', '3–5 years leading projects'],
                  ['Education required', 'Secondary + 23 contact hours', 'HS/Degree + 35 contact hours'],
                  ['Exam length', '150 questions, 3 hours', '180 questions, 4 hours'],
                  ['Target audience', 'Entry-level / career changers', 'Experienced PM practitioners'],
                  ['Salary impact', 'Entry-level positioning', '$20K+ median salary increase'],
                  ['Path forward', 'Stepping stone to PMP', 'Global gold standard'],
                ].map(([criteria, capm, pmp]) => (
                  <tr key={criteria}>
                    <td className="px-6 py-4 font-medium text-navy">{criteria}</td>
                    <td className="px-6 py-4 text-center text-gray-700">{capm}</td>
                    <td className="px-6 py-4 text-center text-gray-700">{pmp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-center text-gray-500 text-sm">
            Not sure which is right for you?{' '}
            <Link href="https://calendly.com/space4grace/30min-pod" className="text-gold hover:underline font-medium">
              Book a free call
            </Link>{' '}
            and Crystal will help you decide.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-navy text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your PM Career?</h2>
          <p className="text-gray-300 mb-8 leading-relaxed">
            Book a free 15-minute strategy call with Crystal to confirm the CAPM is the right move for you,
            or enroll directly and get started today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://calendly.com/space4grace/30min-pod"
              className="rounded-xl bg-gold px-8 py-4 text-base font-bold text-navy transition hover:bg-amber-400"
            >
              Book a Free Call
            </Link>
            <Link
              href="/checkout"
              className="rounded-xl border border-white/30 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
            >
              Enroll Now
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

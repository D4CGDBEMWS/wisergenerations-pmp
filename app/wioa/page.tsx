import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WIOA-Funded PMP and CAPM Training in Georgia | Enterprise Academy™',
  description:
    'Georgia WIOA-eligible PMP and CAPM certification training. Veteran-founded, PMI-aligned, live instructor-led. ETPL application currently in review.',
}

const MAIL = 'mailto:info@wisergenerations.com'

export default function WioaPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-navy text-white py-24">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-3">
            Workforce Development / WIOA Training
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            WIOA-Funded PMP® and CAPM® Training<br />for Georgia Workers
          </h1>
          <p className="text-gray-300 text-xl leading-relaxed max-w-2xl mb-8">
            Your path to project management certification — covered by workforce funding.
            Designed for transitioning workers, veterans, and career changers.
          </p>
          <a
            href={MAIL + '?subject=WIOA%20Eligibility%20Inquiry'}
            className="inline-block bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-yellow-400 transition-colors text-lg"
          >
            Check Your WIOA Eligibility
          </a>
        </div>
      </section>

      {/* Status Banner */}
      <section className="bg-amber-50 border-l-4 border-amber-500 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3">
            <span className="text-amber-600 text-2xl flex-shrink-0">⚠️</span>
            <div>
              <p className="font-bold text-amber-800 text-lg mb-1">
                ETPL Application Status: In Review (Georgia WorkSource — application pending)
              </p>
              <p className="text-amber-700 text-sm leading-relaxed">
                Students can pre-register interest now. WIOA funding becomes available once ETPL
                approval is received (typically 60–90 days from application). We will notify
                pre-registered students as soon as funding is activated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How WIOA Works */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy mb-4 text-center">
            How WIOA Works for PMP/CAPM Training
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            WIOA (Workforce Innovation and Opportunity Act) funds approved training for eligible
            adults, dislocated workers, and youth through Individual Training Accounts.
          </p>
          <div className="relative">
            <div className="hidden md:block absolute left-6 top-8 bottom-8 w-0.5 bg-gold/30" />
            <div className="space-y-8">
              {[
                {
                  step: '1',
                  title: 'Contact Your Local American Job Center',
                  body: 'Find your nearest Georgia American Job Center at careeronestop.org. They administer WIOA funding in your area.',
                },
                {
                  step: '2',
                  title: 'Get an Eligibility Assessment',
                  body: 'The Job Center determines eligibility under WIOA adult, dislocated worker, or youth programs based on your employment status and goals.',
                },
                {
                  step: '3',
                  title: 'Receive Individual Training Account (ITA) Authorization',
                  body: 'Once approved, you receive an ITA — a funding authorization that can be applied to ETPL-approved training providers.',
                },
                {
                  step: '4',
                  title: 'Enroll in Enterprise Academy Cohort',
                  body: 'Apply your ITA toward your PMP® or CAPM® cohort enrollment. We provide all required documentation for your Job Center.',
                },
                {
                  step: '5',
                  title: 'Complete Training and Sit for Certification Exam',
                  body: 'Complete our mentor-led cohort, then sit for your PMI® exam. We prepare you through live sessions, practice exams, and 1:1 coaching.',
                },
                {
                  step: '6',
                  title: 'Job Placement Assistance',
                  body: 'Employment outcomes are part of WIOA reporting. We assist with resume review and employer introductions as part of the program.',
                },
              ].map((item) => (
                <div key={item.step} className="relative flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-gold rounded-full flex items-center justify-center text-navy font-bold text-lg z-10">
                    {item.step}
                  </div>
                  <div className="bg-light-navy rounded-xl p-5 flex-1">
                    <h3 className="font-bold text-navy mb-1 text-lg">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Enterprise Academy */}
      <section className="py-16 bg-light-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy mb-4 text-center">
            Why Enterprise Academy for WIOA-Funded Training?
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Not every approved provider delivers the same quality. Here is what sets Enterprise
            Academy apart for workforce-funded students.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🇺🇸',
                title: 'Veteran-Founded and Veteran-Operated',
                body: 'Crystal Stewart is a U.S. Army veteran and PMP® credential holder. This program was built with the discipline and accountability of military service.',
              },
              {
                icon: '📚',
                title: 'PMI-Aligned Curriculum',
                body: 'All course content aligns with current PMI® standards. Students sit for official PMI® certification exams upon program completion.',
              },
              {
                icon: '👤',
                title: 'Live Mentor-Led Format',
                body: 'Higher completion rates than self-paced alternatives. You are in a cohort with a live instructor — not watching videos alone.',
              },
              {
                icon: '📈',
                title: 'Performance Outcome Reporting Built In',
                body: 'We track and report student outcomes — completion, certification, and placement — to support WIOA performance requirements.',
              },
              {
                icon: '📍',
                title: 'Atlanta-Based, Virtual Delivery Statewide',
                body: 'Headquartered in Smyrna, GA. Live virtual delivery means students across Georgia can participate without relocation.',
              },
              {
                icon: '🤝',
                title: 'ETPL Application In Review',
                body: 'We have submitted our ETPL application to Georgia WorkSource. Once approved, students can apply ITA funding directly to enrollment.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-navy mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-Register Interest */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-navy mb-4">Pre-Register Your Interest</h2>
          <p className="text-gray-600 text-lg mb-8">
            WIOA funding is not yet active at Enterprise Academy. However, you can pre-register
            now so we can notify you the moment ETPL approval comes through. Email us with
            your name, location, and whether you are interested in PMP® or CAPM®.
          </p>
          <a
            href={MAIL + '?subject=WIOA%20Pre-Registration%20Interest'}
            className="inline-block bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-yellow-400 transition-colors text-lg mb-4"
          >
            Pre-Register Now →
          </a>
          <p className="text-gray-400 text-sm">
            Email us at info@wisergenerations.com — subject line: &quot;WIOA Pre-Registration Interest&quot;
          </p>
        </div>
      </section>

      {/* For Workforce Development Boards */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-3">
              For Workforce Development Boards
            </p>
            <h2 className="text-3xl font-bold mb-6">
              Partner with Enterprise Academy as an Approved Provider
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              Enterprise Academy is actively pursuing ETPL approval with Georgia WorkSource.
              If your Local Workforce Development Board (LWDB) is evaluating training providers
              for project management certifications, we welcome the conversation.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {[
                {
                  title: 'Direct Contact with Crystal Stewart, Founder',
                  body: 'No account managers. You speak directly with the founder, a U.S. Army veteran and PMP® credential holder.',
                },
                {
                  title: 'Quarterly Outcome Reporting Available',
                  body: 'We provide structured quarterly reports on student completion rates, certification pass rates, and employment outcomes.',
                },
                {
                  title: 'MOA Template Available for Review',
                  body: 'A Memorandum of Agreement template is available for LWDBs who want to formalize the referral and reporting relationship.',
                },
                {
                  title: 'Veteran-Focused Program',
                  body: 'Particularly strong fit for boards serving transitioning veterans, dislocated workers, and adults returning to the workforce.',
                },
              ].map((item) => (
                <div key={item.title} className="bg-white/10 rounded-xl p-5 border border-white/10">
                  <h3 className="font-bold text-gold mb-2">{item.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="bg-white/5 border border-gold/30 rounded-xl p-6">
              <p className="text-white font-bold mb-2">Contact for LWDB Inquiries</p>
              <p className="text-gray-300 text-sm mb-4">
                Email Crystal directly at{' '}
                <a href={MAIL + '?subject=LWDB%20Inquiry'} className="text-gold underline hover:text-yellow-300">
                  info@wisergenerations.com
                </a>{' '}
                with subject line: <strong className="text-white">&quot;LWDB Inquiry&quot;</strong>
              </p>
              <a
                href={MAIL + '?subject=LWDB%20Inquiry'}
                className="inline-block bg-gold text-navy font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Send LWDB Inquiry
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-light-gold">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">
            Ready When WIOA Funding Is Active?
          </h2>
          <p className="text-gray-600 mb-6">
            Pre-register now. We will reach out the moment ETPL approval is received and
            WIOA funding can be applied to your enrollment.
          </p>
          <a
            href={MAIL + '?subject=WIOA%20Pre-Registration%20Interest'}
            className="inline-block bg-gold text-navy font-bold px-8 py-3 rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Pre-Register Interest →
          </a>
          <p className="text-xs text-gray-400 mt-4">
            Wiser Generations Int&apos;l is not affiliated with PMI®.
            PMP® and CAPM® are registered trademarks of the Project Management Institute.
          </p>
        </div>
      </section>
    </div>
  )
}

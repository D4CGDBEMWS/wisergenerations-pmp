import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pass Guarantee | Wiser Generations Int\'l',
  description: 'Complete your PMP or CAPM prep with Crystal Stewart and pass — or restudy free. Our pass guarantee reflects confidence in the curriculum and commitment to your success.',
}

const CALENDLY = 'https://calendly.com/space4grace/30min-pod'

const included = [
  {
    icon: '📚',
    title: 'Full Restudy Access',
    body: 'If you do not pass your exam after completing the program, you are enrolled in the next available cohort at no charge. Same curriculum, same mentor, same support.'
  },
  {
    icon: '🗺️',
    title: 'Personalized Study Review',
    body: 'Crystal will review your exam feedback report with you, identify your knowledge gaps, and build a targeted restudy plan focused on where you need the most work.'
  },
  {
    icon: '📞',
    title: '1-on-1 Coaching Session',
    body: 'You get a private coaching session with Crystal before your second attempt — focused on exam strategy, question approach, and mindset.'
  },
  {
    icon: '📋',
    title: 'Updated Study Materials',
    body: 'You receive any updated practice exams, study guides, or study aids that have been added since your original cohort.'
  },
  {
    icon: '🤝',
    title: 'Community Support',
    body: 'You remain part of the cohort community — peer study groups, Q&A access, and accountability check-ins through your second attempt.'
  },
  {
    icon: '⏰',
    title: 'No Time Pressure',
    body: 'There is no arbitrary deadline on when you must attempt again. Crystal will help you decide when you are ready — not rush you back to a test you are not prepared for.'
  }
]

const qualifications = [
  'You must have attended at least 90% of the live cohort sessions',
  'You must have completed all assigned practice exams and study activities',
  'You must take your PMI exam within 120 days of program completion',
  'You must contact Crystal within 30 days of receiving your exam results',
  'Guarantee applies once per program enrollment per student'
]

const faqs = [
  {
    q: 'Does the guarantee cover CAPM as well as PMP?',
    a: 'Yes. The pass guarantee applies to both PMP and CAPM prep programs. The same restudy process and support structure applies to both certifications.'
  },
  {
    q: 'What if the exam format changes between my first and second attempt?',
    a: 'Crystal keeps her curriculum current with PMI exam content outlines. If there are material changes to the exam between your attempts, she will ensure your restudy materials reflect the current exam format at no additional cost.'
  },
  {
    q: 'Is there a limit on how many times I can use the guarantee?',
    a: 'The guarantee covers one restudy enrollment per original program enrollment. If after a second attempt you still want to continue, Crystal will work with you individually on next steps — she does not abandon students.'
  },
  {
    q: 'What does "completed the program" mean?',
    a: 'Completed means attending at least 90% of live sessions and completing all practice exams and study activities assigned during the cohort. Passive attendance does not qualify — the guarantee is for students who put in the work.'
  },
  {
    q: 'Can I get a refund instead of the restudy?',
    a: 'The guarantee is a restudy guarantee, not a refund guarantee. We believe in the program and want to see you succeed — not walk away. If you have concerns about your situation, reach out to Crystal directly and she will work with you.'
  }
]

export default function GuaranteePage() {
  return (
    <main className="bg-white">

      {/* Hero */}
      <section className="bg-navy text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-4">Our Commitment to You</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Pass Your Exam — or Restudy Free
          </h1>
          <p className="text-gray-300 text-xl leading-relaxed max-w-3xl mx-auto">
            Crystal stands behind her curriculum and her teaching. If you complete the program,
            do the work, and do not pass your PMP or CAPM exam — you restudy with her again at
            no charge. No fine print. No runaround.
          </p>
          <div className="mt-10">
            <a
              href={CALENDLY}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-yellow-400 transition-colors inline-block"
            >
              Book a Free Strategy Call
            </a>
          </div>
        </div>
      </section>

      {/* Badge bar */}
      <section className="bg-gold py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-navy">87%</div>
              <div className="text-navy text-sm font-medium">First-attempt pass rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-navy">500+</div>
              <div className="text-navy text-sm font-medium">Professionals trained</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-navy">100%</div>
              <div className="text-navy text-sm font-medium">PMI-aligned curriculum</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why we can offer this */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Why We Can Offer This</p>
              <h2 className="text-3xl font-bold text-navy mb-6">
                A Guarantee Backed by 87% First-Attempt Success
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  The pass guarantee is not a marketing gimmick — it is a reflection of what actually
                  happens when students commit to the program. At an 87% first-attempt pass rate,
                  the restudy guarantee almost never gets used.
                </p>
                <p>
                  Crystal&apos;s method is built on real-world application and mentor-led learning —
                  not just memorization and practice tests. Students who go through the program
                  understand the material. They do not just recognize right answers — they can
                  reason through complex scenario questions the way a practicing PM would.
                </p>
                <p>
                  The guarantee exists because Crystal believes in what she teaches, and because
                  no one who puts in genuine effort should be left without support if they fall
                  short on exam day.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-navy mb-6 text-center">How It Works</h3>
              <div className="space-y-4">
                {[
                  { step: '1', label: 'Enroll in a PMP or CAPM cohort' },
                  { step: '2', label: 'Complete all sessions and study activities' },
                  { step: '3', label: 'Take your PMI exam within 120 days' },
                  { step: '4', label: 'If you do not pass, contact Crystal within 30 days' },
                  { step: '5', label: 'Enroll in the next cohort — free of charge' },
                  { step: '6', label: 'Get personalized coaching before your second attempt' },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gold text-navy font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {item.step}
                    </div>
                    <p className="text-gray-700">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">What You Get</p>
            <h2 className="text-3xl font-bold text-navy">If You Need the Guarantee, Here is What is Included</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {included.map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-bold text-navy mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Qualifications */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Eligibility</p>
            <h2 className="text-3xl font-bold text-navy">To Qualify for the Restudy Guarantee</h2>
            <p className="text-gray-600 mt-4">The guarantee is for students who commit to the process. Here is what that means:</p>
          </div>
          <div className="bg-navy rounded-2xl p-8">
            <ul className="space-y-4">
              {qualifications.map((q, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-200">
                  <span className="text-gold mt-0.5">✓</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Questions</p>
            <h2 className="text-3xl font-bold text-navy">Guarantee FAQs</h2>
          </div>
          <div className="space-y-6">
            {faqs.map((item) => (
              <div key={item.q} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-navy mb-2">{item.q}</h3>
                <p className="text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy text-white py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Certify with Confidence?</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Book a free strategy call with Crystal. She will walk you through the program,
            the schedule, and the guarantee — so you can move forward knowing you are covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={CALENDLY}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Book a Free Strategy Call
            </a>
            <Link
              href="/programs"
              className="border-2 border-white text-white font-bold px-8 py-4 rounded-lg hover:bg-white hover:text-navy transition-colors"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FAQ — PMP & CAPM Certification Questions | Wiser Generations Int\'l',
  description: 'Answers to the most common questions about PMP and CAPM certification prep, exam eligibility, payment plans, veterans benefits, and the Wiser Generations program.',
}

const CALENDLY = 'https://calendly.com/space4grace/30min-pod'

const faqCategories = [
  {
    category: 'Exam Eligibility',
    icon: '📋',
    questions: [
      {
        q: 'Do I qualify for the PMP exam?',
        a: 'To qualify for the PMP, PMI requires: a four-year degree plus 36 months of project leadership experience in the last 8 years, OR a high school diploma/GED plus 60 months of project leadership experience in the last 8 years. You also need 35 hours of formal PM education — which our program provides. If you are unsure whether your experience qualifies, book a free strategy call and Crystal will walk you through the application process.'
      },
      {
        q: 'Do I qualify for the CAPM exam?',
        a: 'The CAPM has lower experience requirements than the PMP. You need a secondary degree (high school diploma, associate degree, or global equivalent) and 23 hours of project management education — which our CAPM program fulfills. You do not need prior project management work experience to qualify for the CAPM.'
      },
      {
        q: 'Can I apply for the PMP if I have never had the title "Project Manager"?',
        a: 'Yes. PMI evaluates the experience you describe, not your job title. If you have led projects, managed stakeholders, coordinated resources, and been accountable for deliverables — that counts, even if your title was something else. Crystal helps students document their experience in a way that is clear, accurate, and PMI-compliant.'
      },
      {
        q: 'How long does the PMI application process take?',
        a: 'The application itself typically takes a few hours to complete once you have gathered your experience documentation. PMI usually reviews applications within 5–10 business days. If selected for audit (a random process), additional documentation is required, which can add 2–4 weeks. Crystal walks all students through the application in the program.'
      }
    ]
  },
  {
    category: 'The Program',
    icon: '📚',
    questions: [
      {
        q: 'What is included in the PMP Certification Prep program?',
        a: 'The program includes 36 hours of PMI-aligned education delivered in live virtual cohort sessions, access to a 500+ question practice exam bank, a personalized study plan, exam application support, and mentor access to Crystal throughout the cohort. The program also includes the pass guarantee — if you complete it and do not pass, you restudy free.'
      },
      {
        q: 'Is this live or self-paced?',
        a: 'The program is mentor-led and cohort-based — meaning you attend live virtual sessions with Crystal and your cohort peers on a set schedule. This structure keeps you accountable, lets you ask questions in real time, and provides the community support that self-paced programs lack. Session recordings are typically available for review if you need to catch up.'
      },
      {
        q: 'How long does the program take?',
        a: 'The PMP prep program runs approximately 8–12 weeks depending on the cohort schedule. The CAPM program is shorter, typically 6–8 weeks. Cohort schedules vary — book a call or check the Programs page to see what is currently available.'
      },
      {
        q: 'How much time should I expect to study each week?',
        a: 'Most students spend 8–12 hours per week between live sessions, reading, and practice exams. The amount varies by your background — PMs with more experience typically need less review time, while career transitioners may need more. Crystal builds a personalized study plan for each student based on their starting point.'
      },
      {
        q: 'What is your pass rate?',
        a: 'Students who complete the Wiser Generations program pass the PMP on their first attempt at an 87% rate — well above the industry average. This is the result of mentor-led learning, real-world application, and accountability built into every cohort.'
      }
    ]
  },
  {
    category: 'Pricing & Payment',
    icon: '💳',
    questions: [
      {
        q: 'How much does the PMP program cost?',
        a: 'The PMP Certification Prep program starts at $1,497. The CAPM Career Launcher starts at $997. Veterans receive a discounted rate starting at $797 for either program. Corporate packages are custom-priced based on team size and delivery format. All pricing is reviewed on your strategy call.'
      },
      {
        q: 'Are payment plans available?',
        a: 'Yes. Payment plans are available to make enrollment accessible. Options are discussed during your free strategy call with Crystal. She works with students to find a payment structure that fits their situation — the goal is to remove financial barriers, not add them.'
      },
      {
        q: 'What does the program price include?',
        a: 'Your enrollment includes all live cohort sessions, the practice exam bank, your personalized study plan, exam application support, mentor access to Crystal, and the pass guarantee (restudy free if you do not pass). There are no hidden fees or add-ons.'
      },
      {
        q: 'Does the price include the PMI exam fee?',
        a: 'The program tuition does not include the PMI exam registration fee, which is paid directly to PMI. For PMI members, the PMP exam fee is $405. For non-members, it is $555. Crystal strongly recommends becoming a PMI member first — the member discount on the exam fee more than covers the annual membership cost, and membership includes the PMBOK Guide and other resources.'
      }
    ]
  },
  {
    category: 'Veterans & Military',
    icon: '🎖️',
    questions: [
      {
        q: 'Can I use my GI Bill or VA education benefits for this program?',
        a: 'Wiser Generations Int\'l is working toward VA approval for applicable benefit programs. Please reach out directly — Crystal will let you know the current status and can help you explore all available options, including employer reimbursement and other funding sources. VET TEC is another program worth exploring for tech-adjacent certification training.'
      },
      {
        q: 'Do I qualify for the veteran discount?',
        a: 'The veteran discount applies to any U.S. military veteran, active duty service member, or military spouse. Proof of service is requested at enrollment. The discounted rate starts at $797 for PMP or CAPM prep.'
      },
      {
        q: 'Does my military experience count toward PMP eligibility?',
        a: 'Absolutely. Military leadership experience — managing logistics, coordinating teams, overseeing operations, running missions — maps directly to PMI\'s definition of project management experience. Crystal has extensive experience helping veterans translate their service record into a strong PMI application. Do not undersell what you have done.'
      },
      {
        q: 'Is there a veteran-specific cohort?',
        a: 'Yes. Wiser Generations offers veteran peer cohorts where you train alongside fellow veterans and service members who understand your background. This peer environment accelerates learning and provides a built-in support network of people navigating the same transition.'
      }
    ]
  },
  {
    category: 'Logistics & Delivery',
    icon: '🌐',
    questions: [
      {
        q: 'Is the program online or in person?',
        a: 'The program is delivered virtually via live online sessions, making it accessible nationwide. In-person and hybrid options are available for corporate teams in the Metro Atlanta area. All individual programs are fully virtual.'
      },
      {
        q: 'What happens if I miss a session?',
        a: 'Life happens. Session recordings are typically available so you can catch up. Crystal also holds regular office hours and Q&A sessions between cohort meetings. Missing an occasional session will not derail your progress — though consistent attendance is important for getting the most out of the program and qualifying for the pass guarantee.'
      },
      {
        q: 'When is the next cohort starting?',
        a: 'Cohort dates are updated regularly. The fastest way to get current availability is to book a free strategy call or check the Programs page. Cohorts have limited spots to maintain quality — early enrollment is recommended.'
      },
      {
        q: 'Do you offer corporate or team training?',
        a: 'Yes. Wiser Generations offers custom corporate PM training for teams and organizations, delivered virtually or on-site in Metro Atlanta. Curriculum is tailored to your industry and aligned with PMI standards. Volume pricing is available for teams of 5 or more. Visit the Corporate page or book a call to discuss your team\'s needs.'
      }
    ]
  }
]

export default function FaqPage() {
  return (
    <main className="bg-white">

      {/* Hero */}
      <section className="bg-navy text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-4">Frequently Asked Questions</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Get Your Questions Answered
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Everything you need to know about PMP and CAPM certification prep, eligibility, pricing, and the Wiser Generations program.
          </p>
        </div>
      </section>

      {/* Quick links */}
      <section className="bg-gray-50 py-8 px-4 border-b border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {faqCategories.map((cat) => (
              <a
                key={cat.category}
                href={`#${cat.category.toLowerCase().replace(/[^a-z]+/g, '-')}`}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-navy font-medium hover:border-gold hover:text-gold transition-colors"
              >
                <span>{cat.icon}</span>
                <span>{cat.category}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ categories */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-16">
          {faqCategories.map((cat) => (
            <div key={cat.category} id={cat.category.toLowerCase().replace(/[^a-z]+/g, '-')}>
              <div className="flex items-center gap-3 mb-8">
                <span className="text-3xl">{cat.icon}</span>
                <h2 className="text-2xl font-bold text-navy">{cat.category}</h2>
              </div>
              <div className="space-y-4">
                {cat.questions.map((item) => (
                  <details key={item.q} className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                      <h3 className="font-semibold text-navy pr-4">{item.q}</h3>
                      <span className="text-gold font-bold text-xl flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <div className="px-6 pb-6">
                      <p className="text-gray-700 leading-relaxed">{item.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still have questions */}
      <section className="bg-navy text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-gray-300 mb-8">
            Book a free 15-minute strategy call with Crystal. She answers every question personally —
            no sales scripts, no pressure. Just an honest conversation about whether this program
            is the right fit for your situation.
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
              href="/contact"
              className="border-2 border-white text-white font-bold px-8 py-4 rounded-lg hover:bg-white hover:text-navy transition-colors"
            >
              Send a Message
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}

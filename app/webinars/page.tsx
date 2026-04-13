import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Free Webinars & Live Q&A | Wiser Generations Int\'l',
  description: 'Join Crystal Stewart, PMP for free monthly webinars and live Q&A sessions on PMP certification, exam changes, career transitions, and project management strategy.',
}

const CALENDLY = 'https://calendly.com/space4grace/15min'

const upcomingWebinars = [
  {
    title: 'Ask Crystal: PMP Prep Strategy Session',
    date: 'Monthly — First Thursday, 7:00 PM ET',
    description: 'A free live Q&A with Crystal Stewart, PMP. Bring your questions about exam eligibility, study strategy, program selection, or anything PMP-related. No agenda — just honest answers.',
    tags: ['PMP', 'Q&A', 'Free'],
    cta: 'Register Free'
  },
  {
    title: 'Is PMP Right for You? Free Orientation',
    date: 'Monthly — Third Tuesday, 12:00 PM ET',
    description: 'A 45-minute orientation session for professionals considering PMP or CAPM certification. Crystal covers eligibility, the exam format, what the credential is worth, and what the prep process looks like.',
    tags: ['PMP', 'CAPM', 'Orientation', 'Free'],
    cta: 'Register Free'
  },
  {
    title: 'The PMP Exam Is Changing: What You Need to Know',
    date: 'On-Demand',
    description: 'PMI confirmed significant changes to the PMP exam effective July 8, 2026. This recorded session breaks down every domain shift, new question type, and what it means for professionals certifying before or after the deadline.',
    tags: ['PMP', 'Exam Changes', 'On-Demand'],
    cta: 'Watch Recording'
  },
  {
    title: 'Veterans & the PMP: Translating Your Service into Certification',
    date: 'Quarterly',
    description: 'Built specifically for veterans and service members. Crystal covers how military leadership experience maps to PMP eligibility, how to document your service for the PMI application, and what the veteran cohort experience looks like.',
    tags: ['Veterans', 'PMP', 'CAPM', 'Free'],
    cta: 'Register Free'
  }
]

const pastTopics = [
  'PMP vs CAPM: Which Certification Is Right for Your Career Stage?',
  'How to Document Your Project Experience for the PMI Application',
  'Agile, Hybrid, and Predictive: What the PMP Exam Actually Tests',
  'The Business Case for PM Certification: Salary Data and Career Outcomes',
  'Study Strategies That Actually Work (and the Ones That Waste Your Time)',
  'From Military to PMP: One Veteran\'s Journey to Certification',
]

const benefits = [
  {
    icon: '🆓',
    title: 'Completely Free',
    body: 'All webinars are free to attend. No credit card. No hidden fees. No sales pitch. Just practical information from a practicing PM.'
  },
  {
    icon: '🎓',
    title: 'PMI Contact Hours',
    body: 'Eligible live webinars count toward your PMI contact hours for certification or PDU requirements. Attendance certificates provided.'
  },
  {
    icon: '💬',
    title: 'Live Q&A with Crystal',
    body: 'Every session includes time for your questions. Crystal answers directly — no scripts, no redirects to a sales team.'
  },
  {
    icon: '🎥',
    title: 'On-Demand Recordings',
    body: 'Can\'t make it live? Recordings of past sessions are available on-demand. Register to receive the link.'
  }
]

export default function WebinarsPage() {
  return (
    <main className="bg-white">

      {/* Hero */}
      <section className="bg-navy text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-4">Free Webinars & Live Events</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Learn From Crystal — For Free
          </h1>
          <p className="text-gray-300 text-xl leading-relaxed max-w-3xl mx-auto mb-10">
            Monthly webinars, live Q&A sessions, and on-demand recordings to help you navigate
            PMP and CAPM certification with confidence. No cost. No catch.
          </p>
          <a
            href={CALENDLY}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-yellow-400 transition-colors inline-block"
          >
            Book a 1:1 Strategy Call Instead
          </a>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-xl p-6 text-center border border-gray-100 shadow-sm">
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="font-bold text-navy mb-2">{b.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming webinars */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Upcoming Sessions</p>
            <h2 className="text-3xl font-bold text-navy">Register for a Free Webinar</h2>
            <p className="text-gray-600 mt-3">All webinars are virtual. Registration link is sent by email after sign-up.</p>
          </div>
          <div className="space-y-6">
            {upcomingWebinars.map((w) => (
              <div key={w.title} className="border border-gray-200 rounded-xl p-6 hover:border-gold transition-colors">
                <div className="flex flex-wrap gap-2 mb-3">
                  {w.tags.map((tag) => (
                    <span key={tag} className="bg-gold/20 text-navy text-xs font-semibold px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-navy mb-2">{w.title}</h3>
                <p className="text-gold text-sm font-medium mb-3">{w.date}</p>
                <p className="text-gray-600 mb-5 leading-relaxed">{w.description}</p>
                <a
                  href={CALENDLY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-navy text-white font-semibold px-6 py-3 rounded-lg hover:bg-navy/80 transition-colors inline-block text-sm"
                >
                  {w.cta} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Past topics */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Previous Sessions</p>
            <h2 className="text-2xl font-bold text-navy">Past Webinar Topics</h2>
            <p className="text-gray-600 mt-2 text-sm">Register below to receive on-demand access to past recordings.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {pastTopics.map((topic) => (
              <div key={topic} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-gray-100">
                <span className="text-gold mt-0.5 flex-shrink-0">▶</span>
                <span className="text-gray-700 text-sm">{topic}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email signup to get notified */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Stay in the Loop</p>
          <h2 className="text-3xl font-bold text-navy mb-4">Get Notified of Upcoming Webinars</h2>
          <p className="text-gray-600 mb-8">
            Join the Wiser Generations newsletter to receive webinar invitations, exam updates,
            and PM career resources. No spam — just useful information from Crystal, on her schedule.
          </p>
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <p className="text-navy font-semibold mb-4">Two ways to stay connected:</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={CALENDLY}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Book a 1:1 Call
              </a>
              <Link
                href="/free-guide"
                className="border-2 border-navy text-navy font-bold px-8 py-4 rounded-lg hover:bg-navy hover:text-white transition-colors"
              >
                Download the Free Guide
              </Link>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              Downloading the guide or booking a call adds you to Crystal\'s update list automatically.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy text-white py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready for More Than a Webinar?</h2>
          <p className="text-gray-300 mb-8">
            Webinars are a great way to learn. But if you are ready to commit to getting certified,
            the next step is a free 1:1 strategy call with Crystal. She will map your exact path
            to PMP or CAPM certification.
          </p>
          <a
            href={CALENDLY}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-yellow-400 transition-colors inline-block"
          >
            Book a Free Strategy Call
          </a>
        </div>
      </section>

    </main>
  )
}

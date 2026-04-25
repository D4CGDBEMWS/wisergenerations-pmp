import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Crystal Stewart, PMP | Wiser Generations Int\'l',
  description: 'Meet Crystal Stewart, PMP — U.S. Army veteran, enterprise PM leader, and founder of Enterprise Academy. 20+ years of real-world project management experience, now teaching the next generation.',
}

const CALENDLY = 'https://calendly.com/space4grace/15min'

const milestones = [
  {
    year: 'U.S. Army',
    title: 'Leadership Under Pressure',
    body: 'Crystal\'s project management journey began before it had a name. In the Army, she led complex operations, managed logistics under pressure, and coordinated multi-team missions — the same skills that make great project managers.'
  },
  {
    year: 'Corporate Career',
    title: '20+ Years of Enterprise PM',
    body: 'After her military service, Crystal built a two-decade career leading enterprise transformation initiatives across industries. She earned her PMP certification and rose through the ranks, managing programs worth millions and mentoring teams along the way.'
  },
  {
    year: 'Enterprise Academy',
    title: 'Building the Platform',
    body: 'Crystal founded Enterprise Academy to formalize her approach to PM education — building a PMI-aligned curriculum rooted in real-world application, not just test memorization. The methodology was proven over years of corporate training.'
  },
  {
    year: 'Wiser Generations',
    title: 'Opening the Door Wider',
    body: 'Crystal launched Wiser Generations Int\'l to extend her reach beyond corporate clients and serve career transitioners, veterans, and early-career professionals — the people who need a strong mentor most and benefit most from the PMP credential.'
  },
  {
    year: 'Today',
    title: '87% First-Attempt Pass Rate',
    body: 'With 500+ professionals trained, an 87% first-attempt pass rate, and a growing community of certified PMs, Crystal continues to teach, mentor, and advocate for the next generation of project leaders.'
  }
]

const credentials = [
  { label: 'PMP Certified', icon: '🏅' },
  { label: 'U.S. Army Veteran', icon: '🎖️' },
  { label: 'Enterprise Academy Founder', icon: '🏛️' },
  { label: '20+ Years Experience', icon: '📊' },
  { label: 'PMI-Aligned Curriculum', icon: '✅' },
  { label: 'Metro Atlanta & Virtual', icon: '🌐' },
]

const values = [
  {
    title: 'Real-World First',
    icon: '🏗️',
    body: 'Crystal teaches PM the way she lived it — as a practitioner who has led real projects with real stakes. Every concept is grounded in how it works outside the exam room.'
  },
  {
    title: 'Mentorship, Not Just Instruction',
    icon: '🤝',
    body: 'Students do not just get a trainer. They get a mentor who maps out their path, answers their questions, and stays invested in their outcome — before and after the exam.'
  },
  {
    title: 'Built for Those Who Are Overlooked',
    icon: '🌟',
    body: 'Career transitioners, veterans, and first-generation professionals are not afterthoughts. The programs are designed from the ground up for people making bold moves — not people who already have every advantage.'
  },
  {
    title: 'Pass Guarantee or Restudy Free',
    icon: '🏆',
    body: 'Crystal stands behind her method. If you complete the program and do not pass your exam, you can restudy at no charge. The guarantee reflects confidence in the curriculum and commitment to your success.'
  }
]

export default function AboutPage() {
  return (
    <main className="bg-white">

      {/* Hero */}
      <section className="bg-navy text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-4">About Crystal Stewart, PMP</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            The Project Management Evangelist
          </h1>
          <p className="text-gray-300 text-xl leading-relaxed max-w-3xl mx-auto">
            20+ years of enterprise transformation. U.S. Army veteran. Founder of Enterprise Academy.
            Crystal does not just teach PM — she has lived it, built with it, and now equips the next
            generation of project managers to do the same.
          </p>
        </div>
      </section>

      {/* Credential badges */}
      <section className="bg-gold py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {credentials.map((c) => (
              <div key={c.label} className="text-center">
                <div className="text-2xl mb-1">{c.icon}</div>
                <p className="text-navy font-semibold text-xs">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story intro */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Her Story</p>
              <h2 className="text-3xl font-bold text-navy mb-6">
                A PM Career Built on Service, Grit, and Real Work
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Crystal Stewart started managing projects before project management was her job title.
                  As a U.S. Army veteran, she learned to lead teams under pressure, navigate complexity
                  without a playbook, and deliver outcomes when the stakes were high.
                </p>
                <p>
                  After transitioning to the corporate world, she spent more than two decades leading
                  enterprise transformation programs across industries — earning her PMP certification
                  and building a reputation as someone who could not only execute, but teach others to
                  do the same.
                </p>
                <p>
                  Crystal founded Enterprise Academy to share her methodology, and Wiser Generations
                  Int&apos;l to bring it to the people who need it most: career transitioners, veterans,
                  and professionals ready to elevate their credibility with a PMI certification.
                </p>
              </div>
            </div>
            <div className="bg-navy rounded-2xl p-8 text-white">
              <div className="space-y-6">
                <div className="text-center border-b border-gold/30 pb-6">
                  <div className="text-4xl font-bold text-gold">87%</div>
                  <div className="text-sm text-gray-300 mt-1">First-attempt PMP pass rate</div>
                </div>
                <div className="text-center border-b border-gold/30 pb-6">
                  <div className="text-4xl font-bold text-gold">500+</div>
                  <div className="text-sm text-gray-300 mt-1">Professionals trained</div>
                </div>
                <div className="text-center border-b border-gold/30 pb-6">
                  <div className="text-4xl font-bold text-gold">20+</div>
                  <div className="text-sm text-gray-300 mt-1">Years enterprise PM experience</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gold">100%</div>
                  <div className="text-sm text-gray-300 mt-1">PMI-aligned curriculum</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Teaching philosophy */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Teaching Philosophy</p>
            <h2 className="text-3xl font-bold text-navy">What Makes Wiser Generations Different</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="text-xl font-bold text-navy mb-3">{v.title}</h3>
                <p className="text-gray-600 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">The Journey</p>
            <h2 className="text-3xl font-bold text-navy">From Service to Classroom</h2>
          </div>
          <div className="space-y-0">
            {milestones.map((m, i) => (
              <div key={m.year} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-navy font-bold text-xs">{i + 1}</span>
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-0.5 bg-gold/30 flex-1 my-2" />
                  )}
                </div>
                <div className="pb-10">
                  <div className="text-gold text-sm font-semibold mb-1">{m.year}</div>
                  <h3 className="text-xl font-bold text-navy mb-2">{m.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{m.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-navy text-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">What Students Say</p>
            <h2 className="text-3xl font-bold">Graduates Speak for Themselves</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'Crystal is the ultimate trainer! Her knowledge, training and mentorship helped me to clear my PMP on the very first try!',
                name: 'Tai Cochran, MA Ed. HD, PMP',
                title: 'CEO, HER PM'
              },
              {
                quote: 'Knowledgeable with a sincere concern for each of her pupils, she has a unique way of conveying the concepts. After attending her course, I gained confidence within the PMI realm.',
                name: 'Lynn Fleming MBA, PMP, PMI-ACP',
                title: 'Principal Strategic Program Manager'
              },
              {
                quote: 'Crystal is a project management professional. Her passion for teaching creates an engaging and exciting classroom. I would recommend Crystal to any organization seeking PM education.',
                name: 'Erin Sanders, PE, PMP',
                title: 'Chief Operating Officer'
              }
            ].map((t) => (
              <div key={t.name} className="bg-white/10 rounded-xl p-6 border border-white/20">
                <p className="text-gray-200 italic mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-gold">{t.name}</p>
                  <p className="text-gray-400 text-sm">{t.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-navy mb-4">Ready to Work With Crystal?</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Book a free 15-minute strategy call. Crystal will map out your path to PMP or CAPM
            certification — based on your schedule, your background, and your goals.
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
              className="border-2 border-navy text-navy font-bold px-8 py-4 rounded-lg hover:bg-navy hover:text-white transition-colors"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { PROGRAMS, STATS } from '@/lib/constants'
import HomeClient from './components/HomeClient'
import TrustSignals from '@/components/marketing/TrustSignals'

const CALENDLY = 'https://calendly.com/space4grace/30min-pod'

const TESTIMONIALS = [
  {
    name: 'Tai Cochran, MA Ed. HD, PMP®',
    role: 'CEO, HER PM | Project Leadership Strategist',
    quote: 'Crystal is the ultimate trainer! She is a wealth of knowledge and wisdom, truly invested to ensure the success of each of her students. Her knowledge, training and mentorship helped me to clear my PMP on the very first try!',
  },
  {
    name: 'Lynn Fleming MBA, PMP, PMI-ACP, PMI-SP',
    role: 'Principal Strategic Program Manager',
    quote: "Knowledgeable with a sincere concern for each of her pupils, she has a unique way of conveying the concepts regardless of their learning method. After attending her course, I gained confidence within the PMI realm. I highly recommend Crystal's services to any organization that desires to improve their PMO.",
  },
  {
    name: 'Erin Sanders, PE, PMP',
    role: 'Chief Operating Officer',
    quote: 'Crystal is a project management professional. Her passion for teaching the project management process creates an engaging and exciting classroom. I would recommend Crystal to any organization or individual seeking project management education or PMP Certification.',
  },
]

// Cohorts roll automatically every 2 months so the schedule never goes stale.
// Pure server-side date math (no user input) — revalidated daily via ISR below.
function getUpcomingCohorts() {
  const fmt = (d: Date) => d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const now = new Date()
  // Next cohort opens the month after this one; the following runs two months later.
  const first = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const second = new Date(now.getFullYear(), now.getMonth() + 3, 1)
  return [
    { name: `${fmt(first)} Cohort`, dates: fmt(first), label: fmt(first), spots: 12, status: 'open', examBy: 'Enrolling now — reserve your seat' },
    { name: `${fmt(second)} Cohort`, dates: fmt(second), label: fmt(second), spots: 20, status: 'open', examBy: 'Planning ahead? Reserve your seat early' },
  ]
}

// Refresh the rolling cohort schedule (and any date-derived content) once a day.
export const revalidate = 86400

export default function HomePage() {
  const COHORTS = getUpcomingCohorts()
  return (
    <>
      {/* Top announcement banner */}
      <div className="bg-navy text-gold text-center py-2.5 px-4 text-sm font-bold border-b-2 border-gold">
        🎯 Mentor-led PMP® &amp; CAPM® prep with an 87% first-attempt pass rate.{' '}
        <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline text-white">
          Book a free strategy call →
        </a>
      </div>

      {/* Hero */}
      <section className="bg-navy text-white relative overflow-hidden pb-16 lg:pb-0">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 lg:py-28 relative">
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <p className="text-gold text-sm font-bold uppercase tracking-widest mb-4">Enterprise Academy · Wiser Generations Int&apos;l</p>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight mb-6">
                Pass Your PMP®<br />
                <span className="text-gold">On the First Try.™</span>
              </h1>
              <p className="text-gray-400 text-base italic mb-6">Preparing you to sit confidently and pass the exam on the first try.</p>
              <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-6 max-w-2xl">
                PMI-aligned prep that gets working professionals exam-ready with confidence. Live cohorts,
                realistic practice, and 1:1 support from Crystal and team — built around a single goal:
                you pass on your first attempt.
              </p>
              {/* Stat strip — social proof immediately under headline */}
              <div className="flex flex-wrap gap-6 mb-6">
                <div className="flex flex-col">
                  <span className="text-4xl font-bold text-gold leading-none">87%</span>
                  <span className="text-gray-400 text-xs mt-1">First-attempt pass rate</span>
                </div>
                <div className="w-px bg-white/20 hidden sm:block" />
                <div className="flex flex-col">
                  <span className="text-4xl font-bold text-gold leading-none">500+</span>
                  <span className="text-gray-400 text-xs mt-1">Professionals trained</span>
                </div>
                <div className="w-px bg-white/20 hidden sm:block" />
                <div className="flex flex-col">
                  <span className="text-4xl font-bold text-gold leading-none">20+</span>
                  <span className="text-gray-400 text-xs mt-1">Years enterprise PM</span>
                </div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-8 max-w-xl">
                <p className="text-gray-200 text-sm italic leading-relaxed">
                  "Her knowledge, training and mentorship helped me to clear my PMP on the very first try!"
                </p>
                <p className="text-gold text-xs font-bold mt-2">— Tai Cochran, MA Ed. HD, PMP · CEO, HER PM</p>
              </div>
              {/* Audience-segmented CTAs */}
              <div className="flex flex-wrap gap-4 mb-6">
                <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                  className="bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-amber-400 transition-colors text-lg">
                  I&apos;m an Individual →
                </a>
                <Link href="/corporate"
                  className="border-2 border-gold text-gold font-bold px-8 py-4 rounded-lg hover:bg-white/10 transition-colors text-lg">
                  I&apos;m a Corporate Team →
                </Link>
              </div>
              {/* Low-friction secondary option */}
              <p className="text-gray-400 text-sm">
                Not ready to call?{' '}
                <Link href="/free-practice" className="text-gold underline hover:no-underline font-semibold">
                  Try free practice questions first →
                </Link>
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6">
                {['PMI-Aligned', 'PMP® & CAPM® Prep', 'Veterans Welcome', 'Corporate Packages', 'Virtual + Metro Atlanta'].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />{t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-center order-first lg:order-last">
              <div className="relative">
                <img
                  src="/crystal-stewart.jpg"
                  alt="Crystal Stewart, PMP® — The Project Management Evangelist"
                  className="rounded-2xl shadow-2xl w-full max-w-xs lg:max-w-sm object-cover h-[280px] lg:h-[480px]"
                />
                <div className="absolute -bottom-4 -left-4 bg-gold text-navy font-bold px-4 py-2 rounded-xl text-sm shadow-lg">
                  Crystal Stewart, PMP®
                </div>
                <div className="absolute -top-4 -right-4 bg-navy border-2 border-gold text-white px-4 py-2 rounded-xl text-sm shadow-lg text-center">
                  <p className="font-bold text-gold">87%</p>
                  <p className="text-xs">First-attempt<br/>pass rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals strip */}
      <TrustSignals />

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-navy">How It Works</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Your path from day one to PMP® certified and job-ready.</p>
          </div>

          {/* Process graphic — Learn → Practice → Certified → Get Job-Ready */}
          <img
            src="/HowWeDoIt_process_light.png"
            alt="How we do it: Learn, Practice, Certified, Get Job-Ready"
            className="block w-full max-w-[1100px] h-auto mx-auto rounded-2xl shadow-sm ring-1 ring-gray-100"
          />

          {/* Social proof nudge below steps */}
          <div className="mt-10 bg-navy/5 border border-navy/10 rounded-2xl p-6 text-center">
            <p className="text-navy font-semibold text-lg">
              <span className="text-gold font-bold">87%</span> of students pass on their first attempt.{' '}
              <span className="text-gold font-bold">Pass Guarantee</span> included — we coach you until you pass.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                className="bg-gold text-navy font-bold px-8 py-3 rounded-lg hover:bg-amber-400 transition-colors">
                Book a Free Strategy Call
              </a>
              <Link href="/free-practice"
                className="border-2 border-navy text-navy font-bold px-8 py-3 rounded-lg hover:bg-navy hover:text-white transition-colors">
                Try Free Practice First
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DISPLAY STAT — typographic anchor between How It Works and Free Guide */}
      <section className="py-16 bg-navy text-center overflow-hidden">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div>
              <p className="text-8xl md:text-9xl font-bold text-gold leading-none tabular-nums">87%</p>
              <p className="text-white text-lg font-semibold mt-2">first-attempt pass rate</p>
            </div>
            <div className="hidden md:block w-px h-24 bg-white/20" />
            <div className="text-left max-w-sm">
              <p className="text-2xl font-bold text-white mb-2">Pass Guarantee included.</p>
              <p className="text-gray-300 leading-relaxed">We coach you until you pass — no extra charge, no fine print. Our 87% first-attempt rate means most students never need it.</p>
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                className="inline-block mt-4 bg-gold text-navy font-bold px-6 py-3 rounded-xl hover:bg-amber-400 transition-colors">
                Book a Free Strategy Call →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FREE GUIDE */}
      <section className="py-12 bg-white border-b-4 border-gold">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-gold/20 text-gold text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                📥 Free Download — No Credit Card Needed
              </div>
              <h2 className="text-3xl font-bold text-navy mb-3">
                Get the Free Guide:<br/>"Your PMP® Exam Game Plan"
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                A free 9-page guide to the PMP® exam — every domain, question type, and content area —
                so you can plan your prep and choose your path with confidence.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'Domain weights: People 42%→33%, Business Env 8%→26%',
                  'New question formats — case sets, graphics, pull-down lists',
                  'AI & Sustainability — what you need to know',
                  'Decision guide: is the PMP® or CAPM® right for you?',
                  'Cohort dates, inclusions & real graduate testimonials',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gold font-bold mt-0.5">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/free-guide"
                className="inline-block bg-gold text-navy font-bold px-8 py-4 rounded-xl hover:bg-amber-400 transition-colors text-lg shadow-md">
                Get the Free Guide →
              </Link>
              <p className="text-xs text-gray-400 mt-2">Enter your name & email — instant download. No spam ever.</p>
            </div>
            <div className="flex justify-center">
              <div className="bg-navy rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
                <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">Free Guide</p>
                <div className="bg-gold/20 border border-gold/40 rounded-xl p-4 mb-4">
                  <p className="text-white font-bold text-xl leading-snug mb-1">
                    Your PMP® Exam Game Plan
                  </p>
                  <p className="text-gray-400 text-sm">What Every Aspiring PMP® Needs to Know</p>
                </div>
                <div className="space-y-2 text-left mb-6">
                  {['9 pages of exam intel', 'Domain comparison table', 'New question format guide', 'Decision flowchart', 'Cohort dates & pricing'].map(f => (
                    <p key={f} className="text-gray-300 text-sm flex items-center gap-2">
                      <span className="text-gold">✓</span> {f}
                    </p>
                  ))}
                </div>
                <Link href="/free-guide"
                  className="block w-full bg-gold text-navy font-bold py-3 rounded-xl hover:bg-amber-400 transition-colors">
                  Download Free →
                </Link>
                <p className="text-gray-500 text-xs mt-3">Instant access · No credit card</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cohort Countdown */}
      <section className="py-12 bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Act Now</p>
            <h2 className="text-2xl font-bold text-navy">Cohort Schedule — Current &amp; Upcoming</h2>
            <p className="text-gray-600 mt-2">Reserve your seat in an upcoming cohort — spots are limited to keep classes small and mentor-led.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COHORTS.map((c) => (
              <div key={c.name} className={`rounded-2xl p-6 border-2 ${c.status === 'closed' ? 'border-gray-300 bg-gray-100 opacity-75' : c.status === 'urgent' ? 'border-red-400 bg-red-50' : 'border-gold bg-amber-50'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-navy text-lg">{c.name}</h3>
                    <p className="text-gray-600 text-sm">{c.dates}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.status === 'closed' ? 'bg-gray-400 text-white' : c.status === 'urgent' ? 'bg-red-500 text-white' : 'bg-gold text-navy'}`}>
                    {c.status === 'closed' ? 'Closed' : c.spots + ' spots left'}
                  </span>
                </div>
                <p className={`text-sm font-bold mb-4 ${c.status === 'closed' ? 'text-gray-500' : c.status === 'urgent' ? 'text-red-600' : 'text-amber-700'}`}>
                  ⚡ {c.examBy}
                </p>
                {c.status === 'closed' ? (
                  <p className="block w-full bg-gray-300 text-gray-500 font-bold py-3 rounded-xl text-center cursor-not-allowed text-sm">
                    ✓ Class Full — Enrollment Closed
                  </p>
                ) : (
                  <Link href="/checkout"
                    className={`block w-full font-bold py-3 rounded-xl text-center transition-colors ${c.status === 'urgent' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-navy text-white hover:bg-blue-900'}`}>
                    {c.status === 'urgent' ? '🔥 Enroll Now — Only ' + c.spots + ' Spots Left!' : c.status === 'open' ? '🗓 Reserve My Spot — ' + c.label : 'Reserve My Spot'}
                  </Link>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            * Spots are limited to maintain cohort quality.
          </p>
        </div>
      </section>

      {/* Stats bar with background */}
      <section
        className="bg-gold py-10 relative overflow-hidden"
        style={{ backgroundImage: 'url(/veterans-classroom.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gold/90" />
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-navy">{s.value}</p>
                <p className="text-navy/70 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why certify now */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Why Students Choose Enterprise Academy</h2>
            <p className="text-gray-400 text-sm">Mentor-led prep built around one goal: passing on your first attempt.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
            {[
              { icon: '📚', title: 'Mentor-Led', desc: "Live cohorts and 1:1 support from Crystal and team — you're never studying alone." },
              { icon: '🎯', title: 'Realistic Practice', desc: 'A 694-question bank, full-length mock exam, and every current question format, so exam day feels familiar.' },
              { icon: '🏆', title: 'Pass Guarantee', desc: "Crystal and team coach you until you pass — no extra charge, no fine print. Our 87% first-attempt rate means most never need it." },
            ].map(item => (
              <div key={item.title} className="bg-white/10 hover:bg-white/15 transition-colors rounded-2xl p-8 border border-white/10">
                <p className="text-4xl mb-4">{item.icon}</p>
                <h3 className="font-bold text-gold mb-2">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 bg-white/10 border border-gold/40 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-gold font-bold mb-1">📥 Not ready to book a call yet?</p>
              <p className="text-gray-300 text-sm">Download the free guide first. Get all the facts, then decide your path.</p>
            </div>
            <Link href="/free-guide"
              className="shrink-0 bg-gold text-navy font-bold px-6 py-3 rounded-xl hover:bg-amber-400 transition-colors whitespace-nowrap">
              Get the Free Guide →
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive programs + testimonials */}
      <HomeClient programs={PROGRAMS} testimonials={TESTIMONIALS} calendly={CALENDLY} />

      {/* Crystal instructor section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <img src="/team-success.jpg" alt="PMP certification team celebrating success"
                className="rounded-2xl shadow-xl w-full object-cover max-h-[500px]" />
            </div>
            <div>
              <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Your Instructor</p>
              <h2 className="text-4xl font-bold text-navy mb-4">Crystal Stewart, PMP®</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                The Project Management Evangelist™. 20+ years of enterprise transformation. Founder of Enterprise Academy.
                U.S. Army veteran. Crystal does not just teach PM — she has lived it, built with it, and now equips
                the next generation of project managers to do the same.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                {['PMP® Certified', 'U.S. Army Veteran', 'Enterprise Academy Founder', '20+ Years Experience', 'Smyrna, GA'].map(t => (
                  <span key={t} className="bg-light-navy border border-navy/20 text-navy text-xs font-medium px-3 py-1.5 rounded-full">{t}</span>
                ))}
              </div>
              <div className="flex gap-4">
                <Link href="/about" className="bg-navy text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors">
                  Crystal&apos;s Story
                </Link>
                <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                  className="border-2 border-gold text-gold font-bold px-6 py-3 rounded-lg hover:bg-gold hover:text-navy transition-colors">
                  Book a Call
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Veterans — with photo */}
      <section className="py-16 bg-navy text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-4xl mb-4">🎖️</div>
              <h2 className="text-3xl font-bold mb-4">Built for Veterans</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                You have managed missions under pressure. Now translate that into a PMP® credential.
                Veteran-discounted tuition. Veteran peer cohort.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/veterans" className="bg-gold text-navy font-bold px-8 py-3 rounded-lg hover:bg-amber-400 transition-colors">
                  Veterans Program →
                </Link>
                <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                  className="border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors">
                  Book a Free Call
                </a>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="relative w-full max-w-md">
                <Image
                  src="/veterans-classroom.jpg"
                  alt="Military veterans learning project management in a classroom"
                  width={480}
                  height={320}
                  className="rounded-2xl shadow-2xl object-cover w-full"
                />
                <div className="absolute inset-0 rounded-2xl ring-2 ring-gold/40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gold">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-navy mb-4">Ready to Pass on Your First Try?</h2>
          <p className="text-navy/70 mb-4 text-lg">
            Book a free call with Crystal today. She&apos;ll map your fastest path to PMP® or CAPM®
            certification — and the prep that gets you there with confidence.
          </p>
          <div className="bg-navy/10 rounded-xl p-4 mb-6 max-w-lg mx-auto">
            <p className="text-navy text-sm font-bold">🌐 {COHORTS[0].label} cohort — enrolling now</p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
              className="bg-navy text-white font-bold px-8 py-4 rounded-lg hover:bg-blue-900 transition-colors text-lg">
              Book Your Free Call Today
            </a>
            <Link href="/programs"
              className="border-2 border-navy text-navy font-bold px-8 py-4 rounded-lg hover:bg-navy hover:text-white transition-colors text-lg">
              View All Programs
            </Link>
          </div>
          <p className="text-navy/60 text-sm">
            Not ready to call?{' '}
            <Link href="/free-guide" className="font-bold underline hover:no-underline">Download the free guide first →</Link>
          </p>
        </div>
      </section>
    </>
  )
}

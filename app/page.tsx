import Link from 'next/link'
import { PROGRAMS, STATS } from '@/lib/constants'
import HomeClient from './components/HomeClient'

const CALENDLY = 'https://calendly.com/space4grace/15min'

const TESTIMONIALS = [
  {
    name: 'Tai Cochran, MA Ed. HD, PMP',
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

const COHORTS = [
  { name: 'April Accelerator', dates: 'April 14 – June 30, 2026', spots: 8, status: 'filling', examBy: 'Exam by July 8 — beat the change!' },
  { name: 'May Fast Track', dates: 'May 5 – June 23, 2026', spots: 4, status: 'urgent', examBy: 'Last cohort before July 8 deadline' },
]

export default function HomePage() {
  return (
    <>
      {/* Urgency Banner */}
      <div className="bg-gold text-navy text-center py-2.5 px-4 text-sm font-bold">
        ⚠️ The PMP® exam changes July 8, 2026 — Certify now on the proven exam before the format shifts.{' '}
        <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
          Reserve your spot →
        </a>
      </div>

      {/* Hero */}
      <section className="bg-navy text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Text */}
            <div>
              <p className="text-gold text-sm font-bold uppercase tracking-widest mb-4">Enterprise Academy™ · Wiser Generations™</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Pass Your PMP®<br />
                <span className="text-gold">Before the Exam Changes.™</span>
              </h1>
              <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-6 max-w-2xl">
                The PMP® exam gets a major overhaul on July 8, 2026. Certify now on 5 years of proven materials —
                before new AI content, new question formats, and new uncertainty arrive.
                Mentor-led. PMI-aligned. Delivered by Crystal Stewart, PMP®.
              </p>

              {/* Social proof snippet */}
              <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-8 max-w-xl">
                <p className="text-gray-200 text-sm italic leading-relaxed">
                  "Her knowledge, training and mentorship helped me to clear my PMP on the very first try!"
                </p>
                <p className="text-gold text-xs font-bold mt-2">— Tai Cochran, MA Ed. HD, PMP · CEO, HER PM</p>
              </div>

              <div className="flex flex-wrap gap-4 mb-8">
                <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                  className="bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-amber-400 transition-colors text-lg">
                  Book a Free Strategy Call
                </a>
                <Link href="/programs"
                  className="border-2 border-gold text-gold font-bold px-8 py-4 rounded-lg hover:bg-white/10 transition-colors text-lg">
                  View Programs
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {['PMI-Aligned', 'PMP® & CAPM® Prep', 'Veterans Welcome', 'Corporate Packages', 'Virtual + Metro Atlanta'].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — Crystal's photo */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <img
                  src="/crystal-stewart.jpg"
                  alt="Crystal Stewart, PMP® — The Project Management Evangelist"
                  className="rounded-2xl shadow-2xl w-full max-w-sm object-cover h-[480px]"
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

      {/* Cohort Countdown */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Act Now</p>
            <h2 className="text-2xl font-bold text-navy">Last Cohorts Before July 8 Exam Deadline</h2>
            <p className="text-gray-600 mt-2">The PMP® exam format changes July 8, 2026. These are your final cohorts to certify on proven materials.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COHORTS.map((c) => (
              <div key={c.name} className={`rounded-2xl p-6 border-2 ${c.status === 'urgent' ? 'border-red-400 bg-red-50' : 'border-gold bg-amber-50'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-navy text-lg">{c.name}</h3>
                    <p className="text-gray-600 text-sm">{c.dates}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.status === 'urgent' ? 'bg-red-500 text-white' : 'bg-gold text-navy'}`}>
                    {c.spots} spots left
                  </span>
                </div>
                <p className={`text-sm font-bold mb-4 ${c.status === 'urgent' ? 'text-red-600' : 'text-amber-700'}`}>
                  ⚡ {c.examBy}
                </p>
                <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                  className="block w-full bg-navy text-white font-bold py-3 rounded-xl text-center hover:bg-blue-900 transition-colors">
                  Reserve My Spot
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            * Spots are limited to maintain cohort quality. Book a call to confirm availability.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gold py-10">
        <div className="max-w-5xl mx-auto px-4">
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

      {/* Why certify now callout */}
      <section className="py-12 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Why Certify Before July 8, 2026?</h2>
            <p className="text-gray-400 text-sm">PMI confirmed the exam changes July 8. Here is what that means for you.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '📚', title: 'Proven Materials', desc: '5+ years of refined study guides, practice exams, and question banks — vs. first-generation materials for the new format.' },
              { icon: '🎯', title: 'Known Format', desc: 'The current exam has predictable patterns. After July 8, new AI/sustainability content and new question types arrive.' },
              { icon: '🏆', title: 'Same Credential', desc: 'A PMP® earned in June 2026 is identical to one earned in September. Same salary impact. Same global recognition. Less uncertainty.' },
            ].map(item => (
              <div key={item.title} className="bg-white/10 rounded-xl p-6">
                <p className="text-3xl mb-3">{item.icon}</p>
                <h3 className="font-bold text-gold mb-2">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive section */}
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
              <h2 className="text-3xl font-bold text-navy mb-4">Crystal Stewart, PMP®</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                The Project Management Evangelist™. 20+ years of enterprise transformation. Founder of Enterprise Academy™.
                U.S. Army veteran. Crystal does not just teach PM — she has lived it, built with it, and now equips
                the next generation of project managers to do the same.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                {['PMP® Certified', 'U.S. Army Veteran', 'Enterprise Academy™ Founder', '20+ Years Experience', 'Smyrna, GA'].map(t => (
                  <span key={t} className="bg-light-navy border border-navy/20 text-navy text-xs font-medium px-3 py-1.5 rounded-full">{t}</span>
                ))}
              </div>
              <div className="flex gap-4">
                <Link href="/about" className="bg-navy text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors">
                  Crystal's Story
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

      {/* Veterans */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-4xl mb-4">🎖️</div>
          <h2 className="text-3xl font-bold mb-4">Built for Veterans</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-6 max-w-2xl mx-auto">
            You have managed missions under pressure. Now translate that into a PMP® credential before the exam changes.
            Veteran-discounted tuition. Veteran peer cohort. VA benefit guidance included.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/veterans" className="bg-gold text-navy font-bold px-8 py-3 rounded-lg hover:bg-amber-400 transition-colors">
              Veterans Program →
            </Link>
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
              className="border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors">
              Book a Free Call
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gold">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-navy mb-4">Your Window is Closing July 8, 2026</h2>
          <p className="text-navy/70 mb-4 text-lg">
            The current PMP® exam — the one with 5 years of proven prep materials — is only available until July 8.
            Book a free call with Crystal today. She will map out your path to passing before the deadline.
          </p>
          <div className="bg-navy/10 rounded-xl p-4 mb-8 max-w-lg mx-auto">
            <p className="text-navy text-sm font-bold">⚡ April & May cohorts are filling fast — limited spots remaining</p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
              className="bg-navy text-white font-bold px-8 py-4 rounded-lg hover:bg-blue-900 transition-colors text-lg">
              Book Your Free Call Today
            </a>
            <Link href="/enroll"
              className="border-2 border-navy text-navy font-bold px-8 py-4 rounded-lg hover:bg-navy hover:text-white transition-colors text-lg">
              View All Programs
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

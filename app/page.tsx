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

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-3xl">
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-4">Enterprise Academy™ · Wiser Generations™</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Project Manage Your Career.
              <br /><span className="text-gold">Transform Your Future.™</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8 max-w-2xl">
              PMP® and CAPM® certification training built for career transitioners, corporate teams, and veterans.
              Mentor-led. PMI-aligned. Delivered by Crystal Stewart — The Project Management Evangelist™.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                className="bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-amber-400 transition-colors text-lg">
                Book a Free Call
              </a>
              <Link href="/programs"
                className="border-2 border-gold text-gold font-bold px-8 py-4 rounded-lg hover:bg-white/10 transition-colors text-lg">
                Explore Programs
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
            {/* Team photo */}
            <div className="hidden lg:block">
              <img
                src="/team-success.jpg"
                alt="PMP certification team celebrating success"
                className="rounded-2xl shadow-2xl w-3/4 mx-auto object-cover h-[380px] opacity-90 -mt-24 block"
              />
            </div>
          </div>
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

      {/* Interactive section */}
      <HomeClient programs={PROGRAMS} testimonials={TESTIMONIALS} calendly={CALENDLY} />

      {/* Crystal */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <img src="/crystal-stewart.jpg" alt="Crystal Stewart, PMP®"
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
      <section className="py-16 bg-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 border-2 border-gold rounded-full translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="text-4xl mb-4">🎖️</div>
          <h2 className="text-3xl font-bold mb-4">Built for Veterans</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-6 max-w-2xl mx-auto">
            You have managed missions under pressure. You have led teams in high-stakes environments.
            Now translate that experience into a PMP® or CAPM® credential that civilian employers recognize.
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

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-navy mb-4">Ready to Manage Your Next Chapter?</h2>
          <p className="text-navy/70 mb-8 text-lg">Tell us where you are and where you want to go. Crystal will match you to the right program in a free 15-minute call.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
              className="bg-navy text-white font-bold px-8 py-4 rounded-lg hover:bg-blue-900 transition-colors text-lg">
              Book Your Free Call Today
            </a>
            <Link href="/programs"
              className="border-2 border-navy text-navy font-bold px-8 py-4 rounded-lg hover:bg-navy hover:text-white transition-colors text-lg">
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

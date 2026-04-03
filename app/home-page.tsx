'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { PROGRAMS, STATS } from '@/lib/constants'

const CALENDLY = 'https://calendly.com/space4grace/15min'

const AUDIENCES = [
  { id: 'all', label: 'All Programs' },
  { id: 'professional', label: 'Career Transitioner' },
  { id: 'veteran', label: 'Veteran' },
  { id: 'corporate', label: 'Corporate Team' },
  { id: 'earlycareer', label: 'Early Career' },
]

const AUDIENCE_MAP: Record<string, string[]> = {
  all: [],
  professional: ['pmp-adult', 'capm-adult'],
  veteran: ['veterans'],
  corporate: ['corporate'],
  earlycareer: ['capm-adult'],
}

const TESTIMONIALS = [
  {
    name: 'Tai Cochran, MA Ed. HD, PMP',
    role: 'CEO, HER PM | Project Leadership Strategist',
    quote: 'Crystal is the ultimate trainer! She is a wealth of knowledge and wisdom, truly invested to ensure the success of each of her students. Her knowledge, training and mentorship helped me to clear my PMP on the very first try!',
  },
  {
    name: 'Lynn Fleming MBA, PMP, PMI-ACP, PMI-SP',
    role: 'Principal Strategic Program Manager',
    quote: 'Knowledgeable with a sincere concern for each of her pupils, she has a unique way of conveying the concepts regardless of their learning method. After attending her course, I gained confidence within the PMI realm. I highly recommend Crystal\'s services to any organization that desires to improve their PMO.',
  },
  {
    name: 'Erin Sanders, PE, PMP',
    role: 'Chief Operating Officer',
    quote: 'Crystal is a project management professional. Her passion for teaching the project management process creates an engaging and exciting classroom. I would recommend Crystal to any organization or individual seeking project management education or PMP Certification.',
  },
]

export default function HomePage() {
  const [activeAudience, setActiveAudience] = useState('all')
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  useEffect(() => {
    const handleScroll = () => setShowStickyBar(window.scrollY > 500)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const filteredPrograms = activeAudience === 'all'
    ? PROGRAMS
    : PROGRAMS.filter(p => AUDIENCE_MAP[activeAudience]?.includes(p.id))

  return (
    <>
      {/* Sticky booking bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-navy border-t-2 border-gold py-3 px-4 transition-transform duration-300 ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <p className="text-white font-medium text-sm hidden sm:block">Ready to earn your PMP® or CAPM®?</p>
          <div className="flex gap-3 w-full sm:w-auto">
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
              className="flex-1 sm:flex-none bg-gold text-navy font-bold px-6 py-2 rounded-lg hover:bg-amber-400 transition-colors text-sm text-center">
              Book a Free Call →
            </a>
            <Link href="/programs"
              className="flex-1 sm:flex-none border border-white text-white font-medium px-6 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm text-center">
              View Programs
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-navy text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
        {/* Geometric background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-96 h-96 border-2 border-gold rounded-full" />
          <div className="absolute top-20 right-20 w-72 h-72 border border-gold rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 border border-gold rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div>
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

      {/* Interactive Program Selector */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Find Your Program</p>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Who Are You?</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Select your situation and we'll show you the right program.</p>
          </div>

          {/* Audience tabs */}
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            {AUDIENCES.map(a => (
              <button
                key={a.id}
                onClick={() => setActiveAudience(a.id)}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  activeAudience === a.id
                    ? 'bg-navy text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Program cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(filteredPrograms.length > 0 ? filteredPrograms : PROGRAMS).map(p => (
              <div key={p.id} className={`border-2 ${p.color} rounded-2xl p-8 hover:shadow-lg transition-all hover:-translate-y-1 relative`}>
                {p.badge && <span className="absolute top-4 right-4 bg-navy text-white text-xs font-bold px-3 py-1 rounded-full">{p.badge}</span>}
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="text-xl font-bold text-navy mb-1">{p.name}</h3>
                <p className="text-gold text-sm font-medium mb-3">{p.audience}</p>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{p.description}</p>
                <ul className="space-y-1 mb-6">
                  {p.features.slice(0, 4).map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-gold">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between">
                  {p.price > 0 ? (
                    <p className="text-navy font-bold text-2xl">from ${p.price.toLocaleString()}</p>
                  ) : (
                    <p className="text-navy font-bold text-lg">Custom Pricing</p>
                  )}
                  <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                    className="bg-navy text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-900 transition-colors text-sm">
                    Learn More →
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filteredPrograms.length === 0 && (
            <div className="text-center mt-6">
              <p className="text-gray-500">No exact match — <button onClick={() => setActiveAudience('all')} className="text-gold underline">view all programs</button></p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-light-navy">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-8">Student Results</p>
          <div className="relative min-h-[160px]">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={`transition-all duration-500 absolute inset-0 ${i === activeTestimonial ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <blockquote className="text-xl md:text-2xl font-medium text-navy leading-relaxed mb-4">
                  "{t.quote}"
                </blockquote>
                <p className="text-gold font-bold">{t.name}</p>
                <p className="text-gray-500 text-sm">{t.role}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-center mt-8">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeTestimonial ? 'bg-navy scale-125' : 'bg-gray-300'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* Crystal section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <img src="https://raw.githubusercontent.com/D4CGDBEMWS/wisergenerations-pmp/main/public/crystal-stewart.jpg" alt="Crystal Stewart, PMP®"
                className="rounded-2xl shadow-xl w-full object-cover max-h-[500px]" />
            </div>
            <div>
              <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Your Instructor</p>
              <h2 className="text-3xl font-bold text-navy mb-4">Crystal Stewart, PMP®</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                The Project Management Evangelist™. 20+ years of enterprise transformation. Founder of Enterprise Academy™.
                U.S. Army veteran. Crystal doesn't just teach PM — she's lived it, built with it, and now equips
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

      {/* Veterans callout */}
      <section className="py-16 bg-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 border-2 border-gold rounded-full translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="text-4xl mb-4">🎖️</div>
          <h2 className="text-3xl font-bold mb-4">Built for Veterans</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-6 max-w-2xl mx-auto">
            You've managed missions under pressure. You've led teams in high-stakes environments.
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

'use client'
import { useState, useEffect } from 'react'

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

interface Program {
  id: string
  icon: string
  name: string
  audience: string
  color: string
  badge?: string
  price: number
  description: string
  features: string[]
}

interface Testimonial {
  name: string
  role: string
  quote: string
}

interface Props {
  programs: Program[]
  testimonials: Testimonial[]
  calendly: string
}

export default function HomeClient({ programs, testimonials, calendly }: Props) {
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
      setActiveTestimonial(prev => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  const filteredPrograms = activeAudience === 'all'
    ? programs
    : programs.filter(p => AUDIENCE_MAP[activeAudience]?.includes(p.id))

  const displayPrograms = filteredPrograms.length > 0 ? filteredPrograms : programs

  return (
    <>
      {/* Sticky booking bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-navy border-t-2 border-gold py-3 px-4 transition-transform duration-300 ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <p className="text-white font-medium text-sm hidden sm:block">Ready to earn your PMP® or CAPM®?</p>
          <div className="flex gap-3 w-full sm:w-auto">
            <a href={calendly} target="_blank" rel="noopener noreferrer"
              className="flex-1 sm:flex-none bg-gold text-navy font-bold px-6 py-2 rounded-lg hover:bg-amber-400 transition-colors text-sm text-center">
              Book a Free Call →
            </a>
            <a href="/programs"
              className="flex-1 sm:flex-none border border-white text-white font-medium px-6 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm text-center">
              View Programs
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Program Selector */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Find Your Program</p>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Who Are You?</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Select your situation and we'll show you the right program.</p>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayPrograms.map(p => (
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
                  <a href="/checkout"
                    className="bg-navy text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-900 transition-colors text-sm">
                    Learn More →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-light-navy">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-8">What Students Say</p>
          <div className="relative min-h-[180px]">
            {testimonials.map((t, i) => (
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
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeTestimonial ? 'bg-navy scale-125' : 'bg-gray-300'}`} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

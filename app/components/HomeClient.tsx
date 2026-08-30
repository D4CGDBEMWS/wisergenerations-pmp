'use client'
import { useState, useEffect } from 'react'

// PROTOTYPE — Phase 1A. Not authorized for merge or deployment.
//
// What is left here after the "Who Are You?" router moved out to
// ProgramRouter: the sticky booking bar and the testimonial carousel, both of
// which stay exactly where they are on the page. The router had to be a
// separate component before it could be a separate position.

interface Testimonial {
  name: string
  role: string
  quote: string
}

interface Props {
  testimonials: Testimonial[]
  calendly: string
}

export default function HomeClient({ testimonials, calendly }: Props) {
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const handleScroll = () => setShowStickyBar(window.scrollY > 500)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length, isPaused])

  return (
    <>
      {/* Sticky booking bar */}
      <div data-wg-bottom-chrome="" className={`fixed bottom-0 left-0 right-0 z-50 bg-brand-blue border-t-2 border-gold py-3 px-4 transition-transform duration-300 ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <p className="text-white font-medium text-sm hidden sm:block">Ready to earn your PMP® or CAPM®?</p>
          <div className="flex gap-3 w-full sm:w-auto">
            <a href={calendly} target="_blank" rel="noopener noreferrer"
              className="flex-1 sm:flex-none bg-gold text-navy font-bold px-6 py-2.5 rounded-lg hover:bg-amber-400 transition-colors text-sm text-center shadow-md">
              Book a Free Call →
            </a>
            <a href="/programs"
              className="flex-1 sm:flex-none border border-white/40 text-white/60 font-normal px-5 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm text-center">
              View Programs
            </a>
          </div>
        </div>
      </div>

      {/* Testimonials Carousel */}
      <section
        className="py-20 bg-slate-50"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">What Students Say</p>
          <h2 className="text-3xl font-bold text-navy mb-10">Graduates Speak for Themselves</h2>

          {/* Carousel container — fixed height prevents layout shift */}
          <div className="relative overflow-hidden" style={{ minHeight: '220px' }}>
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out px-4"
                style={{
                  opacity: i === activeTestimonial ? 1 : 0,
                  transform: i === activeTestimonial ? 'translateY(0)' : 'translateY(20px)',
                  pointerEvents: i === activeTestimonial ? 'auto' : 'none',
                }}
              >
                <div className="text-5xl text-gold/30 font-serif leading-none mb-2">&ldquo;</div>
                <blockquote className="text-lg md:text-xl font-medium text-navy leading-relaxed mb-5 max-w-2xl mx-auto">
                  {t.quote}
                </blockquote>
                <p className="text-gold font-bold text-lg">{t.name}</p>
                <p className="text-gray-500 text-sm mt-1">{t.role}</p>
              </div>
            ))}
          </div>

          {/* Dot navigation */}
          <div className="flex gap-3 justify-center mt-10">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActiveTestimonial(i); setIsPaused(true); setTimeout(() => setIsPaused(false), 8000); }}
                aria-label={`Show testimonial ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === activeTestimonial
                    ? 'w-8 h-3 bg-navy'
                    : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-6 max-w-xs mx-auto h-0.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              key={activeTestimonial}
              className="h-full bg-gold rounded-full"
              style={{
                animation: isPaused ? 'none' : 'progress 5s linear forwards',
              }}
            />
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes progress {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </>
  )
}

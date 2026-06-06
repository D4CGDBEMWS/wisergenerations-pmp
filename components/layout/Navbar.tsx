'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/components/Analytics'

const CALENDLY = 'https://calendly.com/space4grace/30min-pod'

// Slimmed to 5 core nav items — secondary links moved to footer
const navLinks = [
  { label: 'Programs', href: '/programs' },
  { label: 'Veterans', href: '/veterans' },
  { label: 'Corporate', href: '/corporate' },
  { label: 'About', href: '/about' },
  { label: 'Free Guide', href: '/free-guide' },
]

// Mobile menu includes secondary links so nothing is lost
const mobileExtraLinks = [
  { label: 'WIOA', href: '/wioa' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Flashcards', href: '/flashcards' },
  { label: 'Pods', href: '/pods' },
  { label: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-navy shadow-lg' : 'bg-navy'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
              <span className="text-navy font-bold text-sm">WG</span>
            </div>
          </Link>

          {/* Desktop nav — 5 core links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Low-friction CTA — no commitment */}
            <Link
              href="/free-practice"
              onClick={() => trackEvent('try_free_practice_click')}
              className="border border-gold/60 text-gold hover:bg-gold/10 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Try Free Practice →
            </Link>
            {/* Primary CTA */}
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('calendly_click')}
              className="bg-gold text-navy font-bold px-4 py-2 rounded-lg text-sm hover:bg-yellow-400 transition-colors whitespace-nowrap">
              Book a Call
            </a>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-gray-300 hover:text-white p-2" aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu — all links available */}
      {isOpen && (
        <div className="lg:hidden bg-navy border-t border-white/10">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                className="block text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {link.label}
              </Link>
            ))}

            {/* Secondary links in mobile */}
            <div className="pt-2 border-t border-white/10 mt-2">
              {mobileExtraLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                  className="block text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              <Link href="/free-practice" onClick={() => setIsOpen(false)}
                className="block border border-gold/60 text-gold px-4 py-3 rounded-lg text-sm font-semibold text-center transition-colors">
                Try Free Practice Questions →
              </Link>
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('calendly_click')}
                className="bg-gold text-navy font-bold px-4 py-3 rounded-lg text-sm hover:bg-yellow-400 transition-colors text-center">
                Book a Free Strategy Call
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()

  // Hide the CTA buttons when the visitor is already on the free-practice page —
  // "Try Free Practice" would link back to the current page, and "Book a Call"
  // pulls focus away from someone who's mid-session.
  const hideCTAs = pathname === '/free-practice'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`sticky top-0 z-50 bg-white border-b border-gray-200 transition-all duration-200 ${scrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0" aria-label="Wiser Generations home">
            <img
              src="/wiser-generations-logo.png"
              alt="Wiser Generations"
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop nav — 5 core links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="text-navy hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs — hidden on /free-practice */}
          {!hideCTAs && (
            <div className="hidden lg:flex items-center gap-3">
              {/* Low-friction CTA — no commitment */}
              <Link
                href="/free-practice"
                onClick={() => trackEvent('try_free_practice_click')}
                className="border border-navy/30 text-navy hover:bg-navy/5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Try Free Practice →
              </Link>
              {/* Primary CTA */}
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('calendly_click')}
                className="bg-gold text-navy font-bold px-4 py-2 rounded-lg text-sm hover:bg-yellow-400 transition-colors whitespace-nowrap">
                Book a Call
              </a>
            </div>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-navy hover:text-gold p-2" aria-label="Toggle menu">
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
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                className="block text-navy hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {link.label}
              </Link>
            ))}

            {/* Secondary links in mobile */}
            <div className="pt-2 border-t border-gray-200 mt-2">
              {mobileExtraLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                  className="block text-gray-600 hover:text-navy px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile CTAs — hidden on /free-practice */}
            {!hideCTAs && (
              <div className="pt-4 border-t border-gray-200 flex flex-col gap-3">
                <Link href="/free-practice" onClick={() => setIsOpen(false)}
                  className="block border border-navy/30 text-navy px-4 py-3 rounded-lg text-sm font-semibold text-center transition-colors">
                  Try Free Practice Questions →
                </Link>
                <a href={CALENDLY} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('calendly_click')}
                  className="bg-gold text-navy font-bold px-4 py-3 rounded-lg text-sm hover:bg-yellow-400 transition-colors text-center">
                  Book a Free Strategy Call
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

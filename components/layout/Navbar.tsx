'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/components/Analytics'

const CALENDLY = 'https://calendly.com/space4grace/15min'

const navLinks = [
  { label: 'Programs', href: '/programs' },
  { label: 'WIOA', href: '/wioa' },
  { label: 'About', href: '/about' },
  { label: 'Veterans', href: '/veterans' },
  { label: 'Corporate', href: '/corporate' },
  { label: 'Pods', href: '/pods' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Exam Simulator', href: '/exam-simulator' },
  { label: 'Flashcards', href: '/flashcards' },
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
          <Link href="/" className="flex-shrink-0">
            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
              <span className="text-navy font-bold text-sm">WG</span>
            </div>
          </Link>

          <div className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden xl:flex items-center gap-3">
            <Link href="/free-guide" className="text-gray-300 hover:text-gold text-sm font-medium transition-colors">
              Free Guide
            </Link>
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('calendly_click')}
              className="bg-gold text-navy font-bold px-4 py-2 rounded-lg text-sm hover:bg-yellow-400 transition-colors">
              Book a Call
            </a>
          </div>

          <button onClick={() => setIsOpen(!isOpen)}
            className="xl:hidden text-gray-300 hover:text-white p-2" aria-label="Toggle menu">
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

      {isOpen && (
        <div className="xl:hidden bg-navy border-t border-white/10">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                className="block text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              <Link href="/free-guide" onClick={() => setIsOpen(false)}
                className="block text-gray-300 hover:text-gold px-3 py-2 text-sm font-medium transition-colors">
                Free Guide
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

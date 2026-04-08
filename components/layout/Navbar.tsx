'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import SocialIcons from './SocialIcons'

const CALENDLY = 'https://calendly.com/space4grace/15min'

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
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
              <span className="text-navy font-bold text-xs">WG</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-sm leading-tight">Wiser Generations™</p>
              <p className="text-gold text-xs leading-tight">Enterprise Academy™</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/programs" className="text-gray-300 hover:text-gold text-sm font-medium transition-colors">Programs</Link>
            <Link href="/pmp" className="text-gray-300 hover:text-gold text-sm font-medium transition-colors">PMP® Prep</Link>
            <Link href="/veterans" className="text-gray-300 hover:text-gold text-sm font-medium transition-colors">Veterans</Link>
            <Link href="/corporate" className="text-gray-300 hover:text-gold text-sm font-medium transition-colors">Corporate</Link>
            <Link href="/resources" className="text-gray-300 hover:text-gold text-sm font-medium transition-colors">Resources</Link>
            <Link href="/about" className="text-gray-300 hover:text-gold text-sm font-medium transition-colors">About</Link>
            {/* FREE GUIDE — highlighted in nav */}
            <Link href="/free-guide"
              className="flex items-center gap-1.5 text-gold border border-gold/50 hover:bg-gold/10 text-sm font-bold px-3 py-1.5 rounded-lg transition-colors">
              📥 Free Guide
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/contact" className="text-gray-300 hover:text-gold text-sm font-medium transition-colors">Contact</Link>
            {/* Social icons — white in nav, hidden on mobile */}
            <SocialIcons variant="white" className="hidden md:flex" />
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
              className="bg-gold text-navy font-bold px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors text-sm">
              Get Started
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-300 hover:text-white p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-1">
            {[
              { href: '/programs', label: 'Programs' },
              { href: '/pmp', label: 'PMP® Prep' },
              { href: '/veterans', label: 'Veterans' },
              { href: '/corporate', label: 'Corporate' },
              { href: '/resources', label: 'Resources' },
              { href: '/about', label: 'About' },
              { href: '/contact', label: 'Contact' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-gray-300 hover:text-gold hover:bg-white/5 rounded-lg text-sm font-medium transition-colors">
                {item.label}
              </Link>
            ))}
            {/* Free Guide prominent in mobile */}
            <Link href="/free-guide" onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-gold font-bold text-sm border border-gold/40 rounded-lg mx-0 hover:bg-gold/10 transition-colors">
              📥 Free Guide — PMP® Exam Changes 2026
            </Link>
            <div className="pt-2 px-0">
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                className="block w-full bg-gold text-navy font-bold px-4 py-3 rounded-lg text-center hover:bg-amber-400 transition-colors text-sm">
                Book a Free Call
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

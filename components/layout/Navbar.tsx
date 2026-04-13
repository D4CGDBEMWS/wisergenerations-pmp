'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import SocialIcons from './SocialIcons'

const CALENDLY = 'https://calendly.com/space4grace/15min'

const navLinks = [
  { label: 'Programs', href: '/programs' },
  { label: 'PMP® Prep', href: '/pmp' },
  { label: 'About', href: '/about' },
  { label: 'Veterans', href: '/veterans' },
  { label: 'Corporate', href: '/corporate' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
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
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
              <span className="text-navy font-bold text-xs">WG</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-sm leading-tight">Wiser Generations Int&apos;l™</p>
              <p className="text-gold text-xs leading-tight">Enterprise Academy™</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-gold text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {/* FREE GUIDE highlighted in nav */}
            <Link
              href="/free-guide"
              className="flex items-center gap-1.5 text-gold border border-gold/50 hover:bg-gold/10 text-sm font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              📥 Free Guide
            </Link>
          </div>

          {/* Desktop CTA + Social Icons */}
          <div className="hidden md:flex items-center gap-3">
            <SocialIcons variant="white" className="hidden lg:flex" />
            <a
              href={CALENDLY}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gold text-navy font-bold px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors text-sm"
            >
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
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-navy border-t border-navy-light">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-gray-300 hover:text-gold py-2 text-sm font-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/free-guide"
              className="flex items-center gap-1.5 text-gold text-sm font-bold py-2"
              onClick={() => setIsOpen(false)}
            >
              📥 Free Guide
            </Link>
            <div className="pt-2 border-t border-gray-700">
              <a
                href={CALENDLY}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gold text-navy font-bold px-4 py-2 rounded-lg text-center text-sm hover:bg-amber-400 transition-colors"
              >
                Book a Free Call
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const CALENDLY = 'https://calendly.com/space4grace/15min'

const navLinks = [
  { label: 'Programs', href: '/programs' },
  { label: 'About', href: '/about' },
  { label: 'Veterans', href: '/veterans' },
  { label: 'Corporate', href: '/corporate' },
  { label: 'Resources', href: '#', dropdown: [
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Free Webinars', href: '/webinars' },
    { label: 'Exam Simulator', href: '/exam-simulator' },
    { label: 'Flashcards', href: '/flashcards' },
  ]},
  { label: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dropdown, setDropdown] = useState(false)

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

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              link.dropdown ? (
                <div key={link.label} className="relative"
                  onMouseEnter={() => setDropdown(true)}
                  onMouseLeave={() => setDropdown(false)}>
                  <button className="text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1">
                    {link.label}
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {dropdown && (
                    <div className="absolute top-full left-0 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-48 z-50">
                      {link.dropdown.map(item => (
                        <Link key={item.href} href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gold/10 hover:text-navy transition-colors">
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link key={link.href} href={link.href!}
                  className="text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/free-guide" className="text-gray-300 hover:text-gold text-sm font-medium transition-colors">
              Free Guide
            </Link>
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
              className="bg-gold text-navy font-bold px-4 py-2 rounded-lg text-sm hover:bg-yellow-400 transition-colors">
              Book a Call
            </a>
          </div>

          {/* Mobile menu button */}
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

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden bg-navy border-t border-white/10">
          <div className="px-4 py-4 space-y-1">
            <Link href="/programs" onClick={() => setIsOpen(false)} className="block text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium">Programs</Link>
            <Link href="/about" onClick={() => setIsOpen(false)} className="block text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium">About</Link>
            <Link href="/veterans" onClick={() => setIsOpen(false)} className="block text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium">Veterans</Link>
            <Link href="/corporate" onClick={() => setIsOpen(false)} className="block text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium">Corporate</Link>
            <Link href="/blog" onClick={() => setIsOpen(false)} className="block text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium">Blog</Link>
            <Link href="/faq" onClick={() => setIsOpen(false)} className="block text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium">FAQ</Link>
            <Link href="/webinars" onClick={() => setIsOpen(false)} className="block text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium">Free Webinars</Link>
            <Link href="/exam-simulator" onClick={() => setIsOpen(false)} className="block text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium">Exam Simulator</Link>
            <Link href="/flashcards" onClick={() => setIsOpen(false)} className="block text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium">Flashcards</Link>
            <Link href="/contact" onClick={() => setIsOpen(false)} className="block text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium">Contact</Link>
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              <Link href="/free-guide" onClick={() => setIsOpen(false)} className="block text-gray-300 hover:text-gold px-3 py-2 text-sm font-medium">Free Guide</Link>
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
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

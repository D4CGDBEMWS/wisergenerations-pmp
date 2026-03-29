'use client'
import Link from 'next/link'
import { useState } from 'react'

const NAV = [
  { label: 'Programs', href: '/programs' },
  { label: 'PMP® Prep', href: '/pmp' },
  { label: 'Veterans', href: '/veterans' },
  { label: 'Corporate', href: '/corporate' },
  { label: 'About', href: '/about' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-navy rounded flex items-center justify-center">
              <span className="text-gold font-bold text-xs">WG</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-navy font-bold text-sm leading-none">Wiser Generations™</p>
              <p className="text-gold text-xs leading-none mt-0.5">Enterprise Academy™</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} className="text-sm font-medium text-gray-700 hover:text-gold transition-colors">{n.label}</Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/contact" className="text-sm font-medium text-navy hover:text-gold transition-colors">Contact</Link>
            <Link href="/enroll" className="bg-gold text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors">Get Started</Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            <div className="w-5 h-0.5 bg-navy mb-1" /><div className="w-5 h-0.5 bg-navy mb-1" /><div className="w-5 h-0.5 bg-navy" />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4">
          {NAV.map(n => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-gray-700 hover:text-gold">{n.label}</Link>)}
          <Link href="/enroll" className="block mt-3 bg-gold text-white text-sm font-semibold px-4 py-2 rounded-lg text-center">Get Started</Link>
        </div>
      )}
    </header>
  )
}

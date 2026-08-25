'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { trackEvent } from '@/components/Analytics'
import { isBareSurface, shellForPath } from '@/lib/shell'

const CALENDLY = 'https://calendly.com/space4grace/30min-pod'

// The link sets moved to lib/shell.ts, where they are data rather than markup.
//
// A LIAP reader must not be shown PMP/CAPM navigation, and the way to make
// that true once is to stop this file from knowing any links at all. It asks
// which shell the current path renders in and draws what that shell declares.
//
// There is no flash of the wrong navigation: this component is already a
// client component reading usePathname() — it has done so since the CTAs
// started hiding on /free-practice — and the App Router resolves that during
// the server render, so the first paint is already correct.

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  // Projected walls and the facilitator's working console get no chrome. See
  // BARE_SURFACES in lib/shell.ts.
  const bare = isBareSurface(pathname)
  const shell = shellForPath(pathname)
  const navLinks = shell.nav
  const mobileExtraLinks = shell.mobileNav

  // Hide the CTA buttons when the visitor is already on the free-practice page —
  // "Try Free Practice" would link back to the current page, and "Book a Call"
  // pulls focus away from someone who's mid-session. A shell that declares no
  // header CTAs hides them everywhere: the PM-pod Calendly is a PMP offer and
  // has no business in front of a book reader.
  const hideCTAs = pathname === '/free-practice' || !shell.showHeaderCtas

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (bare) return null

  return (
    <nav className={`sticky top-0 z-50 bg-white border-b border-gray-200 transition-all duration-200 ${scrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {/* The primary white-on-navy lockup. It carries its own navy panel, so
              it reads as a plaque against the white bar. Sized as tall as the
              64px bar allows — see the note in the footer about the tagline,
              which is only ~1.5px at this height. */}
          <Link href={shell.homeHref} className="flex-shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" aria-label="Wiser Generations home">
            <img
              src="/wg-logo.png"
              alt="Wiser Generations"
              width={68}
              height={48}
              className="h-10 sm:h-12 w-auto"
            />
          </Link>

          {/* Desktop nav — core links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="text-navy hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
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
                className="border border-brand-blue/30 text-navy hover:bg-navy/5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Try Free Practice →
              </Link>
              {/* Primary CTA */}
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('calendly_click')}
                className="bg-gold text-navy font-bold px-4 py-2 rounded-lg text-sm hover:bg-yellow-400 transition-colors whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                Book a Call
              </a>
            </div>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-navy hover:text-gold p-2 min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" aria-label="Toggle menu" aria-expanded={isOpen} aria-controls="mobile-menu">
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
        <div id="mobile-menu" className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                className="block text-navy hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                {link.label}
              </Link>
            ))}

            {/* Secondary links in mobile. Suppressed entirely when the shell
                declares none, so a minimal shell does not render a rule with
                nothing under it. */}
            {mobileExtraLinks.length > 0 && (
            <div className="pt-2 border-t border-gray-200 mt-2">
              {mobileExtraLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                  className="block text-gray-600 hover:text-navy px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                  {link.label}
                </Link>
              ))}
            </div>
            )}

            {/* Mobile CTAs — hidden on /free-practice and in shells with none */}
            {!hideCTAs && (
              <div className="pt-4 border-t border-gray-200 flex flex-col gap-3">
                <Link href="/free-practice" onClick={() => setIsOpen(false)}
                  className="block border border-brand-blue/30 text-navy px-4 py-3 rounded-lg text-sm font-semibold text-center transition-colors">
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

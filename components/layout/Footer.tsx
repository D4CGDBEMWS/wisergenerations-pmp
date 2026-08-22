'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { shellForPath } from '@/lib/shell'

// ---------------------------------------------------------------------------
// The footer draws whatever the current shell declares — see lib/shell.ts.
//
// It used to hold three hardcoded columns of PMP and CAPM links, which meant
// a LIAP reader arriving from a printed book was offered an exam simulator, a
// $49/month practice subscription and a pass guarantee for a certification
// they had not come for.
//
// The brand blurb and the two legal paragraphs are shell-dependent for the
// same reason. A PMI trademark notice is required where PMI marks appear; a
// pass-rate disclaimer exists because the PMP business makes a pass-rate
// claim. On a page that makes neither claim they are not just unnecessary,
// they are confusing.
//
// NO REPLACEMENT LEGAL TEXT IS INVENTED HERE. Whether LIAP needs disclaimers
// of its own is a question for the owner and her counsel, and it is recorded
// as LEGAL REVIEW REQUIRED rather than answered by a developer.
// ---------------------------------------------------------------------------

export function Footer() {
  const shell = shellForPath(usePathname())
  return (
    <footer className="bg-navy text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-2">
            {/* The white/gold lockup, matted off its navy panel so it sits
                directly on the footer. The supplied panel navy is #051F40,
                bluer than the site's #0A1628, and would have shown as a patch. */}
            <img
              src="/wg-wordmark-light.png"
              alt="Wiser Generations Int'l — Mentor, Learn, Lead, Legacy"
              width={225}
              height={158}
              className="h-auto w-[225px] max-w-full mb-3"
            />
            <p className="text-gray-400 text-sm mb-4">An Enterprise Academy Program</p>
            {shell.showProgramDisclaimers && (
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
                PMP® and CAPM® certification prep for career transitioners, corporate teams, and veterans.
                Mentor-led. PMI-aligned. Delivered by Crystal Stewart, PMP.
              </p>
            )}
            <div className="flex gap-4">
              <a href="https://www.facebook.com/wisergenerations" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/wisergenerations" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/wiser-generations" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://www.youtube.com/@wisergenerations" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold transition-colors" aria-label="YouTube">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          {/* Link columns, from the shell. */}
          {shell.footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-white font-semibold mb-4">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-gray-400 text-sm hover:text-gold transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* How to reach a person. Shared infrastructure, every shell. */}
          <div>
            <p className="text-gray-400 text-xs mb-1">Metro Atlanta &amp; Virtual</p>
            <a href="mailto:info@wisergenerations.com" className="text-gold text-sm hover:underline">
              info@wisergenerations.com
            </a>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs">&copy; {new Date().getFullYear()} Wiser Generations Int&apos;l. An Enterprise Academy Program. All rights reserved.</p>
            {/* The PMI trademark notice is required where PMI marks appear.
                It appears here because this footer names PMP, CAPM and PMI —
                on a shell that names none of them it is not applicable. */}
            {shell.showProgramDisclaimers && (
              <p className="text-gray-600 text-xs text-center md:text-right max-w-md">
                PMP&reg;, CAPM&reg;, and PMI&reg; are registered marks of the Project Management Institute, Inc. Wiser Generations Int&apos;l is not affiliated with PMI.
              </p>
            )}
          </div>
          {/* The results disclaimer qualifies specific PMP claims — a pass
              rate, a number of students trained, salary figures. None of those
              claims is made on a LIAP page, and a first-attempt pass-rate
              disclaimer under a page about navigating a bereavement reads as a
              mistake. Suppressed rather than rewritten: LEGAL REVIEW REQUIRED. */}
          {shell.showProgramDisclaimers && (
            <p className="text-gray-600 text-[11px] leading-relaxed text-center md:text-left max-w-4xl">
              Individual results vary. The 87% first-attempt pass rate, &quot;500+ professionals trained,&quot; and similar
              figures reflect historical results from prior students and are not a guarantee of your outcome. Salary
              and earnings figures are general industry data, not a promise of income or employment. Testimonials
              reflect individual experiences and may not be typical. See our{' '}
              <Link href="/terms" className="underline hover:text-gold">Terms of Service</Link> and{' '}
              <Link href="/guarantee" className="underline hover:text-gold">Pass Guarantee</Link> for details.
            </p>
          )}
        </div>

      </div>
    </footer>
  )
}

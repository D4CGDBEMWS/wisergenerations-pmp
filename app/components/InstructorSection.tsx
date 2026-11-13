'use client'
import Link from 'next/link'
import { useId, useState } from 'react'
import { useIsNarrow } from './use-is-narrow'

// ---------------------------------------------------------------------------
// PROTOTYPE Phase 1B — the instructor section, progressively disclosed.
//
// The owner ruling is that Crystal stays on the homepage, that the homepage
// keeps enough to establish identity, credentials and trust, and that the
// fuller story keeps its route to /about.
//
// So everything doing that work stays visible at every width: the photograph,
// the eyebrow, the name, all five credential chips and both calls to action.
// Only the biography paragraph — the part /about tells at length — collapses,
// and only below md.
//
// The heading is the control, so its accessible name is "Crystal Stewart,
// PMP®" and aria-expanded carries the state; the disclosure needed no wording
// of its own. Nothing was written for this file. Every string is the one that
// was already on the page.
// ---------------------------------------------------------------------------

export default function InstructorSection({ calendly }: { calendly: string }) {
  const narrow = useIsNarrow()
  const [open, setOpen] = useState(false)
  const uid = useId()
  const panelId = `${uid}-bio`

  // Desktop has nothing to disclose, so the paragraph is simply shown.
  const bioVisible = !narrow || open

  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <img src="/team-success.jpg" alt="PMP certification team celebrating success"
              className="rounded-2xl shadow-xl w-full object-cover max-h-[500px]" />
          </div>
          <div>
            <p className="text-gold-text text-sm font-bold uppercase tracking-widest mb-2">Your Instructor</p>

            {narrow ? (
              <h2 className="mb-4">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpen((v) => !v)}
                  className="flex w-full items-center gap-3 text-left text-4xl font-bold text-navy min-h-[44px] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                >
                  <span className="flex-1">Crystal Stewart, PMP®</span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-navy text-base transition-transform ${open ? 'rotate-180' : ''}`}
                  >
                    ▾
                  </span>
                </button>
              </h2>
            ) : (
              <h2 className="text-4xl font-bold text-navy mb-4">Crystal Stewart, PMP®</h2>
            )}

            <div id={panelId} className={bioVisible ? 'block' : 'hidden'}>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                The Project Management Evangelist™. 20+ years of enterprise transformation. Founder of Enterprise Academy.
                U.S. Army veteran. Crystal does not just teach PM — she has lived it, built with it, and now equips
                the next generation of project managers to do the same.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              {['PMP® Certified', 'U.S. Army Veteran', 'Enterprise Academy Founder', '20+ Years Experience', 'Smyrna, GA'].map(t => (
                <span key={t} className="bg-light-navy border border-brand-blue/20 text-navy text-xs font-medium px-3 py-1.5 rounded-full">{t}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/about" className="inline-flex items-center min-h-[44px] bg-navy text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors">
                Crystal&apos;s Story
              </Link>
              <a href={calendly} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center min-h-[44px] border-2 border-gold-text text-gold-text font-bold px-6 py-3 rounded-lg hover:bg-gold hover:text-navy transition-colors">
                Book a Call
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

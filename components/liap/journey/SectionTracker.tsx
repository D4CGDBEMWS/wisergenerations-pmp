'use client'

import { useEffect, useRef } from 'react'
import { trackLiap } from '@/lib/liap/analytics'
import type { SectionId } from '@/lib/liap/journey/sections'

// ---------------------------------------------------------------------------
// Records that a visitor reached a section. Once.
//
// The owner's question is where people enter, how far they travel and where
// they leave. This is the smallest thing that answers it: one event the first
// time a section comes into view, carrying nothing but which section it was.
//
// Deliberately NOT here, pending the final taxonomy: scroll depth, dwell
// time, per-transition funnel steps, exit markers. The owner's ruling was
// explicit that expanding the contract is not licence to add every
// conceivable measurement, and the architecture below takes them later
// without changing.
//
// ── WHY IT IS QUIET ────────────────────────────────────────────────────────
//
// IntersectionObserver rather than scroll handlers, so nothing runs on the
// main thread while the visitor scrolls — this page is meant to feel like a
// continuation of a short, and a janky scroll destroys that faster than any
// copy decision.
//
// It disconnects after firing. Fourteen observers that stop observing cost
// nothing; fourteen that keep running cost battery on the phone this page is
// mostly viewed on.
//
// Consent is handled downstream by the shared analytics layer: if the visitor
// declined, trackEvent does nothing and this fires into a void, which is the
// correct outcome and not this component's decision to make.
// ---------------------------------------------------------------------------

export function SectionTracker({ sectionId }: { sectionId: SectionId }) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    if (typeof IntersectionObserver === 'undefined') return

    const element = document.getElementById(sectionId)
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || fired.current) continue
          fired.current = true
          trackLiap('liap_section_view', { section_id: sectionId })
          observer.disconnect()
        }
      },
      // A third of the section visible: enough to mean "reached", not so much
      // that a fast scroll past registers as having read it.
      { threshold: 0.33 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [sectionId])

  return null
}

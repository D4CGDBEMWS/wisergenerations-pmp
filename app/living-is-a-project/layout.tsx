import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isEnabled } from '@/lib/flags'

// ---------------------------------------------------------------------------
// The Phase I stop gate, enforced in one place. §39, §41.
//
// Every LIAP route nests under this layout, so a page added later is gated by
// default rather than by remembering to gate it. FEATURE_LIAP is off unless
// the environment sets it to exactly "true".
//
// notFound() rather than a "coming soon" page: an unreleased product should
// not be discoverable by probing, and a 404 is indistinguishable from a route
// that was never built. The book has not been announced.
// ---------------------------------------------------------------------------

// Rendered per request, never prerendered. FEATURE_LIAP is an environment
// variable read at request time, and a statically generated page would bake in
// whatever the flag said during the build. That cuts both ways, and the
// dangerous direction is the second one: if this ever has to be pulled from
// production, it must go the moment the flag flips — not after a rebuild.
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// LIAP metadata, so the PMP metadata cannot become LIAP's.
//
// Owner ruling, 22 August 2026. The root layout sets a default title of
// "PMP® & CAPM® Certification Training", a keyword list about certification
// prep, and an Open Graph image for the PMP business. Metadata merges
// field by field, so anything a LIAP page does not override it INHERITS.
//
// That is dormant while every LIAP page is noindex. It wakes up the day the
// noindex is lifted — and the failure would be silent and public: a book
// shared on social media rendering a PMP exam-prep card.
//
// So the inherited fields are cleared here rather than left to each page to
// remember. Titles and descriptions stay with the individual pages, which
// already set their own.
//
// WHAT IS NOT DECIDED HERE: the LIAP keywords, the LIAP share image and the
// LIAP social description are customer-facing marketing, and are the owner's
// to write. Empty is the correct placeholder — it inherits nothing and
// asserts nothing. See LEGAL/COPY gaps in the delivery notes.
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  // Cleared, not replaced. An empty list inherits no PMP keyword.
  keywords: [],
  openGraph: {
    // No image rather than the PMP image. A missing card is a gap; the wrong
    // card is a claim about what this book is.
    images: [],
    siteName: "Wiser Generations Int'l",
  },
  // Belt and braces: every LIAP page already sets this, and the section is
  // additionally behind FEATURE_LIAP. Lifting it is a deliberate act.
  robots: { index: false, follow: false },
}

export default function LiapLayout({ children }: { children: ReactNode }) {
  if (!isEnabled('LIAP')) notFound()
  return <>{children}</>
}

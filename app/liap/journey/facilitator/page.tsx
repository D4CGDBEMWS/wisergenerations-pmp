import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Facilitator Console',
  robots: { index: false, follow: false, nocache: true },
  keywords: [],
  openGraph: { images: [] },
}

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// The console used to live here, gated only by the feature flag.
//
// It moved to ./[retreatId] because clearance is per Retreat and this path
// carries no Retreat to authorize against — a console reachable without
// naming one could not enforce the assignment check, which is the difference
// between "is a facilitator" and "is THIS Retreat's facilitator".
//
// Left as a 404 rather than deleted, and deliberately not a redirect: a
// redirect to a Retreat would have to guess which one, and guessing is how
// somebody ends up in a session they were not assigned to. There is nothing
// to send an unauthorized visitor to, so they are sent nowhere.
// ---------------------------------------------------------------------------

export default function FacilitatorIndexPage() {
  notFound()
}

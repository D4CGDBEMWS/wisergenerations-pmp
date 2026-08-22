import { redirect } from 'next/navigation'
import { bookEntry } from '@/lib/liap/book-entry'
import { BookChooser } from '@/components/liap/BookChooser'
import { BookSoftLanding } from '@/components/liap/BookSoftLanding'

export const metadata = {
  title: 'Ready for Your Next Step? | Wiser Generations',
  robots: { index: false, follow: false },
  // The PMP keyword list and Open Graph image are cleared for the same reason
  // they are cleared on the LIAP tree: metadata merges field by field, and
  // this page is the one a reader reaches from a printed book.
  keywords: [],
  openGraph: { images: [] },
}

// Read per request. The flags decide what this route does, and a statically
// generated page would bake in whatever they said at build time.
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// /liap/book — Book Activation, Unit 1.
//
// The durable entry, and the only URL intended to go on paper.
//
// Deliberately thin: it asks lib/liap/book-entry what to do and does it.
// Everything that might change lives there. This file is the seam that must
// keep resolving for the life of the edition, so the less it contains, the
// less there is to go wrong in five years.
//
// It sits OUTSIDE app/living-is-a-project, which means it is outside that
// tree's FEATURE_LIAP gate — so it does its own gating, and gates differently
// on purpose. Every other LIAP route returns 404 when the flag is off, which
// is right while nothing points at them. This one must never 404: a reader
// holding the book would be told, by the business's own QR code, that the
// page does not exist.
//
// UNIT 1 ONLY. Lane A is wired to the LIAP sign-in that already ships. Lane B
// (retailer verification) and Lane C (event activation codes) are scoped and
// not built — see the delivery notes for exactly what each needs. No schema,
// no migration, no Stripe change, no commerce.
// ---------------------------------------------------------------------------

export default async function BookEntryPage() {
  const entry = await bookEntry()

  if (entry.action === 'soft-landing') {
    return <BookSoftLanding />
  }

  if (entry.action === 'assessment') {
    // Entitled and signed in. The question is never asked — the owner's
    // ruling for Lane A: do not make a reader prove a purchase the system
    // already knows about.
    redirect(entry.href)
  }

  return <BookChooser signedIn={entry.signedIn} />
}

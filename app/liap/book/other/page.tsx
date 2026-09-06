import { redirect } from 'next/navigation'
import { bookEntry } from '@/lib/liap/book-entry'
import { BookChooser } from '@/components/liap/BookChooser'
import { BookSoftLanding } from '@/components/liap/BookSoftLanding'

export const metadata = {
  title: 'Where did you get your copy? | Wiser Generations',
  robots: { index: false, follow: false },
  keywords: [],
  openGraph: { images: [] },
}

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// The exception lane.
//
// Owner decision, 4 September 2026 (D2 and D3): the unique code is the normal
// route to assessment access, so the chooser is no longer the front door. It
// is still needed, and only for the cases the owner preserved:
//
//   · a copy printed before registration codes existed;
//   · a card that is missing or unreadable;
//   · an owner-approved support case.
//
// It is deliberately one link away from the registration page rather than
// deleted. A reader whose book genuinely has no code is a real person with a
// real problem, and a dead end for them would be the same failure the chooser
// itself created for gift recipients — just moved to a smaller group.
//
// It sits under /liap/book because that prefix is what goes on paper and is
// gated by LIAP_BOOK_ACTIVATION rather than by the LIAP tree's layout, so a
// reader holding the book can always reach it.
// ---------------------------------------------------------------------------

export default async function BookOtherLanesPage() {
  const entry = await bookEntry()

  if (entry.action === 'soft-landing') {
    return <BookSoftLanding />
  }

  if (entry.action === 'assessment') {
    redirect(entry.href)
  }

  return <BookChooser signedIn={entry.signedIn} />
}

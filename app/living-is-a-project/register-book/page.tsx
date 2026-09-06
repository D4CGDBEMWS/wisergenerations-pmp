import { BookRegister } from '@/components/liap/BookRegister'

export const metadata = {
  title: 'Register your book | Wiser Generations',
  description:
    'Register the unique access code inside Living Is a Project…Are You Ready? to unlock the Life Project-Ready™ Assessment.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Registering a copy of the book.
//
// This is the page the promise printed in the book resolves to, and the one
// lane that works for a reader who has never bought anything from Wiser
// Generations: a gift recipient, or someone handed a new copy at an event.
// It asks for the code and an address and nothing else, because nothing else
// is needed to know that this person is holding a new copy.
//
// It sits inside the LIAP tree and is therefore behind FEATURE_LIAP with
// every other page here — deliberately, while the book is unannounced. The
// durable printed entry point remains /liap/book, which chooses this lane.
// ---------------------------------------------------------------------------

export default function RegisterBookPage() {
  // The same surface as the printed QR destination, reached from inside the
  // LIAP tree. One component, so the two cannot drift into saying different
  // things about the same code.
  return <BookRegister signedIn={false} otherLanesHref="/liap/book/other" />
}

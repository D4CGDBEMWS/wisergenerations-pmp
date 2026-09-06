import { ClaimCodeForm } from '@/components/liap/ClaimCodeForm'

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
  return (
    <main className="mx-auto max-w-2xl px-5 py-14 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-bold leading-tight text-navy sm:text-4xl">
        Register your book
      </h1>
      <p className="mt-4 leading-relaxed text-gray-700">
        Every new copy of <em>Living Is a Project&hellip;Are You Ready?&trade;</em> includes a unique
        access code to the Life Project-Ready&trade; Assessment. Register it here and the
        assessment is yours.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-gray-500">
        Bought the book yourself or received a new copy as a gift &mdash; either way, the code is
        in your book and it registers to you.
      </p>

      <ClaimCodeForm />
    </main>
  )
}

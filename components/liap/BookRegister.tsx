import Link from 'next/link'
import { ClaimCodeForm } from '@/components/liap/ClaimCodeForm'

// ---------------------------------------------------------------------------
// Register My Book — the primary registration surface.
//
// Owner decision, 4 September 2026 (D2). Copy below is the owner's approved
// wording, verbatim; it is not to be rewritten.
//
// ── WHY THIS REPLACED THE CHOOSER AS THE FRONT DOOR ────────────────────────
//
// The chooser asked "Where did you get your copy?" and offered three lanes:
// purchased here, purchased from a retailer, received at an event. A reader
// who was given the book bought nothing and attended nothing, so the one
// person the printed promise names by name — "or received a new copy as a
// gift" — arrived at a page with no lane for them.
//
// The code does not care how the book arrived. Asking for it directly is both
// the shorter path and the only one that keeps the promise for every reader
// the promise is made to.
//
// The chooser is not deleted. It remains one link away for the copies that
// predate codes and for the support cases D3 preserves.
// ---------------------------------------------------------------------------

interface Props {
  /**
   * Signed in but without access. Worth acknowledging rather than ignoring:
   * this reader has already told us who they are and is still being asked
   * for something.
   */
  signedIn: boolean
  /** Where the exception lane lives, which differs by which route rendered this. */
  otherLanesHref: string
}

export function BookRegister({ signedIn, otherLanesHref }: Props) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-5 py-14 sm:py-20">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
        Living Is a Project&hellip;Are You Ready?&trade;
      </p>

      <h1 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl">
        Register My Book
      </h1>
      <p className="mt-3 font-semibold text-navy">Have your unique access code ready.</p>

      <h2 className="mt-8 text-lg font-bold text-navy">I have a unique book access code</h2>
      <p className="mt-2 leading-relaxed text-gray-700">
        Whether you purchased your new copy yourself or received it as a gift, use the unique
        access code included with your book to register your Assessment access.
      </p>

      {signedIn && (
        <p className="mt-5 rounded-lg bg-light-navy px-4 py-3 text-sm leading-relaxed text-navy">
          You&rsquo;re signed in, but we haven&rsquo;t found your registration yet. Enter the code
          from your book and we&rsquo;ll open your access.
        </p>
      )}

      <ClaimCodeForm />

      <hr className="mt-10 border-gray-200" />

      {/* The exception lane. Deliberately quiet and deliberately still here:
          copies printed before codes existed, and the support cases the owner
          preserved under D3, both still need somewhere to go. */}
      <p className="mt-6 text-sm leading-relaxed text-gray-500">
        No code in your book, or bought your copy before registration codes were introduced?{' '}
        <Link href={otherLanesHref} className="font-semibold text-navy underline hover:no-underline">
          Tell us where your copy came from
        </Link>{' '}
        and we&rsquo;ll help.
      </p>
    </main>
  )
}

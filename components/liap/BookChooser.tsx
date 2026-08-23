import Link from 'next/link'

// ---------------------------------------------------------------------------
// The three-lane chooser.
//
// Owner-approved copy, 22 August 2026, verbatim:
//
//   Ready for Your Next Step?
//   Your copy of ... includes access to the Life Project-Ready™ Assessment.
//   Where did you get your copy?
//     I purchased from Wiser Generations
//     I purchased from another retailer
//     I received/purchased my copy at an event
//
// It states a fact the reader already believes — the book includes this —
// before it asks them for anything. The three choices then read as "help us
// find your copy" rather than "prove you are not a thief", which is the
// difference between a continuation and a checkpoint.
//
// ── LANE ORDER IS NOT ARBITRARY ────────────────────────────────────────────
//
// Wiser Generations is first and styled as the lead because it is the only
// lane that is instant. Putting the slowest lane first would train readers to
// expect a wait.
//
// ── LANES B AND C ARE NOT BUILT ────────────────────────────────────────────
//
// Unit 1 ships Lane A. The other two are rendered as what they honestly are:
// visible, explained, and not yet open — rather than hidden, which would make
// a reader who bought from a retailer think the offer is not for them. Neither
// links anywhere that would dead-end.
// ---------------------------------------------------------------------------

interface Props {
  /** Signed in but without access — worth acknowledging rather than ignoring. */
  signedIn: boolean
}

export function BookChooser({ signedIn }: Props) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-5 py-14 sm:py-20">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
        Living Is a Project&hellip;Are You Ready?&trade;
      </p>

      <h1 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl">
        Ready for Your Next Step?
      </h1>
      <p className="mt-4 leading-relaxed text-gray-700">
        Your copy of <em>Living Is a Project&hellip;Are You Ready?&trade;</em> includes access to the Life
        Project-Ready&trade; Assessment.
      </p>

      {signedIn && (
        <p className="mt-4 rounded-lg bg-light-navy px-4 py-3 text-sm leading-relaxed text-navy">
          You&rsquo;re signed in, but we haven&rsquo;t found your copy yet. Let us know where it
          came from and we&rsquo;ll open your access.
        </p>
      )}

      <hr className="mt-8 border-gray-200" />

      <h2 className="mt-8 text-lg font-bold text-navy">Where did you get your copy?</h2>

      <div className="mt-4 flex flex-col gap-3">
        <Link
          href="/living-is-a-project/access"
          className="flex items-center justify-between gap-3 rounded-xl border border-gold bg-light-gold px-5 py-4 font-semibold text-navy transition-colors hover:bg-yellow-50"
        >
          I purchased from Wiser Generations
          <span aria-hidden="true" className="font-bold text-gold">&rarr;</span>
        </Link>

        {/* Lanes B and C: visible and honest about not being open yet. */}
        <div className="rounded-xl border border-gray-200 px-5 py-4">
          <p className="font-semibold text-gray-500">I purchased from another retailer</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Opening soon. A person reviews each one, so it is not instant.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 px-5 py-4">
          <p className="font-semibold text-gray-500">
            I received/purchased my copy at an event
          </p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Opening soon. You&rsquo;ll enter the code on the card that came with your book.
          </p>
        </div>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-gray-500">
        Not sure which to choose, or something looks wrong?{' '}
        <Link href="/contact" className="font-semibold text-gold underline underline-offset-4">
          Tell us and we&rsquo;ll sort it out
        </Link>
        .
      </p>
    </main>
  )
}

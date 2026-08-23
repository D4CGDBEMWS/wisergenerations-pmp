import Link from 'next/link'

// ---------------------------------------------------------------------------
// What /liap/book shows before the flow opens.
//
// Owner ruling: a soft LIAP landing, never a confusing 404.
//
// This is the single most important behaviour in Unit 1, and it inverts the
// convention every other gated route in this codebase follows. Those return
// 404 when their flag is off so an unreleased product is not discoverable by
// probing — correct, precisely because nothing printed points at them.
//
// The moment a QR code exists, that reasoning reverses. The person scanning it
// is holding the business's own book. Telling them the page does not exist
// says the business is broken, and they have no way to know it is temporary.
//
// So this page is honest about the state, offers the one thing that is
// available, and does not pretend the flow is open.
//
// NO EMAIL CAPTURE HERE. It is the obvious thing to add and it needs approval:
// a "tell me when it's ready" field is an acquisition decision with a
// segmentation tag attached, and the owner has ruled that LIAP readers are not
// to be mixed into the generic newsletter list.
// ---------------------------------------------------------------------------

export function BookSoftLanding() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-5 py-14 sm:py-20">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
        Living Is a Project&hellip;Are You Ready?&trade;
      </p>

      <h1 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl">
        Your assessment opens with the book
      </h1>
      <p className="mt-4 leading-relaxed text-gray-700">
        Thanks for scanning. The Life Project-Ready&trade; Assessment isn&rsquo;t open yet —
        it opens alongside the book.
      </p>

      <p className="mt-6 text-sm leading-relaxed text-gray-500">
        Already have access, or think this is a mistake?{' '}
        <Link href="/contact" className="font-semibold text-gold underline underline-offset-4">
          Get in touch
        </Link>{' '}
        and a person will help.
      </p>
    </main>
  )
}

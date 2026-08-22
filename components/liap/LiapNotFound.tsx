import Link from 'next/link'

// ---------------------------------------------------------------------------
// The LIAP 404.
//
// Owner ruling, 22 August 2026: a 404 under a LIAP-owned prefix must not
// render PMP/CAPM recovery navigation. Completion of the shell boundary, not
// a product feature — which is why it is three elements and no more.
//
// The default 404 offers "View Programs" pointing at the PMP catalogue. A
// reader who mistyped a URL from a printed book would be told the page does
// not exist and then invited to browse project-management certifications.
// ---------------------------------------------------------------------------

export function LiapNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-gold">404</p>
        <h1 className="mb-8 text-2xl font-bold text-navy sm:text-3xl">
          We couldn&rsquo;t find that page.
        </h1>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/living-is-a-project"
            className="rounded-xl bg-navy px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-navy/90"
          >
            Return to LIAP
          </Link>
          <Link
            href="/contact"
            className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-bold uppercase tracking-wide text-gray-600 transition hover:border-navy hover:text-navy"
          >
            Need help?
          </Link>
        </div>
      </div>
    </div>
  )
}

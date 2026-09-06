import Link from 'next/link'
import { LiapPageView } from '@/components/liap/LiapPageView'

export const metadata = {
  title: 'Preorder confirmed | Wiser Generations',
  robots: { index: false, follow: false },
}

// ---------------------------------------------------------------------------
// §9. After payment.
//
// Deliberately does NOT verify the entitlement before congratulating them. The
// webhook that grants it can arrive a second or two after Stripe redirects,
// and a page that said "we can't find your preorder" to someone who has just
// paid would be the worst possible first impression. The assessment route does
// the real check, and it explains the delay if the grant has not landed yet.
// ---------------------------------------------------------------------------

export default function PreorderCompletePage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-24">
      <LiapPageView event="liap_preorder_completed" />

      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
        Preorder confirmed
      </p>
      <h1 className="mt-4 text-3xl font-bold leading-tight text-navy sm:text-4xl">
        Your preorder is confirmed.
      </h1>

      <div className="mt-6 space-y-4 leading-relaxed text-gray-700">
        <p>
          Your new book includes access to the Living Is a Project Assessment. When your book
          arrives, use the unique access code included with your copy to register your book and
          activate your Assessment access.
        </p>
      </div>

      <Link
        href="/living-is-a-project/book#how-it-works"
        className="mt-9 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-gold px-8 text-base font-bold text-navy transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:w-auto"
      >
        What happens next
      </Link>

    </main>
  )
}

import Link from 'next/link'
import { LiapPageView } from '@/components/liap/LiapPageView'

export const metadata = {
  title: 'Your assessment is unlocked | Wiser Generations',
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
        Your Life Project-Ready™ Assessment is unlocked.
      </h1>

      <div className="mt-6 space-y-4 leading-relaxed text-gray-700">
        <p>Your preorder is confirmed. Your copy ships when the book publishes in October 2026.</p>
        <p>
          Now let&rsquo;s determine where you are and what deserves your attention next. It takes
          about fifteen minutes, and it saves as you go.
        </p>
      </div>

      <Link
        href="/living-is-a-project/assessment"
        className="mt-9 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-gold px-8 text-base font-bold text-navy transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:w-auto"
      >
        Begin my assessment
      </Link>

      <p className="mt-8 text-sm leading-relaxed text-gray-500">
        We&rsquo;ve emailed you an access link as well, so you can come back to this later. If the
        assessment says it isn&rsquo;t unlocked yet, wait a moment and refresh — payment
        confirmation can take a few seconds to reach us.
      </p>
    </main>
  )
}

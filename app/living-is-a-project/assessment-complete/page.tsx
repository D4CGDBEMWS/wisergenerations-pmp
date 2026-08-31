import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LiapPageView } from '@/components/liap/LiapPageView'

export const metadata = {
  title: "You're Ready to Begin | Wiser Generations",
  robots: { index: false, follow: false },
}

// ---------------------------------------------------------------------------
// After a standalone Life Project-Ready™ Assessment purchase.
//
// ── WHY THIS DOES NOT CHECK THE ENTITLEMENT ────────────────────────────────
//
// Same reasoning as the preorder-complete page, and the same deliberate
// choice: the webhook that grants access can arrive a second or two after
// Stripe redirects the customer here. A page that said "we can't find your
// purchase" to somebody who has just paid would be the worst possible first
// impression, and it would be wrong most of the time it fired.
//
// So this page congratulates, and grants nothing. The real gate is
// /living-is-a-project/assessment, which reads the entitlement server-side and
// explains the delay if the grant has not landed yet. Reaching this page by
// typing its URL gets a visitor a page of text and no access whatsoever.
//
// ── THE FLOW GUARD ─────────────────────────────────────────────────────────
//
// A `session_id` is required, because that is what Stripe appends when it
// redirects. It is NOT verified against Stripe and must never be treated as
// proof of anything — it is a hint that somebody arrived from checkout rather
// than a claim that they paid. Its only job is to stop this page being a
// stray, linkable destination for people who never started a purchase.
//
// ── AND IT IS NOT A SALES PAGE ─────────────────────────────────────────────
//
// Owner direction: no Workshop, no Retreat, no coaching, no other product.
// The next action is the Assessment. There is exactly one button.
// ---------------------------------------------------------------------------

export default async function AssessmentCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const params = await searchParams
  if (!params.session_id) {
    redirect('/living-is-a-project/life-project-ready-assessment')
  }

  return (
    <main className="bg-[#FDFBF6]">
      <LiapPageView event="liap_assessment_purchase_completed" />

      <section className="relative overflow-hidden">
        {/* Farther down the road than the landing page: the light is fuller,
            and the path below has arrived rather than set out. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-gradient-to-b from-[#F7E9C4] via-[#FDF6E6] to-transparent"
        />

        <div className="relative mx-auto max-w-2xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-text">
            Purchase confirmed
          </p>

          <h1 className="mt-4 text-3xl font-bold leading-tight text-navy sm:text-4xl">
            You&rsquo;re Ready to Begin.
          </h1>

          <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-700 sm:text-lg">
            <p>Thank you for investing in YOU.</p>
            <p>This is the investment that keeps giving back.</p>
            <p>
              The Life Project-Ready&trade; Assessment is more than an opportunity to see where you
              are today. This is the step that gives you the ability to launch&mdash;with greater
              awareness of what is working, what deserves your attention, and where to focus next.
            </p>
            <p>
              Answer honestly&mdash;not based on where you think you should be, but where you are
              right now.
            </p>
          </div>

          {/* The road, arrived. The marker sits at the end of the path rather
              than the start, so the page feels farther along than the landing. */}
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 600 90"
            className="mt-10 h-16 w-full text-gold"
            preserveAspectRatio="none"
          >
            <path
              d="M0 76 C 140 76, 180 30, 300 24 S 470 30, 600 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="1 10"
            />
            <circle cx="586" cy="11" r="8" className="fill-navy" />
          </svg>

          <p className="mt-6 text-base font-semibold text-navy sm:text-lg">
            40 questions. 8 dimensions. Your life. Your next move.
          </p>

          <Link
            href="/living-is-a-project/assessment"
            className="mt-8 inline-flex min-h-[56px] w-full items-center justify-center rounded-xl bg-gold px-8 text-base font-bold tracking-wide text-navy transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:w-auto"
          >
            BEGIN MY ASSESSMENT
          </Link>

          <p className="mt-6 text-sm leading-relaxed text-gray-600">
            Your access is connected to the email used for your purchase.
          </p>

          <div className="mt-10 border-t border-gold/40 pt-8 text-base leading-relaxed text-gray-700">
            <p>May this insight lead you to divine purpose.</p>
            <p className="mt-4">
              In His service,
              <br />
              Crystal
            </p>
          </div>

          <p className="mt-10 text-sm leading-relaxed text-gray-500">
            If the assessment says it isn&rsquo;t unlocked yet, wait a moment and refresh &mdash;
            payment confirmation can take a few seconds to reach us.
          </p>
        </div>
      </section>
    </main>
  )
}

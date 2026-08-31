import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LiapPageView } from '@/components/liap/LiapPageView'
import { fulfilledForCheckoutSession, readLiapAccess } from '@/lib/liap/entitlements'

export const metadata = {
  title: "You're Ready to Begin | Wiser Generations",
  robots: { index: false, follow: false },
}

// Read on every request. A waiting participant re-checks by reloading, and a
// cached render would show them a stale answer at the one moment it matters.
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// After a standalone Life Project-Ready™ Assessment purchase.
//
// ── WHAT DECIDES, AND WHAT DOES NOT ────────────────────────────────────────
//
// The webhook is the payment authority. It verifies the Stripe event, writes
// the order, and grants the entitlement. This page reads the result of that
// and renders one of two states. It grants nothing, creates nothing, charges
// nothing and starts no checkout — there is no code path here that could.
//
// `session_id` is an arrival hint and a LOOKUP KEY. It is never proof of
// payment: `fulfilledForCheckoutSession` uses it to find the order the webhook
// wrote, and it is that order — plus the entitlement — that answers the
// question. An id somebody typed matches no paid order and gets the waiting
// state, which grants them nothing at all.
//
// Two sources are consulted, because a standalone buyer may have no session
// cookie: they bought without signing in. So either a signed-in entitlement or
// a fulfilled checkout session counts, and neither can be forged from the URL.
//
// ── WHY THE WAITING STATE IS NOT A FAILURE STATE ───────────────────────────
//
// The granting webhook can land a second or two after Stripe redirects. So
// "not yet" is the common, expected case for a few seconds, and it must not
// read as "we cannot find your purchase" or send anybody back through
// payment. It says the purchase is being processed, and offers one action
// that re-checks. The secure assessment re-checks independently regardless.
//
// ── AND IT IS NOT A SALES PAGE ─────────────────────────────────────────────
//
// Owner direction: no Workshop, no Retreat, no coaching, no other product.
// The next action is the Assessment.
// ---------------------------------------------------------------------------

export default async function AssessmentCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const params = await searchParams
  const sessionId = params.session_id
  if (!sessionId) {
    redirect('/living-is-a-project/life-project-ready-assessment')
  }

  // Either door. Both are server-side facts; neither comes from the URL.
  const access = await readLiapAccess()
  const entitled =
    access?.entitled === true || (await fulfilledForCheckoutSession(sessionId))

  if (!entitled) {
    return (
      <main className="bg-[#FDFBF6]">
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-gradient-to-b from-[#FBF0D6] via-[#FDF8EC] to-transparent"
          />

          <div className="relative mx-auto max-w-2xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
            <h1 className="text-3xl font-bold leading-tight text-navy sm:text-4xl">
              We&rsquo;re Confirming Your Access
            </h1>

            <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-700 sm:text-lg">
              <p>
                Your purchase is being processed. Your Assessment access should be ready shortly.
              </p>
              <p>Please give us a moment to complete your access.</p>
            </div>

            {/*
              A plain anchor to this same URL, so the request goes to the server
              and the check above runs again. Not a form, not a handler, not a
              fetch: re-checking is the only thing it can do, because there is
              no other code behind it.
            */}
            <a
              href={`/living-is-a-project/assessment-complete?session_id=${encodeURIComponent(sessionId)}`}
              className="mt-8 inline-flex min-h-[56px] w-full items-center justify-center rounded-xl bg-navy px-8 text-base font-bold tracking-wide text-white transition-colors hover:bg-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto"
            >
              CHECK MY ACCESS
            </a>
          </div>
        </section>
      </main>
    )
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
        </div>
      </section>
    </main>
  )
}

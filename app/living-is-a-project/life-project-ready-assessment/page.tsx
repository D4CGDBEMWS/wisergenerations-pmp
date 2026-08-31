import Link from 'next/link'
import { LiapPageView } from '@/components/liap/LiapPageView'
import { AssessmentCta } from '@/components/liap/AssessmentCta'
import { LIAP_ASSESSMENT, LIAP_BOOK } from '@/lib/liap/product'

export const metadata = {
  title: 'Life Project-Ready™ Assessment | Wiser Generations',
  description:
    'Pause, reflect, and assess your life across eight important areas. 40 questions, 8 dimensions, one clearer view of where you are.',
  robots: { index: false, follow: false },
}

// ---------------------------------------------------------------------------
// The canonical Life Project-Ready™ Assessment landing page.
//
// This is the URL that goes on promotional artwork, in Email #6 and on site
// CTAs. It is deliberately NOT /living-is-a-project/assessment: that route is
// the secure, entitled assessment itself, and it redirects a signed-out
// visitor to sign in — which is the wrong thing to do to somebody who arrived
// from a poster and has never heard of us.
//
// ── TWO DOORS, AND THEY STAY APART ─────────────────────────────────────────
//
// One page, two paths, and neither can be mistaken for the other:
//
//   A. TAKE THE ASSESSMENT — $29        -> standalone checkout
//   B. ACCESS MY INCLUDED ASSESSMENT    -> entitlement check, no charge
//
// Path B is a LINK, not a button that does anything. Clicking it is not proof
// of purchase and grants nothing: it navigates to the secure assessment route,
// which reads the entitlement server-side and is the only thing that decides.
// A reader who has not bought the book cannot get in by pressing it, and a
// reader who HAS bought the book is never sent to the $29 checkout.
//
// ── THE PRICE IS NOT IN THE TITLE ──────────────────────────────────────────
//
// Owner visual requirement: $29 appears with the TAKE THE ASSESSMENT action
// and nowhere near the page title. A price under a title reads as a toll on
// the idea itself; a price on the button reads as the cost of the action.
//
// ── ON THE IMAGERY ─────────────────────────────────────────────────────────
//
// The approved direction asks for photographic, sunrise/winding-road imagery.
// No such asset exists in this repository, and inventing or generating one
// would be putting unapproved artwork in front of customers. So the journey is
// carried here by an inline SVG path — drawn, obviously abstract, honest about
// what it is — and the photographic hero remains an owner-supplied asset. The
// layout has a slot for it that does not collapse in its absence.
// ---------------------------------------------------------------------------

/** The journey the page walks the reader through, and the page's own spine. */
const JOURNEY = [
  'Compass',
  'Road',
  'Reflection',
  'Assessment',
  'Direction',
  'Launch',
  'Purpose',
] as const

export default function LifeProjectReadyAssessmentPage() {
  return (
    <main className="bg-[#FDFBF6]">
      <LiapPageView event="liap_assessment_landing_view" />

      {/* ── Sunrise: warm light at the top of the page, movement below ── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-[#FBF0D6] via-[#FDF8EC] to-transparent"
        />

        <div className="relative mx-auto max-w-3xl px-5 pb-10 pt-16 sm:px-8 sm:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-text">
            Wiser Generations Int&rsquo;l
          </p>

          <h1 className="mt-4 text-3xl font-bold leading-tight text-navy sm:text-5xl">
            Life Project-Ready&trade; Assessment
          </h1>

          <p className="mt-6 text-lg font-semibold leading-relaxed text-navy sm:text-xl">
            You are here by divine assignment, and we thank you for investing in YOU!
          </p>

          <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-700 sm:text-lg">
            <p>
              Sometimes the first step forward is simply taking an honest look at where you are
              today.
            </p>
            <p>
              The Life Project-Ready&trade; Assessment gives you an opportunity to pause, reflect,
              and assess your life across eight important areas.
            </p>
            <p>
              Your results can help you recognize where you&rsquo;re strong, what may deserve your
              attention, and where your next move may begin.
            </p>
          </div>

          {/* The winding road. Decorative, and marked as such: it carries no
              information a screen reader would otherwise miss. */}
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 600 90"
            className="mt-10 h-16 w-full text-gold"
            preserveAspectRatio="none"
          >
            <path
              d="M0 70 C 110 70, 130 20, 240 26 S 400 68, 600 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="1 10"
            />
            <circle cx="14" cy="69" r="5" fill="currentColor" />
            <circle cx="586" cy="15" r="7" className="fill-navy" />
          </svg>

          <p className="mt-6 text-base font-semibold text-navy sm:text-lg">
            40 questions. 8 dimensions. One clearer view of where you are.
          </p>

          {/* ── PATH A: the standalone purchase ── */}
          <div className="mt-8">
            <AssessmentCta label="TAKE THE ASSESSMENT" priceLabel={LIAP_ASSESSMENT.priceLabel} />
          </div>
        </div>
      </section>

      {/* ── The journey, stated plainly ── */}
      <section className="mx-auto max-w-3xl px-5 pb-4 sm:px-8">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
          {JOURNEY.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className={i === JOURNEY.length - 1 ? 'text-gold-text' : undefined}>
                {step}
              </span>
              {i < JOURNEY.length - 1 && (
                <span aria-hidden="true" className="text-gold">
                  &rarr;
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* ── PATH B: the reader who already bought the book ── */}
      <section className="mx-auto mt-10 max-w-3xl px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="rounded-2xl border border-gold/40 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold leading-snug text-navy sm:text-2xl">
            Already purchased <em>Living Is a Project&hellip;Are You Ready?</em>&trade;
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            Your Assessment is included with your book purchase.
          </p>

          {/*
            A LINK, and deliberately so. It grants nothing and proves nothing:
            it navigates to the secure assessment, which reads the entitlement
            server-side and decides. Someone who has not bought the book cannot
            press their way in, and someone who has is never shown a price.
          */}
          <Link
            href="/living-is-a-project/assessment"
            className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl border-2 border-navy px-8 text-base font-bold tracking-wide text-navy transition-colors hover:bg-navy hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:w-auto"
          >
            ACCESS MY INCLUDED ASSESSMENT
          </Link>

          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            Haven&rsquo;t read it yet?{' '}
            <Link
              href="/living-is-a-project/book"
              className="font-semibold text-gold-text underline underline-offset-2 hover:text-navy"
            >
              {LIAP_BOOK.name} is {LIAP_BOOK.priceLabel}
            </Link>
            , and the Assessment is included.
          </p>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-gray-500">
          The Life Project-Ready&trade; Assessment is a planning and educational tool. It is not a
          medical, mental-health, legal, tax, financial, or other professional diagnostic
          instrument.
        </p>
      </section>
    </main>
  )
}

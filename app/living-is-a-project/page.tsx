import Link from 'next/link'
import { LiapPageView } from '@/components/liap/LiapPageView'

export const metadata = {
  title: 'Life Is a Project™ | Wiser Generations',
  description:
    'Assess where you are, understand what changed, protect what matters and forge your next best steps.',
}

// ---------------------------------------------------------------------------
// The Life Is a Project™ hub. §4, §5.
//
// The journey has six steps and two of them exist. Showing all six is the
// point — someone should be able to see where this goes — but only the book
// carries a call to action. §30: do not sell unfinished products. The later
// cards are labelled and inert.
// ---------------------------------------------------------------------------

const JOURNEY = [
  {
    step: 'Step 1',
    title: 'Read',
    name: 'Living Is a Project…Are You Ready?',
    body: 'The book that frames the change you are in as something you can actually manage.',
    status: 'available' as const,
  },
  {
    step: 'Step 2',
    title: 'Assess',
    name: 'Life Project-Ready™ Assessment',
    body: 'Forty questions across eight dimensions, and a clear read on where you stand today.',
    status: 'available' as const,
  },
  {
    step: 'Step 3',
    title: 'Plan',
    name: 'Personalized next best steps',
    body: 'Three actions and a 30/60/90-day starting plan built from your own answers.',
    status: 'available' as const,
  },
  {
    step: 'Step 4',
    title: 'Experience',
    name: 'Life Is a Project™ Workshop',
    body: 'Ninety minutes working the plan alongside others going through their own change.',
    status: 'soon' as const,
  },
  {
    step: 'Step 5',
    title: 'Transform',
    name: '4-Week Challenge',
    body: 'A month of structured progress against the plan you built.',
    status: 'soon' as const,
  },
  {
    step: 'Step 6',
    title: 'Continue',
    name: 'Coaching & community',
    body: 'Ongoing support for the projects that outlast a single season.',
    status: 'future' as const,
  },
]

const STATUS_LABEL = {
  available: null,
  soon: 'Coming soon',
  future: 'Future',
} as const

export default function LiapHubPage() {
  return (
    <main className="bg-white">
      <LiapPageView event="liap_hub_view" />

      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            A Wiser Generations signature program
          </p>
          <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
            Your life is your most important project.
          </h1>
          <p className="mt-4 text-xl text-gold sm:text-2xl">Living Is a Project&hellip;Are You Ready?</p>

          <div className="mt-8 max-w-2xl space-y-4 text-base leading-relaxed text-gray-200 sm:text-lg">
            <p>
              Significant life changes can be expected, unexpected, or arrive as opportunities you
              never saw coming.
            </p>
            <p>
              Life Is a Project™ helps you assess where you are, understand what changed, protect
              what matters and forge your next best steps.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/living-is-a-project/book"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gold px-7 text-center text-base font-bold text-navy transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Preorder the book + unlock my assessment
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/30 px-7 text-center text-base font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore how it works
            </a>
          </div>
        </div>
      </section>

      {/* Campaign statement */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <p className="text-lg font-semibold leading-snug text-navy sm:text-2xl">
            Don&rsquo;t just react to life.
            <br />
            <span className="text-brand-blue">Be ready to manage what comes next.</span>
          </p>
        </div>
      </section>

      {/* The journey */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <h2 className="text-2xl font-bold text-navy sm:text-3xl">How it works</h2>
        <p className="mt-3 max-w-2xl text-gray-600">
          Six stages, built to be taken in order. The first three are available now.
        </p>

        {/* The roadmap motif: a single path with milestones on it. */}
        <ol className="mt-10 space-y-0">
          {JOURNEY.map((item, index) => {
            const label = STATUS_LABEL[item.status]
            const last = index === JOURNEY.length - 1
            return (
              <li key={item.step} className="relative flex gap-5 pb-8 last:pb-0">
                {/* The path itself */}
                {!last && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px bg-gray-200"
                  />
                )}
                <span
                  aria-hidden="true"
                  className={`relative z-10 mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 text-xs font-bold ${
                    item.status === 'available'
                      ? 'border-navy bg-navy text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    {item.step} · {item.title}
                  </p>
                  <h3 className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg font-bold text-navy">
                    {item.name}
                    {label && (
                      <span className="rounded border border-gray-300 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                        {label}
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-gray-600">{item.body}</p>
                </div>
              </li>
            )
          })}
        </ol>

        <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">Start with the book</h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            Preorder <em>Living Is a Project&hellip;Are You Ready?</em> and receive the Life Project-Ready&trade;
            Assessment at no additional charge.
          </p>
          <Link
            href="/living-is-a-project/book"
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-navy px-7 text-base font-bold text-white transition-colors hover:bg-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Preorder + unlock my assessment
          </Link>
        </div>
      </section>
    </main>
  )
}

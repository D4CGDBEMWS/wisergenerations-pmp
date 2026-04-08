import type { Metadata } from 'next'
import Link from 'next/link'
import ResourceCTA from '@/components/marketing/ResourceCTA'

export const metadata: Metadata = {
  title: 'PMP® Formulas Reference — Free PMP® Exam Cheat Sheet',
  description:
    'The 12 most-tested PMP® formulas with purpose, calculation, and when-to-use notes. Free PMP® exam cheat sheet from Wiser Generations™.',
  alternates: { canonical: '/resources/pmp-formulas' },
  openGraph: {
    title: 'PMP® Formulas Reference — Wiser Generations™',
    description:
      'Free PMP® formula cheat sheet covering EVM, PERT, communication channels, and more.',
    url: 'https://wisergenerations.com/resources/pmp-formulas',
    type: 'article',
  },
}

// ---------------------------------------------------------------------------
// PMP Formulas — SEO pillar page targeting "PMP formulas" / "PMP cheat sheet"
// long-tail searches.  No gating; CTAs funnel into Study Access ($47/mo).
// ---------------------------------------------------------------------------

type Formula = {
  name: string
  category: string
  formula: string
  purpose: string
  use: string
}

const FORMULAS: Formula[] = [
  {
    name: 'Cost Variance (CV)',
    category: 'Earned Value',
    formula: 'CV = EV − AC',
    purpose: 'Measures whether the project is over or under budget at a point in time.',
    use: 'Positive = under budget. Negative = over budget. Always pair with SV for full picture.',
  },
  {
    name: 'Schedule Variance (SV)',
    category: 'Earned Value',
    formula: 'SV = EV − PV',
    purpose: 'Measures whether the project is ahead of or behind schedule.',
    use: 'Positive = ahead of schedule. Negative = behind schedule.',
  },
  {
    name: 'Cost Performance Index (CPI)',
    category: 'Earned Value',
    formula: 'CPI = EV ÷ AC',
    purpose: 'Efficiency of cost utilization — how much value you got per dollar spent.',
    use: '> 1.0 = under budget. < 1.0 = over budget. Most-tested EVM formula on the exam.',
  },
  {
    name: 'Schedule Performance Index (SPI)',
    category: 'Earned Value',
    formula: 'SPI = EV ÷ PV',
    purpose: 'Efficiency of time utilization.',
    use: '> 1.0 = ahead of schedule. < 1.0 = behind schedule.',
  },
  {
    name: 'Estimate at Completion (EAC) — typical',
    category: 'Forecasting',
    formula: 'EAC = BAC ÷ CPI',
    purpose: 'Forecasts total cost assuming current cost performance continues.',
    use: 'Use when current variances are typical of future work.',
  },
  {
    name: 'Estimate at Completion (EAC) — atypical',
    category: 'Forecasting',
    formula: 'EAC = AC + (BAC − EV)',
    purpose: 'Forecasts total cost assuming remaining work is on plan.',
    use: 'Use when the variance was a one-time event and won\u2019t repeat.',
  },
  {
    name: 'Estimate to Complete (ETC)',
    category: 'Forecasting',
    formula: 'ETC = EAC − AC',
    purpose: 'Money still needed to finish the project from this point forward.',
    use: 'Always derive from your chosen EAC method.',
  },
  {
    name: 'Variance at Completion (VAC)',
    category: 'Forecasting',
    formula: 'VAC = BAC − EAC',
    purpose: 'Projected total budget surplus or shortfall at project end.',
    use: 'Positive = under budget at completion. Negative = over budget.',
  },
  {
    name: 'To-Complete Performance Index (TCPI)',
    category: 'Forecasting',
    formula: 'TCPI = (BAC − EV) ÷ (BAC − AC)',
    purpose: 'Cost performance required on remaining work to hit the original budget.',
    use: 'If TCPI > 1.0, the team must work more efficiently than planned to recover.',
  },
  {
    name: 'PERT (Three-Point) Estimate',
    category: 'Estimating',
    formula: 'PERT = (O + 4M + P) ÷ 6',
    purpose: 'Weighted-average estimate using optimistic, most-likely, and pessimistic values.',
    use: 'Use for activities with high uncertainty. Standard deviation = (P − O) ÷ 6.',
  },
  {
    name: 'Communication Channels',
    category: 'Communications',
    formula: 'n × (n − 1) ÷ 2',
    purpose: 'Counts the number of two-way communication channels in a project team.',
    use: 'Almost guaranteed to appear on the exam. n = number of stakeholders.',
  },
  {
    name: 'Expected Monetary Value (EMV)',
    category: 'Risk',
    formula: 'EMV = Probability × Impact',
    purpose: 'Quantifies the expected financial outcome of a risk.',
    use: 'Sum EMVs across a decision branch to compare alternatives in decision trees.',
  },
]

const CATEGORIES = Array.from(new Set(FORMULAS.map((f) => f.category)))

export default function PmpFormulasPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            Free PMP® Reference
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            The 12 PMP® formulas you must know for the exam
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-300">
            Earned Value, forecasting, PERT, communication channels, and EMV — every formula on the
            PMP® exam, with purpose and when-to-use notes. Bookmark this page or print it.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <a
                key={cat}
                href={`#${cat.toLowerCase().replace(/\s+/g, '-')}`}
                className="rounded-full border border-gold/40 px-3 py-1 text-xs font-bold text-gold transition hover:bg-gold/10"
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Intro */}
        <section className="prose prose-slate max-w-none">
          <p className="text-base leading-7 text-slate-700">
            Most of the calculation questions on the PMP® exam fall into one of three buckets:
            Earned Value Management (EVM), forecasting, and a handful of one-off formulas like PERT
            and communication channels. The exam tests three things for each formula: <strong>what
            it&rsquo;s for, how to calculate it, and when to apply it.</strong> Skim this reference,
            then drill the formulas you&rsquo;re weakest on.
          </p>
        </section>

        {/* Formulas grouped by category */}
        {CATEGORIES.map((category) => {
          const items = FORMULAS.filter((f) => f.category === category)
          const id = category.toLowerCase().replace(/\s+/g, '-')

          return (
            <section key={category} id={id} className="mt-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900">{category}</h2>
              <div className="mt-6 grid gap-4">
                {items.map((f) => (
                  <article
                    key={f.name}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-bold text-slate-900">{f.name}</h3>
                      <code className="self-start rounded-md bg-navy px-3 py-1.5 font-mono text-sm font-bold text-gold sm:self-auto">
                        {f.formula}
                      </code>
                    </header>
                    <dl className="mt-4 space-y-2 text-sm leading-6">
                      <div>
                        <dt className="inline font-bold text-slate-900">Purpose: </dt>
                        <dd className="inline text-slate-700">{f.purpose}</dd>
                      </div>
                      <div>
                        <dt className="inline font-bold text-slate-900">When to use: </dt>
                        <dd className="inline text-slate-700">{f.use}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          )
        })}

        {/* Soft CTA */}
        <ResourceCTA variant="soft" />

        {/* Study tips */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900">How to memorize these for exam day</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-700">
            <li>
              <strong>Learn EVM first.</strong> CV, SV, CPI, SPI, and EAC together account for the
              majority of calculation questions. Master these and you&rsquo;ve covered the bulk of
              exam math.
            </li>
            <li>
              <strong>Drill communication channels until it&rsquo;s automatic.</strong> The
              n × (n−1) ÷ 2 question shows up on nearly every PMP® exam.
            </li>
            <li>
              <strong>Practice spotting which EAC variant to use.</strong> Wording like
              &ldquo;assuming current performance continues&rdquo; signals BAC ÷ CPI, while
              &ldquo;one-time event&rdquo; signals AC + (BAC − EV).
            </li>
            <li>
              <strong>Build a one-page brain dump.</strong> On exam day, immediately write all 12
              formulas on your scratch paper before answering any questions. This frees your
              working memory.
            </li>
          </ol>
        </section>

        {/* Hard CTA */}
        <ResourceCTA variant="hard" />

        {/* Related resources */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900">Related resources</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Link
              href="/free-guide"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Free guide</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">PMP® Exam Changes 2026</h3>
              <p className="mt-2 text-sm text-slate-600">
                What&rsquo;s new on the 2026 PMP® exam and how to plan your prep.
              </p>
            </Link>
            <Link
              href="/resources"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Hub</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">All free PMP® resources</h3>
              <p className="mt-2 text-sm text-slate-600">
                Browse every free guide, reference, and tool from Wiser Generations™.
              </p>
            </Link>
          </div>
        </section>
      </div>

      {/* JSON-LD Article schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'The 12 PMP® formulas you must know for the exam',
            description:
              'Free PMP® formula reference covering EVM, forecasting, PERT, communication channels, and EMV.',
            author: { '@type': 'Organization', name: 'Wiser Generations™' },
            publisher: { '@type': 'Organization', name: 'Wiser Generations™' },
            mainEntityOfPage: 'https://wisergenerations.com/resources/pmp-formulas',
          }),
        }}
      />
    </main>
  )
}

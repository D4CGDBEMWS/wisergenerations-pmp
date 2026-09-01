import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, validateSession } from '@/lib/auth/session'
import { findByResultToken, rebuildReport } from '@/lib/liap/assessment-service'
import type { RenderedReport } from '@/lib/liap/recommendations'
import { LiapPageView } from '@/components/liap/LiapPageView'
import { actionLabel } from '@/lib/liap/display-labels'
import { EmailPlanButton } from '@/components/liap/EmailPlanButton'
import { InterestButton } from '@/components/liap/InterestButton'
import { queryOne } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Your Life Project-Ready™ Plan | Wiser Generations',
  robots: { index: false, follow: false, nocache: true },
}

// ---------------------------------------------------------------------------
// The results page. §21, §22, §34.
//
// The URL carries a 256-bit random token, hashed at rest — the same
// construction as a session and a magic link. It is not a database id, so
// there is no sequence to walk, and a database read cannot be replayed as
// access to somebody's report.
//
// The token IS the capability, deliberately. §23 and §37 require the emailed
// link to return the customer to their plan, and demanding a login first would
// break the flow for someone opening it on a phone three weeks later. This is
// the same model as a password-reset link.
//
// Defence in depth on top of that: if a session is present and belongs to a
// DIFFERENT customer, the page refuses. That does not stop someone who holds
// the token — nothing can — but it does stop the plausible real-world case of
// a link pasted into a shared machine where somebody else is signed in.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// The four zones of LIFE PROJECT READINESS AT A GLANCE, in the owner's order:
// WHERE I AM -> WHAT STANDS OUT -> WHAT MAY DESERVE ATTENTION -> WHAT I MAY
// WANT TO DO NEXT.
//
// A table rather than four hand-written blocks, so the order is a single
// readable list and a zone cannot drift out of it during a later edit. Each
// `items` function READS the report; none of them scores, ranks or classifies
// anything, because the panel must agree with the sections below it by
// construction rather than by coincidence.
// ---------------------------------------------------------------------------

interface GlanceZone {
  label: string
  items: (report: RenderedReport) => string[]
}

const GLANCE_ZONES: readonly GlanceZone[] = [
  {
    label: 'Where I am',
    items: (r) => [r.positionLabel, `${r.total} of 200 across eight dimensions`],
  },
  {
    // The dimensions that scored as strengths. When none did, the highest
    // scoring one still stands out relative to the rest, and saying so is
    // reading the result rather than softening it.
    label: 'What stands out',
    items: (r) => {
      const top = r.strengths.length > 0 ? r.strengths : r.scores.slice().sort((a, b) => b.score - a.score).slice(0, 1)
      return top.map((s) => `${s.name} — ${s.score}/25`)
    },
  },
  {
    // Urgent first when there is anything urgent — the same rule Start Here
    // follows — and otherwise the top of the attention ranking the engine
    // already produced.
    label: 'What may deserve attention',
    items: (r) => (r.urgent.length > 0 ? r.urgent : r.ranked.slice(0, 3)).map((s) => `${s.name} — ${s.score}/25`),
  },
  {
    label: 'What I may want to do next',
    items: (r) => r.actions.map((a) => `${actionLabel(a.kind)} — ${a.headline}`),
  },
]

const CLASSIFICATION_STYLE: Record<string, { bar: string; text: string }> = {
  strength: { bar: 'bg-emerald-600', text: 'text-emerald-800' },
  build: { bar: 'bg-brand-blue', text: 'text-brand-blue' },
  priority: { bar: 'bg-amber-600', text: 'text-amber-800' },
  immediate: { bar: 'bg-red-700', text: 'text-red-800' },
}


export default async function ResultsPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Fails closed. If the lookup throws — a database outage, a malformed token —
  // the answer is "no such report", not a stack trace on a page whose whole
  // purpose is that it is hard to reach. §35: no raw system error reaches a
  // customer.
  let found: Awaited<ReturnType<typeof findByResultToken>> = null
  try {
    found = await findByResultToken(token)
  } catch (err) {
    console.error('[liap/results] lookup failed:', err)
  }
  if (!found) notFound()

  const store = await cookies()
  const session = await validateSession(store.get(SESSION_COOKIE)?.value)
  if (session && session.customerId !== found.customerId) notFound()

  const report = await rebuildReport(found.id)
  // `unknown`, deliberately. A `date` column does NOT arrive here as a string:
  // the Neon driver runs pg-types, whose parser for oid 1082 returns a JS Date,
  // and PGlite does the same. Typing it `string` compiled fine and printed
  // "Invalid Date" on every rendered plan. formatDate normalises instead.
  const reviewRow = await queryOne<{ next_review_on: unknown }>(
    `SELECT next_review_on FROM assessment_results WHERE assessment_id = $1`,
    [found.id]
  )

  const reviewOn = formatDate(reviewRow?.next_review_on)

  const maskedEmail = maskEmail(
    (
      await queryOne<{ email: string }>(`SELECT email FROM customers WHERE id = $1`, [
        found.customerId,
      ])
    )?.email ?? ''
  )

  return (
    <main className="bg-gray-50">
      <LiapPageView event="liap_results_viewed" props={{ position: report.position }} />

      {/* Position */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            Your Life Project Position
          </p>
          <h1 className="mt-4 text-3xl font-bold sm:text-5xl">{report.positionLabel}</h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-gray-200">{report.positionMeaning}</p>
          <p className="mt-6 text-sm text-gray-400">
            {report.total} of 200 across eight dimensions
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-12 px-5 py-12 sm:px-8 sm:py-16">
        {/* Anything at 10 or below is stated before anything else, whatever the
            total. §15's critical rule, made visible rather than merely computed. */}
        {report.urgent.length > 0 && (
          <section
            aria-labelledby="urgent-heading"
            className="rounded-xl border-l-4 border-red-700 bg-red-50 p-5 sm:p-6"
          >
            <h2 id="urgent-heading" className="text-lg font-bold text-red-900">
              Start Here
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-red-900">
              However the rest of your answers look, {report.urgent.length === 1 ? 'this area is' : 'these areas are'}{' '}
              low enough to constrain everything else.
            </p>
            <ul className="mt-3 space-y-1">
              {report.urgent.map((s) => (
                <li key={s.key} className="font-semibold text-red-900">
                  {s.name} — {s.score}/25
                </li>
              ))}
            </ul>
          </section>
        )}

        {/*
          LIFE PROJECT READINESS AT A GLANCE.

          ── WHAT THE WORDS ARE, AND WHERE THEY CAME FROM ─────────────────────

          Every word of fixed text in this section is owner-supplied: the
          heading, the four zone labels, and the closing sentence. Nothing here
          was written to fill a gap. There is no explanatory paragraph, no
          connective prose and no summary sentence, because none was approved —
          and a glance panel is exactly the surface where invented framing would
          read as the system's own verdict on somebody's life.

          Everything else on the panel is the participant's own result, read
          from the same `report` the detailed sections below render. It is a
          second view of one set of facts, never a second computation of them.

          ── PLACEMENT ───────────────────────────────────────────────────────

          After Start Here, not before it. §15's rule is that anything at 10 or
          below is stated before anything else, and a summary panel is not an
          exception to it. For a participant with nothing urgent this is the
          first thing in the body, which is where the hierarchy wants it.
        */}
        <section
          aria-labelledby="glance-heading"
          className="rounded-xl border border-gold/40 bg-white p-5 sm:p-6"
        >
          <h2
            id="glance-heading"
            className="text-xs font-bold uppercase tracking-[0.18em] text-gold-text"
          >
            Life Project Readiness at a Glance
          </h2>

          <dl className="mt-5 space-y-5">
            {GLANCE_ZONES.map((zone) => {
              const items = zone.items(report)
              if (items.length === 0) return null
              return (
                <div key={zone.label}>
                  <dt className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                    {zone.label}
                  </dt>
                  <dd className="mt-1.5">
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="leading-relaxed text-navy">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )
            })}
          </dl>

          {/* Owner-approved, verbatim, and deliberately the last thing on the
              panel. Not to be strengthened, spiritualized, rewritten or
              substituted. */}
          <p className="mt-6 border-t border-gold/40 pt-5 leading-relaxed text-gray-700">
            May you discern what project matters most to you.
          </p>
        </section>

        {/*
          RETIRED: the S.T.E.A.D.Y. section stood here.

          S.T.E.A.D.Y. was retired from customer-facing LIAP on 31 August 2026.
          Its owner-approved replacement is Wiser Pivots™, and there is no
          approved Wiser Pivots™ copy for this surface — the six step words
          exist, but the section heading, its explanatory paragraph and the six
          bodies do not. So the section is removed rather than rewritten:
          inventing replacement prose for the moment a participant is told how
          to handle an unexpected change is not a gap to fill in silently.

          The routing itself is untouched. `report.steady` is still computed,
          still stored as `steady_routed`, and still tempers the STRENGTHEN
          step in lib/liap/recommendations.ts. Only the display is gone.

          WISER PIVOTS COPY REQUIRED for this surface.
        */}

        {/* Dashboard. §22: score, classification and a written label — never
            colour alone, and the bar is decorative with the number beside it. */}
        <section aria-labelledby="dashboard-heading">
          <h2 id="dashboard-heading" className="text-xl font-bold text-navy">
            Your eight dimensions
          </h2>
          <ul className="mt-5 space-y-3">
            {report.scores.map((s) => {
              const style = CLASSIFICATION_STYLE[s.classification]!
              return (
                <li key={s.key} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-semibold text-navy">{s.name}</p>
                    <p className="text-sm text-gray-600">
                      <span className="font-bold text-navy">{s.score}</span> / 25 ·{' '}
                      <span className={`font-semibold ${style.text}`}>
                        {report.classificationLabels[s.classification]}
                      </span>
                    </p>
                  </div>
                  <div
                    aria-hidden="true"
                    className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200"
                  >
                    <div
                      className={`h-full rounded-full ${style.bar}`}
                      style={{ width: `${((s.score - 5) / 20) * 100}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        {report.strengths.length > 0 && (
          <section aria-labelledby="strengths-heading">
            <h2 id="strengths-heading" className="text-xl font-bold text-navy">
              Strengths you can use
            </h2>
            <p className="mt-2 leading-relaxed text-gray-600">
              These are the parts of your situation that are already working. Lean on them for the
              parts that are not.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {report.strengths.map((s) => (
                <li
                  key={s.key}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900"
                >
                  {s.name} · {s.score}/25
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Exactly three. §18. */}
        <section aria-labelledby="actions-heading">
          <h2 id="actions-heading" className="text-xl font-bold text-navy">
            Your next best three
          </h2>
          <div className="mt-5 space-y-4">
            {report.actions.map((action) => (
              <article key={action.kind} className="rounded-xl border border-gray-200 bg-white p-5">
                {/* gold-text, not gold: brand gold reads 2.28:1 on white and
                    fails AA. Same hue, taken down to 32% lightness. */}
                <p className="text-xs font-bold uppercase tracking-widest text-gold-text">
                  {actionLabel(action.kind)}
                </p>
                <h3 className="mt-1.5 text-lg font-bold text-navy">{action.headline}</h3>
                {/* Approved copy can run to several paragraphs -- the Spiritual
                    Readiness blocks do. Rendering the whole body in one <p>
                    would collapse those breaks into a single wall of text,
                    which alters owner-approved copy in the act of displaying
                    it. Split on the blank line the copy itself uses. */}
                {action.body.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="mt-2 leading-relaxed text-gray-700">
                    {paragraph}
                  </p>
                ))}
              </article>
            ))}
          </div>
        </section>

        {/* 30/60/90. §20. */}
        <section aria-labelledby="plan-heading">
          <h2 id="plan-heading" className="text-xl font-bold text-navy">
            Your 30/60/90-day starting plan
          </h2>
          <div className="mt-5 space-y-4">
            {report.plan.phases.map((phase) => (
              <article key={phase.window} className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  {phase.window}
                </p>
                <h3 className="mt-1 text-lg font-bold text-navy">{phase.title}</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-gray-700 marker:text-gold">
                  {phase.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          {reviewOn && (
            <p className="mt-5 rounded-lg bg-navy/5 p-4 text-sm text-navy">
              <span className="font-semibold">Next review date:</span>{' '}
              {reviewOn} — put it in your calendar now, while you are
              thinking about it.
            </p>
          )}
        </section>

        {/* §24: reuse the checkout email rather than asking for it again. */}
        <section aria-labelledby="email-heading" className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <h2 id="email-heading" className="text-lg font-bold text-navy">
            Resend My Results Email
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            We&rsquo;ll send it to <span className="font-semibold text-navy">{maskedEmail}</span> so
            you can come back to it.
          </p>
          <EmailPlanButton token={token} />
        </section>

        {/* Owner ruling: "Yours to keep" needs something to keep. A plain link
            rather than a script-driven download, so it works with JavaScript
            off and behaves like a file in every browser. */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-navy">Keep a copy</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            A one-page snapshot of your position, your eight dimensions and your 30/60/90 plan.
          </p>
          {/* The gold focus ring is not decoration here. Without it this
              control fell back to the browser's default near-black ring, which
              on a navy button measures about 1.1:1 — a keyboard user tabbing to
              the one thing on the page they get to keep could not see where
              they were. */}
          <a
            href={`/living-is-a-project/results/${token}/snapshot`}
            className="mt-4 inline-block rounded-lg bg-navy px-6 py-3 font-bold text-white transition-colors hover:bg-brand-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Download My Life Project Snapshot
          </a>
        </section>

        {/* §30: name what is coming, sell nothing that does not exist. */}
        <section aria-labelledby="next-heading" className="border-t border-gray-200 pt-10">
          <h2 id="next-heading" className="text-xl font-bold text-navy">
            You have the plan. Now let&rsquo;s work the plan.
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <article className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Coming soon
              </p>
              <h3 className="mt-1 font-bold text-navy">
                Living Is a Project Virtual Workshop
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Ninety minutes working your plan alongside others going through their own change.
              </p>
              <InterestButton interest="workshop" label="Join the priority list" />
            </article>
            <article className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Coming soon
              </p>
              <h3 className="mt-1 font-bold text-navy">Life Project Starter Kit</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                The templates and checklists behind the plan, ready to use.
              </p>
              <InterestButton interest="starter_kit" label="Notify me" />
            </article>
          </div>
        </section>

        <p className="text-sm text-gray-500">
          <Link href="/living-is-a-project" className="underline underline-offset-2 hover:text-navy">
            Back to Living Is a Project
          </Link>
        </p>
      </div>
    </main>
  )
}

/** c••••••@example.com — enough to recognise, not enough to harvest. §24. */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return 'your email address'
  const head = local.slice(0, 1)
  return `${head}${'•'.repeat(Math.max(local.length - 1, 3))}@${domain}`
}

/**
 * Formats a review date that may arrive as a Date OR as a 'YYYY-MM-DD' string.
 *
 * Both happen: the driver's type parser decides, and it is not the same in
 * every deployment. Returns null rather than the string "Invalid Date" — a
 * date we cannot read is a date not worth showing the customer.
 */
function formatDate(value: unknown): string | null {
  const d =
    value instanceof Date
      ? value
      : typeof value === 'string'
        ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value)
        : null
  if (!d || Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

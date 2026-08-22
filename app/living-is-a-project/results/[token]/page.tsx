import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, validateSession } from '@/lib/auth/session'
import { findByResultToken, rebuildReport } from '@/lib/liap/assessment-service'
import { STEADY_STEPS, PIVOTS_INTRO, PIVOTS_CYCLE, PIVOT_STEP } from '@/lib/liap/scoring'
import { LiapPageView } from '@/components/liap/LiapPageView'
import { EmailPlanButton } from '@/components/liap/EmailPlanButton'
import { InterestButton } from '@/components/liap/InterestButton'
import { queryOne } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Life Project-Ready™ Readiness Report | Wiser Generations',
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

const CLASSIFICATION_STYLE: Record<string, { bar: string; text: string }> = {
  strength: { bar: 'bg-emerald-600', text: 'text-emerald-800' },
  build: { bar: 'bg-brand-blue', text: 'text-brand-blue' },
  priority: { bar: 'bg-amber-600', text: 'text-amber-800' },
  immediate: { bar: 'bg-red-700', text: 'text-red-800' },
}

const ACTION_HEADING = {
  protect: 'Protect',
  resolve: 'Resolve',
  move: 'Move',
} as const

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
  const reviewRow = await queryOne<{ next_review_on: string | null }>(
    `SELECT next_review_on FROM assessment_results WHERE assessment_id = $1`,
    [found.id]
  )

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
              Needs attention first
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

        {/* Change navigation, before any expansion advice. §17.
            Every string comes from lib/liap/scoring — heading, descriptor,
            signature concept and all six steps — so the copy has exactly one
            home and this component decides only how it looks.

            ── PIVOT IS THE FOCAL POINT, NOT THE FIFTH TILE ─────────────────
            WISER is the adaptive thinking cycle; PIVOT is the personal and
            intentional action. So the four thinking steps are compact cards
            and the turn is a full-width navy panel with the gold rule — the
            one thing on the section you cannot scroll past. It stays inside
            the same ordered list, because visually it is the emphasis and
            semantically it is still step five of six. */}
        {report.steady && (
          <section aria-labelledby="pivots-heading">
            <h2 id="pivots-heading" className="text-xl font-bold text-navy">
              {PIVOTS_INTRO.heading}
            </h2>
            <p className="mt-1 text-gray-600">{PIVOTS_INTRO.descriptor}</p>
            <p className="mt-3 text-lg font-semibold italic text-navy">{PIVOTS_INTRO.signature}</p>

            {/* The cycle. Decorative — the ordered list below carries the
                same sequence for anyone not looking at it — and it scrolls
                sideways on a phone rather than shrinking to six unreadable
                words. */}
            <div aria-hidden="true" className="-mx-1 mt-6 overflow-x-auto pb-1">
              <ol className="flex w-max items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-wider">
                {PIVOTS_CYCLE.map((label, i) => (
                  <li key={label} className="flex items-center gap-2">
                    <span
                      className={
                        label === PIVOT_STEP.title
                          ? 'rounded-full bg-navy px-3 py-1.5 text-gold'
                          : 'rounded-full bg-gray-100 px-3 py-1.5 text-gray-700'
                      }
                    >
                      {label}
                    </span>
                    <span className="text-gray-400">{i === PIVOTS_CYCLE.length - 1 ? '\u21bb' : '\u2192'}</span>
                  </li>
                ))}
                <li className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-700">{PIVOTS_CYCLE[0]}</li>
              </ol>
            </div>

            <ol className="mt-5 space-y-3">
              {STEADY_STEPS.map((step) =>
                step.focal ? (
                  <li
                    key={step.letter}
                    className="rounded-xl border-l-4 border-gold bg-navy p-6 text-white sm:p-8"
                  >
                    <p className="text-2xl font-black tracking-wide text-gold sm:text-3xl">{step.title}</p>
                    {step.expansion && (
                      <p className="mt-1 text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
                        {step.expansion}
                      </p>
                    )}
                    <p className="mt-3 text-lg font-bold">{step.lead}</p>
                    {step.body.map((paragraph) => (
                      <p key={paragraph} className="mt-3 leading-relaxed text-white/90">
                        {paragraph}
                      </p>
                    ))}
                  </li>
                ) : (
                  <li
                    key={step.letter}
                    className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-navy font-bold text-gold"
                    >
                      {step.letter}
                    </span>
                    <div>
                      <p className="font-semibold text-navy">
                        {step.title} <span className="font-normal text-gray-600">— {step.lead}</span>
                      </p>
                      {step.body.map((paragraph) => (
                        <p key={paragraph} className="mt-0.5 text-sm leading-relaxed text-gray-600">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </li>
                )
              )}
            </ol>
          </section>
        )}

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
                <p className="text-xs font-bold uppercase tracking-widest text-gold">
                  {ACTION_HEADING[action.kind]}
                </p>
                <h3 className="mt-1.5 text-lg font-bold text-navy">{action.headline}</h3>
                <p className="mt-2 leading-relaxed text-gray-700">{action.body}</p>
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

          {reviewRow?.next_review_on && (
            <p className="mt-5 rounded-lg bg-navy/5 p-4 text-sm text-navy">
              <span className="font-semibold">Next review date:</span>{' '}
              {formatDate(reviewRow.next_review_on)} — put it in your calendar now, while you are
              thinking about it.
            </p>
          )}
        </section>

        {/* §24: reuse the checkout email rather than asking for it again. */}
        <section aria-labelledby="email-heading" className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <h2 id="email-heading" className="text-lg font-bold text-navy">
            Send my plan to me
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            We&rsquo;ll send it to <span className="font-semibold text-navy">{maskedEmail}</span> so
            you can come back to it.
          </p>
          <EmailPlanButton token={token} />
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
                LIAP Virtual Workshop
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
            Back to Living Is a Project...Are You Ready?™
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

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

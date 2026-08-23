'use client'

import type { GameState } from '@/lib/game/types'
import { dayResults } from '@/lib/game/results'
import { glossaryRows } from '@/lib/game/glossary'
import { healthBand } from '@/lib/game/engine'
import { LESSON_CHOICES } from '@/lib/game/scenarios'
import { PIVOT_INTRO } from '@/lib/game/pivot'

// ---------------------------------------------------------------------------
// 5:00 PM.
//
// ── WHAT THIS SCREEN IS NOT ────────────────────────────────────────────────
//
// It is not a profile. It says nothing about the person who played: not their
// personality, not their leadership style, not their readiness, not their
// suitability for anything. Every sentence is about a fictional member
// services portal at the end of a fictional Tuesday.
//
// That is a governance boundary, not a style preference. This product already
// has a readiness assessment with its own consent story, its own retention
// rules and its own approvals. A game that quietly produced a second readiness
// verdict would have opened a second sensitive-data pathway with none of that
// — which §31 forbids outright. So: the project has a standing, and the
// participant has a decision trail.
//
// ── THE TRAIL IS THE POINT ─────────────────────────────────────────────────
//
// The most valuable thing on this page is the section that draws a line from a
// decision at 9:00 AM to something that happened at 2:00 PM. Nothing hinted at
// that link when the decision was made, and that is exactly the lesson.
// ---------------------------------------------------------------------------

const BAND_TEXT: Record<ReturnType<typeof healthBand>, string> = {
  critical: 'text-red-700',
  strained: 'text-amber-700',
  steady: 'text-brand-blue',
  strong: 'text-green-700',
}

export function ResultsScreen({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const results = dayResults(state)
  const terms = glossaryRows(state)
  const lesson = LESSON_CHOICES.find((l) => l.id === state.lesson)

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-navy p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
          End of day &middot; Member Services Portal
        </p>
        <h1 className="mt-3 text-2xl font-bold leading-snug text-white sm:text-3xl">
          {results.standing.headline}
        </h1>
        <p className="mt-4 leading-relaxed text-gray-300">{results.standing.body}</p>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
        <h2 className="text-lg font-bold text-navy">Where the project ended up</h2>
        <dl className="mt-4 divide-y divide-gray-100">
          {results.dimensions.map((dimension) => (
            <div key={dimension.key} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-semibold text-navy">{dimension.label}</dt>
                <dd className={`text-sm font-semibold ${BAND_TEXT[dimension.band]}`}>
                  {dimension.value}
                </dd>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{dimension.note}</p>
            </div>
          ))}
        </dl>
      </section>

      {results.trail.length > 0 && (
        <section className="rounded-xl border border-gold bg-light-gold p-5 sm:p-7">
          <h2 className="text-lg font-bold text-navy">What set up what</h2>
          <p className="mt-2 leading-relaxed text-gray-700">
            Nothing marked these at the time. That is the part worth taking away.
          </p>
          <ul className="mt-5 space-y-4">
            {results.trail.map((item) => (
              <li key={item.text} className="rounded-lg bg-white px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
                  {item.setUpAt}
                </p>
                <p className="mt-1 font-medium leading-snug text-navy">{item.setUpBy}</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
                  &darr; {item.landedAt}
                </p>
                <p className={`mt-1 leading-relaxed ${item.favourable ? 'text-green-800' : 'text-amber-900'}`}>
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Practical Wisdom" value={String(results.wisdom)} note="Awarded for judgement." />
        <Stat
          label="Glossary Points"
          value={String(results.glossaryPoints)}
          note="A bonus layer. Never part of the project score."
        />
        <Stat
          label="Focus"
          value={results.focusOverdrawn > 0 ? `${results.focusOverdrawn} past empty` : `${results.focusRemaining} left`}
          note={
            results.focusOverdrawn > 0
              ? 'Attention you did not have came out of the team.'
              : 'Attention the day did not need.'
          }
        />
      </section>

      <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
        <h2 className="text-lg font-bold text-navy">Terms I Discovered</h2>
        <p className="mt-1 text-sm text-gray-600">
          {results.termsDiscovered.length} of {results.termsAvailable} met today.
          {results.termsDiscovered.length < results.termsAvailable &&
            ' The ones you have not met yet are still there.'}
        </p>
        <ul className="mt-4 space-y-3">
          {terms.map((row) => (
            <li key={row.term} className={row.discovered ? '' : 'opacity-60'}>
              <p className="font-semibold text-navy">
                {row.term}
                {!row.discovered && (
                  <span className="ml-2 text-xs font-normal text-gray-500">not met yet</span>
                )}
              </p>
              {row.discovered && (
                <>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-700">{row.definition}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{row.metAt}</p>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
        <h2 className="text-lg font-bold text-navy">{PIVOT_INTRO.heading}</h2>
        <p className="mt-2 leading-relaxed text-gray-700">
          {results.pivotTaken
            ? 'You took the turn deliberately rather than reacting to it. ' + PIVOT_INTRO.signature
            : results.pivotOffered
              ? 'The moment came and you stayed on the route. That is a decision, and sometimes the right one.'
              : 'Nothing today reached the point where the route itself needed rethinking.'}
        </p>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
        <h2 className="text-lg font-bold text-navy">Your decisions</h2>
        <ol className="mt-4 divide-y divide-gray-100">
          {results.decisions.map((decision) => (
            <li key={decision.scenarioId} className="py-3">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
                {decision.scenarioTitle}
              </p>
              <p className="mt-0.5 leading-snug text-navy">{decision.choiceLabel}</p>
            </li>
          ))}
        </ol>
        {lesson && (
          <p className="mt-5 rounded-lg bg-paper px-5 py-4 leading-relaxed text-navy">
            <span className="font-semibold">Next time: </span>
            {lesson.label}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-line bg-paper p-5 text-center sm:p-7">
        <p className="leading-relaxed text-gray-700">
          Same project, same starting conditions, different decisions. Play it again and see where
          a different day ends up.
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-4 rounded-lg bg-navy px-6 py-3 font-bold text-white transition-colors hover:bg-brand-blue-dark"
        >
          Start a new day
        </button>
        {/* Nothing was stored, so there is nothing to clear. Restarting is a
            new object in React state and no more than that. */}
        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          Nothing from this session is saved. Closing the tab ends it.
        </p>
      </section>
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">{note}</p>
    </div>
  )
}

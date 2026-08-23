'use client'

import Link from 'next/link'
import { useReducer } from 'react'
import {
  PREVIEW_BRIEF,
  PREVIEW_CLOSING,
  PREVIEW_CTA_HREF,
  PREVIEW_CTA_LABEL,
  PREVIEW_SCENARIO,
  PREVIEW_SUPPORTING_LINE,
  PREVIEW_TITLE,
  previewChoice,
  previewGlossaryCorrect,
  previewInitialState,
  previewReduce,
} from '@/lib/game/preview'

// ---------------------------------------------------------------------------
// The teaser, end to end.
//
// Six beats: brief, situation, four choices, consequence, glossary bonus,
// reveal, CTA. About ninety seconds.
//
// ── WHAT IS DELIBERATELY MISSING ───────────────────────────────────────────
//
// No health dashboard, no roadmap rail, no Focus Points, no WISER Pivot™, no
// delayed consequences, no end-of-day results, no lesson screen. Owner ruling,
// and it is the right one: six dimensions moving once teaches nothing, and a
// teaser that showed a dashboard would promise a system it does not deliver.
//
// The costs are hidden here for the same reason. In the full day a Focus cost
// is the whole point, because attention is scarce across twelve hours. In one
// hour it is a number with nothing to be scarce against.
//
// ── AND WHAT IS MISSING FROM THE DATA SIDE ─────────────────────────────────
//
// Everything. No fetch, no storage, no cookie, no analytics, no free text, no
// server action. The CTA is a Link — an ordinary navigation to a page that
// owns its own signup and its own consent. Nothing about the choice a
// participant made travels with them, and the game engine has no idea a
// marketing list exists.
// ---------------------------------------------------------------------------

export function PreviewClient() {
  const [state, dispatch] = useReducer(previewReduce, undefined, previewInitialState)
  const chosen = previewChoice(state)
  const glossary = PREVIEW_SCENARIO.glossary

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:py-12">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
          Living Is a Project&hellip;Are You Ready?&trade;
        </p>
        <h1 className="mt-1 text-xl font-bold leading-snug text-navy sm:text-2xl">
          {PREVIEW_TITLE}
        </h1>
        <p className="mt-2 leading-relaxed text-gray-600">{PREVIEW_SUPPORTING_LINE}</p>
      </header>

      <div aria-live="polite">
        {state.phase === 'brief' && (
          <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
              Your project
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-navy">
              {PREVIEW_BRIEF.project}
            </h2>
            <p className="mt-4 leading-relaxed text-gray-700">{PREVIEW_BRIEF.purpose}</p>
            <p className="mt-4 rounded-lg bg-paper px-5 py-4 leading-relaxed text-navy">
              <span className="font-semibold">Next milestone: </span>
              {PREVIEW_BRIEF.milestone}
            </p>
            <p className="mt-5 leading-relaxed text-gray-700">
              You inherited this project three weeks ago. It is mid-morning, and a message has
              just arrived.
            </p>
            <button
              type="button"
              onClick={() => dispatch({ type: 'begin' })}
              className="mt-6 rounded-lg bg-navy px-6 py-3 font-bold text-white transition-colors hover:bg-brand-blue-dark"
            >
              Start
            </button>
          </section>
        )}

        {state.phase === 'situation' && (
          <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
              {PREVIEW_SCENARIO.time}
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-navy sm:text-3xl">
              {PREVIEW_SCENARIO.title}
            </h2>
            <div className="mt-4 space-y-3">
              {PREVIEW_SCENARIO.situation.map((paragraph) => (
                <p key={paragraph} className="leading-relaxed text-gray-700">
                  {paragraph}
                </p>
              ))}
            </div>
            <h3 className="mt-6 text-lg font-bold text-navy">{PREVIEW_SCENARIO.question}</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {PREVIEW_SCENARIO.choices.map((choice) => (
                <li key={choice.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'choose', choiceId: choice.id })}
                    className="w-full rounded-lg border border-gray-200 px-5 py-4 text-left font-medium leading-snug text-navy transition-colors hover:border-brand-blue hover:bg-paper"
                  >
                    {choice.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {state.phase === 'outcome' && chosen && (
          <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
              What happened
            </p>
            <h2 className="mt-2 text-xl font-bold leading-snug text-navy">{chosen.label}</h2>
            <p className="mt-4 leading-relaxed text-gray-700">{chosen.outcome}</p>
            {/* No verdict. This hour has more than one defensible answer, and a
                teaser that graded you would teach test-taking in ninety
                seconds. */}
            <button
              type="button"
              onClick={() => dispatch({ type: 'next' })}
              className="mt-6 rounded-lg bg-navy px-6 py-3 font-bold text-white transition-colors hover:bg-brand-blue-dark"
            >
              Continue
            </button>
          </section>
        )}

        {state.phase === 'glossary' && glossary && (
          <section className="rounded-xl border border-brand-blue bg-paper p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">
              Name what just happened
            </p>
            <h2 className="mt-2 text-lg font-bold leading-snug text-navy">{glossary.prompt}</h2>
            <p className="mt-2 text-sm text-gray-600">
              Nothing here can go wrong. You learn the term either way.
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {glossary.options.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'answer-glossary', option })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-5 py-3 text-left font-medium text-navy transition-colors hover:border-brand-blue"
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {state.phase === 'reveal' && glossary && (
          <section className="rounded-xl border border-brand-blue bg-paper p-5 sm:p-7">
            <p className={`font-bold ${previewGlossaryCorrect(state) ? 'text-green-700' : 'text-brand-blue'}`}>
              {previewGlossaryCorrect(state) ? 'Yes.' : 'Not quite — and it costs you nothing.'}
            </p>
            <p className="mt-3 leading-relaxed text-gray-700">{glossary.reveal}</p>
            <button
              type="button"
              onClick={() => dispatch({ type: 'next' })}
              className="mt-6 rounded-lg bg-navy px-6 py-3 font-bold text-white transition-colors hover:bg-brand-blue-dark"
            >
              Continue
            </button>
          </section>
        )}

        {state.phase === 'cta' && (
          <section className="rounded-xl bg-navy p-6 text-center sm:p-8">
            <p className="mx-auto max-w-md text-xl font-bold leading-snug text-white">
              {PREVIEW_CLOSING}
            </p>
            {/* A link, not a form. The signup page owns the email, the consent
                and the list; this page owns none of them and never sees one. */}
            <Link
              href={PREVIEW_CTA_HREF}
              className="mt-6 inline-block rounded-lg bg-gold px-7 py-3.5 font-bold text-navy transition-colors hover:bg-yellow-500"
            >
              {PREVIEW_CTA_LABEL}
            </Link>
            <p className="mt-6 text-sm leading-relaxed text-gray-400">
              Nothing from this preview is saved. Closing the tab ends it.
            </p>
            <button
              type="button"
              onClick={() => dispatch({ type: 'restart' })}
              className="mt-4 text-sm font-semibold text-gold underline underline-offset-4"
            >
              Try a different decision
            </button>
          </section>
        )}
      </div>
    </main>
  )
}

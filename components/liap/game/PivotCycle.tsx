'use client'

import { PIVOT_INTRO, PIVOT_INVITATION, PIVOT_STEPS, PIVOT_DECLINE_LABEL } from '@/lib/game/pivot'
import type { GameState } from '@/lib/game/types'
import { HealthDashboard } from './HealthDashboard'

// ---------------------------------------------------------------------------
// The WISER Pivot™ moment.
//
// ── WHY PIVOT LOOKS DIFFERENT FROM THE OTHER FIVE ──────────────────────────
//
// The owner's design requirement for this cycle wherever it appears: PIVOT is
// visually dominant. It is not the fifth card in a row of six. Five of these
// steps are ways of thinking; one is the turn, and the layout says so before
// anybody reads a word — full-bleed navy, gold rule, larger type, and the only
// step that presents real alternatives with real costs.
//
// ── THE OFFER IS DECLINABLE ────────────────────────────────────────────────
//
// Staying on the current route is a legitimate decision and is not punished.
// A cycle you are forced through is a corridor. The turn has to be a choice
// for taking it to mean anything.
// ---------------------------------------------------------------------------

interface Props {
  state: GameState
  onTake: () => void
  onDecline: () => void
  onChoose: (optionId: string) => void
  onContinue: () => void
}

export function PivotCycle({ state, onTake, onDecline, onChoose, onContinue }: Props) {
  if (!state.pivotTaken) {
    return (
      <section className="rounded-xl border-2 border-gold bg-light-gold p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
          {PIVOT_INTRO.heading}
        </p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-navy">
          {PIVOT_INTRO.descriptor}
        </h2>
        <p className="mt-3 leading-relaxed text-gray-700">{PIVOT_INVITATION}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onTake}
            className="rounded-lg bg-navy px-6 py-3 font-bold text-white transition-colors hover:bg-brand-blue-dark"
          >
            Take the turn
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            {PIVOT_DECLINE_LABEL}
          </button>
        </div>
      </section>
    )
  }

  const step = PIVOT_STEPS[state.pivotStep]

  // Every step walked. The signature line closes the cycle and then the day
  // carries on — the turn does not end the game, it changes the route.
  if (!step) {
    return (
      <section className="rounded-xl bg-navy p-6 text-center sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
          {PIVOT_INTRO.heading}
        </p>
        <p className="mx-auto mt-4 max-w-md text-xl font-bold leading-snug text-white">
          {PIVOT_INTRO.signature}
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 rounded-lg bg-gold px-6 py-3 font-bold text-navy transition-colors hover:bg-yellow-500"
        >
          Back to the day
        </button>
      </section>
    )
  }

  const focal = step.focal === true

  // Recovered from the step table rather than stored on the state: the table
  // already says what each option was, and a second copy could disagree.
  const focalStep = PIVOT_STEPS.find((s) => s.focal)
  const turn = focalStep?.options?.find((o) => o.id === state.pivotAction) ?? null
  const selectStep = PIVOT_STEPS.find((s) => s.title === 'SELECT')
  const priority = selectStep?.options?.find((o) => o.id === state.pivotPriority) ?? null

  return (
    <section
      className={
        focal
          ? 'rounded-xl bg-navy p-6 sm:p-8'
          : 'rounded-xl border border-line bg-white p-5 sm:p-6'
      }
    >
      <div className="flex items-center gap-3">
        <span
          className={
            focal
              ? 'rounded-md bg-gold px-3 py-1 text-sm font-black tracking-[0.18em] text-navy'
              : 'rounded-md bg-light-navy px-2.5 py-1 text-sm font-black tracking-[0.14em] text-navy'
          }
        >
          {step.letter}
        </span>
        <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${focal ? 'text-gold' : 'text-gray-500'}`}>
          Step {state.pivotStep + 1} of {PIVOT_STEPS.length}
        </p>
      </div>

      <h2
        className={
          focal
            ? 'mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl'
            : 'mt-4 text-xl font-bold text-navy'
        }
      >
        {step.title}
      </h2>
      {focal && <div aria-hidden="true" className="mt-3 h-1 w-16 rounded-full bg-gold" />}
      <p className={`mt-2 font-semibold ${focal ? 'text-gold' : 'text-brand-blue'}`}>{step.lead}</p>
      <p className={`mt-3 leading-relaxed ${focal ? 'text-gray-200' : 'text-gray-700'}`}>
        {step.prompt}
      </p>

      {/* REVIEW is where the turn is reported back. The focal step advances on
          selection, so without this the participant would choose a pivot and
          never read what it did. */}
      {step.title === 'REVIEW' && turn && (
        <div className="mt-5 rounded-lg border-l-4 border-gold bg-light-gold px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
            The turn you made
          </p>
          <p className="mt-1 font-semibold leading-snug text-navy">{turn.label}</p>
          <p className="mt-2 leading-relaxed text-gray-700">{turn.outcome}</p>
          {priority && (
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{priority.outcome}</p>
          )}
        </div>
      )}

      {step.showsDashboard && (
        <div className="mt-5">
          <HealthDashboard
            health={state.health}
            focus={state.focus}
            focusOverdrawn={state.focusOverdrawn}
          />
          {state.landed.length > 0 && (
            <ul className="mt-4 space-y-2">
              {state.landed.map((c) => (
                <li key={c.text} className="rounded-lg bg-paper px-4 py-3 text-sm leading-relaxed text-gray-700">
                  {c.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {step.options ? (
        <ul className="mt-6 flex flex-col gap-3">
          {step.options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => onChoose(option.id)}
                className={
                  focal
                    ? 'w-full rounded-lg border border-gold/60 bg-white/5 px-5 py-4 text-left font-semibold leading-snug text-white transition-colors hover:bg-white/10'
                    : 'w-full rounded-lg border border-gray-200 px-5 py-4 text-left font-medium leading-snug text-navy transition-colors hover:border-brand-blue hover:bg-paper'
                }
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <button
          type="button"
          onClick={onContinue}
          className={
            focal
              ? 'mt-6 rounded-lg bg-gold px-6 py-3 font-bold text-navy'
              : 'mt-6 rounded-lg bg-navy px-6 py-3 font-bold text-white transition-colors hover:bg-brand-blue-dark'
          }
        >
          Continue
        </button>
      )}
    </section>
  )
}

'use client'

import { PROJECT_BRIEF, LESSON_CHOICES } from '@/lib/game/scenarios'
import type { Choice, DelayedConsequence, Scenario } from '@/lib/game/types'

// ---------------------------------------------------------------------------
// The beats of a single hour: the situation, the outcome, the name for it.
//
// ── NOTHING HERE DECIDES ANYTHING ──────────────────────────────────────────
//
// These are presentational. They render what the engine hands them and call
// back with an id. Every rule about what happens next — which beat follows
// which, what a choice costs, whether the turn is offered — lives in the
// reducer, where a test can reach it without a browser.
//
// ── THE BRIEF IS NOT A TUTORIAL ────────────────────────────────────────────
//
// Three of the lines in the opening brief are weak signals and none of them
// are marked. Highlighting them would remove the only genuinely difficult
// decision of the 8:00 hour, which is what to look at when everything is
// technically green.
// ---------------------------------------------------------------------------

export function ProjectBriefScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">Your project</p>
      <h1 className="mt-2 text-2xl font-bold leading-tight text-navy sm:text-3xl">
        {PROJECT_BRIEF.name}
      </h1>

      <p className="mt-4 leading-relaxed text-gray-700">{PROJECT_BRIEF.purpose}</p>

      <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        {[
          ['Why it matters', PROJECT_BRIEF.value],
          ['Sponsor', PROJECT_BRIEF.sponsor],
          ['Customer representative', PROJECT_BRIEF.customerRep],
          ['Next milestone', PROJECT_BRIEF.milestone],
          ['Team', PROJECT_BRIEF.team],
          ['Budget', PROJECT_BRIEF.budget],
          ['Backlog', PROJECT_BRIEF.backlog],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">{label}</dt>
            <dd className="mt-0.5 leading-relaxed text-navy">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 rounded-lg bg-paper px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
          Notes from the last three weeks
        </p>
        <ul className="mt-2 space-y-1.5 leading-relaxed text-gray-700">
          {PROJECT_BRIEF.signals.map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
      </div>

      <p className="mt-6 leading-relaxed text-gray-700">
        You inherited this project three weeks ago. It is 8:00 AM. You have until 5:00 PM and
        ten Focus Points, and you will not get to everything &mdash; nobody does.
      </p>

      <button
        type="button"
        onClick={onBegin}
        className="mt-6 rounded-lg bg-navy px-6 py-3 font-bold text-white transition-colors hover:bg-brand-blue-dark"
      >
        Start the day
      </button>
    </section>
  )
}

export function ScenarioScreen({
  scenario,
  consequences,
  focus,
  onChoose,
}: {
  scenario: Scenario
  consequences: readonly DelayedConsequence[]
  focus: number
  onChoose: (choiceId: string) => void
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
      {/* Delayed consequences land here, framed as already-happened. They are
          shown ABOVE the situation because that is where they belong in time:
          the participant walks into the hour and this is already true. */}
      {consequences.map((consequence) => (
        <div
          key={consequence.text}
          className={`mb-5 rounded-lg border-l-4 px-5 py-4 ${
            consequence.favourable
              ? 'border-leaf bg-leaf-soft'
              : 'border-amber-500 bg-amber-50'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-600">
            {consequence.favourable ? 'Something you set up earlier' : 'Something has caught up'}
          </p>
          <p className="mt-1 leading-relaxed text-navy">{consequence.text}</p>
        </div>
      ))}

      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">{scenario.time}</p>
      <h1 className="mt-2 text-2xl font-bold leading-tight text-navy sm:text-3xl">
        {scenario.title}
      </h1>

      <div className="mt-4 space-y-3">
        {scenario.situation.map((paragraph) => (
          <p key={paragraph} className="leading-relaxed text-gray-700">
            {paragraph}
          </p>
        ))}
      </div>

      <h2 className="mt-6 text-lg font-bold text-navy">{scenario.question}</h2>

      <ul className="mt-4 flex flex-col gap-3">
        {scenario.choices.map((choice) => (
          <li key={choice.id}>
            <button
              type="button"
              onClick={() => onChoose(choice.id)}
              className="flex w-full items-start justify-between gap-4 rounded-lg border border-gray-200 px-5 py-4 text-left transition-colors hover:border-brand-blue hover:bg-paper"
            >
              <span className="font-medium leading-snug text-navy">{choice.label}</span>
              <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-gray-500">
                {focusLabel(choice, focus)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * The price tag on a choice.
 *
 * Costs are shown before the decision, not after. Hiding them would make the
 * scarcity a trick; showing them makes it a constraint, and a constraint is
 * the thing the participant is meant to be reasoning about.
 *
 * When the cost exceeds what is left, it says so plainly rather than disabling
 * the button. The day does not stop when attention runs out — it comes out of
 * the team, and being told that in advance is fair warning rather than a wall.
 */
function focusLabel(choice: Choice, focus: number): string {
  if (choice.focusCost === 0) return 'No focus'
  const plural = choice.focusCost === 1 ? '' : 's'
  const base = `${choice.focusCost} focus point${plural}`
  return choice.focusCost > focus ? `${base} — more than you have left` : base
}

export function OutcomeScreen({
  scenario,
  choice,
  onContinue,
}: {
  scenario: Scenario
  choice: Choice
  onContinue: () => void
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
        {scenario.time} &middot; what happened
      </p>
      <h1 className="mt-2 text-xl font-bold leading-snug text-navy">{choice.label}</h1>
      <p className="mt-4 leading-relaxed text-gray-700">{choice.outcome}</p>

      {/* Deliberately not "Correct" or "Incorrect". Several of these hours have
          more than one defensible answer with different costs, and a verdict
          would teach test-taking rather than judgement. */}
      <button
        type="button"
        onClick={onContinue}
        className="mt-6 rounded-lg bg-navy px-6 py-3 font-bold text-white transition-colors hover:bg-brand-blue-dark"
      >
        Continue
      </button>
    </section>
  )
}

export function GlossaryScreen({
  scenario,
  answered,
  correct,
  onAnswer,
  onContinue,
}: {
  scenario: Scenario
  answered: boolean
  correct: boolean
  onAnswer: (option: string) => void
  onContinue: () => void
}) {
  const glossary = scenario.glossary
  if (!glossary) return null

  return (
    <section className="rounded-xl border border-brand-blue bg-paper p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">
        Bonus &middot; name what just happened
      </p>
      <h1 className="mt-2 text-lg font-bold leading-snug text-navy">{glossary.prompt}</h1>

      {/* The rule that matters most on this screen: a wrong answer costs
          nothing. Not health, not focus, not Practical Wisdom. Terminology is a
          layer on top of the project score and must never become a second way
          to lose. */}
      <p className="mt-2 text-sm text-gray-600">
        Nothing here can hurt your project. A wrong answer costs nothing and you learn the term
        either way.
      </p>

      {!answered ? (
        <ul className="mt-4 flex flex-col gap-3">
          {glossary.options.map((option) => (
            <li key={option}>
              <button
                type="button"
                onClick={() => onAnswer(option)}
                className="w-full rounded-lg border border-gray-200 bg-white px-5 py-3 text-left font-medium text-navy transition-colors hover:border-brand-blue"
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <p className={`font-bold ${correct ? 'text-green-700' : 'text-brand-blue'}`}>
            {correct ? 'Yes — +3 Glossary Points, +10 Practical Wisdom.' : 'Not quite — and it costs you nothing.'}
          </p>
          <p className="mt-2 leading-relaxed text-gray-700">{glossary.reveal}</p>
          <p className="mt-3 text-sm text-gray-600">
            Added to <strong>Terms I Discovered</strong>.
          </p>
          <button
            type="button"
            onClick={onContinue}
            className="mt-5 rounded-lg bg-navy px-6 py-3 font-bold text-white transition-colors hover:bg-brand-blue-dark"
          >
            Continue
          </button>
        </div>
      )}
    </section>
  )
}

export function LessonScreen({ onRecord }: { onRecord: (lessonId: string) => void }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">5:00 PM</p>
      <h1 className="mt-2 text-2xl font-bold leading-tight text-navy">
        One thing you would do differently
      </h1>
      <p className="mt-3 leading-relaxed text-gray-700">
        Not a report. Just the one sentence a project manager says to themselves on the way home.
      </p>

      {/* Closed options only. Version 1 collects no free text anywhere — see
          the participant-data note in GameClient. Nothing on this screen is
          stored, sent or read by anything outside this browser tab. */}
      <ul className="mt-5 flex flex-col gap-3">
        {LESSON_CHOICES.map((lesson) => (
          <li key={lesson.id}>
            <button
              type="button"
              onClick={() => onRecord(lesson.id)}
              className="w-full rounded-lg border border-gray-200 px-5 py-4 text-left font-medium leading-snug text-navy transition-colors hover:border-brand-blue hover:bg-paper"
            >
              {lesson.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

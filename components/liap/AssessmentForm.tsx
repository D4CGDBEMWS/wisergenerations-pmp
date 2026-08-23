'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AssessmentPrivacyNotice } from '@/components/liap/AssessmentPrivacyNotice'
import {
  AREAS,
  CHANGE_TYPES,
  DIMENSIONS,
  FINAL_STEP,
  NARRATIVE_QUESTIONS,
  QUESTIONS,
  SCALE,
  STEPS,
  questionsForDimension,
  questionsForStep,
  type DimensionKey,
} from '@/lib/liap/assessment/v1'
import { trackLiap } from '@/lib/liap/analytics'

// ---------------------------------------------------------------------------
// The assessment form. §13, §33, §35.
//
// Seven steps rather than one page of forty questions — the single-page
// version is where people abandon, and the section headings let someone see
// the shape of what they are being asked before they start.
//
// Three things here are accessibility requirements, not preferences:
//
//   Each dimension is a <fieldset> with a <legend>, and each question is a
//   radiogroup with its own label. A screen reader announces "Money, question
//   2 of 5" rather than forty unlabelled radio rows.
//
//   Step changes move focus to the step heading and announce progress through
//   a live region. Without that, a keyboard user presses Next and nothing
//   audible happens.
//
//   Errors are announced, not merely coloured, and the first unanswered
//   question receives focus. §22's rule — never communicate status through
//   colour alone — applies to validation as much as to results.
//
// Saving happens on every step transition rather than on every keystroke: the
// answers are short, the connection may be a phone on a train, and a request
// per radio click is how a form starts feeling broken.
// ---------------------------------------------------------------------------

type Answers = Record<string, number>
type Narratives = Record<string, string>

interface IntakeState {
  changeType: string
  area: string
  urgency: number | null
}

const TOTAL_STEPS = FINAL_STEP

export function AssessmentForm() {
  const router = useRouter()

  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<Answers>({})
  const [narratives, setNarratives] = useState<Narratives>({})
  const [intake, setIntake] = useState<IntakeState>({ changeType: '', area: '', urgency: null })

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [missing, setMissing] = useState<string[]>([])

  const headingRef = useRef<HTMLHeadingElement>(null)
  const movedRef = useRef(false)

  // --- start or resume -----------------------------------------------------
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/liap/assessment', { method: 'POST' })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        if (cancelled) return

        setAssessmentId(data.assessmentId)
        setAnswers(data.answers ?? {})
        setStep(Math.min(Math.max(data.currentStep ?? 1, 1), TOTAL_STEPS))
        const i = data.intake ?? {}
        setIntake({
          changeType: i.changeType ?? '',
          area: i.area ?? '',
          urgency: i.urgency ?? null,
        })
        setNarratives({
          what_changed: i.whatChanged ?? '',
          important_decision: i.importantDecision ?? '',
          ninety_day_better: i.ninetyDayBetter ?? '',
        })
      } catch {
        if (!cancelled) {
          setError('We could not open your assessment. Please refresh, or try again in a moment.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Move focus to the new step's heading so a keyboard or screen-reader user
  // lands where the content changed rather than back at the top of the page.
  useEffect(() => {
    if (movedRef.current) headingRef.current?.focus()
    movedRef.current = true
  }, [step])

  const save = useCallback(
    async (nextStep: number) => {
      if (!assessmentId) return true
      try {
        const res = await fetch('/api/liap/assessment', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId,
            step: nextStep,
            answers,
            narratives,
            intake: {
              changeType: intake.changeType || null,
              area: intake.area || null,
              urgency: intake.urgency,
            },
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'We could not save that step. Please try again.')
          return false
        }
        return true
      } catch {
        // §35: a dropped connection must not read as a crash, and the answers
        // are still on screen, so the honest message says exactly that.
        setError('You appear to be offline. Your answers are still here — reconnect and try again.')
        return false
      }
    },
    [assessmentId, answers, narratives, intake]
  )

  /** Which required fields on this step are still empty. */
  function unanswered(current: number): string[] {
    if (current === 1) {
      const gaps: string[] = []
      if (!intake.changeType) gaps.push('change_type')
      if (!intake.area) gaps.push('area')
      if (intake.urgency === null) gaps.push('urgency')
      return gaps
    }
    return questionsForStep(current)
      .filter((q) => answers[q.key] === undefined)
      .map((q) => q.key)
  }

  async function goNext() {
    setError(null)
    const gaps = unanswered(step)
    setMissing(gaps)

    if (gaps.length > 0) {
      // Focus the first gap so the person is taken to the problem rather than
      // left to hunt for a red outline.
      document.getElementById(`q-${gaps[0]}`)?.focus()
      return
    }

    setBusy(true)
    const next = Math.min(step + 1, TOTAL_STEPS)
    const ok = await save(next)
    setBusy(false)
    if (!ok) return

    trackLiap('liap_assessment_step_completed', { step })
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function goBack() {
    setError(null)
    setMissing([])
    const prev = Math.max(step - 1, 1)
    setBusy(true)
    await save(prev)
    setBusy(false)
    setStep(prev)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit() {
    setError(null)
    const everything = QUESTIONS.filter((q) => answers[q.key] === undefined).map((q) => q.key)
    if (everything.length > 0) {
      setError(
        `${everything.length} question${everything.length === 1 ? '' : 's'} still need an answer. Use Back to find ${everything.length === 1 ? 'it' : 'them'}.`
      )
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/liap/assessment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId,
          answers,
          narratives,
          intake: {
            changeType: intake.changeType || null,
            area: intake.area || null,
            urgency: intake.urgency,
          },
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? 'We could not score your assessment. Your answers are saved.')
        setBusy(false)
        return
      }

      if (data.alreadyCompleted) {
        // §35, duplicate submission. The first result stands and its link is
        // already in their inbox; a second token would break that link.
        setError(
          'This assessment has already been scored. Check your email for the link to your plan.'
        )
        setBusy(false)
        return
      }

      trackLiap('liap_assessment_completed')
      router.push(`/living-is-a-project/results/${data.resultToken}`)
    } catch {
      setError('You appear to be offline. Your answers are saved — reconnect and submit again.')
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 sm:px-8" aria-busy="true">
        <p className="text-gray-600">Opening your assessment…</p>
      </div>
    )
  }

  const current = STEPS.find((s) => s.index === step)!
  const answeredCount = QUESTIONS.filter((q) => answers[q.key] !== undefined).length

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-12">
      {/* Progress. Announced politely so it is heard without interrupting. */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Step {step} of {TOTAL_STEPS}
          </p>
          <p className="text-xs text-gray-500">{answeredCount} of {QUESTIONS.length} answered</p>
        </div>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step}
          aria-valuetext={`Step ${step} of ${TOTAL_STEPS}: ${current.title}`}
        >
          <div
            className="h-full rounded-full bg-navy transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <p aria-live="polite" className="sr-only">
          Step {step} of {TOTAL_STEPS}: {current.title}
        </p>
      </div>

      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-bold text-navy outline-none sm:text-3xl"
      >
        {current.title}
      </h1>

      {/* Errors: announced, and never signalled by colour alone. */}
      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border-l-4 border-red-600 bg-red-50 p-4 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}
      {missing.length > 0 && (
        <div
          role="alert"
          className="mt-6 rounded-lg border-l-4 border-amber-600 bg-amber-50 p-4 text-sm font-medium text-amber-900"
        >
          {missing.length} answer{missing.length === 1 ? '' : 's'} still needed on this step. We have
          taken you to the first one.
        </div>
      )}

      <div className="mt-8">
        {/* Above the step that collects the narratives, not after it. */}
        {step === 1 && <AssessmentPrivacyNotice />}

        {step === 1 && (
          <IntakeStep
            intake={intake}
            setIntake={setIntake}
            narratives={narratives}
            setNarratives={setNarratives}
            missing={missing}
          />
        )}

        {current.dimensions.map((key) => (
          <DimensionFieldset
            key={key}
            dimension={key}
            answers={answers}
            missing={missing}
            onAnswer={(qKey, value) => setAnswers((a) => ({ ...a, [qKey]: value }))}
          />
        ))}

        {step === FINAL_STEP && <ReviewStep answers={answers} onJump={setStep} />}
      </div>

      {/* Navigation. 48px targets, comfortably over the 44px floor. */}
      <div className="mt-10 flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1 || busy}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-gray-300 px-6 font-semibold text-navy transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>

        {step < FINAL_STEP ? (
          <button
            type="button"
            onClick={goNext}
            disabled={busy}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-navy px-8 font-bold text-white transition-colors hover:bg-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Next'}
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gold px-8 font-bold text-navy transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:opacity-60"
          >
            {busy ? 'Scoring…' : 'See my results'}
          </button>
        )}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-gray-500">
        Your answers save as you go, so you can stop and come back. What you write in your own words
        is stored separately from everything else and deleted after 90 days.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------

function IntakeStep({
  intake,
  setIntake,
  narratives,
  setNarratives,
  missing,
}: {
  intake: IntakeState
  setIntake: (fn: (prev: IntakeState) => IntakeState) => void
  narratives: Narratives
  setNarratives: (fn: (prev: Narratives) => Narratives) => void
  missing: string[]
  }) {
  return (
    <div className="space-y-10">
      <fieldset>
        <legend className="text-base font-bold text-navy">
          What kind of change are you navigating?
        </legend>
        <div className="mt-4 space-y-2" role="radiogroup" aria-required="true">
          {CHANGE_TYPES.map((option, index) => (
            <label
              key={option.key}
              className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 transition-colors hover:border-navy has-[:checked]:border-navy has-[:checked]:bg-navy/5"
            >
              <input
                type="radio"
                id={index === 0 ? 'q-change_type' : undefined}
                name="change_type"
                value={option.key}
                checked={intake.changeType === option.key}
                onChange={() => setIntake((p) => ({ ...p, changeType: option.key }))}
                className="h-5 w-5 flex-none accent-navy"
              />
              <span className="text-gray-800">{option.label}</span>
            </label>
          ))}
        </div>
        {missing.includes('change_type') && (
          <p className="mt-2 text-sm font-medium text-red-700">Please choose one.</p>
        )}
      </fieldset>

      <div>
        <label htmlFor="q-area" className="block text-base font-bold text-navy">
          What area is most affected?
        </label>
        <select
          id="q-area"
          value={intake.area}
          onChange={(e) => setIntake((p) => ({ ...p, area: e.target.value }))}
          aria-required="true"
          aria-invalid={missing.includes('area')}
          className="mt-3 min-h-[48px] w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          <option value="">Choose one…</option>
          {AREAS.map((a) => (
            <option key={a.key} value={a.key}>
              {a.label}
            </option>
          ))}
        </select>
        {missing.includes('area') && (
          <p className="mt-2 text-sm font-medium text-red-700">Please choose one.</p>
        )}
      </div>

      <fieldset>
        <legend className="text-base font-bold text-navy">How urgent does this feel?</legend>
        <p className="mt-1 text-sm text-gray-600">1 is not urgent. 5 is urgent right now.</p>
        <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-required="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="flex min-h-[48px] min-w-[48px] flex-1 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-3 font-semibold text-gray-800 transition-colors hover:border-navy has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-white"
            >
              <input
                type="radio"
                id={n === 1 ? 'q-urgency' : undefined}
                name="urgency"
                value={n}
                checked={intake.urgency === n}
                onChange={() => setIntake((p) => ({ ...p, urgency: n }))}
                className="sr-only"
              />
              <span>{n}</span>
            </label>
          ))}
        </div>
        {missing.includes('urgency') && (
          <p className="mt-2 text-sm font-medium text-red-700">Please choose a number.</p>
        )}
      </fieldset>

      {NARRATIVE_QUESTIONS.map((q) => (
        <div key={q.key}>
          <label htmlFor={`q-${q.key}`} className="block text-base font-bold text-navy">
            {q.label}
          </label>
          <textarea
            id={`q-${q.key}`}
            rows={3}
            maxLength={2000}
            value={narratives[q.key] ?? ''}
            onChange={(e) => setNarratives((p) => ({ ...p, [q.key]: e.target.value }))}
            placeholder={q.placeholder}
            className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 leading-relaxed text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          />
          <p className="mt-1 text-xs text-gray-500">Optional. Deleted after 90 days.</p>
        </div>
      ))}
    </div>
  )
}

function DimensionFieldset({
  dimension,
  answers,
  missing,
  onAnswer,
}: {
  dimension: DimensionKey
  answers: Answers
  missing: string[]
  onAnswer: (key: string, value: number) => void
}) {
  const meta = DIMENSIONS.find((d) => d.key === dimension)!
  const questions = questionsForDimension(dimension)

  return (
    <section className="mb-12">
      <h2 className="text-lg font-bold text-navy">{meta.name}</h2>
      <p className="mt-1 text-sm text-gray-600">{meta.intro}</p>

      <div className="mt-5 space-y-5">
        {questions.map((q, index) => {
          const isMissing = missing.includes(q.key)
          return (
            <fieldset
              key={q.key}
              className={`rounded-xl border bg-white p-4 sm:p-5 ${
                isMissing ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'
              }`}
            >
              <legend className="sr-only">
                {meta.name}, question {index + 1} of {questions.length}
              </legend>
              <p id={`label-${q.key}`} className="font-medium leading-snug text-gray-900">
                {q.text}
              </p>

              <div
                role="radiogroup"
                aria-labelledby={`label-${q.key}`}
                aria-required="true"
                aria-invalid={isMissing}
                className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5"
              >
                {SCALE.map((option) => {
                  const selected = answers[q.key] === option.value
                  return (
                    <label
                      key={option.value}
                      className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors sm:flex-col sm:justify-center sm:gap-1 sm:text-center ${
                        selected
                          ? 'border-navy bg-navy text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-navy'
                      }`}
                    >
                      <input
                        type="radio"
                        id={option.value === 1 ? `q-${q.key}` : undefined}
                        name={q.key}
                        value={option.value}
                        checked={selected}
                        onChange={() => onAnswer(q.key, option.value)}
                        className="sr-only"
                      />
                      {/* The number is shown as well as the wording, so the
                          selection is never conveyed by colour alone. */}
                      <span className="font-bold sm:text-base">{option.value}</span>
                      <span className={selected ? 'text-white/90' : 'text-gray-600'}>
                        {option.label}
                      </span>
                    </label>
                  )
                })}
              </div>

              {isMissing && (
                <p className="mt-3 text-sm font-medium text-red-700">
                  Please choose an answer for this one.
                </p>
              )}
            </fieldset>
          )
        })}
      </div>
    </section>
  )
}

function ReviewStep({ answers, onJump }: { answers: Answers; onJump: (step: number) => void }) {
  return (
    <div className="space-y-6">
      <p className="leading-relaxed text-gray-700">
        Here is what you answered. Change anything that does not look right, then see your results.
      </p>

      <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {DIMENSIONS.map((d) => {
          const questions = questionsForDimension(d.key)
          const done = questions.filter((q) => answers[q.key] !== undefined).length
          const step = STEPS.find((s) => s.dimensions.includes(d.key))?.index ?? 2
          const complete = done === questions.length
          return (
            <li key={d.key} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-navy">{d.name}</p>
                {/* Status in words, not a green tick alone. §22. */}
                <p className={`text-sm ${complete ? 'text-gray-500' : 'font-medium text-amber-800'}`}>
                  {complete ? `All ${questions.length} answered` : `${done} of ${questions.length} answered`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onJump(step)}
                className="min-h-[44px] flex-none rounded-lg px-3 text-sm font-semibold text-brand-blue underline underline-offset-2 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Review<span className="sr-only"> {d.name}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

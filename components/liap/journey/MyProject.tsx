'use client'

import { useEffect, useState } from 'react'
import {
  MY_PROJECT_EXIT_WARNING,
  MY_PROJECT_EXTRAS,
  MY_PROJECT_STEPS,
  buildMyProjectRoadmap,
  draftHasContent,
  emptyDraft,
  type MyProjectDraft,
} from '@/lib/journey/my-project'

// ---------------------------------------------------------------------------
// MY PROJECT — the same six points, on the project they actually brought.
//
// ── IT NEVER TOUCHES A SERVER, AND THE PROOF IS THE ABSENCE ────────────────
//
// There is no fetch in this file. No server action. No route handler behind
// it. No analytics call. No localStorage, no sessionStorage, no cookie, no
// query string, no BroadcastChannel post — this component deliberately does
// not import lib/journey/channel.ts, so a participant's roadmap cannot reach
// the projected screen even by accident.
//
// The whole storage layer is one useState. Close the tab and it is gone.
//
// That is not a limitation waiting to be relaxed. What a participant types
// here is a real problem in a real life — a business, a parent they are caring
// for, a marriage, a diagnosis. Persisting it would create a new sensitive-data
// pathway needing its own retention window, its own privacy language and its
// own purge, which is the exact machinery the assessment work spent weeks
// getting right. The cheapest way to keep a secret is not to be told it.
//
// The facilitator console's sessionStorage exception does not reach here:
// lib/journey/session-storage.ts is not imported, and its only write function
// takes a JourneyState, which nothing in this file can produce.
//
// ── AI PROMPTS, AND DOES NOT WRITE ─────────────────────────────────────────
//
// Every prompt is a question and there is no generation step anywhere: no
// model call, no suggestion list, no autocomplete, no "improve this". The only
// transformation applied to a participant's words is whitespace tidying, and a
// test asserts the output matches the input.
// ---------------------------------------------------------------------------

export function MyProject() {
  const [draft, setDraft] = useState<MyProjectDraft>(emptyDraft)
  const [showNudges, setShowNudges] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)

  const hasContent = draftHasContent(draft)
  const roadmap = buildMyProjectRoadmap(draft)

  // The browser's own "leave site?" dialog. It is the only warning available
  // on a tab close, and the owner-approved sentence cannot be passed into it —
  // browsers ignore custom text — so the approved copy stays on the page where
  // the participant can actually read it.
  useEffect(() => {
    if (!hasContent) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasContent])

  const setPoint = (id: (typeof MY_PROJECT_STEPS)[number]['pointId'], value: string) =>
    setDraft((current) => ({ ...current, points: { ...current.points, [id]: value } }))

  const setExtra = (id: (typeof MY_PROJECT_EXTRAS)[number]['id'], value: string) =>
    setDraft((current) => ({ ...current, extras: { ...current.extras, [id]: value } }))

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="print:hidden">
        <h1 className="text-3xl font-semibold text-slate-900">My Project</h1>
        <p className="mt-3 text-slate-600">
          The same six points you just walked — on the project you brought.
        </p>
        <p className="mt-6 rounded-md border border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
          {MY_PROJECT_EXIT_WARNING}
        </p>
      </header>

      <label className="mt-10 block">
        <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          What is this project?
        </span>
        <input
          type="text"
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-lg"
          // Nothing here is submitted anywhere, but an autofilled personal
          // detail is still a personal detail sitting on screen in a room.
          autoComplete="off"
        />
      </label>

      <ol className="mt-10 space-y-8">
        {MY_PROJECT_STEPS.map((step) => (
          <li key={step.pointId}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{step.label}</h2>
            <p className="mt-2 text-slate-800">{step.prompt}</p>
            {showNudges ? <p className="mt-1 text-sm italic text-slate-500">{step.nudge}</p> : null}
            <textarea
              value={draft.points[step.pointId] ?? ''}
              onChange={(event) => setPoint(step.pointId, event.target.value)}
              rows={3}
              className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2"
              autoComplete="off"
            />
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={() => setShowNudges((value) => !value)}
        className="mt-6 text-sm text-slate-600 underline print:hidden"
      >
        {showNudges ? 'Hide the second questions' : 'Stuck? Show a second question for each point'}
      </button>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-slate-900">Optional</h2>
        <p className="mt-1 text-sm text-slate-600">
          Fill in what is useful. Your roadmap is complete with the six points above.
        </p>
        <div className="mt-6 space-y-6">
          {MY_PROJECT_EXTRAS.map((extra) => (
            <label key={extra.id} className="block">
              <span className="text-sm font-semibold text-slate-700">{extra.label}</span>
              <span className="mt-1 block text-sm text-slate-600">{extra.prompt}</span>
              <textarea
                value={draft.extras[extra.id] ?? ''}
                onChange={(event) => setExtra(extra.id, event.target.value)}
                rows={2}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                autoComplete="off"
              />
            </label>
          ))}
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-slate-900 px-5 py-2.5 font-medium text-white"
        >
          Print or save as PDF
        </button>
        <button
          type="button"
          onClick={() => setConfirmingReset(true)}
          className="rounded-md border border-slate-300 px-5 py-2.5 font-medium text-slate-700"
        >
          Clear
        </button>
        {roadmap.complete ? (
          <p className="self-center text-sm text-slate-500">All six points answered.</p>
        ) : null}
      </div>

      {confirmingReset ? (
        <div className="mt-6 rounded-md border border-amber-400 bg-amber-50 p-4 print:hidden">
          {/* Owner-approved copy, verbatim, and not expanded with reassurance. */}
          <p className="text-slate-800">{MY_PROJECT_EXIT_WARNING}</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setDraft(emptyDraft())
                setConfirmingReset(false)
              }}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Clear it
            </button>
            <button
              type="button"
              onClick={() => setConfirmingReset(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Keep working
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { DEBRIEF_DO_NOT, DEBRIEF_FINAL_REMINDER, DEBRIEF_SEQUENCE } from '@/lib/journey/debrief'
import { buildJourneyRecord } from '@/lib/journey/record'
import type { JourneyState } from '@/lib/journey/types'

// ---------------------------------------------------------------------------
// The debrief panel. FACILITATOR LAPTOP ONLY.
//
// This is the only component that imports lib/journey/debrief.ts, and it is
// imported only by the facilitator console. That import chain is the whole
// guarantee: the God at the Center Reveal and the autobiographical
// reveal are not in the bundle the projected window loads, so they cannot leak
// through a tooltip, an alt attribute, view-source, a stray render or a future
// component that forgot. A test walks the display route's import graph and
// asserts this file is absent from it.
//
// Nothing here is ever broadcast. The panel does not touch the channel.
// ---------------------------------------------------------------------------

export function DebriefPanel({ state }: { state: JourneyState }) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const record = buildJourneyRecord(state)

  const reveal = (id: string) => setRevealed((current) => new Set(current).add(id))

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-900 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
        Debrief — facilitator only
      </h2>
      <p className="mt-2 text-xs text-slate-500">
        Nothing on this panel is projected. Read it; do not share the screen.
      </p>

      <ol className="mt-5 space-y-4">
        {DEBRIEF_SEQUENCE.map((cue) => {
          const isOpen = revealed.has(cue.id)
          return (
            <li key={cue.id} className="rounded border border-slate-800 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-medium text-slate-200">
                  <span className="mr-2 font-mono text-xs text-slate-500">{cue.time}</span>
                  {cue.heading}
                </h3>
                {!isOpen ? (
                  <button
                    type="button"
                    onClick={() => reveal(cue.id)}
                    className="shrink-0 rounded border border-slate-600 px-2 py-1 text-xs text-slate-300"
                  >
                    Show
                  </button>
                ) : null}
              </div>
              {/* Held behind a click rather than rendered open, so a console
                  glanced at over a shoulder does not give the room the reveal
                  before the facilitator has decided to give it. */}
              {isOpen ? (
                <div className="mt-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{cue.purpose}</p>
                  <ul className="mt-2 space-y-1.5">
                    {cue.asks.map((ask) => (
                      <li key={ask} className="text-slate-100">
                        {ask}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-slate-400">
                    <span className="text-slate-500">FACILITATOR NOTE </span>
                    {cue.note}
                  </p>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>

      {/* Artifact 6, "Do Not Do During the Debrief" — always open, because a
          rule you have to click to see is a rule you forget in a live room. */}
      <div className="mt-6 rounded border border-amber-800/60 bg-amber-500/5 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-200/80">
          Do not do during the debrief
        </h3>
        <ul className="mt-2 space-y-1 text-xs text-slate-400">
          {DEBRIEF_DO_NOT.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 text-xs italic text-slate-500">
        {DEBRIEF_FINAL_REMINDER.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <div className="mt-6 border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Journey Record</h3>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-200"
          >
            Print / save as PDF
          </button>
        </div>
        {/* A record of what happened. No score, no grade, no ranking — there is
            no field on JourneyRecord that could carry one. */}
        <div className="mt-4 space-y-4 text-sm">
          {record.sections
            .filter((section) => section.entries.length > 0)
            .map((section, index) => (
              <div key={`${section.pointId}-${index}`}>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {section.label}
                </h4>
                <ul className="mt-2 space-y-2">
                  {section.entries.map((entry, entryIndex) => (
                    <li key={entryIndex} className="text-slate-300">
                      <span className="text-slate-500">{entry.heading}: </span>
                      <span className="whitespace-pre-line">{entry.body}</span>
                      {entry.becauseOf ? (
                        <span className="block text-slate-500">Because you decided: “{entry.becauseOf}”</span>
                      ) : null}
                      {entry.changed ? <span className="block text-slate-400">{entry.changed}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          {record.finalNextMove ? (
            <p className="text-slate-300">
              <span className="text-slate-500">Final next move: </span>
              {record.finalNextMove}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { openChannel } from '@/lib/journey/channel'
import type { ProjectedJourney } from '@/lib/journey/types'

// ---------------------------------------------------------------------------
// The Participant Display. What goes on the wall.
//
// ── LOOK AT THE IMPORTS ────────────────────────────────────────────────────
//
// Two, and one of them is erased at compile time. This component has no access
// to the event library, the progress-prompt library, the timing constants, the
// dependency register, the facilitator's stored session, or the debrief — not
// because it declines to render them, but because they are not in the bundle
// this window loads. Open devtools on the projected screen and there is
// nothing to find.
//
// Everything it shows arrived as a ProjectedJourney over BroadcastChannel,
// already narrowed by lib/journey/projection.ts. It renders strings it was
// handed. It cannot compute an overrun, resolve a prompt id, look up a
// facilitator note or reveal an event the facilitator has not sent.
//
// ── THE CLOCK ON THIS SCREEN IS THE 90-MINUTE WINDOW ───────────────────────
//
// It is not a countdown to the facilitator's real deadline and it never goes
// negative. There is no field on ProjectedJourney from which the contingency
// buffer could be derived, so the room cannot infer it from anything here.
//
// ── IT HAS NO CONTROLS ─────────────────────────────────────────────────────
//
// No buttons, no inputs, no reducer, no actions. A projected screen that could
// be driven would be a second facilitator, and in a room where the laptop is
// on a lectern and the projector is behind you, that is a real hazard.
// ---------------------------------------------------------------------------

export function JourneyMap() {
  const [journey, setJourney] = useState<ProjectedJourney | null>(null)

  useEffect(() => {
    const channel = openChannel((message) => {
      if (message.kind === 'state') setJourney(message.state)
    })
    // Announce ourselves: a display opened after the session started would
    // otherwise show an empty map until the next thing the facilitator did.
    channel.post({ kind: 'hello' })
    return () => channel.close()
  }, [])

  if (!journey) return <WaitingForFacilitator />

  const activeEvent = journey.activeEventId
    ? journey.events.find((event) => event.id === journey.activeEventId) ?? null
    : null

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl flex-col">
        <header className="flex items-baseline justify-between border-b border-slate-800 pb-6">
          <h1 className="text-2xl font-semibold tracking-wide text-slate-300">THE JOURNEY</h1>
          <TaskWindow minutesRemaining={journey.minutesRemaining} windowMinutes={journey.windowMinutes} />
        </header>

        <Roadmap journey={journey} />

        <div className="mt-10 flex-1">
          {activeEvent ? <EventCard event={activeEvent} /> : <RecentDecision journey={journey} />}
          {journey.activePrompt ? (
            <p className="mt-8 text-center text-3xl font-medium text-amber-200">{journey.activePrompt}</p>
          ) : null}
        </div>

        {journey.destinationRevised ? (
          <p className="mt-6 border-t border-slate-800 pt-4 text-center text-lg text-slate-400">
            Your Destination has been revised. That is a decision, not a setback.
          </p>
        ) : null}
      </div>
    </main>
  )
}

function WaitingForFacilitator() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-8 text-slate-400">
      <p className="text-2xl">Waiting for the facilitator…</p>
    </main>
  )
}

/**
 * The 90 minutes the room was told about. Nothing else.
 *
 * `minutesRemaining` arrives already floored at zero, so this cannot render a
 * negative number even when the session is overrunning — that is the
 * facilitator's information to act on, not the room's to worry about.
 */
function TaskWindow({
  minutesRemaining,
  windowMinutes,
}: {
  minutesRemaining: number | null
  windowMinutes: number
}) {
  return (
    <div className="text-right">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{windowMinutes}-minute task window</p>
      <p className="text-4xl font-semibold tabular-nums text-slate-100">
        {minutesRemaining === null ? '—' : `${minutesRemaining} min`}
      </p>
    </div>
  )
}

/**
 * The six permanent points, always all six, always in order.
 *
 * The whole roadmap stays on screen even before the team reaches it: the
 * sequence is the thing they are meant to learn well enough to reproduce on
 * their own project afterwards, and you do not learn a shape you only ever see
 * one piece of at a time.
 */
function Roadmap({ journey }: { journey: ProjectedJourney }) {
  return (
    <ol className="mt-10 grid grid-cols-6 gap-2">
      {journey.points.map((point, index) => {
        const reached = index <= journey.pointIndex
        const here = index === journey.pointIndex
        return (
          <li key={point.id} className="flex flex-col items-center text-center">
            <span
              aria-hidden
              className={[
                'mb-3 h-4 w-4 rounded-full',
                here ? 'bg-amber-300 ring-4 ring-amber-300/30' : reached ? 'bg-slate-300' : 'bg-slate-700',
              ].join(' ')}
            />
            <span
              className={[
                'text-xs font-semibold uppercase leading-tight tracking-wide',
                here ? 'text-amber-200' : reached ? 'text-slate-200' : 'text-slate-600',
              ].join(' ')}
            >
              {point.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/**
 * A Road Event, as the room sees it.
 *
 * `becauseOf` is the team's OWN earlier words, not the facilitator's note
 * about them — so a consequence reads as something they chose rather than
 * something done to them.
 */
function EventCard({ event }: { event: ProjectedJourney['events'][number] }) {
  return (
    <section
      className={[
        'rounded-lg border-2 p-8',
        event.favourable ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-amber-500/60 bg-amber-500/5',
      ].join(' ')}
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">{event.name}</h2>
      <p className="mt-4 text-3xl leading-snug text-slate-50">{event.revealText}</p>
      {event.becauseOf ? (
        <p className="mt-6 border-l-2 border-slate-700 pl-4 text-lg text-slate-400">
          Because you decided: “{event.becauseOf}”
        </p>
      ) : null}
      {event.impactLabel ? (
        <p className="mt-6 text-lg font-medium text-slate-300">{event.impactLabel}</p>
      ) : (
        <p className="mt-8 text-lg text-slate-400">
          Does this change your First Move, your Decision Check, a Next Milestone, your Destination — or nothing?
        </p>
      )}
    </section>
  )
}

/** Between events, the wall holds the team's most recent decision in their own words. */
function RecentDecision({ journey }: { journey: ProjectedJourney }) {
  const latest = journey.decisions.at(-1)
  if (!latest) {
    return <p className="pt-10 text-center text-xl text-slate-500">Work from your Scenario Cards.</p>
  }
  return (
    <section className="rounded-lg border border-slate-800 p-8">
      <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">You decided</h2>
      <p className="mt-4 text-3xl leading-snug text-slate-100">{latest.text}</p>
    </section>
  )
}

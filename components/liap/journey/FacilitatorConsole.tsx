'use client'

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { openChannel, type Channel } from '@/lib/journey/channel'
import { DebriefPanel } from './DebriefPanel'
import {
  brokenDependencies,
  initialJourney,
  journeyReduce,
  pointAt,
  type JourneyAction,
} from '@/lib/journey/engine'
import { RECALCULATION_PROMPTS, ROAD_EVENT_LIBRARY } from '@/lib/journey/events'
import { IMPACT_CHOICES } from '@/lib/journey/impact'
import { projectJourney } from '@/lib/journey/projection'
import { PROGRESS_PROMPTS } from '@/lib/journey/prompts'
import { SCENARIOS } from '@/lib/journey/scenarios'
import {
  clearFacilitatorSession,
  isResumable,
  readStoredSession,
  saveFacilitatorSession,
  type StoredSession,
} from '@/lib/journey/session-storage'
import { facilitatorClock } from '@/lib/journey/timing'
import type { JourneyState, RoadEventId } from '@/lib/journey/types'

// ---------------------------------------------------------------------------
// The Facilitator Console. PRIVATE — the laptop, never the projector.
//
// ── WHAT MAKES THE SEPARATION REAL ─────────────────────────────────────────
//
// This component holds the whole JourneyState: private notes, the dependency
// register, the 120-minute clock and its contingency buffer, the debrief.
// None of that reaches the wall, because the only thing ever put on the
// channel is projectJourney(state) — a narrower type built by listing what
// goes on rather than by deleting what should not.
//
// So the guarantee is not "the display component declines to render the note".
// It is that the note was never sent.
//
// ── THE CLOCK ON THIS SCREEN IS THE REAL ONE ───────────────────────────────
//
// 90 minutes of task window, 30 of floating contingency, 120 in total. The
// room is told 90 and the projected map counts 90. A team that knows about the
// buffer has 120 minutes and the pressure that makes the decisions real
// evaporates — so the buffer is shown here and nowhere else.
//
// ── SESSION STORAGE, AND ITS FENCE ─────────────────────────────────────────
//
// An accidental refresh mid-Intensive would otherwise destroy a team's journey
// in front of the room, so the console — and only the console — writes its
// state to sessionStorage. It never resumes silently: on load it offers the
// facilitator a choice, because putting the previous team's decisions on the
// wall in front of the next one is the worse failure.
//
// MY PROJECT is not covered by that exception and does not import the module.
// ---------------------------------------------------------------------------

const CLOCK_TICK_MS = 15_000

export function FacilitatorConsole() {
  const [state, dispatch] = useReducer(journeyReduce, undefined, initialJourney)
  const [stored, setStored] = useState<StoredSession | null>(null)
  const [resolvedResume, setResolvedResume] = useState(false)
  const [secondConsole, setSecondConsole] = useState(false)
  const [now, setNow] = useState(0)
  const channelRef = useRef<Channel | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  // ── the wire ─────────────────────────────────────────────────────────────
  const broadcast = useCallback((next: JourneyState, at: number) => {
    channelRef.current?.post({ kind: 'state', state: projectJourney(next, at) })
  }, [])

  useEffect(() => {
    const channel = openChannel((message) => {
      // A display just opened. Send it the current projection so a window
      // opened mid-session does not show an empty map.
      if (message.kind === 'hello') broadcast(stateRef.current, Date.now())
      if (message.kind === 'console-hello') channel.post({ kind: 'console-here' })
      if (message.kind === 'console-here') setSecondConsole(true)
    })
    channelRef.current = channel
    channel.post({ kind: 'console-hello' })
    return () => {
      channelRef.current = null
      channel.close()
    }
  }, [broadcast])

  // ── the clock ────────────────────────────────────────────────────────────
  // Date.now() is read here, in the component, and never inside the reducer —
  // which keeps the engine pure and a whole session replayable in a test.
  useEffect(() => {
    setNow(Date.now())
    const tick = setInterval(() => {
      const at = Date.now()
      setNow(at)
      // Re-broadcast so the projected countdown moves even when nobody
      // has touched the console.
      broadcast(stateRef.current, at)
    }, CLOCK_TICK_MS)
    return () => clearInterval(tick)
  }, [broadcast])

  // ── resume or discard, never silently ────────────────────────────────────
  useEffect(() => {
    const found = readStoredSession()
    if (isResumable(found)) setStored(found)
    else {
      clearFacilitatorSession()
      setResolvedResume(true)
    }
  }, [])

  // ── persistence + projection on every change ─────────────────────────────
  useEffect(() => {
    if (!resolvedResume) return
    const at = Date.now()
    saveFacilitatorSession(state, at)
    broadcast(state, at)
  }, [state, resolvedResume, broadcast])

  // ── warn before closing an active session ────────────────────────────────
  const sessionActive = state.startedAt !== null && state.phase !== 'complete'
  useEffect(() => {
    if (!sessionActive) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [sessionActive])

  const act = (action: JourneyAction) => dispatch(action)

  const clock = facilitatorClock(state.startedAt, now || Date.now())
  const point = pointAt(state.pointIndex)
  const broken = useMemo(() => brokenDependencies(state), [state])

  if (stored && !resolvedResume) {
    return (
      <ResumeChooser
        stored={stored}
        onResume={() => {
          // A stored session is a snapshot, not an action log, so there is
          // nothing to replay — it is adopted whole, and only because a human
          // just said yes.
          dispatch({ type: 'adopt', state: stored.state })
          setResolvedResume(true)
        }}
        onDiscard={() => {
          clearFacilitatorSession()
          dispatch({ type: 'reset' })
          setResolvedResume(true)
        }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 text-slate-100">
      {secondConsole ? (
        <p className="mb-6 rounded border border-amber-500 bg-amber-500/10 p-3 text-sm text-amber-200">
          Another Facilitator Console is open in this browser. Close one — two consoles will fight over
          the projected display.
        </p>
      ) : null}

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-semibold">Facilitator Console</h1>
          <p className="text-sm text-slate-400">
            Private. Do not project this window.
            {SCENARIOS.length === 0 ? ' Running from the printed Scenario Card Deck.' : null}
          </p>
        </div>
        <PrivateClock clock={clock} started={state.startedAt !== null} />
      </header>

      <div className="mt-5 flex flex-wrap gap-3">
        {state.startedAt === null ? (
          <Primary onClick={() => act({ type: 'begin', at: Date.now() })}>Start the task window</Primary>
        ) : null}
        <Secondary onClick={() => window.open('/liap/journey', 'liap-journey-display')}>
          Open participant display
        </Secondary>
        <Secondary onClick={() => act({ type: 'advance-point' })}>Advance to next point →</Secondary>
        <Secondary onClick={() => act({ type: 'complete' })}>Complete journey</Secondary>
        <EndSession
          onEnd={() => {
            clearFacilitatorSession()
            act({ type: 'reset' })
          }}
        />
      </div>

      <p className="mt-5 text-sm text-slate-400">
        Current point: <span className="font-semibold text-slate-100">{point.label}</span>
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <DecisionCapture state={state} onAct={act} />
        <EventPalette state={state} onAct={act} broken={broken} />
        <LifelinePanel onAct={act} />
        <PromptPanel activePromptId={state.activePromptId} onAct={act} />
        <DependencyPanel state={state} onAct={act} />
        {state.phase === 'recalculating' ? <RecalculationForm onAct={act} /> : null}
      </div>

      {state.phase === 'complete' ? (
        <div className="mt-10">
          <DebriefPanel state={state} />
        </div>
      ) : null}
    </div>
  )
}

/**
 * The real numbers. 90, 30, 120.
 *
 * This block exists on the facilitator's laptop and nowhere else — there is no
 * field on ProjectedJourney from which any of it could be derived.
 */
function PrivateClock({ clock, started }: { clock: ReturnType<typeof facilitatorClock>; started: boolean }) {
  if (!started) return <p className="text-sm text-slate-500">Task window not started.</p>
  return (
    <dl className="rounded border border-slate-700 bg-slate-900 px-4 py-3 text-sm">
      <div className="flex justify-between gap-6">
        <dt className="text-slate-400">Window (shown to room)</dt>
        <dd className="tabular-nums">{Math.max(0, Math.ceil(clock.windowRemaining))} min</dd>
      </div>
      <div className="flex justify-between gap-6">
        <dt className="text-slate-400">Contingency left</dt>
        <dd className="tabular-nums">{Math.max(0, Math.ceil(clock.bufferRemaining))} min</dd>
      </div>
      <div className="flex justify-between gap-6">
        <dt className="text-slate-400">Total left</dt>
        <dd className="tabular-nums">{Math.ceil(clock.totalRemaining)} min</dd>
      </div>
      {clock.onBuffer ? (
        <p className="mt-2 text-xs text-amber-300">On contingency. The room still sees the task window.</p>
      ) : null}
    </dl>
  )
}

function ResumeChooser({
  stored,
  onResume,
  onDiscard,
}: {
  stored: StoredSession
  onResume: () => void
  onDiscard: () => void
}) {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-slate-100">
      <h1 className="text-xl font-semibold">There is a journey in progress in this tab.</h1>
      <p className="mt-3 text-slate-400">
        {stored.state.decisions.length} decision{stored.state.decisions.length === 1 ? '' : 's'} and{' '}
        {stored.state.events.length} Road Event{stored.state.events.length === 1 ? '' : 's'} recorded.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Primary onClick={onResume}>Resume active journey</Primary>
        <Secondary onClick={onDiscard}>Discard and start over</Secondary>
      </div>
    </div>
  )
}

function EndSession({ onEnd }: { onEnd: () => void }) {
  const [confirming, setConfirming] = useState(false)
  if (!confirming) return <Secondary onClick={() => setConfirming(true)}>End session</Secondary>
  return (
    <span className="inline-flex items-center gap-2 rounded border border-amber-500 bg-amber-500/10 px-3 py-1.5 text-sm">
      <span className="text-amber-200">Clear this journey? Print the Journey Record first if you want it.</span>
      <button type="button" className="underline" onClick={() => { onEnd(); setConfirming(false) }}>
        End it
      </button>
      <button type="button" className="underline text-slate-300" onClick={() => setConfirming(false)}>
        Cancel
      </button>
    </span>
  )
}

function DecisionCapture({ state, onAct }: { state: JourneyState; onAct: (a: JourneyAction) => void }) {
  const [text, setText] = useState('')
  const [dependsOn, setDependsOn] = useState('')
  return (
    <Panel title="Capture a decision">
      <p className="text-xs text-slate-500">Their words, not a summary of them.</p>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
      />
      <label className="mt-2 block text-xs text-slate-400">
        What does it rest on? (optional — this is what a later event can break)
        <input
          value={dependsOn}
          onChange={(event) => setDependsOn(event.target.value)}
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
        />
      </label>
      <Primary
        onClick={() => {
          if (!text.trim()) return
          onAct({ type: 'record-decision', text, dependsOn, at: Date.now() })
          setText('')
          setDependsOn('')
        }}
      >
        Record
      </Primary>
      <p className="mt-3 text-xs text-slate-500">{state.decisions.length} recorded this session.</p>
    </Panel>
  )
}

function EventPalette({
  state,
  onAct,
  broken,
}: {
  state: JourneyState
  onAct: (a: JourneyAction) => void
  broken: ReturnType<typeof brokenDependencies>
}) {
  const [selected, setSelected] = useState<RoadEventId | null>(null)
  const [revealText, setRevealText] = useState('')
  const [note, setNote] = useState('')
  const [linked, setLinked] = useState('')
  const definition = ROAD_EVENT_LIBRARY.find((event) => event.id === selected)
  const active = state.events.find((event) => event.id === state.activeEventId)

  return (
    <Panel title="Road Events">
      {/* Artifact 3, How to Use the Deck — verbatim. The rule that keeps a
          Road Event a test of the team's road rather than a way to steer it. */}
      <p className="mb-3 text-[11px] italic text-slate-500">
        Do not play every event in every scenario. Select the event that naturally tests the team&rsquo;s
        current plan.
      </p>
      {broken.length ? (
        <div className="mb-3 rounded border border-amber-600/60 bg-amber-500/5 p-2 text-xs text-amber-200">
          {/* A suggestion, never an action. The system remembers; a human decides. */}
          {broken.map((item) => (
            <p key={item.dependencyId}>
              “{item.decisionText}” rests on {item.label}, now unavailable.
            </p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {ROAD_EVENT_LIBRARY.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => setSelected(event.id)}
            className={[
              'rounded border px-2 py-1 text-xs',
              selected === event.id ? 'border-amber-400 text-amber-200' : 'border-slate-700 text-slate-300',
            ].join(' ')}
          >
            {event.name}
          </button>
        ))}
      </div>

      {definition ? (
        <>
          {/* The approved card, in the approved fields. WHEN TO PLAY, WATCH
              FOR and PUSH WITHOUT SOLVING are facilitator-only and never
              projected; READ TO TEAM is what the room hears. */}
          <div className="mt-3 space-y-2 text-xs">
            <p className="font-semibold text-slate-300">{definition.tagline}</p>
            <p className="text-slate-400">
              <span className="text-slate-500">READ TO TEAM </span>
              {definition.readToTeam}
            </p>
            <p className="text-amber-200/70">
              <span className="text-slate-500">WHEN TO PLAY </span>
              {definition.whenToPlay}
            </p>
            <p className="text-amber-200/70">
              <span className="text-slate-500">WATCH FOR </span>
              {definition.watchFor}
            </p>
            <p className="text-amber-200/70">
              <span className="text-slate-500">PUSH WITHOUT SOLVING </span>
              {definition.pushWithoutSolving}
            </p>
          </div>
          <textarea
            value={revealText}
            onChange={(event) => setRevealText(event.target.value)}
            rows={2}
            placeholder="Scenario detail for the room (optional — the card's own words are shown)"
            className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
          />
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Private note — never projected"
            className="mt-2 w-full rounded border border-amber-800 bg-slate-950 px-2 py-1.5 text-sm"
          />
          <select
            value={linked}
            onChange={(event) => setLinked(event.target.value)}
            className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
          >
            <option value="">Land it on a decision (optional)</option>
            {state.decisions.map((decision) => (
              <option key={decision.id} value={decision.id}>
                {decision.text.slice(0, 60)}
              </option>
            ))}
          </select>
          <Primary
            onClick={() => {
              if (!selected || !revealText.trim()) return
              onAct({
                type: 'reveal-event',
                eventId: selected,
                revealText,
                facilitatorNote: note,
                ...(linked ? { linkedDecisionId: linked } : {}),
                at: Date.now(),
              })
              setRevealText('')
              setNote('')
              setLinked('')
            }}
          >
            Reveal to the room
          </Primary>
        </>
      ) : null}

      {active ? (
        <div className="mt-4 border-t border-slate-800 pt-3">
          <p className="text-xs text-slate-400">What did the team decide it changes?</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {IMPACT_CHOICES.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => onAct({ type: 'record-event-impact', eventRecordId: active.id, impact: choice.id })}
                className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300"
              >
                {choice.label}
              </button>
            ))}
          </div>
          <Secondary onClick={() => onAct({ type: 'clear-event' })}>Clear from display</Secondary>
        </div>
      ) : null}
    </Panel>
  )
}

/**
 * Two steps, deliberately. The team names the help they need before any help
 * arrives — that naming is most of the skill, and a Lifeline handed over
 * without it teaches nothing.
 */
function LifelinePanel({ onAct }: { onAct: (a: JourneyAction) => void }) {
  const [asked, setAsked] = useState('')
  const [note, setNote] = useState('')
  return (
    <Panel title="Lifeline">
      <p className="text-xs text-slate-500">Ask first: what kind of help do you need?</p>
      <input
        value={asked}
        onChange={(event) => setAsked(event.target.value)}
        placeholder="What they asked for"
        className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
      />
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="What you gave — information, a perspective, a category, permission"
        className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
      />
      <Primary
        onClick={() => {
          if (!asked.trim()) return
          onAct({ type: 'grant-lifeline', asked, note, at: Date.now() })
          setAsked('')
          setNote('')
        }}
      >
        Record the Lifeline
      </Primary>
      <p className="mt-2 text-xs text-slate-500">A Lifeline does not solve the project.</p>
    </Panel>
  )
}

function PromptPanel({
  activePromptId,
  onAct,
}: {
  activePromptId: string | null
  onAct: (a: JourneyAction) => void
}) {
  return (
    <Panel title="Progress prompts">
      <div className="space-y-2">
        {PROGRESS_PROMPTS.map((prompt) => (
          <div key={prompt.id}>
            <button
              type="button"
              onClick={() => onAct({ type: 'show-prompt', promptId: prompt.id })}
              className={[
                'w-full rounded border px-2 py-1 text-left text-xs',
                activePromptId === prompt.id ? 'border-amber-400 text-amber-200' : 'border-slate-700 text-slate-300',
              ].join(' ')}
            >
              {prompt.text}
            </button>
            {prompt.whenToUse ? (
              <p className="mt-0.5 text-[11px] text-slate-500">{prompt.whenToUse}</p>
            ) : null}
            {prompt.conflict ? (
              <p className="mt-0.5 text-[11px] text-amber-300/70">Wording conflict: {prompt.conflict}</p>
            ) : null}
          </div>
        ))}
      </div>
      {activePromptId ? <Secondary onClick={() => onAct({ type: 'clear-prompt' })}>Clear prompt</Secondary> : null}
    </Panel>
  )
}

/** Facilitator-private. This register is never projected. */
function DependencyPanel({ state, onAct }: { state: JourneyState; onAct: (a: JourneyAction) => void }) {
  if (!state.dependencies.length) return null
  return (
    <Panel title="Dependencies (private)">
      <ul className="space-y-2 text-xs">
        {state.dependencies.map((dependency) => (
          <li key={dependency.id} className="flex items-center justify-between gap-2">
            <span className={dependency.available ? 'text-slate-300' : 'text-amber-300 line-through'}>
              {dependency.label}
            </span>
            <button
              type="button"
              onClick={() =>
                onAct({
                  type: 'set-dependency-available',
                  dependencyId: dependency.id,
                  available: !dependency.available,
                })
              }
              className="rounded border border-slate-700 px-2 py-0.5 text-slate-300"
            >
              {dependency.available ? 'Take it away' : 'Give it back'}
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function RecalculationForm({ onAct }: { onAct: (a: JourneyAction) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [destinationValid, setDestinationValid] = useState<'holds' | 'changes' | 'undecided'>('undecided')
  return (
    <Panel title="GPS: Recalculating…">
      {RECALCULATION_PROMPTS.map((prompt) =>
        prompt.key === 'destinationValid' ? (
          <div key={prompt.key} className="mt-3">
            <p className="text-xs text-slate-400">{prompt.label}</p>
            <div className="mt-1 flex gap-1.5">
              {(['holds', 'changes', 'undecided'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDestinationValid(value)}
                  className={[
                    'rounded border px-2 py-1 text-xs',
                    destinationValid === value ? 'border-amber-400 text-amber-200' : 'border-slate-700 text-slate-300',
                  ].join(' ')}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <label key={prompt.key} className="mt-3 block text-xs text-slate-400">
            {prompt.label}
            <textarea
              value={answers[prompt.key] ?? ''}
              onChange={(event) => setAnswers((current) => ({ ...current, [prompt.key]: event.target.value }))}
              rows={2}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
            />
          </label>
        ),
      )}
      <Primary
        onClick={() =>
          onAct({
            type: 'record-recalculation',
            stillTrue: answers.stillTrue ?? '',
            changed: answers.changed ?? '',
            destinationValid,
            milestoneToChange: answers.milestoneToChange ?? '',
            nextMove: answers.nextMove ?? '',
            at: Date.now(),
          })
        }
      >
        Record the recalculation
      </Primary>
      <p className="mt-2 text-xs text-slate-500">Revise the roadmap. Do not restart it.</p>
    </Panel>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Primary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900"
    >
      {children}
    </button>
  )
}

function Secondary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-200"
    >
      {children}
    </button>
  )
}

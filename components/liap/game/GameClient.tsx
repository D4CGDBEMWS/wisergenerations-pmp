'use client'

import { useEffect, useReducer, useRef } from 'react'
import {
  choiceById,
  consequencesNow,
  currentScenario,
  initialState,
  reduce,
  type GameAction,
} from '@/lib/game/engine'
import type { GameState } from '@/lib/game/types'
import { HealthDashboard } from './HealthDashboard'
import { RoadmapRail } from './RoadmapRail'
import { PivotCycle } from './PivotCycle'
import { ResultsScreen } from './ResultsScreen'
import {
  GlossaryScreen,
  LessonScreen,
  OutcomeScreen,
  ProjectBriefScreen,
  ScenarioScreen,
} from './GameScreens'

// ---------------------------------------------------------------------------
// A Day in the Life of a Project Manager — the client shell.
//
// ── PARTICIPANT DATA: THERE ISN'T ANY ──────────────────────────────────────
//
// §31, and it is the most important paragraph in this file.
//
// The entire game state is the object below, held in React for the length of
// one visit. There is no fetch, no POST, no cookie, no localStorage, no
// sessionStorage, no analytics event carrying a decision, and no server action.
// Closing the tab ends the session and there is nothing left behind to purge,
// because nothing was ever written.
//
// That is not a convenience — it is what keeps Version 1 from introducing a
// new sensitive-data pathway. There is no free-text field anywhere in the
// experience: the end-of-day reflection is seven closed options, and the
// unrestricted box that would normally live there is deliberately absent.
// Nothing here touches the assessment, its tables, its scoring, its retention
// rules, or Mailchimp. `tests/liap-game.test.ts` asserts every one of those by
// reading the source of every module under lib/game and components/liap/game.
//
// If persistence is ever wanted — resuming a half-finished day, a workshop
// facilitator seeing the room's choices — that is a proposal to be documented
// and approved before it is built, not something to add quietly to a reducer.
//
// ── WHY useReducer AND NOT A STORE ─────────────────────────────────────────
//
// The engine is already a pure reducer with its own tests. useReducer is the
// React binding for exactly that shape, and adding a state library would put
// a second description of the same transitions in the repo.
// ---------------------------------------------------------------------------

/** Clearance for the sticky site header, in pixels. */
const STICKY_HEADER_ALLOWANCE = 96

export function GameClient() {
  const [state, dispatch] = useReducer(
    (current: GameState, action: GameAction) => reduce(current, action),
    undefined,
    initialState
  )

  const scenario = currentScenario(state)
  const headingRef = useRef<HTMLDivElement>(null)

  // §33. Each beat replaces the whole panel, so without this a keyboard or
  // screen-reader user is left focused on a button that no longer exists and
  // has to tab back from the top of the document every hour.
  //
  // `preventScroll` and an explicit scroll, rather than the browser's default:
  // the site header is sticky, and letting the browser scroll the panel to the
  // top of the viewport puts its heading underneath that header. The first
  // beat does not scroll at all — the page has only just loaded and yanking it
  // is disorienting.
  const beat = `${state.phase}:${state.scenarioIndex}:${state.pivotStep}:${state.glossaryAnswered.length}`
  const firstBeat = useRef(true)
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
    if (firstBeat.current) {
      firstBeat.current = false
      return
    }
    const top = headingRef.current?.getBoundingClientRect().top ?? 0
    window.scrollBy({ top: top - STICKY_HEADER_ALLOWANCE, behavior: 'smooth' })
  }, [beat])

  const lastDecision = state.decisions[state.decisions.length - 1]
  const chosen =
    scenario && lastDecision?.scenarioId === scenario.id
      ? choiceById(scenario, lastDecision.choiceId)
      : null

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
          Living Is a Project&hellip;Are You Ready?&trade;
        </p>
        <h1 className="mt-1 text-xl font-bold text-navy sm:text-2xl">
          A Day in the Life of a Project Manager
        </h1>
      </header>

      {/*
        Three blocks, ordered differently on a phone and on a laptop.

        On a laptop the dashboard and the roadmap sit together in a right-hand
        column beside the decision. On a phone they cannot both go above it:
        the dashboard is a cost signal and has to be visible while deciding,
        but the twelve-stage roadmap is orientation, and stacking it above the
        panel puts six hundred pixels of scrolling between the header and the
        first choice. So the dashboard stays above and the roadmap moves below.
      */}
      <div
        className={`grid grid-cols-1 gap-6 ${
          state.phase === 'results' ? '' : 'lg:grid-cols-[1fr_18rem] lg:grid-rows-[auto_1fr]'
        }`}
      >
        {state.phase !== 'results' && (
          <div className="order-1 lg:order-2 lg:col-start-2 lg:row-start-1">
            <HealthDashboard
              health={state.health}
              focus={state.focus}
              focusOverdrawn={state.focusOverdrawn}
              compact
            />
          </div>
        )}

        <div
          ref={headingRef}
          tabIndex={-1}
          aria-live="polite"
          className="order-2 outline-none lg:order-1 lg:col-start-1 lg:row-span-2 lg:row-start-1"
        >
          {state.phase === 'brief' && (
            <ProjectBriefScreen onBegin={() => dispatch({ type: 'begin' })} />
          )}

          {state.phase === 'situation' && scenario && (
            <ScenarioScreen
              scenario={scenario}
              consequences={consequencesNow(state)}
              focus={state.focus}
              onChoose={(choiceId) => dispatch({ type: 'choose', choiceId })}
            />
          )}

          {state.phase === 'outcome' && scenario && chosen && (
            <OutcomeScreen
              scenario={scenario}
              choice={chosen}
              onContinue={() => dispatch({ type: 'continue' })}
            />
          )}

          {state.phase === 'glossary' && scenario && (
            <GlossaryScreen
              scenario={scenario}
              answered={state.glossaryAnswered.includes(scenario.id)}
              correct={state.glossaryCorrect.includes(scenario.id)}
              onAnswer={(option) => dispatch({ type: 'answer-glossary', option })}
              onContinue={() => dispatch({ type: 'continue' })}
            />
          )}

          {state.phase === 'pivot' && (
            <PivotCycle
              state={state}
              onTake={() => dispatch({ type: 'take-pivot' })}
              onDecline={() => dispatch({ type: 'decline-pivot' })}
              onChoose={(optionId) => dispatch({ type: 'pivot-choose', optionId })}
              onContinue={() => dispatch({ type: 'continue' })}
            />
          )}

          {state.phase === 'lesson' && (
            <LessonScreen onRecord={(lessonId) => dispatch({ type: 'record-lesson', lessonId })} />
          )}

          {state.phase === 'results' && (
            <ResultsScreen state={state} onRestart={() => dispatch({ type: 'restart' })} />
          )}
        </div>

        {state.phase !== 'results' && (
          <div className="order-3 lg:col-start-2 lg:row-start-2">
            <RoadmapRail current={scenario?.stage ?? null} />
          </div>
        )}
      </div>
    </main>
  )
}

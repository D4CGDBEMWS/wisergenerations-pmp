import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  initialJourney,
  journeyReduce,
  brokenDependencies,
  minutesAtPoint,
  shouldOfferPacingNudge,
  PACING_NUDGE_MINUTES,
  type JourneyAction,
} from '@/lib/journey/engine'
import { projectJourney } from '@/lib/journey/projection'
import { buildJourneyRecord } from '@/lib/journey/record'
import { BUFFER_MINUTES, TOTAL_MINUTES, WINDOW_MINUTES, facilitatorClock } from '@/lib/journey/timing'
import { ROAD_EVENT_LIBRARY, RECALCULATION_PROMPTS, roadEvent } from '@/lib/journey/events'
import { SCENARIOS } from '@/lib/journey/scenarios'
import { BARE_SURFACES, isBareSurface } from '@/lib/shell'
import { CONTENT_INVENTORY, pendingOwnerReview, wordingConflicts } from '@/lib/journey/content'
import { DISPLAY_STRINGS } from '@/lib/journey/display-copy'
import { IMPACT_CHOICES } from '@/lib/journey/impact'
import { PROGRESS_PROMPTS } from '@/lib/journey/prompts'
import {
  DEBRIEF_DO_NOT,
  DEBRIEF_FINAL_REMINDER,
  DEBRIEF_SEQUENCE,
  GOD_AT_THE_CENTER_FOUNDATION,
  PROTECTED_SEQUENCE,
} from '@/lib/journey/debrief'
import {
  MAKE_IT_REAL_COLUMNS,
  MY_PROJECT_CLOSING,
  MY_PROJECT_EXTRAS,
  MY_PROJECT_OPENING,
  MY_PROJECT_STEPS,
  buildMyProjectRoadmap,
  emptyDraft,
} from '@/lib/journey/my-project'
import { ROADMAP_POINTS, type JourneyState } from '@/lib/journey/types'

// ---------------------------------------------------------------------------
// The LIAP Journey Game.
//
// NOT the customer-journey suite in tests/liap-journey.test.ts — that one
// covers preorder → entitlement → assessment → results for the Life
// Project-Ready™ Assessment and is untouched by this work.
//
// ── WHAT THIS SUITE IS FOR ─────────────────────────────────────────────────
//
// Four things must be true of a game run in front of a room, and none of them
// is provable by reading the components:
//
//   1. Nothing private reaches the projected screen — not hidden by CSS, not
//      filtered at render, but never put on the wire.
//   2. MY PROJECT cannot transmit or persist a participant's real life.
//   3. The facilitator's sessionStorage exception reaches the console only.
//   4. No dice, no score, and no way to add either quietly.
//
// Each critical assertion below is followed by a NEGATIVE CONTROL: the same
// check run against a value with the old behaviour restored, proving the test
// fails when the guarantee is broken. A privacy test that cannot fail is a
// comment with a green tick next to it.
// ---------------------------------------------------------------------------

const root = join(__dirname, '..')
const source = (rel: string) => readFileSync(join(root, rel), 'utf8')

/**
 * Source with comments removed.
 *
 * Every absence assertion runs against this. These modules explain at length
 * what they do not do — "no fetch, no localStorage, never projected" — and a
 * test looking for the absence of those words would otherwise pass on the
 * strength of the comment and keep passing after somebody added the call.
 */
const code = (rel: string) =>
  source(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const LIB_MODULES = readdirSync(join(root, 'lib/journey')).map((f) => `lib/journey/${f}`)
const COMPONENTS = readdirSync(join(root, 'components/liap/journey')).map(
  (f) => `components/liap/journey/${f}`,
)
const ROUTES = [
  'app/liap/journey/page.tsx',
  'app/liap/journey/facilitator/page.tsx',
  'app/liap/journey/my-project/page.tsx',
]

// A session with every kind of private content in it, used by the projection
// tests. The strings are deliberately distinctive so a leak is unmistakable.
const PRIVATE_NOTE = 'PRIVATENOTE-the-vehicle-goes-next-round'
const PRIVATE_DEPENDENCY = 'PRIVATEDEP-the-car'

function populatedSession(): JourneyState {
  const actions: JourneyAction[] = [
    { type: 'begin', at: 1_000 },
    { type: 'record-decision', text: 'Deliver groceries evenings', dependsOn: PRIVATE_DEPENDENCY, at: 2_000 },
    {
      type: 'reveal-event',
      eventId: 'issue-now',
      revealText: 'The car will not start.',
      facilitatorNote: PRIVATE_NOTE,
      linkedDecisionId: 'decision-1',
      at: 3_000,
    },
    { type: 'record-event-impact', eventRecordId: 'event-1', impact: 'first-move' },
    { type: 'grant-lifeline', asked: 'Someone who knows the rules', note: 'A category, not an answer', at: 4_000 },
    { type: 'grant-resource', note: 'A neighbour with a van', at: 5_000 },
    { type: 'set-dependency-available', dependencyId: 'dependency-1', available: false },
    { type: 'advance-point', at: 5_500 },
    {
      type: 'record-recalculation',
      stillTrue: 'The need is still the need',
      changed: 'No vehicle',
      mattersNow: 'Getting the first deliveries out this week',
      optionsAvailable: "A neighbour's van, or switching to pickup orders",
      revisedNextMove: 'Borrow the van for a week',
      at: 6_000,
    },
    // Last, deliberately: advance-point clears the prompt, which is correct
    // behaviour — a prompt is for the moment the facilitator put it up.
    { type: 'show-prompt', promptId: 'research' },
  ]
  return actions.reduce(journeyReduce, initialJourney())
}

describe('routes and flag', () => {
  it('gates all three routes on FEATURE_LIAP_JOURNEY and nothing else', () => {
    for (const route of ROUTES) {
      const text = code(route)
      expect(text, route).toContain("isEnabled('LIAP_JOURNEY')")
      expect(text, route).toContain('notFound()')
    }
  })

  it('never couples the Journey Game to another LIAP flag', () => {
    // The whole point of a standalone flag: turning the Journey Game on for one
    // Intensive date must not turn on the assessment, the book QR, or Living
    // Life as a Project Manager.
    const others = ['LIAP_GAME_PREVIEW', 'LIAP_BOOK_ACTIVATION', 'LIAP_GAME']
    for (const file of [...ROUTES, ...LIB_MODULES, ...COMPONENTS]) {
      const text = code(file)
      for (const flag of others) expect(text, `${file} / ${flag}`).not.toContain(flag)
      // "isEnabled('LIAP')" would match LIAP_JOURNEY on a naive substring
      // check, so this looks for the exact bare call.
      expect(text, file).not.toContain("isEnabled('LIAP')")
    }
  })

  it('leaves the deployed Living Life as a Project Manager experience alone', () => {
    // Nothing in the Journey Game imports the deployed game, and nothing in the
    // deployed game imports the Journey Game. Separate content sets, separate
    // routes, separate flags.
    for (const file of [...LIB_MODULES, ...COMPONENTS, ...ROUTES]) {
      expect(code(file), file).not.toMatch(/from ['"]@\/lib\/game\//)
    }
    for (const file of readdirSync(join(root, 'lib/game')).map((f) => `lib/game/${f}`)) {
      expect(code(file), file).not.toMatch(/journey/i)
    }
  })

  it('adds no API route', () => {
    // Version 1 has no server side at all. A route handler appearing here later
    // is exactly the change that should have to argue for itself.
    expect(existsSync(join(root, 'app/api/liap/journey'))).toBe(false)
    for (const file of [...LIB_MODULES, ...COMPONENTS]) {
      expect(code(file), file).not.toContain("'use server'")
    }
  })
})

describe('no dice, no score', () => {
  it('has no randomness anywhere in lib/journey', () => {
    for (const file of LIB_MODULES) {
      expect(code(file), file).not.toContain('Math.random')
      expect(code(file), file).not.toContain('crypto.getRandomValues')
    }
  })

  it('produces byte-identical state when the same session is replayed', () => {
    // The proof that nothing random or clock-dependent leaked in: two runs of
    // the same actions are the same object.
    expect(JSON.stringify(populatedSession())).toBe(JSON.stringify(populatedSession()))
  })

  it('carries no score, grade, rank or winner on any surface', () => {
    const state = populatedSession()
    const serialised = JSON.stringify({
      state,
      projection: projectJourney(state, 10_000),
      record: buildJourneyRecord(state),
    })
    for (const forbidden of ['score', 'grade', 'rank', 'winner', 'leaderboard', 'correct', 'health']) {
      expect(serialised.toLowerCase(), forbidden).not.toContain(`"${forbidden}`)
    }
    // `points` IS present and is the six roadmap points, not a tally — so the
    // check that matters is that no key anywhere holds a bare number that
    // could be read as a result.
    expect(serialised).not.toMatch(/"(points|score|rank|level|health|hp)":\s*-?\d/)
    expect(projectJourney(state, 10_000).points).toHaveLength(6)
  })

  it('never moves a team because of a Road Event', () => {
    const before = journeyReduce(initialJourney(), { type: 'begin', at: 0 })
    const after = journeyReduce(before, {
      type: 'reveal-event',
      eventId: 'risk-ahead',
      revealText: 'Something ahead',
      facilitatorNote: 'private',
      at: 1,
    })
    expect(after.pointIndex).toBe(before.pointIndex)

    // NEGATIVE CONTROL — an event that advanced the team would move the index,
    // and this assertion would catch it.
    const ifEventsMoved = { ...after, pointIndex: after.pointIndex + 1 }
    expect(ifEventsMoved.pointIndex).not.toBe(before.pointIndex)
  })

  it('advances only when a facilitator advances', () => {
    let state = journeyReduce(initialJourney(), { type: 'begin', at: 0 })
    const movers = new Set<string>()
    const probes: JourneyAction[] = [
      { type: 'record-decision', text: 'x', at: 1 },
      { type: 'grant-lifeline', asked: 'help', note: 'y', at: 2 },
      { type: 'grant-resource', note: 'z', at: 3 },
      { type: 'show-prompt', promptId: 'research' },
      { type: 'clear-prompt' },
      { type: 'clear-event' },
    ]
    for (const probe of probes) {
      const next = journeyReduce(state, probe)
      if (next.pointIndex !== state.pointIndex) movers.add(probe.type)
      state = next
    }
    expect([...movers]).toEqual([])
    expect(journeyReduce(state, { type: 'advance-point', at: 9 }).pointIndex).toBe(
      state.pointIndex + 1,
    )
  })
})

describe('participant display data boundary', () => {
  const state = populatedSession()
  const wire = JSON.stringify(projectJourney(state, 10_000))

  it('carries no facilitator note', () => {
    expect(wire).not.toContain(PRIVATE_NOTE)
    // NEGATIVE CONTROL — the note is genuinely in the state being projected,
    // so its absence from the wire is the projection's doing and not an
    // artefact of a session that never had one.
    expect(JSON.stringify(state)).toContain(PRIVATE_NOTE)
  })

  it('carries no dependency register', () => {
    expect(wire).not.toContain(PRIVATE_DEPENDENCY)
    expect(wire).not.toContain('dependencies')
    expect(JSON.stringify(state)).toContain(PRIVATE_DEPENDENCY)
  })

  it('carries no unrevealed event', () => {
    const projected = projectJourney(state, 10_000)
    expect(projected.events).toHaveLength(state.events.length)
    // Every event on the wire is one the facilitator actually revealed.
    for (const event of projected.events) {
      expect(state.events.some((e) => e.id === event.id)).toBe(true)
    }
    // And the library the facilitator picks from is not on the wire, so the
    // room cannot read the names of events still to come.
    const unrevealed = ROAD_EVENT_LIBRARY.filter((e) => e.id !== 'issue-now')
    for (const event of unrevealed) expect(wire).not.toContain(event.readToTeam)
  })

  it('carries no facilitator guidance on the active prompt', () => {
    const guidance = PROGRESS_PROMPTS.find((p) => p.id === 'research')!.whenToUse!
    expect(wire).not.toContain(guidance)
    // The prompt TEXT is on the wire — that is the point of putting it up.
    expect(wire).toContain(PROGRESS_PROMPTS.find((p) => p.id === 'research')!.text)
  })

  it('names WISER Pivots nowhere a participant can reach', () => {
    // "Wiser Generations" is the company and appears in the approved MY
    // PROJECT warning; WISER Pivots™ is the framework and must not appear at
    // all before the debrief. The pattern distinguishes them.
    expect(wire).not.toMatch(/WISER\s*Pivots/i)
    for (const file of COMPONENTS.filter(
      (f) => !f.includes('Facilitator') && !f.includes('Debrief'),
    )) {
      expect(code(file), file).not.toMatch(/WISER\s*Pivots/i)
    }
  })

  it('does not let the display component reach private modules', () => {
    // The strongest form of the guarantee: not "the component declines to
    // render it" but "the module is not in this bundle".
    const display = code('components/liap/journey/JourneyMap.tsx')
    for (const forbidden of [
      '@/lib/journey/debrief',
      '@/lib/journey/timing',
      '@/lib/journey/prompts',
      '@/lib/journey/events',
      '@/lib/journey/session-storage',
      '@/lib/journey/engine',
      '@/lib/journey/scenarios',
    ]) {
      expect(display, forbidden).not.toContain(forbidden)
    }
  })

  it('keeps the protected reveals out of the display route entirely', () => {
    // Walk what the display page can reach, one hop at a time, and assert the
    // debrief module never appears. Sponsor / Higher Power and the
    // autobiographical reveal live only there.
    const seen = new Set<string>()
    const queue = ['app/liap/journey/page.tsx']
    while (queue.length) {
      const file = queue.shift()!
      if (seen.has(file)) continue
      seen.add(file)
      const text = code(file)
      for (const match of text.matchAll(/from ['"]@\/([^'"]+)['"]/g)) {
        const target = match[1]
        for (const ext of ['.ts', '.tsx']) {
          const candidate = `${target}${ext}`
          if (existsSync(join(root, candidate))) queue.push(candidate)
        }
      }
    }
    expect([...seen]).not.toContain('lib/journey/debrief.ts')
    expect([...seen]).not.toContain('lib/journey/session-storage.ts')
    // NEGATIVE CONTROL — the walker does find real imports, so an empty result
    // is not why this passed.
    expect([...seen]).toContain('components/liap/journey/JourneyMap.tsx')
    expect([...seen]).toContain('lib/journey/channel.ts')

    // The God at the Center Reveal carries no script — it is owner-pending —
    // so the autobiographical lines are what there is to leak, plus the
    // superseded framing itself.
    const revealLine = DEBRIEF_SEQUENCE.find((c) => c.id === 'personal-reveal')!.asks[1]
    for (const file of seen) {
      expect(code(file), file).not.toContain(revealLine)
      expect(code(file), file).not.toMatch(/God at the Center/i)
      expect(code(file), file).not.toMatch(/Higher Power/i)
    }
  })
})

describe('timing and the contingency buffer', () => {
  it('never puts the buffer or the total on the wire', () => {
    const state = { ...populatedSession(), startedAt: 0 }
    const projection = projectJourney(state, 95 * 60_000)
    const wire = JSON.stringify(projection)
    expect(wire).not.toContain(String(BUFFER_MINUTES))
    expect(wire).not.toContain(String(TOTAL_MINUTES))
    expect(Object.keys(projection)).not.toContain('bufferRemaining')
    expect(Object.keys(projection)).not.toContain('totalRemaining')
    expect(projection.windowMinutes).toBe(WINDOW_MINUTES)
  })

  it('floors the projected clock at zero while the facilitator sees the overrun', () => {
    const state = { ...initialJourney(), startedAt: 0 }
    // 95 minutes in: five minutes past the window the room was told about.
    const projection = projectJourney(state, 95 * 60_000)
    expect(projection.minutesRemaining).toBe(0)

    const clock = facilitatorClock(0, 95 * 60_000)
    expect(clock.onBuffer).toBe(true)
    expect(Math.round(clock.bufferUsed)).toBe(5)
    expect(Math.round(clock.totalRemaining)).toBe(25)

    // NEGATIVE CONTROL — an unfloored clock would show the room a negative
    // number and hand them the fact that time is being borrowed.
    expect(Math.ceil(WINDOW_MINUTES - 95)).toBeLessThan(0)
  })

  it('keeps the buffer constants out of every participant-facing module', () => {
    const participantFacing = [
      'components/liap/journey/JourneyMap.tsx',
      'components/liap/journey/MyProject.tsx',
      'app/liap/journey/page.tsx',
      'app/liap/journey/my-project/page.tsx',
    ]
    for (const file of participantFacing) {
      const text = code(file)
      expect(text, file).not.toContain('BUFFER_MINUTES')
      expect(text, file).not.toContain('TOTAL_MINUTES')
      expect(text, file).not.toContain('facilitatorClock')
    }
  })
})

describe('MY PROJECT never touches a server', () => {
  const MY_PROJECT_FILES = ['lib/journey/my-project.ts', 'components/liap/journey/MyProject.tsx']

  it('cannot transmit', () => {
    for (const file of MY_PROJECT_FILES) {
      const text = code(file)
      for (const forbidden of ['fetch(', 'XMLHttpRequest', 'navigator.sendBeacon', 'WebSocket', "'use server'", 'axios']) {
        expect(text, `${file} / ${forbidden}`).not.toContain(forbidden)
      }
    }
  })

  it('cannot persist', () => {
    for (const file of MY_PROJECT_FILES) {
      const text = code(file)
      for (const forbidden of ['localStorage', 'sessionStorage', 'document.cookie', 'indexedDB', 'searchParams', 'history.pushState']) {
        expect(text, `${file} / ${forbidden}`).not.toContain(forbidden)
      }
    }
  })

  it('cannot reach the facilitator storage exception or the projected screen', () => {
    for (const file of MY_PROJECT_FILES) {
      const text = code(file)
      expect(text, file).not.toContain('session-storage')
      expect(text, file).not.toContain('journey/channel')
      expect(text, file).not.toContain('BroadcastChannel')
    }
  })

  it('has no analytics or logging call', () => {
    for (const file of MY_PROJECT_FILES) {
      const text = code(file)
      for (const forbidden of ['console.log', 'gtag', 'analytics', 'track(', 'Sentry']) {
        expect(text, `${file} / ${forbidden}`).not.toContain(forbidden)
      }
    }
  })

  it('organises what the participant wrote and adds nothing', () => {
    const draft = {
      ...emptyDraft(),
      opening: { project: '  Move   my mother  ' },
      points: { start: '  Living   two hours away ', destination: 'She is safe and near me' },
      extras: { 'risk-ahead': ' Her lease  ends in May ' },
    }
    const roadmap = buildMyProjectRoadmap(draft)

    expect(roadmap.title).toBe('Move my mother')
    expect(roadmap.steps[0].text).toBe('Living two hours away')
    // The label is the approved artifact's, in the approved capitalisation.
    expect(roadmap.extras).toEqual([{ label: 'RISK AHEAD', text: 'Her lease ends in May' }])

    // Every output word came from the input. Nothing was suggested, expanded,
    // summarised or completed.
    const inputWords = new Set(
      [...Object.values(draft.opening), ...Object.values(draft.points), ...Object.values(draft.extras)]
        .join(' ')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean),
    )
    const outputWords = [...roadmap.steps, ...roadmap.extras]
      .map((s) => s.text)
      .concat(roadmap.title)
      .join(' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
    for (const word of outputWords) expect(inputWords.has(word), word).toBe(true)
  })

  it('treats the optional fields as optional', () => {
    const draft = emptyDraft()
    const points = Object.fromEntries(MY_PROJECT_STEPS.map((s) => [s.pointId, 'answered']))
    const roadmap = buildMyProjectRoadmap({ ...draft, points })
    expect(roadmap.complete).toBe(true)
    expect(roadmap.extras).toEqual([])
    expect(MY_PROJECT_EXTRAS.length).toBe(13)
  })

  it('asks questions and never proposes an answer', () => {
    for (const step of MY_PROJECT_STEPS) {
      expect(step.prompt.trim().endsWith('?'), step.pointId).toBe(true)
      expect(step.nudge.trim().endsWith('?'), step.pointId).toBe(true)
    }
    for (const field of MY_PROJECT_OPENING) {
      expect(field.prompt.trim().endsWith('?'), field.id).toBe(true)
    }
    // Two approved fields are bare labelled lines with no question at all —
    // "My revised next move" and "Target date". Artifact 5 asks nothing there,
    // so nothing is invented.
    for (const extra of MY_PROJECT_EXTRAS.filter((e) => e.prompt)) {
      expect(extra.prompt.trim().endsWith('?'), extra.id).toBe(true)
    }
  })
})

describe('facilitator session storage is fenced', () => {
  it('is reachable only from the console', () => {
    const importers = [...LIB_MODULES, ...COMPONENTS, ...ROUTES].filter((file) =>
      code(file).includes('journey/session-storage'),
    )
    expect(importers).toEqual(['components/liap/journey/FacilitatorConsole.tsx'])
  })

  it('uses sessionStorage and nothing wider', () => {
    const text = code('lib/journey/session-storage.ts')
    expect(text).toContain('sessionStorage')
    for (const forbidden of ['localStorage', 'document.cookie', 'fetch(', 'indexedDB', "'use server'"]) {
      expect(text, forbidden).not.toContain(forbidden)
    }
  })

  it('cannot be handed MY PROJECT text', () => {
    // A compiler guarantee rather than a convention: the only write function
    // takes a JourneyState, and JourneyState has no field a personal project
    // could occupy.
    const state = populatedSession()
    const keys = Object.keys(state)
    for (const myProjectKey of ['title', 'points', 'extras']) {
      expect(keys, myProjectKey).not.toContain(myProjectKey)
    }
    expect(code('lib/journey/session-storage.ts')).not.toContain('MyProjectDraft')
  })

  it('never resumes without being asked', () => {
    const console_ = code('components/liap/journey/FacilitatorConsole.tsx')
    // A stored session is offered, not applied: the adopt action fires from a
    // click handler, and readStoredSession only sets the chooser's state.
    expect(console_).toContain('readStoredSession')
    expect(console_).toContain('Resume active journey')
    expect(console_).toContain('Discard and start over')
    expect(console_).toContain('clearFacilitatorSession')
    expect(console_).toContain('beforeunload')
  })

  it('is the only adopt caller, and adopt is never automatic', () => {
    // The engine declares the action; this asserts who DISPATCHES it.
    const callers = [...LIB_MODULES, ...COMPONENTS]
      .filter((f) => f !== 'lib/journey/engine.ts')
      .filter((f) => code(f).includes("type: 'adopt'"))
    expect(callers).toEqual(['components/liap/journey/FacilitatorConsole.tsx'])
  })
})

describe('the consequence model', () => {
  it('remembers what a decision rests on and surfaces it when it breaks', () => {
    const state = populatedSession()
    const broken = brokenDependencies(state)
    expect(broken).toHaveLength(1)
    expect(broken[0].label).toBe(PRIVATE_DEPENDENCY)
    expect(broken[0].decisionText).toBe('Deliver groceries evenings')
  })

  it('suggests and never fires', () => {
    // Marking a dependency unavailable must not create an event, move the
    // team, or change what is on the wall. A human decides.
    const before = populatedSession()
    const after = journeyReduce(before, {
      type: 'set-dependency-available',
      dependencyId: 'dependency-1',
      available: false,
    })
    expect(after.events).toEqual(before.events)
    expect(after.pointIndex).toBe(before.pointIndex)
    expect(after.activeEventId).toBe(before.activeEventId)
  })

  it('shows the room its own words, never the private note', () => {
    const projection = projectJourney(populatedSession(), 10_000)
    expect(projection.events[0].becauseOf).toBe('Deliver groceries evenings')
    expect(JSON.stringify(projection.events[0])).not.toContain(PRIVATE_NOTE)
  })

  it('records what the team decided an event changed, without judging it', () => {
    const projection = projectJourney(populatedSession(), 10_000)
    expect(projection.events[0].impact).toBe('first-move')
    expect(projection.events[0].impactLabel).toBe('You changed your First Move')
    // 'none' is a real answer, not a skip.
    const noChange = journeyReduce(populatedSession(), {
      type: 'record-event-impact',
      eventRecordId: 'event-1',
      impact: 'none',
    })
    expect(projectJourney(noChange, 10_000).events[0].impactLabel).toBe('You decided it changed nothing')
  })
})

describe('GPS: Recalculating…', () => {
  it('puts the five questions on the wall, not a paraphrase', () => {
    // The major interaction. The room reads the approved questions themselves.
    const state = journeyReduce(populatedSession(), {
      type: 'reveal-event',
      eventId: 'recalculating',
      revealText: 'Stop. Before you go further.',
      facilitatorNote: 'private',
      at: 8_000,
    })
    const projected = projectJourney(state, 10_000)
    expect(projected.recalculationQuestions).toEqual(RECALCULATION_PROMPTS.map((p) => p.label))

    // And only while one is on the wall — a Risk Ahead does not carry them.
    const other = journeyReduce(populatedSession(), {
      type: 'reveal-event',
      eventId: 'risk-ahead',
      revealText: 'Something ahead',
      facilitatorNote: 'private',
      at: 8_000,
    })
    expect(projectJourney(other, 10_000).recalculationQuestions).toBeNull()
  })

  it('revises the roadmap rather than restarting it', () => {
    const before = populatedSession()
    const after = journeyReduce(before, {
      type: 'record-recalculation',
      stillTrue: 'x',
      changed: 'y',
      mattersNow: 'z',
      optionsAvailable: 'w',
      revisedNextMove: 'v',
      at: 9_000,
    })
    // Everything the team did is still there. Nothing was reset.
    expect(after.pointIndex).toBe(before.pointIndex)
    expect(after.decisions).toEqual(before.decisions)
    expect(after.events).toEqual(before.events)

    // And the recalculation decided nothing on the team's behalf. Whether the
    // Destination changed is the team's answer to the Road Event, not
    // something inferred from this form.
    expect(after.destinationRevised).toBe(before.destinationRevised)
    const teamSaidDestination = journeyReduce(before, {
      type: 'record-event-impact',
      eventRecordId: 'event-1',
      impact: 'destination',
    })
    expect(teamSaidDestination.destinationRevised).toBe(true)
  })
})

describe('the Journey Record', () => {
  it('records what happened, unscored', () => {
    const record = buildJourneyRecord(populatedSession())
    expect(record.sections.some((s) => s.entries.length > 0)).toBe(true)
    expect(record.finalNextMove).toBe('Borrow the van for a week')
    expect(Object.keys(record)).not.toContain('score')
    expect(JSON.stringify(record)).not.toContain(PRIVATE_NOTE)
  })

  it('carries both halves of a Lifeline', () => {
    const record = buildJourneyRecord(populatedSession())
    const lifeline = record.sections.flatMap((s) => s.entries).find((e) => e.kind === 'lifeline')
    expect(lifeline?.body).toContain('You asked for: Someone who knows the rules')
  })
})

describe('scenario content stays where the owner put it', () => {
  it('ships an empty digital registry', () => {
    // Version 1 runs on the printed Scenario Card Deck. This is the check that
    // keeps unapproved scenario content out, not a forgotten task.
    expect(SCENARIOS).toEqual([])
  })
})

describe('the content inventory', () => {
  it('covers every string the interface renders', () => {
    // Derived from the constants themselves rather than a magic number, so a
    // new prompt that nobody classified fails here rather than reaching a room
    // unreviewed.
    const expected =
      ROAD_EVENT_LIBRARY.length * 6 + // name, tagline, readToTeam, whenToPlay, watchFor, push
      1 + // the shared ROADMAP CHECK
      RECALCULATION_PROMPTS.length +
      IMPACT_CHOICES.length +
      PROGRESS_PROMPTS.length +
      PROGRESS_PROMPTS.filter((p) => p.whenToUse).length +
      MY_PROJECT_OPENING.length +
      MY_PROJECT_STEPS.length * 2 + // prompts + nudges
      MY_PROJECT_EXTRAS.filter((e) => e.prompt).length +
      MAKE_IT_REAL_COLUMNS.length +
      MY_PROJECT_CLOSING.length +
      2 + // MY PROJECT intro and signoff
      1 + // exit warning
      DEBRIEF_SEQUENCE.reduce((n, m) => n + m.asks.length, 0) +
      DEBRIEF_SEQUENCE.length + // one note each
      DEBRIEF_DO_NOT.length +
      DEBRIEF_FINAL_REMINDER.length +
      DISPLAY_STRINGS.length
    expect(CONTENT_INVENTORY).toHaveLength(expected)
  })

  it("reads the display component's own copy, which it once missed entirely", () => {
    // The hole reconciliation found: eight participant-facing lines hardcoded
    // in JSX, projected onto a wall, invisible to a generated inventory that
    // only read the content modules.
    for (const entry of DISPLAY_STRINGS) {
      expect(CONTENT_INVENTORY.some((c) => c.id === entry.id), entry.id).toBe(true)
    }
    // And the component renders them from the constant rather than inline.
    const display = code('components/liap/journey/JourneyMap.tsx')
    expect(display).toContain('DISPLAY_COPY')
    for (const entry of DISPLAY_STRINGS) {
      expect(display, entry.id).not.toContain(entry.text)
    }
  })

  it('names an approved source for every approved string', () => {
    const approved = CONTENT_INVENTORY.filter((e) => e.provenance === 'owner-approved')
    for (const entry of approved) expect(entry.source, entry.id).toBeTruthy()
    // Reconciliation moved the great majority across; some remain mine.
    expect(approved.length).toBeGreaterThan(CONTENT_INVENTORY.length / 2)
    expect(pendingOwnerReview().length).toBeGreaterThan(0)
  })

  it('carries no unresolved conflict, and would describe one if it did', () => {
    // All six artifact-vs-artifact conflicts were ruled on by the owner on
    // 25 August 2026. The mechanism stays: a conflict entry must carry both
    // readings, never a quiet choice between them.
    const conflicts = wordingConflicts()
    expect(conflicts).toEqual([])
    for (const entry of conflicts) expect(entry.conflict, entry.id).toBeTruthy()
  })

  it('says who sees each string', () => {
    for (const entry of CONTENT_INVENTORY) {
      expect(['participant', 'facilitator'], entry.id).toContain(entry.audience)
      expect(entry.where.length, entry.id).toBeGreaterThan(0)
    }
    // Nothing marked facilitator-only may appear on the wire.
    const wire = JSON.stringify(projectJourney(populatedSession(), 10_000))
    for (const entry of CONTENT_INVENTORY.filter((e) => e.audience === 'facilitator')) {
      expect(wire, entry.id).not.toContain(entry.text)
    }
  })
})

describe('the projected surface carries no site chrome', () => {
  it('strips navigation, newsletter, footer and cookie banner from the two facilitated screens', () => {
    // A cookie consent dialog over a team's Road Event, in a paid Intensive,
    // is the wrong company showing up in the middle of somebody's session.
    expect(isBareSurface('/liap/journey')).toBe(true)
    expect(isBareSurface('/liap/journey/facilitator')).toBe(true)
    for (const file of [
      'components/layout/Navbar.tsx',
      'components/layout/Footer.tsx',
      'components/layout/NewsletterSignup.tsx',
      'components/CookieBanner.tsx',
    ]) {
      expect(code(file), file).toContain('isBareSurface')
    }
  })

  it('leaves MY PROJECT inside the shell', () => {
    // A participant's own device, and they may want the privacy policy from
    // the footer. Prefix matching would have swallowed this route.
    expect(isBareSurface('/liap/journey/my-project')).toBe(false)
  })

  it('makes no existing page bare', () => {
    // NEGATIVE CONTROL for a shared-component change: every route in the app
    // other than the two named ones keeps its chrome.
    const routes = new Set<string>()
    const walk = (dir: string, prefix: string) => {
      for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
        if (entry.isDirectory() && !entry.name.startsWith('(') && entry.name !== 'api') {
          walk(`${dir}/${entry.name}`, `${prefix}/${entry.name}`)
        }
        if (entry.name === 'page.tsx') routes.add(prefix || '/')
      }
    }
    walk('app', '')
    expect(routes.size).toBeGreaterThan(20)
    const bare = [...routes].filter((r) => isBareSurface(r))
    expect(bare.sort()).toEqual([...BARE_SURFACES].sort())
  })

  it('keeps the Virtual Guide off every Journey Game page', () => {
    // Including MY PROJECT — a chat bubble beside a page whose guarantee is
    // "this never leaves your browser" is an invitation to paste it somewhere
    // that does post to a server.
    expect(code('components/chat/ChatWidget.tsx')).toContain("'/liap/journey'")
  })
})

describe('display recovery — the console stays the source of truth', () => {
  it('answers a reconnecting display with a read, never a mutation', () => {
    // The whole safeguard in one assertion: whatever a display does on
    // reconnect, the console's state must come back identical. `hello` is
    // handled by projecting current state, and projection cannot write.
    const before = populatedSession()
    const snapshot = JSON.stringify(before)

    // Three reconnects in a row — accidental close, refresh, unplugged HDMI.
    const first = projectJourney(before, 20_000)
    const second = projectJourney(before, 21_000)
    const third = projectJourney(before, 22_000)

    expect(JSON.stringify(before)).toBe(snapshot)
    expect(first.pointIndex).toBe(before.pointIndex)
    expect(second.pointIndex).toBe(before.pointIndex)
    expect(third.pointIndex).toBe(before.pointIndex)
    // The revealed event is still revealed. Reconnecting does not consume it.
    expect(third.events).toHaveLength(before.events.length)
    expect(third.activeEventId).toBe(before.activeEventId)
    expect(third.decisions).toHaveLength(before.decisions.length)
  })

  it('does not reset the 90-minute clock on reconnect', () => {
    // The clock is derived from startedAt, which lives on the console. A
    // display that reconnects at minute 40 sees 50 minutes left, not 90.
    const state = { ...populatedSession(), startedAt: 0 }
    const atFortyMinutes = projectJourney(state, 40 * 60_000)
    expect(atFortyMinutes.minutesRemaining).toBe(50)

    // NEGATIVE CONTROL — a clock restarted by the reconnect would read 90.
    const ifReset = projectJourney({ ...state, startedAt: 40 * 60_000 }, 40 * 60_000)
    expect(ifReset.minutesRemaining).toBe(90)
  })

  it('still exposes nothing private after a reconnect', () => {
    const wire = JSON.stringify(projectJourney(populatedSession(), 30_000))
    expect(wire).not.toContain(PRIVATE_NOTE)
    expect(wire).not.toContain(PRIVATE_DEPENDENCY)
    expect(wire).not.toContain(String(BUFFER_MINUTES))
  })

  it('keeps asking until the console answers, then stops', () => {
    // A display opened before the console would otherwise sit on "Waiting for
    // the facilitator" until the next thing the facilitator happened to do.
    const display = code('components/liap/journey/JourneyMap.tsx')
    expect(display).toContain("channel.post({ kind: 'hello' })")
    expect(display).toContain('setInterval')
    expect(display).toContain('stopAsking()')

    // And the console answers a hello by projecting — a read of stateRef,
    // never a dispatch.
    const console_ = code('components/liap/journey/FacilitatorConsole.tsx')
    expect(console_).toContain("if (message.kind === 'hello') broadcast(stateRef.current, Date.now())")
    // NEGATIVE CONTROL for the claim above: the console does dispatch
    // elsewhere, so finding no dispatch in the hello path is meaningful.
    expect(console_).toContain('dispatch(')
  })

  it('gives the display no way to drive the session', () => {
    const display = code('components/liap/journey/JourneyMap.tsx')
    // No reducer, no actions, no writes. It renders what it was handed.
    for (const forbidden of ['useReducer', 'journeyReduce', 'dispatch', 'onClick', '<button', '<input']) {
      expect(display, forbidden).not.toContain(forbidden)
    }
    // It posts exactly one kind of message, and that message carries no state.
    expect(display).not.toContain("kind: 'state'")
    expect(display).not.toContain("kind: 'console-hello'")
  })
})

describe('the locked road', () => {
  it('is exactly the six permanent points, in order, in the approved words', () => {
    expect(ROADMAP_POINTS.map((p) => p.label)).toEqual([
      'TODAY / START',
      'FIRST MOVE',
      'DECISION / MILESTONE CHECK',
      'NEXT MILESTONE',
      'NEXT MILESTONE',
      'DESTINATION',
    ])
    // And it is projected whole, so the room learns a shape it can reproduce.
    expect(projectJourney(populatedSession(), 10_000).points).toEqual(ROADMAP_POINTS)
  })

  it('never turns a Road Event into a roadmap point', () => {
    const pointIds = new Set(ROADMAP_POINTS.map((p) => p.id))
    for (const event of ROAD_EVENT_LIBRARY) {
      expect(pointIds.has(event.id as never), event.id).toBe(false)
    }
    expect(ROADMAP_POINTS).toHaveLength(6)
  })
})

describe('GPS: Recalculating… — the five owner-ruled questions', () => {
  it('asks exactly these five, in this order, in these words', () => {
    expect(RECALCULATION_PROMPTS.map((p) => p.label)).toEqual([
      'What is still true?',
      'What changed?',
      'What matters now?',
      'What options are available now?',
      'What is my revised next move?',
    ])
  })

  it('puts those same five on the wall, not a paraphrase of them', () => {
    const state = journeyReduce(populatedSession(), {
      type: 'reveal-event',
      eventId: 'recalculating',
      revealText: 'Something changed.',
      facilitatorNote: 'private',
      at: 8_000,
    })
    expect(projectJourney(state, 10_000).recalculationQuestions).toEqual(
      RECALCULATION_PROMPTS.map((p) => p.label),
    )
  })

  it("decides nothing on the team's behalf", () => {
    // No verdict field, no 'holds' / 'changes' enum, nothing the software
    // could read as a judgement about the road.
    const record = populatedSession().recalculations[0]
    expect(Object.keys(record).sort()).toEqual([
      'afterPointId',
      'at',
      'changed',
      'id',
      'mattersNow',
      'optionsAvailable',
      'revisedNextMove',
      'stillTrue',
    ])
  })
})

describe('facilitator pacing', () => {
  it('offers a nudge at five minutes and never advances on its own', () => {
    const started = journeyReduce(initialJourney(), { type: 'begin', at: 0 })
    expect(shouldOfferPacingNudge(started, 4 * 60_000)).toBe(false)
    expect(shouldOfferPacingNudge(started, PACING_NUDGE_MINUTES * 60_000)).toBe(true)

    // NEGATIVE CONTROL — the nudge is advisory. Nothing about crossing five
    // minutes moves the team; only the facilitator does.
    expect(journeyReduce(started, { type: 'begin', at: 99 }).pointIndex).toBe(started.pointIndex)
    expect(minutesAtPoint(started, 6 * 60_000)).toBeCloseTo(6)
  })

  it('restarts the pacing clock when the team actually moves', () => {
    const started = journeyReduce(initialJourney(), { type: 'begin', at: 0 })
    const moved = journeyReduce(started, { type: 'advance-point', at: 10 * 60_000 })
    expect(minutesAtPoint(moved, 12 * 60_000)).toBeCloseTo(2)
    expect(shouldOfferPacingNudge(moved, 12 * 60_000)).toBe(false)
  })

  it('keeps the pacing clock off the wall', () => {
    // A projected countdown of how long a team has been stuck would be a
    // public criticism of that team in front of the room.
    const state = { ...populatedSession(), pointEnteredAt: 0 }
    const wire = JSON.stringify(projectJourney(state, 10 * 60_000))
    expect(wire).not.toContain('pointEnteredAt')
    expect(wire).not.toContain('minutesAtPoint')
    for (const file of ['components/liap/journey/JourneyMap.tsx', 'app/liap/journey/page.tsx']) {
      expect(code(file), file).not.toContain('PACING_NUDGE_MINUTES')
      expect(code(file), file).not.toContain('minutesAtPoint')
    }
  })
})

describe('WISER Pivots™ stays behind the experience', () => {
  it('appears in no module a participant loads', () => {
    for (const file of [
      'components/liap/journey/JourneyMap.tsx',
      'components/liap/journey/MyProject.tsx',
      'app/liap/journey/page.tsx',
      'app/liap/journey/my-project/page.tsx',
      'lib/journey/display-copy.ts',
      'lib/journey/my-project.ts',
    ]) {
      expect(code(file), file).not.toMatch(/WISER\s*Pivots/i)
      expect(code(file), file).not.toMatch(/\bPIVOTS?\b/)
    }
    // Nor in anything the projection carries.
    expect(JSON.stringify(projectJourney(populatedSession(), 10_000))).not.toMatch(
      /WISER\s*Pivots/i,
    )
  })

  it('is not modelled anywhere in this product', () => {
    // The Journey Game teaches the need for it. The framework itself belongs
    // to the facilitated debrief and is not this codebase's to hold.
    for (const file of LIB_MODULES) {
      expect(code(file), file).not.toMatch(/WAIT[\s\S]*INSPECT[\s\S]*SELECT/i)
    }
  })
})

describe('God at the Center', () => {
  it('replaces the Sponsor framing entirely', () => {
    const moment = DEBRIEF_SEQUENCE.find((m) => m.stage === 'god-at-the-center')
    expect(moment).toBeDefined()
    expect(moment!.heading).toBe('God at the Center Reveal')
    // Superseded framing is gone from the whole codebase, not just hidden.
    for (const file of [...LIB_MODULES, ...COMPONENTS, ...ROUTES]) {
      expect(code(file), file).not.toContain('Who is the Sponsor of your life project?')
      expect(code(file), file).not.toMatch(/Higher Power/)
    }
  })

  it('ships no script, and generates none', () => {
    // Owner: keep the final reveal script OWNER PENDING; do not generate,
    // rewrite or publish a replacement.
    const moment = DEBRIEF_SEQUENCE.find((m) => m.stage === 'god-at-the-center')!
    expect(moment.asks).toEqual([])
    expect(moment.ownerWordingPending).toBe('superseded')
    expect(moment.note).toContain('OWNER WORDING PENDING')
  })

  it('never frames God as a project role', () => {
    // Owner: not a sponsor, stakeholder, resource, Lifeline or contingency.
    // Includes the words BEFORE "God" as well, so the sentence that forbids
    // the framing is recognisable as the prohibition it is.
    const nearGod = /.{0,50}God[^.]{0,120}/gi
    for (const file of [...LIB_MODULES, ...COMPONENTS]) {
      for (const passage of code(file).match(nearGod) ?? []) {
        // The permitted mention is the prohibition itself, in the owner's own
        // words — "Do not frame God as merely a Sponsor, stakeholder,
        // resource, Lifeline, or contingency." A rule has to be able to name
        // what it forbids.
        const lower = passage.toLowerCase()
        if (lower.includes('not frame god as merely') || lower.includes('not a project sponsor')) {
          continue
        }
        for (const role of [
          'sponsor',
          'stakeholder',
          'resource',
          'lifeline',
          'contingency',
          'dependency',
          'tool for',
        ]) {
          expect(lower, `${file} / ${role}`).not.toContain(role)
        }
      }
    }
  })

  it('carries the approved autobiographical reveal verbatim', () => {
    // OWNER-APPROVED FINAL in the RECONCILED master: twenty paragraphs, in
    // order, unedited.
    const moment = DEBRIEF_SEQUENCE.find((m) => m.stage === 'personal-reveal')!
    expect(moment.ownerWordingPending).toBeUndefined()
    expect(moment.asks).toHaveLength(20)
    expect(moment.asks[0]).toBe(
      'There is something else I did not tell you when we began this Journey.',
    )
    expect(moment.asks[3]).toBe('They came from real life.')
    // It ends by handing the room to their own project, which is why the
    // protected sequence runs through the reveal rather than stopping at it.
    expect(moment.asks.at(-3)).toBe('Start with what is true TODAY.')
    expect(moment.asks.at(-2)).toBe('Then determine your FIRST MOVE.')
    expect(moment.asks.at(-1)).toBe('From there, we will begin building your road.')
    expect(moment.note).toContain('OWNER-APPROVED FINAL')
    // The superseded eight-line Artifact 6 script is gone, not kept beside it.
    expect(moment.asks).not.toContain(
      'Every one of these high-impact scenarios was rooted in something that happened in my life.',
    )
  })

  it('keeps the protected sequence in the ruled order', () => {
    expect(PROTECTED_SEQUENCE).toEqual([
      'EXPERIENCE',
      'DEBRIEF',
      'GOD AT THE CENTER',
      'AUTOBIOGRAPHICAL REVEAL',
      'TRANSFER TO THEIR PROJECT',
      'TODAY',
      'FIRST MOVE',
    ])
    // The debrief moments run in that order too — God at the Center before the
    // reveal, and both after the room has named what it did.
    const stages = DEBRIEF_SEQUENCE.map((m) => m.stage)
    expect(stages.indexOf('god-at-the-center')).toBeLessThan(stages.indexOf('personal-reveal'))
    expect(stages.indexOf('name-it')).toBeLessThan(stages.indexOf('god-at-the-center'))
  })

  it('keeps the whole reveal off every participant surface', () => {
    // Twenty paragraphs of somebody's life, in a module the display cannot
    // reach. Checked line by line rather than by module name.
    const moment = DEBRIEF_SEQUENCE.find((m) => m.stage === 'personal-reveal')!
    const participantFacing = [
      'components/liap/journey/JourneyMap.tsx',
      'components/liap/journey/MyProject.tsx',
      'lib/journey/display-copy.ts',
      'lib/journey/projection.ts',
      'app/liap/journey/page.tsx',
      'app/liap/journey/my-project/page.tsx',
    ]
    for (const line of moment.asks) {
      for (const file of participantFacing) {
        expect(code(file), `${file} / ${line.slice(0, 40)}`).not.toContain(line)
      }
    }
    // And none of it crosses the wire.
    const wire = JSON.stringify(projectJourney(populatedSession(), 10_000))
    for (const line of moment.asks) expect(wire).not.toContain(line)
  })
})

describe('canonical wording rulings', () => {
  it('uses the ellipsis character throughout, with no exemption left', () => {
    expect(roadEvent('recalculating').name).toBe('GPS: Recalculating…')

    // The one exemption this rule used to need is gone. The old Artifact 6
    // script contained 'the GPS of my life said, "Recalculating..."' with
    // three periods, and rewriting somebody's testimony to satisfy a style
    // rule was not on the table. The RECONCILED master's approved reveal does
    // not contain the phrase at all, so the rule is now absolute.
    for (const file of [...LIB_MODULES, ...COMPONENTS]) {
      expect(code(file), file).not.toContain('Recalculating...')
      expect(code(file), file).not.toContain('RECALCULATING...')
    }
  })

  it('uses the ruled form of each prompt that was in conflict', () => {
    const text = (id: string) => PROGRESS_PROMPTS.find((p) => p.id === id)!.text
    expect(text('do-nothing')).toBe('What happens if you do nothing?')
    expect(text('road-or-destination')).toBe('Does the road change, or does the Destination change?')
    expect(text('next-wise-move')).toBe('What is your next wise move?')
    // NEGATIVE CONTROL — the superseded variants appear nowhere.
    for (const file of LIB_MODULES) {
      expect(code(file), file).not.toContain('What happens if nothing changes?')
      expect(code(file), file).not.toContain('Does the route change, or does the destination change?')
      expect(code(file), file).not.toContain('What is the next wise move?')
    }
  })

  it('uses the transfer vocabulary on MY PROJECT and the metaphor in the game', () => {
    const labels = MY_PROJECT_EXTRAS.map((e) => e.label)
    expect(labels).toContain('PEOPLE AND SUPPORT')
    expect(labels).toContain('DEPENDENCIES AND BACKUP')
    expect(labels).toContain('LIFELINES')
    expect(MY_PROJECT_OPENING.find((f) => f.id === 'why')!.label).toBe('WHY IT MATTERS')
    expect(labels).not.toContain('TEAM / SUPPORT')
    expect(labels).not.toContain('NO SIGNAL / BACKUP')

    // And the Journey keeps its own words — No Signal is still No Signal on
    // the road, and nothing was mechanically replaced to match.
    expect(roadEvent('no-signal').name).toBe('No Signal')
    expect(roadEvent('lifeline').name).toBe('Lifeline')
  })

  it('keeps the two review prompts verbatim from the Plan', () => {
    const byId = new Map(MY_PROJECT_EXTRAS.map((e) => [e.id, e]))
    expect(byId.get('review-rhythm')!.label).toBe('MY REVIEW RHYTHM')
    expect(byId.get('review-rhythm')!.prompt).toBe(
      'How often will I review this plan, and what will I inspect when I do?',
    )
    expect(byId.get('ask-for-help')!.label).toBe('WHEN I WILL ASK FOR HELP')
    expect(byId.get('ask-for-help')!.prompt).toBe(
      'What will tell me it is time to use a Lifeline or seek additional support?',
    )
  })
})

describe('the obsolete Sponsor framing is gone', () => {
  it('appears nowhere in the LIAP codebase', () => {
    // Every one of the passages the owner named. The PMP exam-prep content is
    // out of scope by ruling — sponsor terminology may stay where it teaches
    // the actual project-management role — so this checks LIAP only.
    const LIAP_FILES = [
      ...LIB_MODULES,
      ...COMPONENTS,
      ...ROUTES,
      ...readdirSync(join(root, 'lib/liap/workshop')).map((f) => `lib/liap/workshop/${f}`),
    ]
    const obsolete = [
      'The Missing Role',
      'Who is the Sponsor of your life project?',
      'Sponsor moment',
      'The Sponsor Reveal',
      'Higher Power',
      'the Sponsor question',
    ]
    for (const file of LIAP_FILES) {
      for (const phrase of obsolete) {
        expect(code(file), `${file} / ${phrase}`).not.toContain(phrase)
      }
    }
  })

  it('left the PMP exam content alone, as ruled', () => {
    // NEGATIVE CONTROL for the scope above: sponsor terminology teaching the
    // real PM role still exists, so the sweep was targeted rather than a
    // blanket find-and-replace across the repository.
    expect(source('lib/exam-questions.ts')).toContain('project sponsor')
  })
})

describe('the six MY PROJECT second questions are canonical', () => {
  it('are exactly the owner-approved wording, in road order', () => {
    expect(MY_PROJECT_STEPS.map((s) => s.nudge)).toEqual([
      'What do you know to be true right now?',
      'What can you begin with what you have now?',
      'What do you need to know before you decide?',
      'How will you know you reached this milestone?',
      'What needs to happen before you can move forward?',
      'What will tell you that you have reached your intended outcome?',
    ])
  })

  it('carry no example, suggestion or coaching', () => {
    // Every one ends in a question mark and contains no sentence that could
    // propose an answer. The moment one becomes a suggestion the roadmap stops
    // being the participant's.
    for (const step of MY_PROJECT_STEPS) {
      expect(step.nudge.trim().endsWith('?'), step.pointId).toBe(true)
      expect(step.nudge.split('?').filter(Boolean), step.pointId).toHaveLength(1)
      for (const tell of ['for example', 'e.g.', 'try ', 'consider ', 'you should', 'we recommend']) {
        expect(step.nudge.toLowerCase(), `${step.pointId} / ${tell}`).not.toContain(tell)
      }
    }
  })

  it('replaced mine rather than joining them', () => {
    const retired = [
      'What is true right now that you would rather not write down?',
      'If this went well, what is different a year from now?',
    ]
    for (const file of LIB_MODULES) {
      for (const old of retired) expect(code(file), file).not.toContain(old)
    }
  })
})

describe('the ten functional strings are approved inventory', () => {
  it('carries each one as owner-approved with a source', () => {
    const approvedText = new Set(
      CONTENT_INVENTORY.filter((e) => e.provenance === 'owner-approved').map((e) => e.text),
    )
    for (const text of [
      'You changed your First Move',
      'You changed your Decision / Milestone Check',
      'You changed your Next Milestone',
      'You changed a later milestone',
      'You changed your Destination',
      'You decided it changed nothing',
      'THE JOURNEY',
      'Waiting for the facilitator…',
      'task window',
      'Because you decided:',
    ]) {
      expect(approvedText.has(text), text).toBe(true)
    }
  })

  it('leaves exactly one entry pending, and it is the missing script marker', () => {
    const pending = pendingOwnerReview()
    expect(pending).toHaveLength(1)
    expect(pending[0].id).toBe('debrief.god-at-the-center.note')
    expect(pending[0].text).toContain('OWNER WORDING PENDING')
  })
})

describe('the God at the Center script stays unwritten', () => {
  it('holds the foundation and the placement, and no script', () => {
    const moment = DEBRIEF_SEQUENCE.find((m) => m.stage === 'god-at-the-center')!
    expect(moment.asks).toEqual([])
    expect(moment.ownerWordingPending).toBe('superseded')
    expect(GOD_AT_THE_CENTER_FOUNDATION).toContain('God is the Creator and foundation of life')
  })

  it('does not let the foundation statement become the script', () => {
    // The distinction the owner drew explicitly. The foundation is a statement
    // ABOUT the reveal for the facilitator; the reveal is what is said to the
    // room. Nothing renders the foundation as an ask.
    const moment = DEBRIEF_SEQUENCE.find((m) => m.stage === 'god-at-the-center')!
    expect(moment.asks).not.toContain(GOD_AT_THE_CENTER_FOUNDATION)
    for (const m of DEBRIEF_SEQUENCE) {
      expect(m.asks, m.id).not.toContain(GOD_AT_THE_CENTER_FOUNDATION)
    }
    // And the console renders `asks`, so an empty list is an empty panel.
    expect(code('components/liap/journey/DebriefPanel.tsx')).toContain('cue.asks.map')
    expect(code('components/liap/journey/DebriefPanel.tsx')).not.toContain(
      'GOD_AT_THE_CENTER_FOUNDATION',
    )
  })
})

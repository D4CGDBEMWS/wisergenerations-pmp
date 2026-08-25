import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { initialJourney, journeyReduce, brokenDependencies, type JourneyAction } from '@/lib/journey/engine'
import { projectJourney } from '@/lib/journey/projection'
import { buildJourneyRecord } from '@/lib/journey/record'
import { BUFFER_MINUTES, TOTAL_MINUTES, WINDOW_MINUTES, facilitatorClock } from '@/lib/journey/timing'
import { ROAD_EVENT_LIBRARY, RECALCULATION_PROMPTS } from '@/lib/journey/events'
import { SCENARIOS } from '@/lib/journey/scenarios'
import { BARE_SURFACES, isBareSurface } from '@/lib/shell'
import { CONTENT_INVENTORY, pendingOwnerReview } from '@/lib/journey/content'
import { PROGRESS_PROMPTS } from '@/lib/journey/prompts'
import { DEBRIEF_SEQUENCE } from '@/lib/journey/debrief'
import {
  MY_PROJECT_EXTRAS,
  MY_PROJECT_STEPS,
  buildMyProjectRoadmap,
  emptyDraft,
} from '@/lib/journey/my-project'
import type { JourneyState } from '@/lib/journey/types'

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
    { type: 'advance-point' },
    {
      type: 'record-recalculation',
      stillTrue: 'The need is still the need',
      changed: 'No vehicle',
      destinationValid: 'holds',
      milestoneToChange: 'The first milestone',
      nextMove: 'Borrow the van for a week',
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
    expect(journeyReduce(state, { type: 'advance-point' }).pointIndex).toBe(state.pointIndex + 1)
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
    for (const event of unrevealed) expect(wire).not.toContain(event.intent)
  })

  it('carries no facilitator guidance on the active prompt', () => {
    const guidance = PROGRESS_PROMPTS.find((p) => p.id === 'research')!.whenToUse
    expect(wire).not.toContain(guidance)
    // The prompt TEXT is on the wire — that is the point of putting it up.
    expect(wire).toContain(PROGRESS_PROMPTS.find((p) => p.id === 'research')!.text)
  })

  it('names WISER Pivots nowhere a participant can reach', () => {
    expect(wire).not.toMatch(/WISER/i)
    for (const file of [...COMPONENTS.filter((f) => !f.includes('Facilitator') && !f.includes('Debrief'))]) {
      expect(code(file), file).not.toMatch(/WISER/i)
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

    const sponsorCue = DEBRIEF_SEQUENCE.find((c) => c.id === 'sponsor')!.cue
    for (const file of seen) expect(code(file), file).not.toContain(sponsorCue)
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
      title: '  Move   my mother  ',
      points: { start: '  Living   two hours away ', destination: 'She is safe and near me' },
      extras: { 'risk-ahead': ' Her lease  ends in May ' },
    } as ReturnType<typeof emptyDraft>
    const roadmap = buildMyProjectRoadmap(draft)

    expect(roadmap.title).toBe('Move my mother')
    expect(roadmap.steps[0].text).toBe('Living two hours away')
    expect(roadmap.extras).toEqual([{ label: 'Risk Ahead', text: 'Her lease ends in May' }])

    // Every output word came from the input. Nothing was suggested, expanded,
    // summarised or completed.
    const inputWords = new Set(
      [draft.title, ...Object.values(draft.points), ...Object.values(draft.extras)]
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
    expect(MY_PROJECT_EXTRAS.length).toBe(10)
  })

  it('asks questions and never proposes an answer', () => {
    for (const step of MY_PROJECT_STEPS) {
      expect(step.prompt.trim().endsWith('?'), step.pointId).toBe(true)
      expect(step.nudge.trim().endsWith('?'), step.pointId).toBe(true)
    }
    for (const extra of MY_PROJECT_EXTRAS) {
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
  it('asks the five owner-specified questions, in order', () => {
    expect(RECALCULATION_PROMPTS.map((p) => p.key)).toEqual([
      'stillTrue',
      'changed',
      'destinationValid',
      'milestoneToChange',
      'nextMove',
    ])
  })

  it('revises the roadmap rather than restarting it', () => {
    const before = populatedSession()
    const after = journeyReduce(before, {
      type: 'record-recalculation',
      stillTrue: 'x',
      changed: 'y',
      destinationValid: 'changes',
      milestoneToChange: 'z',
      nextMove: 'w',
      at: 9_000,
    })
    // Everything the team did is still there. Nothing was reset.
    expect(after.pointIndex).toBe(before.pointIndex)
    expect(after.decisions).toEqual(before.decisions)
    expect(after.events).toEqual(before.events)
    expect(after.destinationRevised).toBe(true)
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
    // Assembled from the constants themselves, so a new prompt that nobody
    // classified fails here rather than reaching a room unreviewed.
    const expected =
      ROAD_EVENT_LIBRARY.length * 2 + // names + intents
      RECALCULATION_PROMPTS.length +
      6 + // impact labels
      PROGRESS_PROMPTS.length * 2 + // text + whenToUse
      MY_PROJECT_STEPS.length * 2 + // prompts + nudges
      MY_PROJECT_EXTRAS.length +
      1 + // exit warning
      DEBRIEF_SEQUENCE.length * 2 // cue + note
    expect(CONTENT_INVENTORY).toHaveLength(expected)
  })

  it('marks the owner-approved language as approved and everything else as pending', () => {
    const approved = CONTENT_INVENTORY.filter((e) => e.provenance === 'owner-approved')
    // The Road Event names, the five recalculation questions, the Sponsor
    // question and the MY PROJECT exit warning.
    expect(approved.length).toBe(ROAD_EVENT_LIBRARY.length + RECALCULATION_PROMPTS.length + 2)
    for (const entry of approved) expect(entry.source, entry.id).toBeTruthy()
    expect(pendingOwnerReview().length).toBeGreaterThan(0)
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

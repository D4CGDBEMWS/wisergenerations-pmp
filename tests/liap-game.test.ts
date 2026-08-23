import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  advance,
  choiceById,
  consequencesNow,
  currentScenario,
  GLOSSARY_POINTS,
  GLOSSARY_WISDOM,
  healthBand,
  initialState,
  reduce,
  type GameAction,
} from '@/lib/game/engine'
import { SCENARIOS, PROJECT_BRIEF, LESSON_CHOICES } from '@/lib/game/scenarios'
import { HEALTH_KEYS, ROADMAP_STAGES, STARTING_FOCUS, STARTING_HEALTH, type GameState } from '@/lib/game/types'
import { PIVOT_STEPS, PIVOT_WISDOM } from '@/lib/game/pivot'
import { dayResults, dimensionResults, lowestDimension, projectStanding } from '@/lib/game/results'
import { GLOSSARY_TERMS, glossaryRows } from '@/lib/game/glossary'
import { OUTCOME_MATRIX, danglingMappings, domainCoverage, unmappedScenarios } from '@/lib/game/validation'
import {
  PREVIEW_CTA_HREF,
  PREVIEW_SCENARIO,
  PREVIEW_SCENARIO_ID,
  PREVIEW_TITLE,
  PREVIEW_SUPPORTING_LINE,
  PREVIEW_CLOSING,
  previewInitialState,
  previewReduce,
  type PreviewAction,
  type PreviewState,
} from '@/lib/game/preview'
import { SHARED_INFRASTRUCTURE, shell, shellForPath } from '@/lib/shell'
import { decidePlayEntry, PLAY_SOFT_LANDING } from '@/lib/game/play-entry'
import { GAME_NAME, GAME_SUPPORTING_LINE } from '@/lib/game/naming'

// ---------------------------------------------------------------------------
// Living Life as a Project Manager — Version 1.
//
// The suite is in four parts, in descending order of what it would cost to get
// wrong:
//
//   1. PARTICIPANT DATA. §31. The game must not introduce a new sensitive-data
//      pathway. These read the source of every game module and assert that no
//      persistence, no network call, no analytics and no free-text input
//      exists — because a reviewer reading a promise in a comment learns
//      nothing, and this is the promise most expensive to break.
//   2. ISOLATION. §36/§37. No game module may reach the assessment, the
//      scoring engine, the database, entitlements or the CRM.
//   3. THE ENGINE. Deterministic play-throughs, including the seam scenario
//      end-to-end and the delayed-consequence chains.
//   4. CONTENT INTEGRITY. Every scenario reachable, every glossary bonus
//      harmless, every stage mapped, no certification vocabulary anywhere a
//      player can see it.
// ---------------------------------------------------------------------------

const root = join(__dirname, '..')
const source = (rel: string) => readFileSync(join(root, rel), 'utf8')

/**
 * Source with comments removed.
 *
 * Every absence assertion below runs against this rather than the raw file.
 * These modules explain at length what they do not do, and prose saying
 * "no fetch, no localStorage" would otherwise satisfy a test looking for the
 * absence of "fetch" and "localStorage" — the test would pass on the strength
 * of the comment and keep passing after somebody added the call.
 */
const code = (rel: string) =>
  source(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const GAME_MODULES = [
  ...readdirSync(join(root, 'lib/game')).map((f) => `lib/game/${f}`),
  ...readdirSync(join(root, 'components/liap/game')).map((f) => `components/liap/game/${f}`),
  'app/liap/game/page.tsx',
  'app/liap/game/preview/page.tsx',
  'app/liap/play/page.tsx',
]

/** Modules a player can actually reach. The matrix is deliberately excluded. */
const PLAYER_FACING = GAME_MODULES.filter((m) => !m.endsWith('validation.ts'))

// ── 1. PARTICIPANT DATA ────────────────────────────────────────────────────

describe('§31 — the game stores nothing about the participant', () => {
  it.each(GAME_MODULES)('%s writes to no browser storage', (module) => {
    const src = code(module)
    expect(src).not.toContain('localStorage')
    expect(src).not.toContain('sessionStorage')
    expect(src).not.toContain('indexedDB')
    expect(src).not.toContain('document.cookie')
  })

  it.each(GAME_MODULES)('%s makes no network call', (module) => {
    const src = code(module)
    expect(src).not.toMatch(/\bfetch\s*\(/)
    expect(src).not.toContain('XMLHttpRequest')
    expect(src).not.toContain('navigator.sendBeacon')
    expect(src).not.toContain("'use server'")
    expect(src).not.toContain('axios')
  })

  it.each(GAME_MODULES)('%s emits no analytics carrying a decision', (module) => {
    const src = code(module)
    expect(src).not.toContain('gtag')
    expect(src).not.toContain('dataLayer')
    expect(src).not.toContain('posthog')
    expect(src).not.toMatch(/\btrack\s*\(/)
  })

  it('offers no free-text input anywhere in the experience', () => {
    for (const module of PLAYER_FACING) {
      const src = code(module)
      expect(src, module).not.toMatch(/<textarea/i)
      expect(src, module).not.toMatch(/<input/i)
      expect(src, module).not.toMatch(/contentEditable/i)
    }
  })

  it('closes the end-of-day reflection to a fixed set of options', () => {
    expect(LESSON_CHOICES.length).toBeGreaterThan(0)
    for (const lesson of LESSON_CHOICES) {
      expect(typeof lesson.label).toBe('string')
    }
    // The state field is a chosen id, never arbitrary text: recording a lesson
    // that is not one of the offered ids is the only way text could get in.
    const played = { ...initialState(), phase: 'lesson' as const }
    const recorded = reduce(played, { type: 'record-lesson', lessonId: 'protect' })
    expect(LESSON_CHOICES.some((l) => l.id === recorded.lesson)).toBe(true)
  })

  it('does not touch Mailchimp, the CRM or any newsletter path', () => {
    for (const module of GAME_MODULES) {
      const src = code(module).toLowerCase()
      expect(src, module).not.toContain('mailchimp')
      expect(src, module).not.toContain('convertkit')
      expect(src, module).not.toContain('subscriber')
      expect(src, module).not.toContain('newsletter')
    }
  })
})

// ── 2. ISOLATION ───────────────────────────────────────────────────────────

describe('§36/§37 — the game is a separate module with a closed boundary', () => {
  const FORBIDDEN_IMPORTS = [
    '@/lib/liap/',
    '@/lib/db',
    '@/lib/entitlements',
    '@/lib/auth',
    '@/lib/audit',
    '@/lib/email',
    '@/lib/rate-limit',
    '@neondatabase',
  ]

  it.each(GAME_MODULES)('%s imports nothing from the assessment or the data layer', (module) => {
    const src = code(module)
    for (const forbidden of FORBIDDEN_IMPORTS) {
      expect(src, `${module} imports ${forbidden}`).not.toContain(forbidden)
    }
  })

  it('keeps every lib/game module inside lib/game', () => {
    for (const module of GAME_MODULES.filter((m) => m.startsWith('lib/game/'))) {
      const imports = [...code(module).matchAll(/from '([^']+)'/g)].map((m) => m[1])
      for (const specifier of imports) {
        const ok = specifier.startsWith('./') || specifier.startsWith('node:')
        expect(ok, `${module} imports ${specifier}`).toBe(true)
      }
    }
  })

  it('never reaches the game from assessment code', () => {
    const liapFiles = readdirSync(join(root, 'lib/liap'))
      .map((f) => `lib/liap/${f}`)
      .filter((f) => statSync(join(root, f)).isFile())
    expect(liapFiles.length).toBeGreaterThan(0)
    for (const file of liapFiles) {
      expect(source(file), file).not.toContain('lib/game')
    }
  })

  it('exposes the internal outcome matrix to nothing a player can reach', () => {
    // Asserted on the import specifier rather than the word: one scenario is
    // about a defect in profile validation, and a substring match would fail
    // on the fiction rather than on the boundary.
    for (const module of PLAYER_FACING) {
      const src = code(module)
      expect(src, module).not.toMatch(/from '[^']*game\/validation'/)
      expect(src, module).not.toContain('OUTCOME_MATRIX')
      expect(src, module).not.toContain('strongestChoice')
    }
  })

  it('gates the route behind its own flag and returns a 404 when it is off', () => {
    const page = code('app/liap/game/page.tsx')
    expect(page).toContain("isEnabled('LIAP_GAME')")
    expect(page).toContain('notFound()')
    // Not the flags helper: it sets digest NEXT_NOT_FOUND by hand, which Next
    // 16 no longer honours, and the route 500s instead of 404ing. Proven
    // against a production build; reported in the delivery notes.
    expect(page).not.toContain('assertEnabledOrNotFound')
    expect(code('lib/flags.ts')).toContain("| 'LIAP_GAME'")
  })

  it('creates no API route for the game', () => {
    const apiDirs = readdirSync(join(root, 'app/api'))
    expect(apiDirs).not.toContain('game')
    expect(apiDirs).not.toContain('liap-game')
  })
})

// ── 3. THE ENGINE ──────────────────────────────────────────────────────────

/** Drives a sequence of actions from a fresh state. */
function play(...actions: GameAction[]): GameState {
  return actions.reduce(reduce, initialState())
}

/**
 * Plays one whole day, taking the named choice where offered and the first
 * choice everywhere else. Answers every glossary bonus with `answer` — right
 * when `correctGlossary`, wrong otherwise — and resolves the turn as asked.
 */
function playDay(options: {
  picks?: Record<string, string>
  correctGlossary?: boolean
  takePivot?: boolean
  pivotSelect?: string
  pivotAction?: string
}): GameState {
  let state = reduce(initialState(), { type: 'begin' })
  let guard = 0

  while (state.phase !== 'lesson' && state.phase !== 'results' && guard++ < 500) {
    const scenario = currentScenario(state)

    if (state.phase === 'situation' && scenario) {
      const choiceId = options.picks?.[scenario.id] ?? scenario.choices[0].id
      state = reduce(state, { type: 'choose', choiceId })
      continue
    }

    if (state.phase === 'outcome') {
      state = reduce(state, { type: 'continue' })
      continue
    }

    if (state.phase === 'glossary' && scenario?.glossary) {
      if (!state.glossaryAnswered.includes(scenario.id)) {
        const option = options.correctGlossary
          ? scenario.glossary.answer
          : scenario.glossary.options.find((o) => o !== scenario.glossary!.answer)!
        state = reduce(state, { type: 'answer-glossary', option })
      } else {
        state = reduce(state, { type: 'continue' })
      }
      continue
    }

    if (state.phase === 'pivot') {
      if (!state.pivotTaken && !state.pivotResolved) {
        if (!options.takePivot) {
          state = reduce(state, { type: 'decline-pivot' })
        } else {
          state = reduce(state, { type: 'take-pivot' })
        }
        continue
      }
      const step = PIVOT_STEPS[state.pivotStep]
      if (step?.options) {
        const optionId = step.focal
          ? (options.pivotAction ?? step.options[0].id)
          : (options.pivotSelect ?? step.options[0].id)
        state = reduce(state, { type: 'pivot-choose', optionId })
      } else {
        state = reduce(state, { type: 'continue' })
      }
      continue
    }

    break
  }

  expect(guard).toBeLessThan(500)
  return state
}

/**
 * Plays forward, taking the first choice at every hour, until the named
 * scenario is on screen and waiting for a decision.
 */
function atScenario(id: string): GameState {
  let state = reduce(initialState(), { type: 'begin' })
  let guard = 0
  while (currentScenario(state)?.id !== id && guard++ < 200) {
    if (state.phase === 'situation') {
      state = reduce(state, { type: 'choose', choiceId: currentScenario(state)!.choices[0].id })
    } else if (state.phase === 'glossary') {
      const scenario = currentScenario(state)!
      state = state.glossaryAnswered.includes(scenario.id)
        ? reduce(state, { type: 'continue' })
        : reduce(state, { type: 'answer-glossary', option: scenario.glossary!.answer })
    } else {
      state = reduce(state, { type: 'continue' })
    }
  }
  expect(currentScenario(state)?.id).toBe(id)
  expect(state.phase).toBe('situation')
  return state
}

describe('the engine is a deterministic reducer', () => {
  it('starts every day identically', () => {
    const a = initialState()
    const b = initialState()
    expect(a).toEqual(b)
    expect(a.focus).toBe(STARTING_FOCUS)
    for (const key of HEALTH_KEYS) expect(a.health[key]).toBe(STARTING_HEALTH)
  })

  it('produces the same result from the same decisions, every time', () => {
    const picks = { morning: 'signals', standup: 'unblock', backlog: 'clarify' }
    const first = playDay({ picks, correctGlossary: true, takePivot: false })
    const second = playDay({ picks, correctGlossary: true, takePivot: false })
    expect(second).toEqual(first)
  })

  it('reaches the end of the day and the reflection', () => {
    const state = playDay({})
    expect(state.phase).toBe('lesson')
    expect(state.decisions).toHaveLength(SCENARIOS.length)
  })

  it('ignores an action that does not belong to the current phase', () => {
    const fresh = initialState()
    expect(reduce(fresh, { type: 'choose', choiceId: 'signals' })).toEqual(fresh)
    expect(reduce(fresh, { type: 'answer-glossary', option: 'Impediment' })).toEqual(fresh)
    expect(reduce(fresh, { type: 'take-pivot' })).toEqual(fresh)
  })

  it('ignores a choice id that is not on the current scenario', () => {
    const started = play({ type: 'begin' })
    expect(reduce(started, { type: 'choose', choiceId: 'not-a-choice' })).toEqual(started)
  })

  it('clamps every dimension into 0–100 whatever the deltas say', () => {
    const state = playDay({ picks: Object.fromEntries(SCENARIOS.map((s) => [s.id, s.choices[0].id])) })
    for (const key of HEALTH_KEYS) {
      expect(state.health[key]).toBeGreaterThanOrEqual(0)
      expect(state.health[key]).toBeLessThanOrEqual(100)
    }
  })
})

describe('Focus Points are finite and never purchasable', () => {
  it('never goes below zero', () => {
    const state = playDay({})
    expect(state.focus).toBeGreaterThanOrEqual(0)
  })

  it('charges the team for attention that was not there', () => {
    // Spend the day on the most expensive option available every hour.
    const greedy = Object.fromEntries(
      SCENARIOS.map((s) => [s.id, [...s.choices].sort((a, b) => b.focusCost - a.focusCost)[0].id])
    )
    const state = playDay({ picks: greedy })
    expect(state.focus).toBe(0)
    expect(state.focusOverdrawn).toBeGreaterThan(0)
  })

  it('offers no way to acquire more focus', () => {
    for (const module of GAME_MODULES) {
      const src = code(module).toLowerCase()
      expect(src, module).not.toContain('purchase')
      expect(src, module).not.toContain('stripe')
      expect(src, module).not.toContain('checkout')
      expect(src, module).not.toContain('price')
    }
  })
})

describe('delayed consequences land later, unannounced', () => {
  it('does not reveal the consequence at the moment the decision is made', () => {
    const chosen = play({ type: 'begin' }, { type: 'choose', choiceId: 'inbox' })
    expect(chosen.landed).toHaveLength(0)
    // The 9:00 decision is where the chain actually starts.
    const scenario = SCENARIOS.find((s) => s.id === 'standup')!
    const source = scenario.choices.find((c) => c.delayed)!
    expect(source.outcome).not.toContain(source.delayed!.text)
  })

  it('fires at the start of the scenario it names, not before', () => {
    const state = playDay({ picks: { standup: 'document' } })
    const landed = state.landed.map((c) => c.firesAt)
    expect(landed).toContain('hybrid')
  })

  it('applies the consequence health effect exactly once', () => {
    const scenario = SCENARIOS.find((s) => s.id === 'standup')!
    const choice = scenario.choices.find((c) => c.id === 'document')!
    const delayed = choice.delayed!

    let state = reduce(atScenario('standup'), { type: 'choose', choiceId: 'document' })
    expect(state.pending).toHaveLength(1)

    const before = { ...state.health }

    // Walk forward to the firing scenario.
    while (state.pending.length > 0 && state.scenarioIndex < SCENARIOS.length) {
      state = advance(state)
    }
    expect(state.pending).toHaveLength(0)

    // Exactly the consequence's own delta, no more and no less.
    for (const key of HEALTH_KEYS) {
      const delta = delayed.health?.[key] ?? 0
      expect(state.health[key], key).toBe(Math.max(0, Math.min(100, before[key] + delta)))
    }

    // And it does not fire a second time when the clock keeps moving.
    const later = advance(state)
    expect(later.landed).toHaveLength(state.landed.length)
    expect(state.landed.map((c) => c.text)).toEqual([delayed.text])
    expect(currentScenario(state)?.id).toBe(delayed.firesAt)
    expect(consequencesNow(state).map((c) => c.text)).toEqual([delayed.text])
  })

  it('carries at least one favourable chain, so foresight is visible too', () => {
    const favourable = SCENARIOS.flatMap((s) => s.choices)
      .map((c) => c.delayed)
      .filter((d) => d?.favourable)
    expect(favourable.length).toBeGreaterThan(0)
  })

  it('points every consequence at a scenario that exists and comes later', () => {
    SCENARIOS.forEach((scenario, index) => {
      for (const choice of scenario.choices) {
        if (!choice.delayed) continue
        const targetIndex = SCENARIOS.findIndex((s) => s.id === choice.delayed!.firesAt)
        expect(targetIndex, `${scenario.id}/${choice.id}`).toBeGreaterThan(index)
      }
    })
  })
})

describe('the glossary bonus can never cost anything', () => {
  it('awards points and wisdom for a correct answer', () => {
    const right = playDay({ correctGlossary: true })
    const glossaryScenarios = SCENARIOS.filter((s) => s.glossary).length
    expect(right.glossaryPoints).toBe(glossaryScenarios * GLOSSARY_POINTS)
  })

  it('leaves the project score identical whether the answers are right or wrong', () => {
    const picks = { morning: 'signals', standup: 'unblock', seam: 'end-to-end' }
    const right = playDay({ picks, correctGlossary: true })
    const wrong = playDay({ picks, correctGlossary: false })

    expect(wrong.health).toEqual(right.health)
    expect(wrong.focus).toBe(right.focus)
    expect(wrong.focusOverdrawn).toBe(right.focusOverdrawn)
    expect(wrong.glossaryPoints).toBe(0)
  })

  it('separates Practical Wisdom earned by judgement from wisdom earned by naming', () => {
    const picks = { morning: 'signals' }
    const right = playDay({ picks, correctGlossary: true })
    const wrong = playDay({ picks, correctGlossary: false })
    const named = SCENARIOS.filter((s) => s.glossary).length
    expect(right.wisdom - wrong.wisdom).toBe(named * GLOSSARY_WISDOM)
  })

  it('discovers the term either way', () => {
    const wrong = playDay({ correctGlossary: false })
    expect(wrong.termsDiscovered).toHaveLength(GLOSSARY_TERMS.length)
    expect(wrong.glossaryPoints).toBe(0)
  })

  it('never asks for the term before the consequence has been seen', () => {
    const state = play({ type: 'begin' }, { type: 'choose', choiceId: 'signals' })
    expect(state.phase).toBe('outcome')
    // A glossary answer sent while the outcome is still on screen does nothing.
    expect(reduce(state, { type: 'answer-glossary', option: 'Impediment' })).toEqual(state)
  })

  it('accepts one answer per bonus and ignores a second', () => {
    let state = play({ type: 'begin' }, { type: 'choose', choiceId: 'signals' })
    state = reduce(state, { type: 'continue' })
    while (state.phase !== 'glossary' && state.phase !== 'lesson') {
      state = reduce(state, { type: 'continue' })
      if (state.phase === 'situation') state = reduce(state, { type: 'choose', choiceId: currentScenario(state)!.choices[0].id })
    }
    const scenario = currentScenario(state)!
    const answered = reduce(state, { type: 'answer-glossary', option: scenario.glossary!.answer })
    const again = reduce(answered, { type: 'answer-glossary', option: scenario.glossary!.answer })
    expect(again.glossaryPoints).toBe(answered.glossaryPoints)
  })
})

describe('the WISER Pivot™ is not a generic emergency button', () => {
  it('is opened by exactly two branches in the whole day', () => {
    const opening = SCENARIOS.flatMap((s) =>
      s.choices.filter((c) => c.opensPivot).map((c) => `${s.id}/${c.id}`)
    )
    expect(opening).toEqual(['change/assess', 'seam/end-to-end'])
  })

  it('is never offered when no branch has opened it', () => {
    const state = playDay({ picks: { change: 'refuse-change', seam: 'blame-portal' } })
    expect(state.pivotOffered).toBe(false)
    expect(state.pivotTaken).toBe(false)
  })

  it('is offered once and not again after being declined', () => {
    const state = playDay({ picks: { change: 'assess', seam: 'end-to-end' }, takePivot: false })
    expect(state.pivotOffered).toBe(true)
    expect(state.pivotResolved).toBe(true)
    expect(state.pivotTaken).toBe(false)
    expect(state.decisions).toHaveLength(SCENARIOS.length)
  })

  it('is offered once and not again after being walked', () => {
    const state = playDay({ picks: { change: 'assess', seam: 'end-to-end' }, takePivot: true })
    expect(state.pivotTaken).toBe(true)
    expect(state.pivotResolved).toBe(true)
    expect(state.pivotAction).not.toBeNull()
    expect(state.pivotPriority).not.toBeNull()
    expect(state.decisions).toHaveLength(SCENARIOS.length)
  })

  it('rewards walking the cycle deliberately', () => {
    const picks = { change: 'assess', seam: 'end-to-end' }
    const declined = playDay({ picks, takePivot: false })
    const walked = playDay({ picks, takePivot: true })
    expect(walked.wisdom - declined.wisdom).toBe(PIVOT_WISDOM)
  })

  it('costs something whichever turn is taken — no free wins', () => {
    const focal = PIVOT_STEPS.find((s) => s.focal)!
    for (const option of focal.options!) {
      const deltas = Object.values(option.health ?? {})
      expect(deltas.some((d) => d > 0), option.id).toBe(true)
      expect(deltas.some((d) => d < 0), option.id).toBe(true)
    }
  })

  it('makes PIVOT the one focal step, not the fifth card in a row of six', () => {
    expect(PIVOT_STEPS.filter((s) => s.focal)).toHaveLength(1)
    expect(PIVOT_STEPS.find((s) => s.focal)!.title).toBe('PIVOT')
    expect(PIVOT_STEPS.map((s) => s.title)).toEqual([
      'WAIT',
      'INSPECT',
      'SELECT',
      'EMBRACE',
      'PIVOT',
      'REVIEW',
    ])
  })

  it('is reachable from no scenario choice label', () => {
    for (const scenario of SCENARIOS) {
      for (const choice of scenario.choices) {
        expect(choice.label.toLowerCase(), `${scenario.id}/${choice.id}`).not.toContain('pivot')
      }
    }
  })
})

// ── THE SEAM SCENARIO, END TO END ──────────────────────────────────────────

describe('the seam scenario, end to end', () => {
  const seam = SCENARIOS.find((s) => s.id === 'seam')!

  it('presents a failure that belongs to neither owning team', () => {
    const text = seam.situation.join(' ').toLowerCase()
    // The whole point of the hour: both owning teams are correct, which is
    // why the failure has survived in the gap between them.
    expect(text).toContain('both teams are right')
    expect(seam.choices.map((c) => c.id)).toEqual([
      'blame-portal',
      'blame-members',
      'end-to-end',
      'add-check',
    ])
  })

  it('punishes neither of the two plausible-but-wrong attributions with silence', () => {
    for (const id of ['blame-portal', 'blame-members']) {
      const choice = choiceById(seam, id)!
      expect(choice.outcome.length, id).toBeGreaterThan(60)
    }
  })

  it('plays through to the end of the day with the seam owned', () => {
    const state = playDay({
      picks: { morning: 'signals', standup: 'unblock', seam: 'end-to-end' },
      correctGlossary: true,
      takePivot: true,
      pivotSelect: 'quality',
      pivotAction: 'scope',
    })

    expect(state.phase).toBe('lesson')
    const seamDecision = state.decisions.find((d) => d.scenarioId === 'seam')!
    expect(seamDecision.choiceId).toBe('end-to-end')
    expect(state.pivotTaken).toBe(true)
    expect(state.pivotAction).toBe('scope')
    expect(state.pivotPriority).toBe('quality')

    const finished = reduce(state, { type: 'record-lesson', lessonId: 'risk' })
    expect(finished.phase).toBe('results')

    const results = dayResults(finished)
    expect(results.dimensions).toHaveLength(HEALTH_KEYS.length)
    expect(results.pivotTaken).toBe(true)
    expect(results.termsAvailable).toBe(GLOSSARY_TERMS.length)
  })

  it('leaves the seam open when the failure is pushed back across it', () => {
    const state = playDay({ picks: { seam: 'blame-portal' } })
    const decision = state.decisions.find((d) => d.scenarioId === 'seam')!
    expect(decision.choiceId).toBe('blame-portal')
    expect(state.pivotOffered).toBe(false)
  })
})

// ── 4. RESULTS ─────────────────────────────────────────────────────────────

describe('§26 — the results describe the project, never the participant', () => {
  const JUDGEMENT_VOCABULARY = [
    'you are',
    "you're",
    'your personality',
    'your style',
    'readiness',
    'ready to',
    'profile',
    'you tend to',
    'as a leader you',
    'this says about you',
    'mental',
    'resilien',
    'you seem',
    'suggests you',
  ]

  it('uses no vocabulary that would turn a day into a verdict about a person', () => {
    const strings = [
      ...dimensionResults(initialState()).map((d) => d.note),
      projectStanding(initialState()).headline,
      projectStanding(initialState()).body,
    ]
    // Every band of every dimension, not only the ones a default state hits.
    for (let value = 0; value <= 100; value += 5) {
      const state = {
        ...initialState(),
        health: Object.fromEntries(HEALTH_KEYS.map((k) => [k, value])),
      } as GameState
      strings.push(...dimensionResults(state).map((d) => d.note))
      strings.push(projectStanding(state).headline, projectStanding(state).body)
    }

    for (const text of strings) {
      for (const phrase of JUDGEMENT_VOCABULARY) {
        expect(text.toLowerCase(), text).not.toContain(phrase)
      }
    }
  })

  it('never hides a dimension in trouble behind a decent average', () => {
    const state = {
      ...initialState(),
      health: { people: 90, value: 90, time: 90, resources: 90, risk: 90, quality: 12 },
    } as GameState
    const standing = projectStanding(state)
    expect(lowestDimension(state).key).toBe('quality')
    expect(standing.headline.toLowerCase()).toContain('quality')
  })

  it('resolves ties in a stable order rather than by object iteration', () => {
    const state = { ...initialState() } as GameState
    expect(lowestDimension(state).key).toBe(HEALTH_KEYS[0])
  })

  it('draws the line from the decision that set a consequence up to where it landed', () => {
    const state = playDay({ picks: { standup: 'document' } })
    const finished = reduce({ ...state }, { type: 'record-lesson', lessonId: 'same' })
    const trail = dayResults(finished).trail
    expect(trail.length).toBeGreaterThan(0)
    for (const item of trail) {
      expect(item.setUpAt, item.text).not.toBe('')
      expect(item.setUpBy, item.text).not.toBe('')
      expect(item.landedAt, item.text).not.toBe('')
    }
  })

  it('bands health without a gap or an overlap', () => {
    expect(healthBand(0)).toBe('critical')
    expect(healthBand(25)).toBe('critical')
    expect(healthBand(26)).toBe('strained')
    expect(healthBand(45)).toBe('strained')
    expect(healthBand(46)).toBe('steady')
    expect(healthBand(75)).toBe('steady')
    expect(healthBand(76)).toBe('strong')
    expect(healthBand(100)).toBe('strong')
  })
})

describe('Terms I Discovered', () => {
  it('is derived from the day rather than maintained beside it', () => {
    expect(GLOSSARY_TERMS.map((t) => t.term)).toEqual(
      SCENARIOS.filter((s) => s.glossary).map(
        (s) => s.glossary!.term ?? s.glossary!.answer
      )
    )
  })

  it('records the canonical term, not the answer, where a bonus says so', () => {
    // 4:00 PM. The participant picks "Fitness for use" and leaves with
    // "Conformance", which is the entry in the approved vocabulary. Without
    // this the panel would name a term the guide says is not a term.
    const seam = SCENARIOS.find((s) => s.id === 'seam')!
    expect(seam.glossary!.answer).toBe('Fitness for use')
    expect(seam.glossary!.term).toBe('Conformance')

    const state = playDay({ picks: { seam: 'end-to-end' }, correctGlossary: true })
    expect(state.termsDiscovered).toContain('Conformance')
    expect(state.termsDiscovered).not.toContain('Fitness for use')
  })

  it('records the term on a wrong answer too', () => {
    const state = playDay({ picks: { seam: 'end-to-end' }, correctGlossary: false })
    expect(state.termsDiscovered).toContain('Conformance')
    expect(state.glossaryPoints).toBe(0)
  })

  it('shows undiscovered terms without revealing them', () => {
    const rows = glossaryRows(initialState())
    expect(rows).toHaveLength(GLOSSARY_TERMS.length)
    expect(rows.every((r) => !r.discovered)).toBe(true)
  })

  it('names every term uniquely, so a discovered term is unambiguous', () => {
    const terms = GLOSSARY_TERMS.map((t) => t.term)
    expect(new Set(terms).size).toBe(terms.length)
  })
})

// ── CONTENT INTEGRITY ──────────────────────────────────────────────────────

describe('the day holds together as content', () => {
  it('runs a full workday from 8:00 to 5:00', () => {
    expect(SCENARIOS[0].time).toBe('8:00 AM')
    expect(SCENARIOS[SCENARIOS.length - 1].time).toBe('5:00 PM')
  })

  it('is long enough to be a day and short enough to finish in a sitting', () => {
    // §34: 15–25 minutes. Twelve decision points plus ten bonuses plus the
    // turn is roughly a minute a beat with reading.
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(10)
    expect(SCENARIOS.length).toBeLessThanOrEqual(14)
  })

  it('gives every scenario a unique id and every choice a unique id within it', () => {
    const ids = SCENARIOS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const scenario of SCENARIOS) {
      const choiceIds = scenario.choices.map((c) => c.id)
      expect(new Set(choiceIds).size, scenario.id).toBe(choiceIds.length)
    }
  })

  it('offers four choices at every hour', () => {
    for (const scenario of SCENARIOS) {
      expect(scenario.choices.length, scenario.id).toBe(4)
    }
  })

  it('gives every choice a real outcome rather than a verdict', () => {
    for (const scenario of SCENARIOS) {
      for (const choice of scenario.choices) {
        expect(choice.outcome.length, `${scenario.id}/${choice.id}`).toBeGreaterThan(40)
        const lower = choice.outcome.toLowerCase()
        expect(lower.startsWith('correct'), `${scenario.id}/${choice.id}`).toBe(false)
        expect(lower.startsWith('incorrect'), `${scenario.id}/${choice.id}`).toBe(false)
        expect(lower.startsWith('wrong'), `${scenario.id}/${choice.id}`).toBe(false)
      }
    }
  })

  it('includes a "do nothing yet" option where waiting is defensible', () => {
    const waiting = SCENARIOS.filter((s) =>
      s.choices.some((c) => c.focusCost === 0 || /wait|watch|defer|not now|leave it/i.test(c.label))
    )
    expect(waiting.length).toBeGreaterThanOrEqual(3)
  })

  it('maps every scenario onto a roadmap stage that exists', () => {
    const stageIds = new Set<string>(ROADMAP_STAGES.map((s) => s.id))
    for (const scenario of SCENARIOS) {
      expect(stageIds.has(scenario.stage), scenario.id).toBe(true)
    }
  })

  it('walks the roadmap through its looping middle rather than straight down it', () => {
    const looping = new Set<string>(ROADMAP_STAGES.filter((s) => s.looping).map((s) => s.id))
    const visitedLoops = SCENARIOS.filter((s) => looping.has(s.stage))
    expect(visitedLoops.length).toBeGreaterThan(1)
    expect(ROADMAP_STAGES.filter((s) => s.looping)).toHaveLength(3)
  })

  it('starts every first-time player on the same project', () => {
    expect(PROJECT_BRIEF.name).toBeTruthy()
    expect(PROJECT_BRIEF.signals.length).toBeGreaterThanOrEqual(3)
    // The weak signals are not marked as signals anywhere a player can see.
    const brief = code('lib/game/scenarios.ts')
    expect(brief).not.toContain('weakSignal')
    expect(brief).not.toContain('isHint')
  })

  it('names no certification anywhere a player can see', () => {
    const CERTIFICATION = ['PMP', 'CAPM', 'PMBOK', 'PMI', 'exam', 'certification', 'ECO']
    for (const module of PLAYER_FACING) {
      const src = code(module)
      for (const term of CERTIFICATION) {
        expect(src, `${module} mentions ${term}`).not.toMatch(new RegExp(`\\b${term}\\b`, 'i'))
      }
    }
  })

  it('offers a glossary bonus at most hours but not all of them', () => {
    const withBonus = SCENARIOS.filter((s) => s.glossary).length
    expect(withBonus).toBeGreaterThan(SCENARIOS.length / 2)
    expect(withBonus).toBeLessThan(SCENARIOS.length)
  })

  it('puts the right answer in the options of every bonus', () => {
    for (const scenario of SCENARIOS) {
      if (!scenario.glossary) continue
      expect(scenario.glossary.options, scenario.id).toContain(scenario.glossary.answer)
      expect(new Set(scenario.glossary.options).size, scenario.id).toBe(
        scenario.glossary.options.length
      )
      expect(scenario.glossary.options.length, scenario.id).toBeGreaterThanOrEqual(3)
    }
  })
})

// ── THE DURABLE SEAM ───────────────────────────────────────────────────────

describe('/liap/play is what goes on paper', () => {
  it('never dead-ends, whatever the flags say', () => {
    // The rule that matters most. Every other gated route 404s when its flag
    // is off; this one cannot, because someone holding a printed code must
    // never be told by the business's own site that the page does not exist.
    for (const gameEnabled of [true, false]) {
      for (const previewEnabled of [true, false]) {
        const entry = decidePlayEntry({ gameEnabled, previewEnabled })
        expect(['play', 'soft-landing']).toContain(entry.action)
      }
    }
    const page = code('app/liap/play/page.tsx')
    expect(page).not.toContain('notFound')
    expect(page).not.toContain('assertEnabledOrNotFound')
  })

  it('resolves to the teaser during pre-launch', () => {
    expect(decidePlayEntry({ gameEnabled: false, previewEnabled: true })).toEqual({
      action: 'play',
      href: '/liap/game/preview',
    })
  })

  it('carries a scan forward to the full day once it ships', () => {
    // A code printed during pre-launch must not strand its holder on a teaser
    // they have outgrown, so the full day wins when both are live.
    expect(decidePlayEntry({ gameEnabled: true, previewEnabled: true })).toEqual({
      action: 'play',
      href: '/liap/game',
    })
    expect(decidePlayEntry({ gameEnabled: true, previewEnabled: false })).toEqual({
      action: 'play',
      href: '/liap/game',
    })
  })

  it('soft-lands when nothing is live — which is today', () => {
    expect(decidePlayEntry({ gameEnabled: false, previewEnabled: false })).toEqual({
      action: 'soft-landing',
    })
  })

  it('only ever sends a scan to a route that exists', () => {
    const routes = new Set(['/liap/game', '/liap/game/preview'])
    for (const gameEnabled of [true, false]) {
      for (const previewEnabled of [true, false]) {
        const entry = decidePlayEntry({ gameEnabled, previewEnabled })
        if (entry.action === 'play') {
          expect(routes.has(entry.href), entry.href).toBe(true)
          const file = `app${entry.href}/page.tsx`
          expect(existsSync(join(root, file)), file).toBe(true)
        }
      }
    }
  })

  it('lives in the seam, outside the product tree that gets renamed', () => {
    // /liap survived the rename that turned /life-is-a-project into
    // /living-is-a-project across fourteen files. That is the whole argument
    // for putting paper here rather than in the tree.
    expect(existsSync(join(root, 'app/liap/play/page.tsx'))).toBe(true)
    expect(existsSync(join(root, 'app/living-is-a-project/play'))).toBe(false)
    expect(shellForPath('/liap/play').key).toBe('liap')
  })

  it('keeps the decision out of the file that goes on paper', () => {
    const page = code('app/liap/play/page.tsx')
    expect(page).toContain('decidePlayEntry')
    expect(page).not.toContain("'/liap/game/preview'")
  })

  it('holds its soft-landing copy as unapproved and promises nothing', () => {
    const text = Object.values(PLAY_SOFT_LANDING).join(' ').toLowerCase()
    for (const promise of ['october', 'next week', 'tomorrow', 'guarantee', 'free',
      'sign up', 'subscribe', 'email']) {
      expect(text, promise).not.toContain(promise)
    }
    // And captures nothing. A "tell me when it's ready" field is the obvious
    // thing to add to a soft landing and it is an acquisition decision with a
    // segmentation tag attached — LIAP readers are not to be mixed into the
    // generic newsletter list.
    const page = code('app/liap/play/page.tsx')
    expect(page).not.toMatch(/<input/i)
    expect(page).not.toMatch(/<form/i)
    expect(page).not.toMatch(/\bfetch\s*\(/)
  })
})

// ── THE NAME ───────────────────────────────────────────────────────────────

describe('the game is called one thing everywhere', () => {
  const RETIRED = 'A Day in the Life of a Project Manager'

  it('carries the owner-approved name verbatim', () => {
    expect(GAME_NAME).toBe('Living Life as a Project Manager')
    expect(GAME_SUPPORTING_LINE).toBe(
      'Experience the decisions. Live with the consequences. Discover the wisdom.'
    )
  })

  it('titles the teaser with the product name and no suffix', () => {
    // Owner ruling: the game is called one thing. The teaser is not a
    // separately-named product, and "— Game Preview" is not part of the name.
    expect(PREVIEW_TITLE).toBe(GAME_NAME)
    // Comment-stripped, unlike the retired-name check below. A retired name in
    // a comment teaches the next person the wrong name; a comment explaining
    // that "Game Preview" is NOT part of the name is the opposite, and this
    // assertion would otherwise fail on the sentence documenting it.
    for (const module of GAME_MODULES) {
      expect(code(module), module).not.toContain('Game Preview')
    }
  })

  it('shows the retired name nowhere in the built ecosystem', () => {
    // Comments included, not just strings: a module header titling itself with
    // a retired product name is how the next person learns the wrong name.
    for (const module of [...GAME_MODULES, 'lib/flags.ts']) {
      expect(source(module), module).not.toContain(RETIRED)
    }
  })

  it('reads the heading and the browser tab from the one home', () => {
    const client = code('components/liap/game/GameClient.tsx')
    expect(client).toContain('{GAME_NAME}')
    const page = code('app/liap/game/page.tsx')
    expect(page).toContain('title: GAME_NAME')
    // No literal title anywhere — that is what lets one edit move all of them.
    expect(page).not.toContain("'Living Life as a Project Manager")
  })

  it('lets the root layout brand the tab, exactly once', () => {
    // app/layout.tsx appends "| Wiser Generations Int'l" to every title. A page
    // that appends its own brand gets it twice, which is what most of this site
    // still does — see the note in lib/game/naming.ts.
    for (const page of ['app/liap/game/page.tsx', 'app/liap/game/preview/page.tsx']) {
      expect(code(page), page).not.toContain('Wiser Generations')
    }
  })

  it('leaves every technical identifier alone', () => {
    // Owner ruling: identifiers do not follow a public name. The printed QR
    // seam and the flags matter more than matching a marketing decision.
    expect(code('lib/flags.ts')).toContain("| 'LIAP_GAME'")
    expect(code('lib/flags.ts')).toContain("| 'LIAP_GAME_PREVIEW'")
    expect(readdirSync(join(root, 'app/liap'))).toContain('game')
    expect(readdirSync(join(root, 'app/liap/game'))).toContain('preview')
    expect(code('components/liap/game/GameClient.tsx')).toContain('export function GameClient')
    expect(SCENARIOS.map((s) => s.id)).toContain('backlog')
  })
})

// ── THE GAME PREVIEW ───────────────────────────────────────────────────────

const PREVIEW_MODULES = ['lib/game/preview.ts', 'components/liap/game/PreviewClient.tsx',
  'app/liap/game/preview/page.tsx']

function playPreview(...actions: PreviewAction[]): PreviewState {
  return actions.reduce(previewReduce, previewInitialState())
}

describe('the preview is one hour and cannot become the day', () => {
  it('imports the approved scenario rather than carrying a copy of it', () => {
    // Identity, not equality: the preview and the full game hold the same
    // object, so re-approving the hour changes both or neither.
    expect(PREVIEW_SCENARIO).toBe(SCENARIOS.find((s) => s.id === PREVIEW_SCENARIO_ID))
    const src = code('lib/game/preview.ts')
    expect(src).not.toContain('situation:')
    expect(src).not.toContain('outcome:')
    expect(src).not.toContain('focusCost')
  })

  it('cannot express the action that moves the clock', () => {
    // The containment argument, asserted rather than described. `advance()` is
    // reachable only through the engine's `continue`, and no preview module
    // contains that string.
    for (const module of PREVIEW_MODULES) {
      expect(code(module), module).not.toContain("'continue'")
      expect(code(module), module).not.toContain('advance')
      // Nor any other way of walking the array: no index arithmetic, and none
      // of the engine's positional lookups. The single SCENARIOS[] read in
      // preview.ts resolves the one approved hour and nothing else.
      expect(code(module), module).not.toMatch(/scenarioIndex\s*[+-]/)
      expect(code(module), module).not.toContain('scenarioAt')
      expect(code(module), module).not.toContain('currentScenario')
    }
  })

  it('never leaves the one scenario, whatever it is sent', () => {
    const index = SCENARIOS.findIndex((s) => s.id === PREVIEW_SCENARIO_ID)
    const junk: PreviewAction[] = [
      { type: 'next' }, { type: 'next' }, { type: 'next' }, { type: 'begin' },
      { type: 'choose', choiceId: 'clarify' }, { type: 'next' }, { type: 'next' },
      { type: 'answer-glossary', option: 'Scope creep' }, { type: 'next' },
      { type: 'next' }, { type: 'next' }, { type: 'begin' },
    ]
    let state = previewInitialState()
    for (const action of junk) {
      state = previewReduce(state, action)
      expect(state.game.scenarioIndex, action.type).toBe(index)
    }
  })

  it('walks its six beats in order', () => {
    let s = previewInitialState()
    expect(s.phase).toBe('brief')
    s = previewReduce(s, { type: 'begin' });                          expect(s.phase).toBe('situation')
    s = previewReduce(s, { type: 'choose', choiceId: 'clarify' });    expect(s.phase).toBe('outcome')
    s = previewReduce(s, { type: 'next' });                           expect(s.phase).toBe('glossary')
    s = previewReduce(s, { type: 'answer-glossary', option: 'Scope creep' })
    expect(s.phase).toBe('reveal')
    s = previewReduce(s, { type: 'next' });                           expect(s.phase).toBe('cta')
    s = previewReduce(s, { type: 'next' });                           expect(s.phase).toBe('cta')
  })

  it('uses the real engine, so the consequence is the real consequence', () => {
    const s = playPreview({ type: 'begin' }, { type: 'choose', choiceId: 'absorb' })
    const engine = reduce(
      { ...initialState(), phase: 'situation', scenarioIndex: SCENARIOS.findIndex((x) => x.id === 'backlog') },
      { type: 'choose', choiceId: 'absorb' }
    )
    expect(s.game.health).toEqual(engine.health)
    expect(s.game.decisions).toEqual(engine.decisions)
  })

  it('rejects a choice id that is not on the hour', () => {
    const started = playPreview({ type: 'begin' })
    expect(previewReduce(started, { type: 'choose', choiceId: 'not-a-choice' })).toEqual(started)
  })

  it('restarts to exactly the opening state', () => {
    const played = playPreview({ type: 'begin' }, { type: 'choose', choiceId: 'refuse' },
      { type: 'next' }, { type: 'answer-glossary', option: 'Fast tracking' }, { type: 'next' })
    expect(previewReduce(played, { type: 'restart' })).toEqual(previewInitialState())
  })

  it('costs nothing to miss the term here either', () => {
    const right = playPreview({ type: 'begin' }, { type: 'choose', choiceId: 'clarify' },
      { type: 'next' }, { type: 'answer-glossary', option: 'Scope creep' })
    const wrong = playPreview({ type: 'begin' }, { type: 'choose', choiceId: 'clarify' },
      { type: 'next' }, { type: 'answer-glossary', option: 'Requirement' })
    expect(wrong.game.health).toEqual(right.game.health)
    expect(wrong.game.termsDiscovered).toEqual(right.game.termsDiscovered)
    expect(wrong.game.glossaryPoints).toBe(0)
  })

  it('shows none of the machinery the owner ruled out', () => {
    const client = code('components/liap/game/PreviewClient.tsx')
    for (const absent of ['HealthDashboard', 'RoadmapRail', 'PivotCycle', 'ResultsScreen',
      'Focus', 'focusOverdrawn', 'dayResults', 'LESSON_CHOICES', 'landed', 'pending']) {
      expect(client, `preview renders ${absent}`).not.toContain(absent)
    }
  })

  it('collects nothing and posts nowhere', () => {
    for (const module of PREVIEW_MODULES) {
      const src = code(module)
      expect(src, module).not.toMatch(/\bfetch\s*\(/)
      expect(src, module).not.toContain('localStorage')
      expect(src, module).not.toContain('sessionStorage')
      expect(src, module).not.toContain('document.cookie')
      expect(src, module).not.toContain("'use server'")
      expect(src, module).not.toMatch(/<input/i)
      expect(src, module).not.toMatch(/<textarea/i)
      expect(src, module).not.toContain('mailchimp')
      expect(src, module).not.toContain('/api/')
    }
  })

  it('sends the CTA somewhere that belongs to this program', () => {
    // Never the exam simulator, never the $49/month studio — the same
    // allow-list rule the LIAP shell follows.
    const liap = shell('liap')
    const ownPath = liap.pathPrefixes.some((p) => PREVIEW_CTA_HREF.startsWith(p))
    const sharedPath = SHARED_INFRASTRUCTURE.includes(PREVIEW_CTA_HREF)
    expect(ownPath || sharedPath, PREVIEW_CTA_HREF).toBe(true)
  })

  it('carries the owner-approved copy verbatim', () => {
    expect(PREVIEW_TITLE).toBe('Living Life as a Project Manager')
    expect(PREVIEW_SUPPORTING_LINE).toBe(
      'Experience the decisions. Live with the consequences. Discover the wisdom.'
    )
    expect(PREVIEW_CLOSING).toBe('That was one decision. The full day is coming soon.')
  })

  it('gates on its own flag, not the full game\'s', () => {
    const page = code('app/liap/game/preview/page.tsx')
    expect(page).toContain("isEnabled('LIAP_GAME_PREVIEW')")
    expect(page).toContain('notFound()')
    expect(page).not.toContain("isEnabled('LIAP_GAME')")
    expect(code('lib/flags.ts')).toContain("| 'LIAP_GAME_PREVIEW'")
  })
})

// ── THE APPROVED VOCABULARY ────────────────────────────────────────────────

/**
 * Destiny Projects — Words to Know. The thirty approved introductory terms,
 * owner-governed, in the guide's own order.
 *
 * The game does not have to teach all thirty and deliberately does not — it is
 * an experience, not a vocabulary test. What it may not do is put a word in
 * front of a participant, as a right answer or a wrong one, that the approved
 * guide does not contain. A wrong answer is still teaching: offer "resource
 * leveling" four times and the participant leaves believing it is a term they
 * were meant to know.
 */
const CANONICAL_30 = [
  'project', 'objective', 'scope', 'scope creep', 'requirement', 'deliverable',
  'milestone', 'baseline', 'stakeholder', 'sponsor', 'backlog', 'priority',
  'dependency', 'impediment', 'risk', 'issue', 'trigger', 'assumption',
  'constraint', 'variance', 'change control', 'impact assessment',
  'rolling-wave planning', 'progressive elaboration', 'cause-and-effect analysis',
  'pareto / 80-20', 'conformance', 'agile', 'hybrid', 'lessons learned',
] as const

/**
 * The one string a participant can see that is not a canonical term.
 *
 * Owner-approved: fitness for use is taught as an extension of Conformance
 * rather than as an entry of its own, so it may be the ANSWER at 4:00 PM while
 * Conformance is the term recorded. It is allow-listed by name here so that
 * adding a second exception is a deliberate act with a reviewer, not a
 * side-effect of writing a question.
 */
const APPROVED_NON_CANONICAL = ['fitness for use']

/** Plural and shorthand forms count as the canonical term. */
function isCanonical(option: string): boolean {
  const value = option.toLowerCase().trim()
  if (APPROVED_NON_CANONICAL.includes(value)) return true
  return CANONICAL_30.some(
    (term) => value === term || value === `${term}s` || value === term.replace(/y$/, 'ies')
  )
}

describe('the glossary stays inside the approved vocabulary', () => {
  it('offers no answer outside the thirty, bar the one approved exception', () => {
    for (const scenario of SCENARIOS) {
      if (!scenario.glossary) continue
      expect(isCanonical(scenario.glossary.answer), scenario.glossary.answer).toBe(true)
    }
  })

  it('offers no DISTRACTOR outside the thirty', () => {
    for (const scenario of SCENARIOS) {
      if (!scenario.glossary) continue
      for (const option of scenario.glossary.options) {
        if (option === scenario.glossary.answer) continue
        expect(isCanonical(option), `${scenario.id}: "${option}"`).toBe(true)
      }
    }
  })

  it('records only canonical terms in Terms I Discovered', () => {
    for (const entry of GLOSSARY_TERMS) {
      const value = entry.term.toLowerCase()
      expect(
        CANONICAL_30.some((t) => value === t || value === `${t}s`),
        entry.term
      ).toBe(true)
    }
  })

  it('never names a term the approved guide does not contain', () => {
    // Stage gate is a real practice and is deliberately not in the thirty. The
    // 3:00 PM scenario still turns on the sponsor's decision — the concept is
    // preserved — but the participant is not handed the label as vocabulary.
    expect(GLOSSARY_TERMS.map((t) => t.term)).not.toContain('Stage gate')
    const sponsor = SCENARIOS.find((s) => s.id === 'sponsor')!
    expect(sponsor.glossary).toBeUndefined()
    expect(sponsor.situation.join(' ')).toContain('stage gate')
    expect(sponsor.choices.find((c) => c.id === 'decision-shaped')!.wisdom).toBe(10)
  })

  it('retires the two overused non-canonical distractors entirely', () => {
    const everyOption = SCENARIOS.flatMap((s) => s.glossary?.options ?? [])
      .join(' | ')
      .toLowerCase()
    expect(everyOption).not.toContain('resource leveling')
    expect(everyOption).not.toContain('fast tracking')
    expect(everyOption).not.toContain('nonconformity')
    expect(everyOption).not.toContain('retrospective')
    expect(everyOption).not.toContain('approvers')
  })

  it('leans on no single distractor the way the first draft did', () => {
    const counts = new Map<string, number>()
    for (const scenario of SCENARIOS) {
      if (!scenario.glossary) continue
      for (const option of scenario.glossary.options) {
        if (option === scenario.glossary.answer) continue
        const key = option.toLowerCase()
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    for (const [option, count] of counts) {
      expect(count, `"${option}" appears ${count} times`).toBeLessThanOrEqual(3)
    }
  })
})

// ── THE INTERNAL MATRIX ────────────────────────────────────────────────────

describe('the internal outcome validation matrix', () => {
  it('maps every scenario', () => {
    expect(unmappedScenarios()).toEqual([])
  })

  it('points at scenarios and choices that still exist', () => {
    expect(danglingMappings()).toEqual([])
  })

  it('covers all three outcome domains', () => {
    const coverage = domainCoverage()
    expect(coverage.People).toBeGreaterThan(0)
    expect(coverage.Process).toBeGreaterThan(0)
    expect(coverage['Business Environment']).toBeGreaterThan(0)
    expect(OUTCOME_MATRIX).toHaveLength(SCENARIOS.length)
  })

  it('writes a rationale for every mapping rather than a label', () => {
    for (const mapping of OUTCOME_MATRIX) {
      expect(mapping.rationale.length, mapping.scenarioId).toBeGreaterThan(60)
    }
  })
})

// ── REPLAY ─────────────────────────────────────────────────────────────────

describe('§35 — a second day is a genuinely different day', () => {
  it('restarts to exactly the opening state', () => {
    const played = playDay({ picks: { morning: 'signals' } })
    const finished = reduce(played, { type: 'record-lesson', lessonId: 'same' })
    expect(reduce(finished, { type: 'restart' })).toEqual(initialState())
  })

  it('reaches materially different endings from different decisions', () => {
    const careful = playDay({
      picks: {
        morning: 'signals',
        standup: 'unblock',
        backlog: 'clarify',
        stakeholders: 'facilitate',
        signals: 'analyse',
        change: 'assess',
        hybrid: 'integrate',
        sponsor: 'decision-shaped',
        ethics: 'accurate',
        seam: 'end-to-end',
        quality: 'assess-risk',
        close: 'fix-seam',
      },
      correctGlossary: true,
      takePivot: true,
    })
    const reactive = playDay({
      picks: {
        morning: 'inbox',
        standup: 'document',
        backlog: 'absorb',
        stakeholders: 'sponsor-wins',
        signals: 'cut-quality',
        change: 'absorb-change',
        hybrid: 'two-reports',
        sponsor: 'green',
        ethics: 'soften',
        seam: 'blame-portal',
        quality: 'skip',
        close: 'catch-up',
      },
      correctGlossary: false,
    })

    const carefulAvg = dayResults(careful).average
    const reactiveAvg = dayResults(reactive).average
    expect(carefulAvg).toBeGreaterThan(reactiveAvg)
    expect(dayResults(careful).standing.headline).not.toBe(
      dayResults(reactive).standing.headline
    )
  })
})

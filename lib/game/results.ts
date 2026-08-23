import { HEALTH_KEYS, type GameState, type HealthKey } from './types'
import { SCENARIOS } from './scenarios'
import { healthBand } from './engine'

// ---------------------------------------------------------------------------
// End of day.
//
// ── THE RULE THAT SHAPES EVERY STRING IN THIS FILE ─────────────────────────
//
// §26. The results describe THE PROJECT. They do not describe the person
// playing.
//
// No psychological profile. No personality type. No readiness score. No
// inference about mental state, resilience, leadership style or suitability.
// Not "you are a decisive project manager" — "the team ended the day tired,
// and here is the decision that made them tired."
//
// The distinction is not decoration. Elsewhere in this product there is a
// readiness assessment with its own governance, its own consent story and its
// own retention rules. A game that quietly produced a second readiness verdict
// would have created a second sensitive-data pathway with none of that, and
// §31 forbids exactly this. So every sentence below is written about a
// fictional portal project, and a test asserts that no results string contains
// second-person judgement vocabulary.
//
// ── AND IT IS DETERMINISTIC ────────────────────────────────────────────────
//
// Same decisions, same day, same result. Nothing here samples, randomises or
// calls a model. Two participants comparing screens in a workshop must be able
// to trust that the difference between them is the difference between their
// decisions.
// ---------------------------------------------------------------------------

export interface DimensionResult {
  readonly key: HealthKey
  readonly label: string
  readonly value: number
  readonly band: ReturnType<typeof healthBand>
  /** What this number says about the project. Never about the participant. */
  readonly note: string
}

export const DIMENSION_LABELS: Record<HealthKey, string> = {
  people: 'People',
  value: 'Customer value',
  time: 'Schedule',
  resources: 'Resources',
  risk: 'Risk position',
  quality: 'Quality',
}

/**
 * One line per dimension per band.
 *
 * Written as observations of the portal project at 5:00 PM. Read any of them
 * aloud and it should be a sentence a project manager could say in a status
 * meeting, not a sentence a personality test could say to a person.
 */
const NOTES: Record<HealthKey, Record<ReturnType<typeof healthBand>, string>> = {
  people: {
    critical: 'The team ended the day depleted. Two people are out Thursday and nothing has been re-planned around them.',
    strained: 'The team is carrying more than it was carrying this morning.',
    steady: 'The team is holding. Nobody was asked for something unreasonable today.',
    strong: 'The team ended the day better supported than it started it.',
  },
  value: {
    critical: 'It is no longer clear that what gets demoed will be the thing members actually needed.',
    strained: 'The link between the work and the reason for the work has thinned.',
    steady: 'The work still points at the outcome: members updating their own details.',
    strong: 'The purpose of the project is clearer at 5:00 PM than it was at 8:00 AM.',
  },
  time: {
    critical: 'Nine days is no longer a plausible number for what is currently in scope.',
    strained: 'The schedule has less room in it than the plan says it has.',
    steady: 'The demo date is still reachable with the work as it now stands.',
    strong: 'There is genuine slack between the current scope and the demo date.',
  },
  resources: {
    critical: 'Spend and capacity are both committed past what this iteration can absorb.',
    strained: 'Capacity is tight and the spend is still running ahead of plan.',
    steady: 'Resources are roughly where the plan expects them to be.',
    strong: 'Capacity and spend are both under control going into the last week.',
  },
  risk: {
    critical: 'Several things that could go wrong before the demo have not been looked at by anybody.',
    strained: 'Known risks are known and unaddressed.',
    steady: 'The significant risks have been named and someone owns each of them.',
    strong: 'The project is ahead of its risks rather than behind them.',
  },
  quality: {
    critical: 'What would be demoed today would not survive contact with members.',
    strained: 'Known defects are travelling towards the demo.',
    steady: 'What has been built works, and what is unfinished is known to be unfinished.',
    strong: 'The work that is done is genuinely done, including the parts nobody would check.',
  },
}

export function dimensionResults(state: GameState): DimensionResult[] {
  return HEALTH_KEYS.map((key) => {
    const value = state.health[key]
    const band = healthBand(value)
    return { key, label: DIMENSION_LABELS[key], value, band, note: NOTES[key][band] }
  })
}

export function averageHealth(state: GameState): number {
  const total = HEALTH_KEYS.reduce((sum, key) => sum + state.health[key], 0)
  return Math.round(total / HEALTH_KEYS.length)
}

/**
 * The lowest dimension, always surfaced.
 *
 * The same rule the readiness engine follows for a different reason: a good
 * average must never hide a dimension in trouble. A project can average 70 and
 * still be one defect away from demoing something broken to its members, and a
 * summary that opened with the average would be worse than no summary.
 *
 * Ties resolve by HEALTH_KEYS order, so the answer is stable rather than
 * dependent on object iteration.
 */
export function lowestDimension(state: GameState): DimensionResult {
  return dimensionResults(state).reduce((low, d) => (d.value < low.value ? d : low))
}

/**
 * The state of the project at 5:00 PM.
 *
 * Four bands, all of them about the portal. There is deliberately no "you
 * won": a day in a project does not end in a score, it ends in a position, and
 * the debrief question in the Virtual Workshop is what position everybody
 * ended up in and why.
 */
export function projectStanding(state: GameState): { headline: string; body: string } {
  const avg = averageHealth(state)
  const low = lowestDimension(state)
  const lowIsSerious = low.value <= 45

  if (avg >= 70 && !lowIsSerious) {
    return {
      headline: 'The project is in a better position than it was this morning.',
      body: 'Nothing was solved today. Several things were understood, which is a different and more durable kind of progress nine days out from a demo.',
    }
  }
  if (avg >= 55 && !lowIsSerious) {
    return {
      headline: 'The project ends the day roughly where it started.',
      body: 'The day held. The demo is still nine days away and the significant questions are still open, but none of them got quietly worse.',
    }
  }
  if (lowIsSerious) {
    return {
      headline: `The project ends the day with one problem larger than the rest: ${low.label.toLowerCase()}.`,
      body: `${low.note} That is the thing to take into tomorrow, whatever the other five dimensions say.`,
    }
  }
  return {
    headline: 'The project ends the day under real pressure.',
    body: 'More was committed today than was resolved. That is a normal way for a project day to go and an expensive way for nine of them in a row to go.',
  }
}

export interface ConsequenceTrail {
  readonly text: string
  readonly favourable: boolean
  /** The scenario where the decision was made. */
  readonly setUpAt: string
  readonly setUpBy: string
  /** The scenario where it landed. */
  readonly landedAt: string
}

/**
 * What set up what.
 *
 * The single most important screen in the debrief, and the reason delayed
 * consequences exist at all. At 9:00 AM nothing announced that leaving the
 * approver unchased would matter; at 2:00 PM the work stalled. Drawing that
 * line only at the end of the day is the point — drawn at 9:00 it would have
 * been a hint, and the lesson is that it was not obvious at the time.
 *
 * The link is recovered by matching the consequence text back to the choice
 * that carries it, rather than stored on the consequence. One source of truth:
 * the scenario table already says which choice sets up which consequence, and
 * a second copy could disagree with it.
 */
export function consequenceTrail(state: GameState): ConsequenceTrail[] {
  return state.landed.map((consequence) => {
    let setUpAt = ''
    let setUpBy = ''
    for (const scenario of SCENARIOS) {
      const source = scenario.choices.find((c) => c.delayed?.text === consequence.text)
      if (source) {
        setUpAt = `${scenario.time} · ${scenario.title}`
        setUpBy = source.label
        break
      }
    }
    const landedIn = SCENARIOS.find((s) => s.id === consequence.firesAt)
    return {
      text: consequence.text,
      favourable: consequence.favourable,
      setUpAt,
      setUpBy,
      landedAt: landedIn ? `${landedIn.time} · ${landedIn.title}` : '',
    }
  })
}

/** Every glossary term the day could have offered, for "Terms I Discovered". */
export function totalTermsAvailable(): number {
  return SCENARIOS.filter((s) => s.glossary).length
}

export interface DayResults {
  readonly standing: { headline: string; body: string }
  readonly dimensions: readonly DimensionResult[]
  readonly average: number
  readonly lowest: DimensionResult
  readonly wisdom: number
  readonly glossaryPoints: number
  readonly termsDiscovered: readonly string[]
  readonly termsAvailable: number
  readonly focusRemaining: number
  readonly focusOverdrawn: number
  readonly decisions: GameState['decisions']
  readonly trail: readonly ConsequenceTrail[]
  readonly pivotTaken: boolean
  readonly pivotOffered: boolean
  readonly pivotAction: string | null
}

export function dayResults(state: GameState): DayResults {
  return {
    standing: projectStanding(state),
    dimensions: dimensionResults(state),
    average: averageHealth(state),
    lowest: lowestDimension(state),
    wisdom: state.wisdom,
    glossaryPoints: state.glossaryPoints,
    termsDiscovered: state.termsDiscovered,
    termsAvailable: totalTermsAvailable(),
    focusRemaining: state.focus,
    focusOverdrawn: state.focusOverdrawn,
    decisions: state.decisions,
    trail: consequenceTrail(state),
    pivotTaken: state.pivotTaken,
    pivotOffered: state.pivotOffered,
    pivotAction: state.pivotAction,
  }
}

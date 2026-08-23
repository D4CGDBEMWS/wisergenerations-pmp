import { SCENARIOS } from './scenarios'

// ---------------------------------------------------------------------------
// Internal outcome validation matrix.
//
// ── NOT CUSTOMER-FACING. NOT RENDERED. NOT AN ANSWER KEY. ──────────────────
//
// Nothing in this file reaches a player. No component imports it, no route
// imports it, and `tests/liap-game.test.ts` asserts that — because the moment
// a player can see this table the game becomes a quiz with the answers
// printed at the back, and the whole design depends on several scenarios
// having more than one defensible answer.
//
// ── WHAT IT IS FOR ─────────────────────────────────────────────────────────
//
// One question, asked of every scenario: is this decision point exercising a
// real project-management outcome, or is it just a story beat? The matrix
// forces that answer to be written down, and a test asserts every scenario has
// one — so a scenario added after a workshop cannot quietly be filler.
//
// It is also what a facilitator needs to run the debrief: knowing that 4:00 PM
// is about integration across an organisational seam is what turns "what did
// people choose?" into a conversation.
//
// ── ON THE DOMAIN NAMES ────────────────────────────────────────────────────
//
// The three domain names are the standard ones the profession organises these
// outcomes under. They are used here as an internal filing system for checking
// coverage. This is emphatically NOT a claim that the game is PMI or PMP
// instruction, and nothing that says otherwise may be built on top of this
// file — the customer-facing experience names no certification, and a test
// asserts that certification vocabulary stays out of the player-visible copy.
// ---------------------------------------------------------------------------

export type OutcomeDomain = 'People' | 'Process' | 'Business Environment'

export interface OutcomeMapping {
  readonly scenarioId: string
  readonly domain: OutcomeDomain
  /** The outcome the decision point exercises. */
  readonly outcome: string
  /** Why this scenario tests it rather than merely mentioning it. */
  readonly rationale: string
  /**
   * The choice a practitioner would most likely defend — and deliberately not
   * called "correct". Several of these have a second defensible answer with a
   * different cost, which is the point.
   */
  readonly strongestChoice: string
}

export const OUTCOME_MATRIX: readonly OutcomeMapping[] = [
  {
    scenarioId: 'morning',
    domain: 'Process',
    outcome: 'Decide where finite attention goes when everything appears green',
    rationale:
      'The dashboard is green and three weak signals are sitting in the brief unmarked. The decision is whether to work the inbox or read what the status is not saying.',
    strongestChoice: 'signals',
  },
  {
    scenarioId: 'standup',
    domain: 'People',
    outcome: 'Remove impediments and blockers for the team',
    rationale:
      'A blocked team member and an unresponsive external approver. Documenting the blocker is not removing it, and the difference costs time later in the day.',
    strongestChoice: 'unblock',
  },
  {
    scenarioId: 'backlog',
    domain: 'Process',
    outcome: 'Manage scope and route additions through a decision rather than absorbing them',
    rationale:
      'A small, reasonable, undocumented addition from the customer representative — the third this month. Absorbing it is easy and is exactly how the schedule was lost.',
    strongestChoice: 'clarify',
  },
  {
    scenarioId: 'stakeholders',
    domain: 'People',
    outcome: 'Engage stakeholders whose stated requirements conflict',
    rationale:
      'The sponsor and the customer representative want incompatible things. Picking a winner resolves the meeting and not the conflict.',
    strongestChoice: 'facilitate',
  },
  {
    scenarioId: 'signals',
    domain: 'Process',
    outcome: 'Assess project performance against plan and act on variance',
    rationale:
      'Spend running ahead of plan is a number until somebody asks what it is made of. The decision is whether to explain the variance or manage the symptom.',
    strongestChoice: 'analyse',
  },
  {
    scenarioId: 'change',
    domain: 'Process',
    outcome: 'Evaluate the impact of a change before committing to it',
    rationale:
      'A late change arrives with authority behind it. Accepting and refusing are both answers given without information; assessing impact is the one that produces any.',
    strongestChoice: 'assess',
  },
  {
    scenarioId: 'hybrid',
    domain: 'Process',
    outcome: 'Select delivery approaches appropriate to the work rather than to a preference',
    rationale:
      'Part of this project genuinely suits iteration and part of it genuinely has a fixed compliance gate. Forcing either onto the whole is the mistake.',
    strongestChoice: 'integrate',
  },
  {
    scenarioId: 'sponsor',
    domain: 'Process',
    outcome: 'Communicate project status to the level of detail the audience can act on',
    rationale:
      'Fifteen minutes with the sponsor. Everything and nothing are both failures of communication; a decision-shaped update is the one that uses the sponsor for what only a sponsor can do.',
    strongestChoice: 'decision-shaped',
  },
  {
    scenarioId: 'ethics',
    domain: 'Business Environment',
    outcome: 'Report status honestly under pressure to report otherwise',
    rationale:
      'The pressure is real, the softening is plausible, and the cost of an inaccurate green lands on somebody who is not in the room.',
    strongestChoice: 'accurate',
  },
  {
    scenarioId: 'seam',
    domain: 'Business Environment',
    outcome: 'Manage an issue that crosses an organisational boundary nobody owns',
    rationale:
      'The failure is in neither system and in the seam between them. Both owning teams are correct that it is not their defect, which is why it has survived.',
    strongestChoice: 'end-to-end',
  },
  {
    scenarioId: 'quality',
    domain: 'Process',
    outcome: 'Manage quality of deliverables against schedule pressure',
    rationale:
      'The regression suite costs half a day nine days before a demo. Both never-skip and always-skip are policies rather than judgements.',
    strongestChoice: 'assess-risk',
  },
  {
    scenarioId: 'close',
    domain: 'People',
    outcome: 'Close the day deliberately and carry what was learned forward',
    rationale:
      'The last hour is the one most often spent reacting. What gets done with it decides what tomorrow starts from.',
    strongestChoice: 'fix-seam',
  },
]

/** Scenarios with no mapping. Must be empty; asserted in the test suite. */
export function unmappedScenarios(): string[] {
  const mapped = new Set(OUTCOME_MATRIX.map((m) => m.scenarioId))
  return SCENARIOS.filter((s) => !mapped.has(s.id)).map((s) => s.id)
}

/** Mappings whose scenario or strongest choice no longer exists. Must be empty. */
export function danglingMappings(): string[] {
  return OUTCOME_MATRIX.filter((m) => {
    const scenario = SCENARIOS.find((s) => s.id === m.scenarioId)
    return !scenario || !scenario.choices.some((c) => c.id === m.strongestChoice)
  }).map((m) => m.scenarioId)
}

/** Coverage across the three domains, for the review deliverable. */
export function domainCoverage(): Record<OutcomeDomain, number> {
  return OUTCOME_MATRIX.reduce(
    (acc, m) => ({ ...acc, [m.domain]: acc[m.domain] + 1 }),
    { People: 0, Process: 0, 'Business Environment': 0 } as Record<OutcomeDomain, number>
  )
}

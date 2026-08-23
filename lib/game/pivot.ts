import type { PivotStepDef } from './types'

// ---------------------------------------------------------------------------
// WISER Pivots™ inside the game.
//
// ── WHERE THE APPROVED WORDING COMES FROM ──────────────────────────────────
//
// The six step words (WAIT · INSPECT · SELECT · EMBRACE · PIVOT · REVIEW),
// their leads, and the signature line are the owner's approved wording,
// approved 22 August 2026 as the customer-facing replacement for S.T.E.A.D.Y.
// They already exist in `lib/liap/scoring.ts` as STEADY_STEPS and PIVOTS_INTRO
// — but on the `claude/liap-canonical` branch, which is not in `main` and so
// is not importable from here.
//
// So the words are restated below rather than imported, and that is a
// duplication with a known resolution: when the canonical branch merges, this
// file should import the six approved strings instead of holding its own copy.
// It is flagged in the Change Report as such. Nothing else from the report
// section is restated — the four paragraphs of PIVOT body prose stay in one
// home, and the game does not need them.
//
// ── WHAT IS NEW LANGUAGE HERE ──────────────────────────────────────────────
//
// Every `prompt`, `label` and `outcome` below is written for this game and is
// new customer-facing language. It is listed in the Change Report for owner
// review. It describes a portal project; it makes no life claim, no readiness
// claim and no PMI claim.
//
// ── WHY THIS IS NOT AN EMERGENCY BUTTON ────────────────────────────────────
//
// The cycle is reachable from exactly two branches in the whole day, both of
// which end with the participant learning something that genuinely calls the
// current route into question, and it can be walked once. It is not on the
// dashboard, there is no "Pivot" button in the chrome, and no scenario offers
// it as a choice. If it were available every hour it would become the answer
// to everything, which is the opposite of what an intentional turn is.
//
// Four steps ask the participant to look. One asks them to choose a priority.
// One — the turn itself — is a real fork with real costs. A cycle you can
// click through without deciding anything teaches nothing.
// ---------------------------------------------------------------------------

/** Approved wording. Section heading and signature line. */
export const PIVOT_INTRO = {
  heading: 'WISER Pivots™',
  descriptor: 'An adaptive cycle for navigating change.',
  signature: 'The bend is not the end. Be ready to make the turn.',
} as const

/**
 * The one line the game adds around the cycle, and it is deliberately about
 * the project rather than about the participant.
 */
export const PIVOT_INVITATION =
  'Something you just learned changes the picture. Before you decide what to do next, take the turn deliberately.'

export const PIVOT_STEPS: readonly PivotStepDef[] = [
  {
    letter: 'W',
    title: 'WAIT',
    lead: 'Resist the reaction.',
    prompt:
      'The instinct right now is to act immediately — send the message, call the meeting, fix it yourself. Nothing about this gets worse in the next two minutes. Take them.',
  },
  {
    letter: 'I',
    title: 'INSPECT',
    lead: 'See what is true now.',
    prompt:
      'Not what the plan said this morning. What is actually true about this project, right now, including the parts you would rather not look at.',
    showsDashboard: true,
  },
  {
    letter: 'S',
    title: 'SELECT',
    lead: 'Choose what matters now.',
    prompt:
      'You have nine days and one team. You cannot protect everything equally. What matters most between now and the demo?',
    options: [
      {
        id: 'people',
        label: 'The team — they are the only thing that delivers anything else',
        outcome: 'You decide the team is what you will not spend to buy something else.',
      },
      {
        id: 'value',
        label: 'The value — whether members can actually update their own details',
        outcome: 'You decide the point of the project outranks the shape of the plan.',
      },
      {
        id: 'time',
        label: 'The date — the demo is committed and people are expecting it',
        outcome: 'You decide the commitment is the thing you will hold.',
      },
      {
        id: 'quality',
        label: 'The quality — a demo that breaks in front of members costs more than a late one',
        outcome: 'You decide that what you show has to work.',
      },
      {
        id: 'risk',
        label: 'The risk — you would rather deal with it now than be surprised by it',
        outcome: 'You decide to spend attention on what has not happened yet.',
      },
      {
        id: 'resources',
        label: 'The resources — the spend and the two people out on Thursday',
        outcome: 'You decide the constraint you have to plan around is capacity.',
      },
    ],
  },
  {
    letter: 'E',
    title: 'EMBRACE',
    lead: 'Accept the need to adapt.',
    prompt:
      'You do not have to like what changed. You do have to stop planning as though it did not. The plan you inherited three weeks ago described a project that no longer exists in that form.',
  },
  {
    letter: 'PIVOT',
    title: 'PIVOT',
    lead: 'Make the turn.',
    focal: true,
    prompt:
      'A pivot may mean changing the route rather than the destination. It may mean the timeline, the order, the resources, the scope — or it may mean the destination itself was wrong. Decide what to do with what you now know.',
    options: [
      {
        id: 'route',
        label: 'Change the route — same demo, same date, different way of getting there',
        outcome:
          'You keep the commitment and change the method. The team re-sequences around what you learned. It costs you the slack you were quietly holding, and it buys you a plan that matches reality.',
        health: { risk: 8, quality: 6, time: -4 },
      },
      {
        id: 'timeline',
        label: 'Change the timeline — go to Dana and move the demo',
        outcome:
          'Dana is not pleased and does not argue. The date moves by a week. The team stops working to a number nobody believed, and Ray tells you afterwards that it was the first honest date the project has had.',
        health: { people: 8, quality: 8, risk: 6, time: -6, value: -4 },
      },
      {
        id: 'scope',
        label: 'Change the scope — demo the part that genuinely works',
        outcome:
          'You cut the demo down to profile update and nothing else. It is smaller than what was promised, it is real, and it holds. What you cut is still on the backlog and everyone knows where it went.',
        health: { time: 8, quality: 8, risk: 5, value: -5 },
      },
      {
        id: 'destination',
        label: 'Question the destination — say out loud that this may be solving the wrong problem',
        outcome:
          'It is an uncomfortable conversation and it is the right one. Dana does not agree with you, but the question is now on the table where a sponsor can answer it instead of a project manager guessing.',
        health: { value: 10, risk: 8, people: -4, time: -6 },
      },
    ],
  },
  {
    letter: 'R',
    title: 'REVIEW',
    lead: 'Learn from your pivot.',
    prompt:
      'You will not know whether that was right for some days yet. What you can do now is name what you expect to see if it was — and notice when circumstances change again.',
  },
]

/** Practical Wisdom for walking the cycle deliberately rather than reacting. */
export const PIVOT_WISDOM = 25

/** The turn is optional. Declining costs nothing and buys nothing. */
export const PIVOT_DECLINE_LABEL = 'Not now — stay on the current route'

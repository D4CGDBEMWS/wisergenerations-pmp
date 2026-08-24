import type { RoadEvent } from './types'

// ---------------------------------------------------------------------------
// The eight Road Events.
//
// Owner-approved NAMES, fixed set. The `intent` lines are the facilitator's
// prompt — what they are inviting the team to do — and are SYSTEM-WRITTEN,
// pending owner approval. They appear on the facilitator console only; nothing
// here is projected to the room except the event name, and the reveal text the
// facilitator writes in the moment.
//
// ── EVENTS ARE NOT SPACES ──────────────────────────────────────────────────
//
// None of these advances the team, none of them is a phase, and none of them
// is landed on by chance. A facilitator chooses one, chooses when, and chooses
// whether it lands on a decision the team already made. That is why there is
// no `weight`, no `probability` and no ordering here — a set, not a deck.
// ---------------------------------------------------------------------------

export const ROAD_EVENT_LIBRARY: readonly RoadEvent[] = [
  {
    id: 'risk-ahead',
    name: 'Risk Ahead',
    intent: 'Something that has not happened yet could change the route. Name it, then decide whether to plan around it now or accept it and move.',
    favourable: false,
  },
  {
    id: 'issue-now',
    name: 'Issue Now',
    intent: 'This one has already happened. It is not a risk any more. What does the team do about it before the next milestone?',
    favourable: false,
  },
  {
    id: 'opening-ahead',
    name: 'Opening Ahead',
    intent: 'An opportunity the team did not plan for. Taking it costs something. Decide whether it serves the Destination or merely looks like progress.',
    favourable: true,
  },
  {
    id: 'resources',
    name: 'Resources',
    intent: 'Something becomes available — people, money, time, information, access. Decide where it goes, and what it does not go to.',
    favourable: true,
  },
  {
    id: 'low-fuel',
    name: 'Low Fuel',
    intent: 'Capacity is running down. Energy, budget, goodwill, attention. What does the team protect, and what does it let go?',
    favourable: false,
  },
  {
    id: 'no-signal',
    name: 'No Signal',
    intent: 'Information the team needs is not coming. A person is unreachable, an answer has not arrived. Decide without it, or change the plan to wait.',
    favourable: false,
  },
  {
    id: 'lifeline',
    name: 'Lifeline',
    intent: 'Help is available if the team asks for it. Facilitator-granted. What do they ask for, and what will they do with it?',
    favourable: true,
  },
  {
    id: 'recalculating',
    name: 'GPS: Recalculating…',
    intent: 'Stop. Before the next move, the team reviews what is still true and what has changed — and decides whether the Destination and the milestones still hold.',
    favourable: false,
    opensRecalculation: true,
  },
]

export function roadEvent(id: RoadEvent['id']): RoadEvent {
  const found = ROAD_EVENT_LIBRARY.find((e) => e.id === id)
  if (!found) throw new Error(`Unknown road event: ${id}`)
  return found
}

/**
 * The five GPS: Recalculating… questions. Owner-specified, fixed, in order.
 *
 * Nothing scores these. The review exists so a team says out loud what changed
 * and then revises the roadmap on purpose rather than drifting into a plan
 * that stopped being true two milestones ago.
 *
 * NOTE ON WISER PIVOTS™: this review is deliberately NOT presented as WISER
 * Pivots™ instruction, and the acronym appears nowhere in the participant
 * display. The methodology is taught in the facilitated debrief, after the
 * team has felt the need for it. Naming it here would hand them the answer
 * before they have the question. A test asserts the term is absent from every
 * projected string.
 */
export const RECALCULATION_PROMPTS = [
  { key: 'stillTrue', label: 'What is still true?' },
  { key: 'changed', label: 'What has changed?' },
  { key: 'destinationValid', label: 'Does the Destination still hold?' },
  { key: 'milestoneToChange', label: 'Which milestone has to change?' },
  { key: 'nextMove', label: 'What is your next move?' },
] as const

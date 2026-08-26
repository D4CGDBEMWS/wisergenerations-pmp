import type { RoadEvent } from './types'

// ---------------------------------------------------------------------------
// The eight Road Events — reconciled against the approved deck.
//
// ── PROVENANCE: ARTIFACT 3, FACILITATOR ROAD-EVENT CARDS ───────────────────
//
// Every string in this file is now the owner's, transcribed verbatim from
// LIAP_Facilitator_Road_Event_Cards.docx. The system-written `intent` line
// that used to stand in for a card has been deleted rather than kept beside
// the approved wording — one vocabulary, physical and digital.
//
// The printed card carries six fields and this file carries the same six, in
// the same words, because collapsing them into a summary is how a parallel
// digital vocabulary starts.
//
// ── WHICH FIELDS MAY REACH THE ROOM ────────────────────────────────────────
//
// The card itself is marked FACILITATOR ONLY — "Participants build the road.
// You control what happens on it. Do not distribute this deck." So the split
// matters:
//
//   name, tagline, readToTeam, ROADMAP_CHECK   read aloud → may be projected
//   whenToPlay, watchFor, pushWithoutSolving   facilitator's own eyes only
//
// projection.ts copies only the first group. A test asserts the second group
// never reaches the wire.
//
// ── EVENTS ARE NOT SPACES ──────────────────────────────────────────────────
//
// "Introduce road events between those points. The events interrupt the road;
// they do not replace the roadmap process." — Artifact 3.
//
// So there is no weight, no probability and no ordering here: a set, not a
// deck to draw from. And the governing rule, also Artifact 3: "Do not play
// every event in every scenario. Select the event that naturally tests the
// team's current plan."
// ---------------------------------------------------------------------------

export const ROAD_EVENT_LIBRARY: readonly RoadEvent[] = [
  {
    id: 'risk-ahead',
    name: 'Risk Ahead',
    tagline: 'Something might happen.',
    readToTeam:
      'A possible problem is now visible on the road. Decide whether it matters enough to plan for before it happens.',
    whenToPlay:
      'Before a milestone when the team is moving as though nothing could disrupt its plan.',
    watchFor:
      'Do they distinguish a possible future problem from something already happening? Do they build a response without abandoning the project?',
    pushWithoutSolving:
      'What could this affect? How likely is it? What could you do now so you are not starting from zero if it happens?',
    favourable: false,
  },
  {
    id: 'issue-now',
    name: 'Issue Now',
    tagline: 'It already happened.',
    readToTeam:
      'The problem is no longer a possibility. It is here. Decide what requires action now and what can wait.',
    whenToPlay:
      'When a scenario condition has become real or an earlier unaddressed problem catches up with the team.',
    watchFor:
      'Do they prioritize? Do they protect the destination while changing the route? Do earlier choices create consequences?',
    pushWithoutSolving:
      'What changed because this is real now? What needs action first? Which milestone is affected?',
    favourable: false,
  },
  {
    id: 'opening-ahead',
    name: 'Opening Ahead',
    tagline: 'A door may be opening.',
    readToTeam:
      'An opportunity has appeared. You do not have to take it. Decide what you need to know before saying yes or no.',
    whenToPlay:
      'When the team is overly focused on problems, or when a credible new option can change the road.',
    watchFor:
      'Do they investigate the opportunity instead of automatically accepting it? Do they consider trade-offs and timing?',
    pushWithoutSolving:
      'What would this make possible? What would it cost? Does it move you toward your Destination or distract you from it?',
    favourable: true,
  },
  {
    id: 'resources',
    name: 'Resources',
    tagline: 'Look at what you already have.',
    readToTeam:
      'Before looking for something new, take inventory of the people, skills, tools, knowledge, money, relationships, experience, and faith resources already available to you.',
    whenToPlay: 'When a team says it cannot proceed because it lacks something.',
    watchFor:
      'Do they overlook people, transferable skills, networks, existing tools, or nonfinancial resources?',
    pushWithoutSolving:
      'What are you treating as ordinary that could actually help this project? Who already knows something you need to know?',
    favourable: true,
  },
  {
    id: 'low-fuel',
    name: 'Low Fuel',
    tagline: 'Something is running low.',
    readToTeam:
      'Time, money, energy, focus, capacity, or another critical resource is getting low. Decide what you will protect, reduce, replace, or replenish.',
    whenToPlay:
      'Before or after a demanding milestone when resource pressure should force prioritization.',
    watchFor:
      'Do they recognize capacity limits? Do they keep adding work instead of making trade-offs?',
    pushWithoutSolving:
      'What runs out first if nothing changes? What can you stop, delay, delegate, replace, or refuel?',
    favourable: false,
  },
  {
    id: 'no-signal',
    name: 'No Signal',
    tagline: 'The thing you expected to work does not.',
    readToTeam:
      'A tool, technology, information source, connection, or dependency you expected to rely on is unavailable. Keep moving without assuming it will return immediately.',
    whenToPlay:
      "When the team's plan depends too heavily on one technology, person, system, vehicle, vendor, or source of information.",
    watchFor:
      'Do they have a backup? Can they separate the Destination from the route they originally chose?',
    pushWithoutSolving:
      'What did your plan depend on? What do you know without it? What is another way to reach the same milestone?',
    favourable: false,
  },
  {
    id: 'lifeline',
    name: 'Lifeline',
    tagline: 'Ask for help.',
    readToTeam:
      'You may call on a person, network, professional, organization, mentor, faith resource, or other legitimate source of help. First decide what kind of help you actually need.',
    whenToPlay:
      'When the team is genuinely stuck or when asking for appropriate help is itself part of the learning.',
    watchFor:
      'Can they define the need before asking? Do they expect the Lifeline to solve the project for them?',
    pushWithoutSolving:
      'What specifically do you need help with? Who is best positioned to help with that part? What still belongs to you?',
    favourable: true,
  },
  {
    id: 'recalculating',
    // Owner ruling, 25 August 2026: the ellipsis character, consistently.
    // Artifacts 2, 3, 4, 5 and 6 print three periods and now diverge from the
    // software; that is on the physical-artifact revision list, not something
    // to reconcile by reverting the code.
    name: 'GPS: Recalculating…',
    tagline: 'New information. New route. Keep going.',
    readToTeam:
      'Something changed. Pause long enough to see what is still true, what is no longer true, and what must change in the road ahead.',
    whenToPlay: "After a meaningful change that invalidates part of the team's roadmap.",
    watchFor:
      'Do they treat change as failure, or can they adapt? Do they change only what needs changing? Does the Destination still make sense?',
    pushWithoutSolving:
      'What is still true? What changed? Which milestone needs to move? Is the Destination the same? What is your next wise move?',
    favourable: false,
    opensRecalculation: true,
  },
]

/**
 * The ROADMAP CHECK, identical on all eight approved cards.
 *
 * Verbatim from Artifact 3, minus the facilitator's "Ask:" prefix — the card
 * instructs the facilitator to ask it, so the question itself is what the room
 * hears, and this is the participant-facing half.
 */
export const ROADMAP_CHECK =
  'Does this change your First Move, Decision/Milestone Check, Next Milestone, later milestone, or Destination? If yes, revise the road.'

export function roadEvent(id: RoadEvent['id']): RoadEvent {
  const found = ROAD_EVENT_LIBRARY.find((e) => e.id === id)
  if (!found) throw new Error(`Unknown road event: ${id}`)
  return found
}

/**
 * The GPS: Recalculating… review — the five canonical questions.
 *
 * ── THEY ARE THE COMPLETED LIFE PROJECT PLAN™'S OWN WORDING ────────────────
 *
 * Worth correcting an earlier report of mine: these did not arrive only as a
 * chat ruling. The Completed Life Project Plan™ §15 carries all five verbatim,
 * under "When the road changes, use these questions before reacting". So the
 * software agrees with the Retreat's outcome document — which is the artifact
 * a participant ends up holding — and it is the Road-Event Card, the Journey
 * Documentation Tool and the MY PROJECT sheet that are out of step.
 *
 * That makes the reprint list three artifacts, not four, and it means the
 * canonical set was already owner-written rather than newly decided.
 *
 * ── WHAT THEY SUPERSEDE ────────────────────────────────────────────────────
 *
 * Reconciliation had flagged two of these as conflicts between artifacts.
 * Questions 3 and 4 in the Plan are neither of the readings the Road-Event
 * Card and the earlier instruction gave:
 *
 *   3. "What matters now?"              (not "Is the Destination the same?",
 *                                        not "Does the Destination still make
 *                                        sense?")
 *   4. "What options are available now?" (not "Which milestone needs to move?",
 *                                        not "Which part of the roadmap
 *                                        changes?")
 *
 * That resolves the digital side and creates a real one on the physical side:
 * the printed Road-Event Card, the Journey Documentation Tool and the MY
 * PROJECT sheet still ask the older questions. Reported to the owner rather
 * than reconciled in either direction — changing printed material is not a
 * decision this file gets to make.
 *
 * Note the shift in person, which is the owner's and is preserved: question 5
 * is "my revised next move", matching the MY PROJECT sheet's own line rather
 * than the facilitator's "your next wise move".
 *
 * Nothing scores these. The review exists so a team says out loud what changed
 * and then revises the roadmap on purpose rather than drifting into a plan
 * that stopped being true two milestones ago.
 *
 * NOTE ON WISER PIVOTS™: Artifact 6 — "Connect adaptation to WISER Pivots™
 * only after participants have described the behavior themselves." The acronym
 * and the model appear nowhere a participant can reach, and a test asserts it.
 */
export const RECALCULATION_PROMPTS = [
  { key: 'stillTrue', label: 'What is still true?' },
  { key: 'changed', label: 'What changed?' },
  { key: 'mattersNow', label: 'What matters now?' },
  { key: 'optionsAvailable', label: 'What options are available now?' },
  { key: 'revisedNextMove', label: 'What is my revised next move?' },
] as const

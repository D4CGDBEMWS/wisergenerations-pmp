import type { ImpactTarget } from './types'

// ---------------------------------------------------------------------------
// How the team's own answer reads back to them.
//
// One module rather than a string in each surface, because the wall, the
// Journey Record and the console must say the same thing about the same
// decision. Two copies of this sentence would drift, and the room would end up
// reading one wording while the printed record said another.
//
// Note what it is not: a judgement. "You changed your Destination" is a
// description of what the team did, not a verdict on whether they should have.
// ---------------------------------------------------------------------------

/**
 * PROVENANCE: SYSTEM-WRITTEN, pending owner review.
 *
 * The approved artifacts phrase this moment as a QUESTION — Artifact 3's
 * ROADMAP CHECK, and Artifact 4's log column "WHAT PART OF THE ROAD CHANGED?"
 * — and let the team write the answer in their own words. There is no approved
 * set of answer labels to reconcile these against, so they remain mine and
 * remain pending.
 *
 * The vocabulary, at least, is now the approved vocabulary: "later milestone"
 * rather than a second "Next Milestone", matching Artifact 3.
 *
 * 'none' becomes a sentence rather than a blank, because deciding an
 * interruption changes nothing is a project-management judgement worth seeing
 * in the record.
 */
export function impactLabel(impact: ImpactTarget): string {
  switch (impact) {
    case 'first-move':
      return 'You changed your First Move'
    case 'decision-check':
      return 'You changed your Decision / Milestone Check'
    case 'milestone-2':
      return 'You changed your Next Milestone'
    case 'milestone-3':
      return 'You changed a later milestone'
    case 'destination':
      return 'You changed your Destination'
    case 'none':
      return 'You decided it changed nothing'
  }
}

/**
 * What the facilitator picks from, after the team has argued it out.
 *
 * Labels are the five named in Artifact 3's ROADMAP CHECK, in its order and
 * its words. 'Nothing' has no approved equivalent — the card ends "If yes,
 * revise the road", which implies a no without labelling one — so that option
 * is system-written and pending.
 */
export const IMPACT_CHOICES: readonly { readonly id: ImpactTarget; readonly label: string }[] = [
  { id: 'first-move', label: 'First Move' },
  { id: 'decision-check', label: 'Decision/Milestone Check' },
  { id: 'milestone-2', label: 'Next Milestone' },
  { id: 'milestone-3', label: 'later milestone' },
  { id: 'destination', label: 'Destination' },
  { id: 'none', label: 'Nothing' },
]

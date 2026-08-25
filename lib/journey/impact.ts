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
 * PROVENANCE: SYSTEM-WRITTEN, pending owner approval.
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
    case 'milestone-3':
      return 'You changed a Next Milestone'
    case 'destination':
      return 'You changed your Destination'
    case 'none':
      return 'You decided it changed nothing'
  }
}

/** What the facilitator picks from, after the team has argued it out. */
export const IMPACT_CHOICES: readonly { readonly id: ImpactTarget; readonly label: string }[] = [
  { id: 'first-move', label: 'First Move' },
  { id: 'decision-check', label: 'Decision / Milestone Check' },
  { id: 'milestone-2', label: 'Next Milestone (first)' },
  { id: 'milestone-3', label: 'Next Milestone (second)' },
  { id: 'destination', label: 'Destination' },
  { id: 'none', label: 'Nothing' },
]

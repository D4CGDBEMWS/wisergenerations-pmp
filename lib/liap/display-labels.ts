// ---------------------------------------------------------------------------
// The one place a stored action key becomes something a participant reads.
//
// ── WHY THIS FILE EXISTS ───────────────────────────────────────────────────
//
// Three surfaces show a participant their next best three: the results page,
// the results email, and the downloadable Snapshot PDF. Each had its own idea
// of how to turn `kind` into a heading. The page and the email carried their
// own literal maps; the PDF did `a.kind.toUpperCase()` — printing the raw
// stored key straight onto a document that leaves the system and outlives
// every retention rule here. So a participant's permanent PDF said RESOLVE
// and MOVE, which are database values, not language anybody approved.
//
// One map, three consumers, and a test that no surface can print a raw key.
//
// ── THE KEYS ARE NOT THE LABELS ────────────────────────────────────────────
//
// `protect` / `resolve` / `move` are PERSISTED. They live inside
// assessment_results.next_best_three as stored JSON, and every historical
// report holds them. Renaming a key would orphan every report ever scored —
// the same class of defect as rendering a V1 result through V2's definition.
//
// So the keys never change and the labels are free to. What a participant
// reads is a presentation decision; what the database holds is a fact about
// a report that was already produced.
// ---------------------------------------------------------------------------

/** The persisted action kinds. NEVER rename these. */
export type ActionKind = 'protect' | 'resolve' | 'move'

/**
 * Owner-approved participant-facing labels, 31 August 2026.
 *
 * The intent behind each, for anyone deciding where they belong:
 *
 *   PROTECT         Keep building on what's working.
 *   GIVE ATTENTION  Take a closer look.
 *   STRENGTHEN      Give this area focused care and attention.
 *
 * That intent is not rendered anywhere. The labels are used on their own,
 * because the surfaces that carry them are already short and each label sits
 * directly above the headline that explains it.
 */
export const ACTION_DISPLAY_LABELS: Readonly<Record<ActionKind, string>> = {
  protect: 'PROTECT',
  resolve: 'GIVE ATTENTION',
  move: 'STRENGTHEN',
}

/**
 * The label for a stored action kind.
 *
 * Returns an empty string for anything unrecognised rather than falling back
 * to the raw value. That fallback is the entire defect this module exists to
 * remove: a surface that prints whatever it was given will happily print a
 * database key to a customer, and it will look deliberate. A missing heading
 * is a visible gap somebody fixes; a raw key is a gap nobody notices.
 */
export function actionLabel(kind: string): string {
  return ACTION_DISPLAY_LABELS[kind as ActionKind] ?? ''
}

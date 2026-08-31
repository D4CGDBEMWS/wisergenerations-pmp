import * as v1 from './v1'
import * as v2 from './v2'

// ---------------------------------------------------------------------------
// The version registry.
//
// ── THE INVARIANT ──────────────────────────────────────────────────────────
//
// A stored assessment result is always reconstructed using the exact version
// that produced it. A V1 result renders V1 dimensions, V1 dimension keys and
// V1 report semantics; a V2 result renders V2's. Neither is ever rendered
// through the other's definition.
//
// ── WHY THIS FILE EXISTS ───────────────────────────────────────────────────
//
// Before it, rebuildReport imported the CURRENT definition and mapped stored
// score rows onto it. That is correct exactly until a version changes, and
// then it is silently wrong in the worst way: a V1 participant's report would
// have shown "Spiritual Readiness 5/25 - Immediate attention" for five
// questions they were never asked, because no score row matched that key and
// the lookup fell through to a default. Their actual Risk & Readiness score
// would have vanished from the report entirely, since V2 has no such key to
// map it onto. Nothing would have errored. The report would simply have
// described a different person.
//
// So the version is resolved from the assessment row and the matching
// definition is loaded here. Nothing is converted, nothing is re-scored, and
// no stored row is touched.
//
// ── WHY THE POSITION LABELS LIVE HERE TOO ──────────────────────────────────
//
// Dimensions are not the only version-sensitive thing. V1 scored the 80-119
// band as 'rebuild' / "Ready to Rebuild"; the owner renamed it to 'build' /
// "Ready to Build" on 31 August 2026. A stored V1 result holds position_key
// 'rebuild', and looking that up in V2's labels returns undefined -- a report
// with a blank position. The V1 strings below are the originals, preserved
// verbatim, and they are what a V1 result is rendered with.
//
// Ranking is version-sensitive for the same reason: V1 ranked money, risk and
// wellness first, and 'risk' is not a V2 dimension.
// ---------------------------------------------------------------------------

/** Every dimension key that has ever been scored, across all versions. */
export type HistoricalDimensionKey = v1.DimensionKey | v2.DimensionKey

/** The version-specific facts needed to render a stored result faithfully. */
export interface ReportSemantics {
  versionKey: string
  /** In this version's own display order. */
  dimensions: readonly { key: HistoricalDimensionKey; name: string }[]
  positionLabels: Readonly<Record<string, string>>
  positionMeanings: Readonly<Record<string, string>>
  /** Ranked ahead of the rest when two dimensions score the same. */
  priorityDimensions: readonly HistoricalDimensionKey[]
  /** Total order, so ties never flap between renders. */
  dimensionOrder: readonly HistoricalDimensionKey[]
}

// ── V1, as it was on the day it scored people ───────────────────────────────
//
// These strings are frozen. They are not the current wording and must never be
// updated to match it: they are the record of what a V1 participant was shown.

const V1_POSITION_LABELS = {
  move: 'Ready to Move',
  plan: 'Ready to Plan',
  rebuild: 'Ready to Rebuild',
  stabilize: 'Ready to Stabilize',
} as const

const V1_POSITION_MEANINGS = {
  move: 'You have the footing to act. The work now is choosing well and moving deliberately rather than waiting for more certainty.',
  plan: 'The ground is steady enough to plan on. The work now is turning intent into a sequence you can actually follow.',
  rebuild: 'Some foundations need attention before bigger moves will hold. That is ordinary during a real change, and it is addressable.',
  stabilize: 'Several essentials need steadying first. Start there — not because the larger goals do not matter, but because they will hold better once they do.',
} as const

const V2_POSITION_LABELS = {
  move: 'Ready to Move',
  plan: 'Ready to Plan',
  build: 'Ready to Build',
  stabilize: 'Ready to Stabilize',
} as const

const V2_POSITION_MEANINGS = {
  move: 'You have a strong foundation. Move forward intentionally while continuing to watch any dimension requiring attention.',
  plan: 'You have direction. Strengthen the areas that need structure before making your next major move.',
  build: 'Important areas need development. Build the foundation and resources needed for sustainable progress.',
  stabilize: 'Your priority is not to fix everything at once. Protect what matters, address what requires immediate attention, and move deliberately.',
} as const

const SEMANTICS: Readonly<Record<string, ReportSemantics>> = {
  [v1.VERSION_KEY]: {
    versionKey: v1.VERSION_KEY,
    dimensions: v1.DIMENSIONS.map((d) => ({ key: d.key, name: d.name })),
    positionLabels: V1_POSITION_LABELS,
    positionMeanings: V1_POSITION_MEANINGS,
    priorityDimensions: ['money', 'risk', 'wellness'],
    dimensionOrder: v1.DIMENSION_KEYS,
  },
  [v2.VERSION_KEY]: {
    versionKey: v2.VERSION_KEY,
    dimensions: v2.DIMENSIONS.map((d) => ({ key: d.key, name: d.name })),
    positionLabels: V2_POSITION_LABELS,
    positionMeanings: V2_POSITION_MEANINGS,
    priorityDimensions: ['money', 'wellness'],
    dimensionOrder: v2.DIMENSION_KEYS,
  },
}

/**
 * The semantics a stored result must be rendered with.
 *
 * Throws on an unrecognised version rather than falling back to the current
 * one. A report rendered through the wrong definition is not a degraded
 * report — it is a report about somebody else's answers, and it looks entirely
 * normal. Failing loudly is the only safe behaviour.
 */
export function semanticsFor(versionKey: string): ReportSemantics {
  const found = SEMANTICS[versionKey]
  if (!found) {
    throw new Error(
      `No report semantics registered for assessment version "${versionKey}". ` +
        `A stored result must be rendered with the version that produced it, so ` +
        `rendering it with a different version's definition is refused. Register ` +
        `the version in lib/liap/assessment/registry.ts.`
    )
  }
  return found
}

/** Every version this application can still render. */
export const REGISTERED_VERSIONS = Object.keys(SEMANTICS)

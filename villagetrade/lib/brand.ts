// ---------------------------------------------------------------------------
// Who VillageTrade is, in one place.
//
// ── TWO THINGS THIS FILE EXISTS TO PREVENT ─────────────────────────────────
//
// 1. "International". VillageTrade is a LOCAL, community-centered
//    marketplace. The sibling company is Wiser Generations Int'l; this one is
//    not, and must never inherit that word by copy-paste. A test forbids it.
//
// 2. Claiming a company that does not exist yet. The intended entity name is
//    VillageTrade LLC, subject to Georgia name availability and registration.
//    It is NOT registered. Nothing rendered may say "LLC", carry a
//    registration number, or imply an operating company, until the founder
//    says it is formed.
// ---------------------------------------------------------------------------

export const BRAND_NAME = 'VillageTrade'

/** Founder-approved. */
export const MISSION = 'Helping neighbors survive and thrive.'

export const PILOT_AREA = 'Cobb County, Georgia'

/**
 * Entity status. Deliberately not a name string that could be rendered.
 *
 * `intendedEntityName` is recorded for planning documents only. While
 * `registered` is false, no customer-facing surface may render it — see
 * tests/brand.test.ts.
 */
export const ENTITY = {
  intendedEntityName: 'VillageTrade LLC',
  registered: false,
  jurisdiction: 'Georgia',
  note: 'Subject to Georgia name availability and registration. Not formed.',
} as const

/** Words that must not appear on a VillageTrade surface. */
export const FORBIDDEN_BRAND_TERMS: readonly string[] = [
  'International',
  "Int'l",
  'Nationwide',
  'Worldwide',
  'Global',
]

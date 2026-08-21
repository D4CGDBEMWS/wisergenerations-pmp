// ---------------------------------------------------------------------------
// The fourteen sections, and the rule that governs them.
//
// This module is the single source of truth for what sections exist, what
// order they appear in, and — the part that matters most — where the
// conversion firewall sits.
//
// ── THE FIREWALL ───────────────────────────────────────────────────────────
//
// Owner ruling, 21 August 2026, recorded verbatim because it is a hard rule
// rather than a layout preference:
//
//   "No price. No product name. No purchase CTA above Section 8.
//    Sections 1–7 create recognition, tension, possibility and future state.
//    Section 8 introduces LIAP as the solution.
//    Section 9 introduces the first commercial yes.
//    Do not weaken this rule later for convenience or conversion
//    experimentation without owner approval."
//
// It is enforced here rather than remembered: a section before the boundary
// may only carry a 'journey' call to action, and the content contract refuses
// to compile if one carries a price or a product name. There is a test that
// fails the build if the boundary moves.
//
// The reason to make it mechanical is that this is exactly the rule that
// erodes. Somebody will one day want "just a small book link in the hero,"
// and it will be reasonable, and it will quietly undo the entire structure
// the page is built on.
// ---------------------------------------------------------------------------

/** Every section id. Also the enumerated value for analytics `section_id`. */
export const SECTION_IDS = [
  'journey',     // 1 — hook
  'destination', // 2
  'direction',   // 3
  'resources',   // 4 — hidden resources
  'risk',        // 5
  'change',      // 6 — recalculating
  'possibility', // 7 — future pacing
  'reveal',      // 8 — introduce LIAP. The firewall lifts here.
  'start',       // 9 — book + assessment
  'build',       // 10 — workshop
  'experience',  // 11 — weekend
  'proof',       // 12
  'questions',   // 13 — FAQ
  'next-step',   // 14
] as const

export type SectionId = (typeof SECTION_IDS)[number]

/**
 * The first section allowed to mention commerce.
 *
 * Section 8 by number, index 7 in the array. Named rather than written as a
 * literal so the rule reads the same in every file that enforces it.
 */
export const FIREWALL_SECTION: SectionId = 'reveal'

const FIREWALL_INDEX = SECTION_IDS.indexOf(FIREWALL_SECTION)

/** 1-based position, matching how the owner numbers them. */
export function sectionNumber(id: SectionId): number {
  return SECTION_IDS.indexOf(id) + 1
}

/**
 * Whether a section sits above the firewall.
 *
 * Above it: recognition, tension, possibility. No price, no product name, no
 * purchase CTA — only an invitation to keep going.
 */
export function isAboveFirewall(id: SectionId): boolean {
  const index = SECTION_IDS.indexOf(id)
  return index >= 0 && index < FIREWALL_INDEX
}

/**
 * Call-to-action tiers, ordered by how much they ask of the visitor.
 *
 * 'journey' asks for nothing but attention and is the only tier permitted
 * above the firewall. The rest map to the approved commercial ladder:
 * START, BUILD, EXPERIENCE, CONTINUE.
 */
export const CTA_TIERS = ['journey', 'start', 'build', 'experience', 'continue'] as const

export type CtaTier = (typeof CTA_TIERS)[number]

/** The only tier a pre-firewall section may use. */
export const JOURNEY_TIER: CtaTier = 'journey'

/**
 * Whether a tier may appear in a section.
 *
 * The whole firewall, in one function. Everything else in this codebase that
 * needs to know the rule asks this rather than reimplementing it.
 */
export function tierAllowedIn(id: SectionId, tier: CtaTier): boolean {
  return isAboveFirewall(id) ? tier === JOURNEY_TIER : true
}

'use client'

// ---------------------------------------------------------------------------
// What may leave the system, and what may not. §26, §28, §29.
//
// This module exists so the rule is enforced in one place rather than
// remembered in twenty. Every LIAP analytics event goes through here, and the
// allow-lists below are the whole contract. Its server-side twin, lib/liap/crm.ts,
// does the same for CRM tags.
//
// The rule, stated plainly: an assessment answer never leaves this system.
// Not the narrative, not a dimension score, not the affected area, not the
// urgency. GA4 and Meta are advertising and measurement systems with their own
// retention, their own subprocessors and their own breach history, and
// somebody's sentence about a diagnosis has no business in any of them.
//
// What may go out is funnel shape: that an assessment was started, that one
// was completed, and which of four positions resulted. The position is
// coarse enough to segment on and carries no detail about the person's
// circumstances.
//
// ── THE PHASE II-J EXPANSION, AND ITS LIMITS ───────────────────────────────
//
// Owner ruling, 21 August 2026: the two-property contract may grow to carry
// journey measurement, with two conditions attached —
//
//   "Do not use these fields for PII, free-form customer text, authorization,
//    entitlement, approval, pricing decisions, or behavioral profiling."
//
//   "Do not create unlimited arbitrary analytics properties merely because
//    the contract is being expanded. Keep the schema controlled and
//    enumerated."
//
// So exactly two properties were added — `section_id` and `cta_tier` — and
// both are ENUMERATED rather than free strings. A key on the allow-list is
// not enough: the VALUE must also be one of the fourteen section ids or one
// of the five tiers, or it is dropped. That is the difference between a
// controlled schema and a permitted free-text field with a narrow name.
//
// Deliberately NOT added, pending the final taxonomy: scroll depth, dwell
// time, per-transition funnel steps, entry/exit markers. The architecture
// below carries them without further change when they are defined; adding
// them speculatively now would be exactly the unlimited expansion the ruling
// rules out.
// ---------------------------------------------------------------------------

import { trackEvent } from '@/components/Analytics'
import { SECTION_IDS, CTA_TIERS, type SectionId, type CtaTier } from '@/lib/liap/journey/sections'

/** §29. The only LIAP events that may reach analytics. */
export const LIAP_EVENTS = [
  'liap_hub_view',
  'liap_book_view',
  'liap_preorder_clicked',
  'liap_preorder_completed',
  'liap_assessment_unlocked',
  'liap_assessment_started',
  'liap_assessment_step_completed',
  'liap_assessment_completed',
  'liap_results_viewed',
  'liap_results_email_sent',
  'liap_next_offer_clicked',
  // Phase II-J. Two events, no more: where a visitor reached, and what they
  // chose. Together with the campaign code they arrived on, that is enough to
  // see where the story loses people.
  'liap_section_view',
  'liap_cta_clicked',
] as const

export type LiapEvent = (typeof LIAP_EVENTS)[number]

/**
 * The only properties allowed alongside an event.
 *
 * `step` is a number 1–6. `position` is one of four coarse buckets. Nothing
 * else is permitted — not a score, not a dimension, not an area, and
 * emphatically not a free-text answer.
 */
export interface LiapEventProps {
  step?: number
  position?: 'move' | 'plan' | 'rebuild' | 'stabilize'
  /** Which of the fourteen journey sections. Enumerated, never free text. */
  section_id?: SectionId
  /** Which rung of the offer ladder a CTA belongs to. Enumerated. */
  cta_tier?: CtaTier
}

const ALLOWED_PROPS = new Set(['step', 'position', 'section_id', 'cta_tier'])

/**
 * Properties whose VALUE is checked, not only whose key is permitted.
 *
 * The owner's instruction was to keep the schema controlled and enumerated. A
 * key allow-list alone would let `section_id: "user@example.com"` through —
 * narrow name, free-text field. Checking the value against the enumeration
 * closes that, and means a typo drops the property rather than creating a
 * phantom segment nobody can explain three months later.
 */
const ENUMERATED: Record<string, ReadonlySet<string>> = {
  position: new Set(['move', 'plan', 'rebuild', 'stabilize']),
  section_id: new Set(SECTION_IDS),
  cta_tier: new Set(CTA_TIERS),
}

/**
 * Sends a LIAP funnel event, stripping anything not on the allow-list.
 *
 * Strips rather than throws. A caller that accidentally passes a score should
 * lose the score, not lose the event and take the page down with it — but it
 * must never be the case that passing it results in it being sent.
 */
export function trackLiap(event: LiapEvent, props: LiapEventProps = {}): void {
  const clean: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(props)) {
    if (!ALLOWED_PROPS.has(key)) continue
    if (typeof value !== 'number' && typeof value !== 'string') continue

    // Enumerated properties must also carry a permitted VALUE.
    const permitted = ENUMERATED[key]
    if (permitted && !permitted.has(String(value))) continue

    clean[key] = value
  }
  trackEvent(event, clean)
}

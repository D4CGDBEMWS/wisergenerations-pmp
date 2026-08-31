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
// ---------------------------------------------------------------------------

import { trackEvent } from '@/components/Analytics'

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
  position?: 'move' | 'plan' | 'build' | 'stabilize'
}

const ALLOWED_PROPS = new Set(['step', 'position'])

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
    if (typeof value === 'number' || typeof value === 'string') clean[key] = value
  }
  trackEvent(event, clean)
}

// ---------------------------------------------------------------------------
// CRM segmentation for Living Is a Project. §28.
//
// Server-only: it holds the Mailchimp key. Split from lib/liap/analytics.ts,
// which runs in the browser, so that neither can accidentally import the
// other's dependencies.
//
// The rule both halves share: an assessment answer never leaves this system.
// Not the narrative, not a dimension score, not the affected area, not the
// urgency. What may go out is funnel shape and one of four coarse positions.
// ---------------------------------------------------------------------------

import { upsertSubscriber } from '@/lib/mailchimp'


/** Product-specific by design. A LIAP customer is not a PMP lead. */
export const LIAP_TAGS = [
  'liap_interest',
  'liap_book_preorder',
  'liap_assessment_entitled',
  'liap_assessment_started',
  'liap_assessment_completed',
  'liap_ready_to_move',
  'liap_ready_to_plan',
  'liap_ready_to_rebuild',
  'liap_ready_to_stabilize',
  'liap_workshop_interest',
  'liap_starter_kit_interest',
] as const

export type LiapTag = (typeof LIAP_TAGS)[number]

const TAG_SET = new Set<string>(LIAP_TAGS)

export function positionTag(position: string): LiapTag | null {
  const map: Record<string, LiapTag> = {
    move: 'liap_ready_to_move',
    plan: 'liap_ready_to_plan',
    rebuild: 'liap_ready_to_rebuild',
    stabilize: 'liap_ready_to_stabilize',
  }
  return map[position] ?? null
}

/**
 * Tags a LIAP contact in the CRM.
 *
 * Only tags from the list above, and only ever tags — no merge fields, so
 * there is no shape in which an assessment answer could ride along. Someone
 * appearing here does not become a PMP campaign recipient: that is a
 * segmentation decision made in Mailchimp on these tags, and the reason the
 * tags are product-specific.
 */
export async function tagLiapContact(email: string, tags: LiapTag[]): Promise<void> {
  const allowed = tags.filter((t) => TAG_SET.has(t))
  if (allowed.length === 0) return

  try {
    await upsertSubscriber({ email, tags: allowed })
  } catch (err) {
    // Never fatal. A CRM outage must not stop someone receiving the plan they
    // paid for, and it must not surface as an error on a results page.
    console.error('[liap/crm] tagging failed:', err)
  }
}

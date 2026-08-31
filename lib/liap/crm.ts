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
//
// ── STATE FLOWS OUT, DECISIONS DO NOT FLOW BACK ────────────────────────────
//
// Everything here pushes a fact the application already established — this
// person paid, this person finished — into Mailchimp so a campaign can be
// segmented on it. Nothing reads back. Mailchimp cannot decide whether
// somebody paid, owns the book, is entitled to the assessment, finished it,
// or may see their results. Those live in `entitlements` and `assessments`
// and are read from there.
// ---------------------------------------------------------------------------

import { upsertSubscriber, type MailchimpResult } from '@/lib/mailchimp'
import { recordAuditEvent } from '@/lib/audit'
import { recordMarketingConsent } from '@/lib/marketing-consent'

/**
 * Product-specific by design. A LIAP customer is not a PMP lead.
 *
 * ── OWNER-FACING JOURNEY NAME → MACHINE TAG ────────────────────────────────
 *
 *   LIAP – Book Launch          liap_book_launch
 *   LIAP – Book Interest        liap_interest
 *   LIAP – Book Purchaser       liap_book_preorder
 *   LIAP – Assessment Access    liap_assessment_entitled
 *   LIAP – Assessment Completed liap_assessment_completed
 *   LIAP – Virtual Workshop     liap_workshop_interest
 *   LIAP – Retreat Interest     liap_retreat_interest
 *   LIAP – Retreat Registered   liap_retreat_registered
 *
 * The machine values are the ones already applied to live contacts, so they
 * are kept as they are: renaming a tag in code does not rename it in
 * Mailchimp, it just stops matching the contacts that carry the old one.
 *
 * The Destiny Projects™ Free Guide is deliberately NOT in this list. It is
 * tagged `free-guide` / `ebook-lead` by its own route and stays separately
 * identifiable, so a Free Guide reader is not swept into a LIAP segment.
 */
export const LIAP_TAGS = [
  'liap_book_launch',
  'liap_interest',
  'liap_book_preorder',
  'liap_assessment_entitled',
  'liap_assessment_started',
  'liap_assessment_completed',
  'liap_ready_to_move',
  'liap_ready_to_plan',
  'liap_ready_to_build',
  'liap_ready_to_stabilize',
  'liap_workshop_interest',
  'liap_starter_kit_interest',
  // Present for the launch campaign's segmentation, with no capture surface
  // behind them yet. A tag that exists cannot create a customer journey on its
  // own; it can only describe one the application already knows about.
  'liap_retreat_interest',
  'liap_retreat_registered',
] as const

export type LiapTag = (typeof LIAP_TAGS)[number]

/** Owner-facing journey names, for campaign briefs and audits. */
export const LIAP_JOURNEY_NAMES: Readonly<Record<string, LiapTag>> = {
  'LIAP – Book Launch': 'liap_book_launch',
  'LIAP – Book Interest': 'liap_interest',
  'LIAP – Book Purchaser': 'liap_book_preorder',
  'LIAP – Assessment Access': 'liap_assessment_entitled',
  'LIAP – Assessment Completed': 'liap_assessment_completed',
  'LIAP – Virtual Workshop': 'liap_workshop_interest',
  'LIAP – Retreat Interest': 'liap_retreat_interest',
  'LIAP – Retreat Registered': 'liap_retreat_registered',
}

const TAG_SET = new Set<string>(LIAP_TAGS)

export function positionTag(position: string): LiapTag | null {
  const map: Record<string, LiapTag> = {
    move: 'liap_ready_to_move',
    plan: 'liap_ready_to_plan',
    build: 'liap_ready_to_build',
    stabilize: 'liap_ready_to_stabilize',
  }
  return map[position] ?? null
}

/**
 * Records a synchronisation that did not happen, so it can be replayed.
 *
 * The alternative — a console line — is how a marketing outage turns into a
 * cohort of customers who quietly never receive the launch sequence. The row
 * says who and which tags, and `crm.sync_failed` is queryable, so a replay is
 * a SELECT away rather than an archaeology exercise.
 *
 * Uses the existing audit_events table. No new queue, no new schema.
 */
async function recordSyncFailure(input: {
  customerId?: string | null
  tags: readonly string[]
  operation: string
  status: number | null
}): Promise<void> {
  await recordAuditEvent({
    eventType: 'crm.sync_failed',
    customerId: input.customerId ?? null,
    metadata: {
      tags: input.tags.join(','),
      operation: input.operation,
      status: input.status,
    },
  })
}

/**
 * Tags a LIAP contact in the CRM.
 *
 * Only tags from the list above, and only ever tags — no merge fields, no
 * address, so there is no shape in which an assessment answer could ride
 * along. Someone appearing here does not become a PMP campaign recipient:
 * that is a segmentation decision made in Mailchimp on these tags, and the
 * reason the tags are product-specific.
 *
 * DOES NOT GRANT MARKETING CONSENT. A new contact is created `pending`, so
 * Mailchimp asks them to confirm before sending anything; and no `marketing`
 * consent row is written here, because being tagged is not the same as asking
 * to be emailed. Use `enrolLiapMarketing` when the customer actually opted in.
 *
 * Never throws. A CRM outage must not stop someone receiving the plan they
 * paid for, and must not surface as an error on a results page.
 */
export async function tagLiapContact(
  email: string,
  tags: LiapTag[],
  options: { customerId?: string | null; firstName?: string; lastName?: string } = {}
): Promise<MailchimpResult> {
  const allowed = tags.filter((t) => TAG_SET.has(t))
  if (allowed.length === 0) return { ok: true, skipped: true }

  try {
    const result = await upsertSubscriber({
      email,
      firstName: options.firstName,
      lastName: options.lastName,
      tags: allowed,
      statusIfNew: 'pending',
    })
    if (!result.ok) {
      await recordSyncFailure({
        customerId: options.customerId,
        tags: allowed,
        operation: 'tag',
        status: result.status,
      })
    }
    return result
  } catch (err) {
    console.error('[liap/crm] tagging failed:', err)
    await recordSyncFailure({
      customerId: options.customerId,
      tags: allowed,
      operation: 'tag',
      status: null,
    }).catch(() => {})
    return { ok: false, status: 500, message: 'Could not sync to the CRM.' }
  }
}

/**
 * Enrols a LIAP contact in MARKETING, which tagging alone does not do.
 *
 * Two gates, both required:
 *
 *   1. `consentGranted` must be an explicit choice the customer made. It is
 *      not defaulted and not inferred, and a refusal is recorded as a refusal
 *      rather than dropped — "they said no, on this date" is the answer to a
 *      later complaint.
 *   2. Mailchimp still sends its own double opt-in, because the contact is
 *      created `pending`. A first-party record of a tick-box and a confirmed
 *      email address answer different questions, and the owner requires both.
 *
 * Without consent this records the refusal and returns without contacting
 * Mailchimp at all.
 */
export async function enrolLiapMarketing(input: {
  email: string
  firstName: string
  lastName: string
  consentGranted: boolean
  source: string
  tags: LiapTag[]
}): Promise<{ enrolled: boolean; result: MailchimpResult }> {
  const consent = await recordMarketingConsent({
    email: input.email,
    granted: input.consentGranted,
    source: input.source,
    firstName: input.firstName,
    lastName: input.lastName,
  })

  if (!input.consentGranted) {
    return { enrolled: false, result: { ok: true, skipped: true } }
  }

  const result = await tagLiapContact(input.email, input.tags, {
    customerId: consent.customerId,
    firstName: input.firstName,
    lastName: input.lastName,
  })
  return { enrolled: result.ok, result }
}

import { getDb } from '@/lib/db/client'
import { findPartnerByCode, type Partner } from '@/lib/liap/partners'

// ---------------------------------------------------------------------------
// Attribution.
//
// Answers one business question: which coffee shop, church or barbershop is
// actually producing results? Everything here exists to make that answerable
// and nothing here exists to make a decision.
//
// ── THE INVARIANT ──────────────────────────────────────────────────────────
//
//   No value originating from a referral code, QR scan, partner record or
//   attribution row may reach grantEntitlement(), influence hasEntitlement(),
//   or alter a price.
//
//   Attribution is WRITE-ONLY with respect to authorization.
//
// This module therefore imports lib/liap/partners and lib/db and nothing else.
// It does not import lib/entitlements, lib/auth, or anything under
// lib/payments, and the test suite asserts that so a future change fails the
// build instead of quietly making a public string into a permission.
//
// ── ON CONSENT ─────────────────────────────────────────────────────────────
//
// The site's consent banner offers two states, accepted and essential-only,
// and a visitor choosing essential-only has declined exactly this kind of
// tracking. Honouring that costs some attribution, and the alternative — a
// banner that quietly does not apply to some tracking — is a worse problem
// than incomplete marketing data.
//
// So attribution works in two tiers:
//
//   Always:        a scan is COUNTED, with no visitor identifier attached.
//                  That is a tally of how many people used a sign, not a
//                  record of who.
//
//   With consent:  a first-party visitor key stitches that scan to a later
//                  purchase, so a partner gets credit for a sale that
//                  happened three weeks later.
//
//   Regardless:    when someone deliberately submits a form or starts a
//                  checkout with a partner code in the URL, that is an
//                  intentional act and attaches attribution without any
//                  cookie at all. This recovers most of what matters.
// ---------------------------------------------------------------------------

/** Every point in the funnel a partner can be credited for. */
export const ATTRIBUTION_EVENTS = [
  'scan',
  'landing_view',
  'lead',
  'book_preorder',
  'assessment_activated',
  'assessment_completed',
  'workshop_registered',
  'retreat_interest',
  'retreat_registered',
  'sponsor_inquiry',
] as const

export type AttributionEvent = (typeof ATTRIBUTION_EVENTS)[number]

const EVENT_SET = new Set<string>(ATTRIBUTION_EVENTS)

/** The first-party cookie carrying a visitor key. Set only with consent. */
export const ATTRIBUTION_COOKIE = 'wg_attr'

export interface RecordInput {
  partner: Partner | null
  eventType: AttributionEvent
  /** Omitted when there is no consent to stitch touches together. */
  visitorKey?: string | null
  customerId?: string | null
}

/**
 * Writes one touch to the append-only log.
 *
 * Never throws. Attribution is marketing measurement, and a measurement
 * failure must not take down a page a customer is trying to use or block a
 * lead the business wants. A dropped row costs a line in a report; a thrown
 * error costs the customer.
 *
 * The partner's campaign fields are copied onto the row rather than joined at
 * read time, so editing a partner's campaign next month does not silently
 * rewrite what last month's touches were attributed to.
 */
export async function recordAttribution(input: RecordInput): Promise<void> {
  if (!EVENT_SET.has(input.eventType)) return

  try {
    await getDb().query(
      `INSERT INTO attribution_events
         (partner_id, event_type, visitor_key, customer_id, campaign, utm_source, utm_medium)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.partner?.id ?? null,
        input.eventType,
        input.visitorKey ?? null,
        input.customerId ?? null,
        input.partner?.campaign ?? null,
        input.partner?.utm_source ?? null,
        input.partner?.utm_medium ?? null,
      ]
    )
  } catch (err) {
    console.error('[liap/attribution] failed to record', input.eventType, err)
  }
}

/**
 * Resolves a partner code submitted alongside an intentional action.
 *
 * Used by form handlers: the code arrives in the request body having come
 * from the landing page URL, so no cookie and no consent are involved. An
 * unrecognised code resolves to null and the action proceeds unattributed —
 * a bad code must never cost somebody their enquiry.
 */
export async function partnerFromSubmission(value: unknown): Promise<Partner | null> {
  if (typeof value !== 'string' || !value.trim()) return null
  return findPartnerByCode(value.trim())
}

export interface PartnerFunnelRow {
  partner_id: string
  partner_name: string
  partner_type: string
  status: string
  scans: number
  leads: number
  book_preorders: number
  assessments_completed: number
  retreat_interest: number
  retreat_registered: number
}

/**
 * The partner league table.
 *
 * Counts by partner across the funnel, which is what makes "is this
 * barbershop working?" a one-glance question. Deliberately returns raw counts
 * and lets the caller compute rates: a partner with 40 scans and 6 buyers is
 * worth more than one with 400 scans and 6 buyers, and only the caller knows
 * which comparison it is drawing.
 *
 * Reporting only. Nothing in the application reads this to make a decision.
 */
export async function partnerFunnel(): Promise<PartnerFunnelRow[]> {
  return getDb().query<PartnerFunnelRow>(
    `SELECT p.id   AS partner_id,
            p.partner_name,
            p.partner_type,
            p.status,
            count(*) FILTER (WHERE e.event_type = 'scan')::int                  AS scans,
            count(*) FILTER (WHERE e.event_type = 'lead')::int                  AS leads,
            count(*) FILTER (WHERE e.event_type = 'book_preorder')::int         AS book_preorders,
            count(*) FILTER (WHERE e.event_type = 'assessment_completed')::int  AS assessments_completed,
            count(*) FILTER (WHERE e.event_type = 'retreat_interest')::int      AS retreat_interest,
            count(*) FILTER (WHERE e.event_type = 'retreat_registered')::int    AS retreat_registered
       FROM partners p
       LEFT JOIN attribution_events e ON e.partner_id = p.id
      GROUP BY p.id, p.partner_name, p.partner_type, p.status
      ORDER BY p.partner_name`
  )
}

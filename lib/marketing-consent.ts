import { getDb, isDbConfigured, queryOne } from '@/lib/db/client'
import { upsertCustomer } from '@/lib/customers'
import { recordAuditEvent } from '@/lib/audit'

// ---------------------------------------------------------------------------
// First-party MARKETING consent — server side, durable, per customer.
//
// Not to be confused with lib/consent.ts, which is the browser cookie banner:
// that one decides whether GA4 may load for this visitor, lives in
// localStorage, and knows nothing about who the visitor is. This one records
// that a named person asked to receive email, and survives them clearing
// their browser.
//
// ── WHY THIS EXISTS ALONGSIDE MAILCHIMP'S DOUBLE OPT-IN ────────────────────
//
// Mailchimp's `pending` status is a real consent mechanism: the contact gets a
// confirmation email and receives nothing until they click it. But that record
// lives in Mailchimp and answers "did they confirm?" — not "what did we ask
// them, on which page, on what date, against which policy version?"
//
// The two answer different questions and the owner requires both. This is the
// first-party half, written to the `consents` table that migration 0001
// created for exactly this purpose and that nothing had ever used.
//
// ── WHAT IS DELIBERATELY NOT HERE ──────────────────────────────────────────
//
// There is no way to infer consent. `recordMarketingConsent` must be called
// with an explicit boolean the customer actually supplied, and nothing else in
// the codebase writes a `marketing` row. In particular:
//
//   - a purchase does not grant it (buying a book is not asking for email)
//   - completing an assessment does not grant it
//   - a preorder verification does not grant it
//   - there is no backfill, and no historical import path
//
// Those are not omissions to be filled in later. A marketing consent record
// that was inferred rather than given is worse than none, because it looks
// like evidence.
// ---------------------------------------------------------------------------

/** The consent kind, as stored in `consents.consent_type`. */
export const CONSENT_MARKETING = 'marketing'

/**
 * The version a consent was given against.
 *
 * Stored per row, so a later wording change does not silently restate what
 * somebody agreed to. Bump this when the marketing consent wording changes.
 */
export const MARKETING_CONSENT_VERSION = '2026-08-31'

export interface MarketingConsentInput {
  email: string
  /** Exactly what the customer chose. Never a default, never inferred. */
  granted: boolean
  /** Where it was given, e.g. 'liap_book_interest'. Stored for provenance. */
  source: string
  /** Optional: the customer, when the caller already resolved one. */
  customerId?: string | null
  /** Optional, so a new contact is not created nameless. */
  firstName?: string | null
  lastName?: string | null
}

/**
 * Records a marketing consent decision, granted or refused.
 *
 * A refusal is recorded too, and on purpose: "they said no, on this date" is
 * the answer to a later complaint, and without the row the only evidence of a
 * refusal is an absence, which proves nothing.
 */
export async function recordMarketingConsent(
  input: MarketingConsentInput
): Promise<{ customerId: string | null; recorded: boolean }> {
  if (!isDbConfigured()) {
    // Loud in the log, honest to the caller. A consent record that could not
    // be written must never be treated as though it had been.
    console.error('[marketing-consent] no database configured; consent NOT recorded')
    return { customerId: null, recorded: false }
  }

  const name = [input.firstName?.trim(), input.lastName?.trim()].filter(Boolean).join(' ')
  const customerId =
    input.customerId ?? (await upsertCustomer({ email: input.email, name: name || null })).id

  await getDb().query(
    `INSERT INTO consents (customer_id, consent_type, version, granted, source)
     VALUES ($1, $2, $3, $4, $5)`,
    [customerId, CONSENT_MARKETING, MARKETING_CONSENT_VERSION, input.granted, input.source]
  )

  await recordAuditEvent({
    eventType: 'consent.recorded',
    customerId,
    metadata: {
      consent_type: CONSENT_MARKETING,
      granted: input.granted,
      version: MARKETING_CONSENT_VERSION,
      source_type: input.source,
    },
  })

  return { customerId, recorded: true }
}

/**
 * Whether this customer currently consents to marketing.
 *
 * Reads the MOST RECENT row, not any row: someone who opted in and later opted
 * out must come back false, and a query that merely looked for an existing
 * `granted = true` row would come back true forever.
 */
export async function hasMarketingConsent(customerId: string): Promise<boolean> {
  if (!isDbConfigured()) return false
  const row = await queryOne<{ granted: boolean }>(
    `SELECT granted FROM consents
      WHERE customer_id = $1 AND consent_type = $2
      ORDER BY recorded_at DESC, id DESC
      LIMIT 1`,
    [customerId, CONSENT_MARKETING]
  )
  return row?.granted === true
}

/** The same question by email, for callers holding no customer id. */
export async function hasMarketingConsentByEmail(email: string): Promise<boolean> {
  if (!isDbConfigured()) return false
  const row = await queryOne<{ granted: boolean }>(
    `SELECT c.granted FROM consents c
       JOIN customers cu ON cu.id = c.customer_id
      WHERE lower(cu.email) = lower($1) AND c.consent_type = $2
      ORDER BY c.recorded_at DESC, c.id DESC
      LIMIT 1`,
    [email.trim(), CONSENT_MARKETING]
  )
  return row?.granted === true
}

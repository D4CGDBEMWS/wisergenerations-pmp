import { getDb } from '@/lib/db/client'
import { recordAuditEvent } from '@/lib/audit'

// ---------------------------------------------------------------------------
// Data retention.
//
// The privacy policy, section 5, published 20 August 2026:
//
//   "If you create an account or request a free resource but never make a
//    purchase, we delete your record within 180 days."
//
// This module is what makes that true. A published retention promise with no
// mechanism behind it is worse than no promise: it is a commitment the
// business cannot evidence keeping.
//
// The other periods in that section are deliberately NOT implemented here.
// Purchase and enrollment records are retained for at least seven years for
// tax and legal compliance, and support correspondence for three years —
// neither lives in this database, and shortening either would be the opposite
// of compliance.
// ---------------------------------------------------------------------------

/** Days after signup that a never-purchasing record is deleted. Section 5. */
export const SIGNUP_RETENTION_DAYS = 180

/**
 * Who is in scope.
 *
 * "Never made a purchase" is read strictly, and every clause below excludes
 * someone the plain reading might otherwise sweep up:
 *
 *   no orders            — the purchase itself
 *   no entitlements      — including a comped or scholarship grant, and
 *                          including revoked ones, because a revoked grant
 *                          means this was a customer rather than a signup
 *   not a participant    — an employer-funded cohort seat has no order
 *                          attached to the learner
 *   not a payer          — a guardian or employer who bought a seat for
 *                          someone else has no order of their own either
 *
 * The last two matter more than they look. `program_enrollments` separates
 * payer from participant precisely so a seat can be funded by someone who is
 * not the learner, and both sides of that relationship would otherwise read as
 * "signed up, never bought".
 *
 * The database is the backstop: orders and program_enrollments are ON DELETE
 * RESTRICT, so a mistake in this predicate raises a foreign key error rather
 * than deleting a paying customer.
 */
const IN_SCOPE = `
  FROM customers c
 WHERE c.created_at < now() - ($1 || ' days')::interval
   AND NOT EXISTS (SELECT 1 FROM orders o              WHERE o.customer_id       = c.id)
   AND NOT EXISTS (SELECT 1 FROM entitlements e        WHERE e.customer_id       = c.id)
   AND NOT EXISTS (SELECT 1 FROM program_enrollments p WHERE p.customer_id       = c.id)
   AND NOT EXISTS (SELECT 1 FROM program_enrollments p WHERE p.payer_customer_id = c.id)
`

export interface PurgeCandidate {
  id: string
  email: string
  created_at: string
  age_days: number
}

/**
 * Lists who would be deleted, without deleting anything.
 *
 * Returns email addresses because a human reviewing a dry run needs to
 * recognise the records. Nothing here writes them anywhere.
 */
export async function findStaleSignups(
  days: number = SIGNUP_RETENTION_DAYS
): Promise<PurgeCandidate[]> {
  return getDb().query<PurgeCandidate>(
    `SELECT c.id, c.email, c.created_at,
            EXTRACT(DAY FROM now() - c.created_at)::int AS age_days
       ${IN_SCOPE}
      ORDER BY c.created_at`,
    [String(days)]
  )
}

export interface PurgeResult {
  deleted: number
  dryRun: boolean
}

/**
 * Deletes stale signups and records that it happened.
 *
 * Cascades handle the rest of the record: sessions and consents are ON DELETE
 * CASCADE, and audit_events is ON DELETE SET NULL so the security history
 * survives with the person de-identified — which is the correct outcome for
 * both obligations at once.
 *
 * login_tokens carries an email rather than a customer id, so it is cleaned by
 * address in the same statement. Expired tokens are swept regardless of who
 * they belong to; a consumed or timed-out magic link has no reason to persist.
 */
export async function purgeStaleSignups(options: {
  days?: number
  dryRun?: boolean
} = {}): Promise<PurgeResult> {
  const days = options.days ?? SIGNUP_RETENTION_DAYS
  const dryRun = options.dryRun ?? false
  const db = getDb()

  if (dryRun) {
    return { deleted: (await findStaleSignups(days)).length, dryRun: true }
  }

  const deleted = await db.query<{ email: string }>(
    `DELETE FROM customers
      WHERE id IN (SELECT c.id ${IN_SCOPE})
      RETURNING email`,
    [String(days)]
  )

  if (deleted.length > 0) {
    await db.query(
      `DELETE FROM login_tokens WHERE lower(email) = ANY($1::text[])`,
      [deleted.map((row) => row.email.toLowerCase())]
    )
  }

  // Housekeeping, not retention: a magic link that has been used or has timed
  // out is dead weight, and these rows accumulate for people who never
  // completed a sign-in.
  await db.query(
    `DELETE FROM login_tokens
      WHERE expires_at < now() - interval '7 days' OR consumed_at < now() - interval '7 days'`
  )

  // A count, never the addresses. Deleting someone's record for privacy and
  // then writing their email into an audit row would defeat the exercise —
  // and lib/audit.ts would strip the key anyway.
  await recordAuditEvent({
    eventType: 'retention.purged',
    metadata: { reason: 'signup_retention_expired', count: deleted.length },
  })

  return { deleted: deleted.length, dryRun: false }
}

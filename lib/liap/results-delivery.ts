import { getDb, queryOne } from '@/lib/db/client'
import { recordAuditEvent } from '@/lib/audit'
import { rebuildReport } from './assessment-service'
import { RESULTS_SUBJECT, resultsEmailHtml, resultsEmailText } from './results-email'

// ---------------------------------------------------------------------------
// Sending the participant their plan.
//
// Owner ruling: the first delivery is automatic on submission. Someone who has
// just answered forty questions about a redundancy should not have to notice a
// button to receive what they came for.
//
// ── THE TWO RULES THAT SHAPE THIS FILE ─────────────────────────────────────
//
// 1. DELIVERY MUST NEVER DAMAGE THE RESULT. The assessment is scored, stored
//    and reachable by its link before this runs. If Resend is down, the send
//    fails and the report stands — no rollback, no thrown request, no lost
//    submission. Every failure path here returns a value; none throws.
//
// 2. ONE AUTOMATIC SEND PER ASSESSMENT, ENFORCED IN POSTGRES. The claim is a
//    conditional UPDATE, so two concurrent submissions race for one row and
//    exactly one wins. Checking-then-sending would let a retried request
//    deliver twice, and the second copy lands in a real person's inbox.
//
// The recipient is NEVER taken from a request. It is read from the customer
// row that owns the assessment.
//
// No participant narrative reaches the email: it carries the position, the
// three action headlines and a link. The bodies — which are where a quotation
// would appear — are not included, and a test asserts it.
// ---------------------------------------------------------------------------

/** How long before the same assessment may be manually resent. */
export const RESEND_COOLDOWN_MINUTES = 5

export type DeliveryOutcome =
  | 'sent'
  | 'already-sent'
  | 'throttled'
  | 'not-configured'
  | 'send-failed'
  | 'not-found'

export interface DeliveryResult {
  outcome: DeliveryOutcome
  /** True only when a message actually left the building. */
  delivered: boolean
}

/**
 * Claims the one automatic send for this assessment.
 *
 * Returns false if it has already been claimed. The condition is in the WHERE
 * clause rather than in a preceding SELECT, so a race has exactly one winner.
 */
async function claimAutomaticSend(assessmentId: string): Promise<boolean> {
  const rows = await getDb().query<{ id: string }>(
    `UPDATE assessments
        SET results_email_sent_at = now(), results_email_last_sent_at = now()
      WHERE id = $1 AND results_email_sent_at IS NULL
      RETURNING id`,
    [assessmentId]
  )
  return rows.length > 0
}

/** Claims a manual resend, subject to the cooldown. Same race-safety. */
async function claimResend(assessmentId: string): Promise<boolean> {
  const rows = await getDb().query<{ id: string }>(
    `UPDATE assessments
        SET results_email_last_sent_at = now()
      WHERE id = $1
        AND (results_email_last_sent_at IS NULL
             OR results_email_last_sent_at < now() - ($2 || ' minutes')::interval)
      RETURNING id`,
    [assessmentId, String(RESEND_COOLDOWN_MINUTES)]
  )
  return rows.length > 0
}

/** Undoes a claim when the send itself failed, so a retry is possible. */
async function releaseAutomaticClaim(assessmentId: string): Promise<void> {
  await getDb().query(
    `UPDATE assessments SET results_email_sent_at = NULL WHERE id = $1`,
    [assessmentId]
  )
}

async function send(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false
  const from =
    process.env.MAGIC_LINK_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'info@wisergenerations.com'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `Wiser Generations <${from}>`, to: [to], subject, html, text }),
    })
    if (!res.ok) {
      console.error(`[liap/results-delivery] Resend rejected the send: HTTP ${res.status}`)
      return false
    }
    return true
  } catch (err) {
    console.error('[liap/results-delivery] send threw:', err)
    return false
  }
}

/**
 * Builds and sends the results email for one assessment.
 *
 * `mode: 'automatic'` is the once-only initial delivery. `mode: 'resend'` is
 * the participant asking again, and is throttled rather than counted.
 */
export async function deliverResults(input: {
  assessmentId: string
  resultToken: string
  mode: 'automatic' | 'resend'
}): Promise<DeliveryResult> {
  const owner = await queryOne<{ email: string }>(
    `SELECT c.email FROM assessments a
       JOIN customers c ON c.id = a.customer_id
      WHERE a.id = $1`,
    [input.assessmentId]
  )
  if (!owner?.email) return { outcome: 'not-found', delivered: false }

  const claimed =
    input.mode === 'automatic'
      ? await claimAutomaticSend(input.assessmentId)
      : await claimResend(input.assessmentId)

  if (!claimed) {
    return {
      outcome: input.mode === 'automatic' ? 'already-sent' : 'throttled',
      delivered: false,
    }
  }

  if (!process.env.RESEND_API_KEY) {
    if (input.mode === 'automatic') await releaseAutomaticClaim(input.assessmentId)
    console.error('[liap/results-delivery] RESEND_API_KEY not set; plan not sent')
    return { outcome: 'not-configured', delivered: false }
  }

  const report = await rebuildReport(input.assessmentId)
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wisergenerations.com'
  const url = `${origin}/living-is-a-project/results/${input.resultToken}`

  const ok = await send(
    owner.email,
    RESULTS_SUBJECT,
    resultsEmailHtml(report, url),
    resultsEmailText(report, url)
  )

  if (!ok) {
    // The claim is released so the participant can ask again. The report is
    // untouched either way — a failed send is a failed send, not a failed
    // assessment.
    if (input.mode === 'automatic') await releaseAutomaticClaim(input.assessmentId)
    return { outcome: 'send-failed', delivered: false }
  }

  await recordAuditEvent({
    eventType: 'liap.results_emailed',
    metadata: { result: input.mode },
  })

  return { outcome: 'sent', delivered: true }
}

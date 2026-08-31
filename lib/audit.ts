import { getDb, isDbConfigured } from '@/lib/db/client'

// ---------------------------------------------------------------------------
// audit — durable record of security-relevant actions.
//
// Two rules, both enforced in code rather than by convention:
//
//   1. Metadata keys are allow-listed. Phase 0.5 forbids logging tokens,
//      payment details and (later) free-text assessment answers. An allow-list
//      fails closed when someone adds a field in a hurry; a deny-list does not.
//
//   2. Auditing never breaks the request. A failure to write history must not
//      turn a successful login into an error, so writes are best-effort and
//      log locally on failure.
// ---------------------------------------------------------------------------

const ALLOWED_METADATA_KEYS = new Set([
  'entitlement_key',
  'source_type',
  'reason',
  'event_type',
  'stripe_event_id',
  'product_key',
  'session_id',
  'result',
  'attempts',
  'consent_type',
  'granted',
  'version',
  'count',
  // CRM synchronisation outcomes. Deliberately structural: which tags were
  // meant to apply and why the attempt failed, never who or what they answered.
  'tags',
  'operation',
  'status',
  // Which Retreat an authority event concerned. An id, never its content.
  'retreat_id',
])

export type AuditEventType =
  | 'entitlement.granted'
  | 'entitlement.revoked'
  | 'login.token_issued'
  | 'login.success'
  | 'login.failed'
  | 'login.rate_limited'
  | 'login.email_failed'
  | 'session.revoked'
  | 'consent.recorded'
  | 'webhook.received'
  | 'webhook.duplicate'
  | 'webhook.failed'
  | 'admin.entitlement_change'
  | 'retention.purged'
  // Living Is a Project. Deliberately narrow: an assessment records that it
  // started and that it finished, plus the resulting position. Never the
  // narrative, the affected area, or a score breakdown — an audit trail that
  // captured what someone wrote about their divorce would be a worse leak
  // than the one it exists to detect.
  | 'liap.assessment_started'
  | 'liap.assessment_completed'
  | 'liap.results_emailed'
  | 'liap.preorder_verification_submitted'
  | 'liap.preorder_verification_reviewed'
  | 'liap.narratives_purged'
  // CRM synchronisation. A marketing sync must never fail a purchase, but a
  // silently dropped sync is a customer who never hears from us again -- so
  // the failure is recorded here, where it can be found and replayed.
  | 'crm.sync_failed'
  // Facilitation governance. Who was certified, suspended, granted trainer
  // authority, assigned to a Retreat -- the record that makes an unauthorized
  // access investigable. Deliberately narrow: the preparation event records
  // THAT the required confirmation happened and nothing about its content.
  | 'liap.retreat_completion_confirmed'
  | 'liap.facilitator_certification_granted'
  | 'liap.facilitator_certification_suspended'
  | 'liap.facilitator_certification_revoked'
  | 'liap.trainer_authority_granted'
  | 'liap.trainer_authority_revoked'
  | 'liap.retreat_facilitator_assigned'
  | 'liap.retreat_facilitator_unassigned'
  | 'liap.retreat_preparation_confirmed'

function sanitize(metadata: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (!ALLOWED_METADATA_KEYS.has(key)) continue
    // Depth is capped at scalars: nesting is where secrets hide.
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      clean[key] = typeof value === 'string' ? value.slice(0, 200) : value
    }
  }
  return clean
}

export async function recordAuditEvent(input: {
  eventType: AuditEventType
  customerId?: string | null
  actor?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  if (!isDbConfigured()) return

  try {
    await getDb().query(
      `INSERT INTO audit_events (event_type, customer_id, actor, metadata)
       VALUES ($1, $2, $3, $4)`,
      [
        input.eventType,
        input.customerId ?? null,
        input.actor ?? null,
        JSON.stringify(sanitize(input.metadata ?? {})),
      ]
    )
  } catch (err) {
    console.error('[audit] failed to record', input.eventType, err)
  }
}

/** Exposed for the test that asserts disallowed keys never reach the row. */
export const __sanitizeForTest = sanitize

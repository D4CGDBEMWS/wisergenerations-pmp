import { getDb, queryOne } from '@/lib/db/client'
import { recordAuditEvent } from '@/lib/audit'

// ---------------------------------------------------------------------------
// Webhook idempotency ledger.
//
// Stripe guarantees at-least-once delivery, retries on any non-2xx, and can
// replay an event that already succeeded. Signature verification proves an
// event is authentic; it says nothing about whether it is the first copy.
//
// claimEvent() is that missing half. It inserts the event id and reports
// whether this caller is the first to see it. The unique (provider, event_id)
// index makes the claim atomic, so two concurrent deliveries cannot both win.
//
// Note the layering: this ledger prevents duplicate PROCESSING, and
// entitlements.idempotency_key independently prevents duplicate GRANTS. Either
// alone would be sufficient for the common case; together they also cover a
// grant arriving from a different event entirely.
// ---------------------------------------------------------------------------

export interface EventClaim {
  isFirstDelivery: boolean
  previousStatus: string | null
}

export async function claimEvent(input: {
  eventId: string
  eventType: string
}): Promise<EventClaim> {
  const rows = await getDb().query<{ id: string }>(
    `INSERT INTO payment_events (provider, event_id, event_type)
     VALUES ('stripe', $1, $2)
     ON CONFLICT (provider, event_id) DO NOTHING
     RETURNING id`,
    [input.eventId, input.eventType]
  )

  if (rows[0]) return { isFirstDelivery: true, previousStatus: null }

  const existing = await queryOne<{ status: string }>(
    `SELECT status FROM payment_events WHERE provider = 'stripe' AND event_id = $1`,
    [input.eventId]
  )
  await recordAuditEvent({
    eventType: 'webhook.duplicate',
    metadata: { stripe_event_id: input.eventId, event_type: input.eventType },
  })
  return { isFirstDelivery: false, previousStatus: existing?.status ?? null }
}

export async function markEventProcessed(eventId: string): Promise<void> {
  await getDb().query(
    `UPDATE payment_events SET status = 'processed', processed_at = now()
      WHERE provider = 'stripe' AND event_id = $1`,
    [eventId]
  )
}

/**
 * Marks an event failed and clears the claim, so Stripe's retry can be
 * processed rather than dismissed as a duplicate.
 *
 * Without this the ledger would turn a transient failure into permanent data
 * loss: the first attempt claims the id, fails, and every retry is then
 * treated as already-seen.
 */
export async function markEventFailed(eventId: string, message: string): Promise<void> {
  await getDb().query(
    `UPDATE payment_events
        SET status = 'failed', error_message = $2, processed_at = NULL
      WHERE provider = 'stripe' AND event_id = $1`,
    [eventId, message.slice(0, 500)]
  )
  await recordAuditEvent({
    eventType: 'webhook.failed',
    metadata: { stripe_event_id: eventId },
  })
}

/** Releases the claim entirely so a retry is treated as a first delivery. */
export async function releaseEventClaim(eventId: string): Promise<void> {
  await getDb().query(
    `DELETE FROM payment_events
      WHERE provider = 'stripe' AND event_id = $1 AND status <> 'processed'`,
    [eventId]
  )
}

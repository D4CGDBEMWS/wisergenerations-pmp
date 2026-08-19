import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb, seedCustomer } from './helpers/db'
import { claimEvent, markEventProcessed, markEventFailed } from '@/lib/payments/events'
import { recordAuditEvent, __sanitizeForTest } from '@/lib/audit'

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  const c = await createTestDb(); db = c.db; close = c.close; setDbForTesting(db)
})
afterEach(async () => { setDbForTesting(null); await close() })

describe('webhook idempotency ledger', () => {
  it('claims an event once', async () => {
    const a = await claimEvent({ eventId: 'evt_1', eventType: 'checkout.session.completed' })
    const b = await claimEvent({ eventId: 'evt_1', eventType: 'checkout.session.completed' })
    expect(a.isFirstDelivery).toBe(true)
    expect(b.isFirstDelivery).toBe(false)
  })

  it('only one of several concurrent deliveries wins', async () => {
    const results = await Promise.all(
      [1, 2, 3, 4].map(() => claimEvent({ eventId: 'evt_race', eventType: 'charge.refunded' }))
    )
    expect(results.filter((r) => r.isFirstDelivery)).toHaveLength(1)
  })

  it('a failed event can be retried rather than dismissed as a duplicate', async () => {
    // Without clearing the claim, the ledger would turn a transient failure
    // into permanent data loss: Stripe's retry would look like a duplicate.
    await claimEvent({ eventId: 'evt_fail', eventType: 'checkout.session.completed' })
    await markEventFailed('evt_fail', 'downstream timeout')

    const row = await db.query<{ status: string; processed_at: string | null }>(
      `SELECT status, processed_at FROM payment_events WHERE event_id = 'evt_fail'`
    )
    expect(row[0]!.status).toBe('failed')
    expect(row[0]!.processed_at).toBeNull()
  })

  it('records the processed timestamp on success', async () => {
    await claimEvent({ eventId: 'evt_ok', eventType: 'checkout.session.completed' })
    await markEventProcessed('evt_ok')
    const row = await db.query<{ status: string }>(
      `SELECT status FROM payment_events WHERE event_id = 'evt_ok'`
    )
    expect(row[0]!.status).toBe('processed')
  })
})

describe('audit logging redacts by allow-list', () => {
  it('drops keys that are not explicitly permitted', () => {
    const clean = __sanitizeForTest({
      entitlement_key: 'STUDY_ACCESS',
      token: 'super-secret-token',
      password: 'hunter2',
      card_number: '4242424242424242',
      assessment_answer: 'my divorce is finalising next month',
    })
    expect(clean).toEqual({ entitlement_key: 'STUDY_ACCESS' })
    expect(Object.keys(clean)).not.toContain('token')
    expect(Object.keys(clean)).not.toContain('assessment_answer')
  })

  it('drops nested objects, where secrets hide', () => {
    const clean = __sanitizeForTest({ reason: 'refund', metadata: { token: 'leak' } })
    expect(clean).toEqual({ reason: 'refund' })
  })

  it('writes a row without the forbidden fields', async () => {
    const customerId = await seedCustomer(db, 'audited@example.com')
    await recordAuditEvent({
      eventType: 'login.success',
      customerId,
      metadata: { result: 'ok', token: 'must-not-persist' },
    })
    const rows = await db.query<{ metadata: Record<string, unknown> }>(
      `SELECT metadata FROM audit_events WHERE customer_id = $1`, [customerId]
    )
    expect(rows[0]!.metadata).toEqual({ result: 'ok' })
  })
})

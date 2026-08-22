import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb } from './helpers/db'
import { findStaleSignups, purgeStaleSignups, SIGNUP_RETENTION_DAYS } from '@/lib/retention'

// ---------------------------------------------------------------------------
// Retention.
//
// This is the only code in the system that deletes a customer, so the tests
// that matter most are the ones asserting what it REFUSES to touch. A purge
// that is slightly too eager destroys paying customers' records, and there is
// no undo.
//
// The privacy policy, section 5: "If you create an account or request a free
// resource but never make a purchase, we delete your record within 180 days."
// ---------------------------------------------------------------------------

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  const created = await createTestDb()
  db = created.db
  close = created.close
  setDbForTesting(db)
})

afterEach(async () => {
  setDbForTesting(null)
  await close()
})

/** A customer created `ageDays` ago. */
async function signup(email: string, ageDays: number): Promise<string> {
  const rows = await db.query<{ id: string }>(
    `INSERT INTO customers (email, created_at)
     VALUES ($1, now() - ($2 || ' days')::interval)
     RETURNING id`,
    [email, String(ageDays)]
  )
  return rows[0]!.id
}

async function productId(): Promise<string> {
  const rows = await db.query<{ id: string }>(
    `SELECT id FROM products WHERE product_key = 'PMP_ESSENTIALS'`
  )
  return rows[0]!.id
}

async function remaining(): Promise<string[]> {
  const rows = await db.query<{ email: string }>(`SELECT email FROM customers ORDER BY email`)
  return rows.map((r) => r.email)
}

describe('who gets deleted', () => {
  it('deletes a signup past the retention period who never purchased', async () => {
    await signup('stale@example.com', SIGNUP_RETENTION_DAYS + 1)

    const result = await purgeStaleSignups()
    expect(result.deleted).toBe(1)
    expect(await remaining()).toEqual([])
  })

  it('keeps a signup that has not yet reached the period', async () => {
    await signup('recent@example.com', SIGNUP_RETENTION_DAYS - 1)

    expect((await purgeStaleSignups()).deleted).toBe(0)
    expect(await remaining()).toEqual(['recent@example.com'])
  })

  it('treats the boundary itself as due', async () => {
    // "within 180 days" is a promise that deletion has happened BY day 180,
    // not on day 181. A record that has reached the period is therefore due,
    // and waiting one more day would put the business a day outside its own
    // published commitment.
    //
    // The direction of the error matters here, so it is worth stating: this
    // is the one place the purge is allowed to be eager, and it is eager by
    // fractions of a second rather than by a day. Anything genuinely younger
    // than the period is kept — see the test above.
    await signup('boundary@example.com', SIGNUP_RETENTION_DAYS)

    expect((await purgeStaleSignups()).deleted).toBe(1)
    expect(await remaining()).toEqual([])
  })
})

describe('who is protected', () => {
  it('never deletes a customer with an order, however old', async () => {
    const id = await signup('bought@example.com', SIGNUP_RETENTION_DAYS * 10)
    await db.query(
      `INSERT INTO orders (customer_id, status, amount) VALUES ($1, 'paid', 4900)`,
      [id]
    )

    expect((await purgeStaleSignups()).deleted).toBe(0)
    expect(await remaining()).toEqual(['bought@example.com'])
  })

  it('never deletes a customer holding a comped entitlement', async () => {
    // A scholarship or admin grant means someone has access without ever
    // paying. Deleting them would revoke access they were given.
    const id = await signup('comped@example.com', SIGNUP_RETENTION_DAYS + 30)
    await db.query(
      `INSERT INTO entitlements (customer_id, entitlement_key, source_type, idempotency_key)
       VALUES ($1, 'STUDY_ACCESS', 'scholarship', 'schol:1')`,
      [id]
    )

    expect((await purgeStaleSignups()).deleted).toBe(0)
    expect(await remaining()).toEqual(['comped@example.com'])
  })

  it('never deletes a customer whose entitlement was revoked', async () => {
    // A revoked grant means this was a customer, not a signup. The history is
    // the point.
    const id = await signup('former@example.com', SIGNUP_RETENTION_DAYS + 30)
    await db.query(
      `INSERT INTO entitlements (customer_id, entitlement_key, source_type, idempotency_key, revoked_at)
       VALUES ($1, 'STUDY_ACCESS', 'order', 'rev:1', now())`,
      [id]
    )

    expect((await purgeStaleSignups()).deleted).toBe(0)
    expect(await remaining()).toEqual(['former@example.com'])
  })

  it('never deletes a participant in an employer-funded cohort', async () => {
    // The learner has no order of their own — the employer paid. Reading
    // "never purchased" naively would delete exactly the person who is
    // enrolled right now.
    const learner = await signup('learner@example.com', SIGNUP_RETENTION_DAYS + 60)
    const program = await db.query<{ id: string }>(
      `INSERT INTO programs (program_key, name, product_family)
       VALUES ('pmp-boot-camp', 'PMP Boot Camp', 'PMP') RETURNING id`
    )
    await db.query(
      `INSERT INTO program_enrollments (program_id, customer_id, funding_source_type)
       VALUES ($1, $2, 'organization')`,
      [program[0]!.id, learner]
    )

    expect((await purgeStaleSignups()).deleted).toBe(0)
    expect(await remaining()).toEqual(['learner@example.com'])
  })

  it('never deletes the payer who funded someone else’s seat', async () => {
    // A guardian or employer has no order and no entitlement of their own.
    const payer = await signup('employer@example.com', SIGNUP_RETENTION_DAYS + 60)
    const learner = await signup('funded@example.com', 1)
    const program = await db.query<{ id: string }>(
      `INSERT INTO programs (program_key, name, product_family)
       VALUES ('capm', 'CAPM', 'CAPM') RETURNING id`
    )
    await db.query(
      `INSERT INTO program_enrollments (program_id, customer_id, funding_source_type, payer_customer_id)
       VALUES ($1, $2, 'organization', $3)`,
      [program[0]!.id, learner, payer]
    )

    expect((await purgeStaleSignups()).deleted).toBe(0)
    expect(await remaining()).toEqual(['employer@example.com', 'funded@example.com'])
  })

  it('never deletes someone with an open retreat enquiry', async () => {
    // The defect this clause fixes is real, not hypothetical. A $1,499.99
    // retreat is routinely nurtured for longer than six months, and without
    // this the purge would delete a live prospect's record mid-conversation.
    const id = await signup('prospect@example.com', SIGNUP_RETENTION_DAYS + 90)
    await db.query(
      `INSERT INTO retreat_leads (email, inquiry_type, status, customer_id)
       VALUES ($1, 'individual', 'reviewing', $2)`,
      ['prospect@example.com', id]
    )

    expect((await purgeStaleSignups()).deleted).toBe(0)
    expect(await remaining()).toEqual(['prospect@example.com'])
  })

  it('does delete someone whose enquiry was declined or withdrawn', async () => {
    // Only OPEN enquiries protect a record. Holding somebody's account of
    // their circumstances indefinitely because they once asked about a
    // retreat would be the opposite of a retention policy.
    for (const [email, status] of [
      ['declined@example.com', 'declined'],
      ['withdrew@example.com', 'withdrawn'],
    ]) {
      const id = await signup(email!, SIGNUP_RETENTION_DAYS + 5)
      await db.query(
        `INSERT INTO retreat_leads (email, inquiry_type, status, customer_id)
         VALUES ($1, 'individual', $2, $3)`,
        [email, status, id]
      )
    }

    expect((await purgeStaleSignups()).deleted).toBe(2)
    expect(await remaining()).toEqual([])
  })

  it('never deletes someone waiting on an interest list', async () => {
    const id = await signup('waiting@example.com', SIGNUP_RETENTION_DAYS + 20)
    await db.query(
      `INSERT INTO liap_interest (email, interest_key, customer_id)
       VALUES ($1, 'workshop', $2)`,
      ['waiting@example.com', id]
    )

    expect((await purgeStaleSignups()).deleted).toBe(0)
    expect(await remaining()).toEqual(['waiting@example.com'])
  })

  it('deletes only the stale signup when mixed with protected records', async () => {
    const bought = await signup('paid@example.com', SIGNUP_RETENTION_DAYS + 5)
    await db.query(`INSERT INTO orders (customer_id, status) VALUES ($1, 'paid')`, [bought])
    await signup('never.bought@example.com', SIGNUP_RETENTION_DAYS + 5)
    await signup('new@example.com', 3)

    expect((await purgeStaleSignups()).deleted).toBe(1)
    expect(await remaining()).toEqual(['new@example.com', 'paid@example.com'])
  })
})

describe('what happens around the deletion', () => {
  it('removes the sessions and consents that hang off the record', async () => {
    const id = await signup('cascade@example.com', SIGNUP_RETENTION_DAYS + 1)
    await db.query(
      `INSERT INTO sessions (customer_id, token_hash, expires_at)
       VALUES ($1, 'hash', now() + interval '1 day')`,
      [id]
    )
    await db.query(
      `INSERT INTO consents (customer_id, consent_type, version, granted)
       VALUES ($1, 'analytics', 'v1', true)`,
      [id]
    )

    await purgeStaleSignups()

    const sessions = await db.query<{ n: string }>(`SELECT count(*)::text n FROM sessions`)
    const consents = await db.query<{ n: string }>(`SELECT count(*)::text n FROM consents`)
    expect(sessions[0]!.n).toBe('0')
    expect(consents[0]!.n).toBe('0')
  })

  it('keeps the audit history, de-identified', async () => {
    // Two obligations at once: erase the person, keep the security record.
    // audit_events.customer_id is ON DELETE SET NULL, which satisfies both.
    const id = await signup('audited@example.com', SIGNUP_RETENTION_DAYS + 1)
    await db.query(
      `INSERT INTO audit_events (event_type, customer_id) VALUES ('login.failed', $1)`,
      [id]
    )

    await purgeStaleSignups()

    const rows = await db.query<{ event_type: string; customer_id: string | null }>(
      `SELECT event_type, customer_id FROM audit_events WHERE event_type = 'login.failed'`
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.customer_id).toBeNull()
  })

  it('clears their pending magic links, which are keyed by email not id', async () => {
    const email = 'tokens@example.com'
    await signup(email, SIGNUP_RETENTION_DAYS + 1)
    await db.query(
      `INSERT INTO login_tokens (email, token_hash, expires_at)
       VALUES ($1, 'h1', now() + interval '10 minutes')`,
      [email]
    )

    await purgeStaleSignups()

    const rows = await db.query<{ n: string }>(`SELECT count(*)::text n FROM login_tokens`)
    expect(rows[0]!.n).toBe('0')
  })

  it('records the purge as a count, never as addresses', async () => {
    await signup('logged@example.com', SIGNUP_RETENTION_DAYS + 1)

    await purgeStaleSignups()

    const rows = await db.query<{ metadata: Record<string, unknown> }>(
      `SELECT metadata FROM audit_events WHERE event_type = 'retention.purged'`
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.metadata.count).toBe(1)
    // Deleting a record for privacy and then writing the address into an audit
    // row would defeat the exercise.
    expect(JSON.stringify(rows[0]!.metadata)).not.toContain('logged@example.com')
  })
})

describe('the dry run', () => {
  it('reports what would go without deleting it', async () => {
    await signup('a@example.com', SIGNUP_RETENTION_DAYS + 1)
    await signup('b@example.com', SIGNUP_RETENTION_DAYS + 1)

    const result = await purgeStaleSignups({ dryRun: true })
    expect(result).toEqual({ deleted: 2, dryRun: true })
    expect(await remaining()).toEqual(['a@example.com', 'b@example.com'])
  })

  it('names the records so a human can recognise them', async () => {
    await signup('reviewable@example.com', SIGNUP_RETENTION_DAYS + 10)

    const candidates = await findStaleSignups()
    expect(candidates).toHaveLength(1)
    expect(candidates[0]!.email).toBe('reviewable@example.com')
    expect(candidates[0]!.age_days).toBeGreaterThanOrEqual(SIGNUP_RETENTION_DAYS)
  })

  it('the dry run and the real run agree on the count', async () => {
    await signup('one@example.com', SIGNUP_RETENTION_DAYS + 1)
    await signup('two@example.com', SIGNUP_RETENTION_DAYS + 1)
    await signup('safe@example.com', 1)

    const predicted = await purgeStaleSignups({ dryRun: true })
    const actual = await purgeStaleSignups()
    expect(actual.deleted).toBe(predicted.deleted)
  })
})

describe('the retention period matches what was published', () => {
  it('is 180 days', () => {
    // Section 5 of the privacy policy says 180. If this number changes, that
    // document has to change with it.
    expect(SIGNUP_RETENTION_DAYS).toBe(180)
  })
})

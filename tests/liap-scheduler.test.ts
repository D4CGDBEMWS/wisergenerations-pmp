import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb } from './helpers/db'
import {
  enqueue,
  dispatchDueTasks,
  registerHandler,
  resetHandlersForTesting,
  scheduleReaderSeries,
  scheduleWorkshopWindow,
  pendingByType,
  TASK_TYPES,
} from '@/lib/liap/scheduler'

// ---------------------------------------------------------------------------
// The LIAP dispatcher.
//
// One scheduler for every LIAP workflow, because Vercel's Hobby plan permits
// two cron jobs and both are spent on privacy purges that cannot be given up.
//
// The tests that matter most are about restraint and about not repeating
// itself. A scheduler that occasionally runs late is invisible to a customer;
// one that occasionally sends the same reminder twice is an apology. And a
// handler with no owner-approved content must refuse to improvise rather than
// inventing an email.
// ---------------------------------------------------------------------------

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  const created = await createTestDb()
  db = created.db
  close = created.close
  setDbForTesting(db)
  resetHandlersForTesting()
})

afterEach(async () => {
  setDbForTesting(null)
  await close()
})

const PAST = new Date(Date.now() - 60_000)
const FUTURE = new Date(Date.now() + 86_400_000)

describe('scheduling', () => {
  it('enqueues a task that becomes due', async () => {
    expect(await enqueue({
      type: 'workshop.day5_reminder',
      runAfter: PAST,
      payload: { sessionId: 'abc' },
      idempotencyKey: 'k1',
    })).toBe(true)

    const rows = await db.query<{ task_type: string; status: string }>(
      `SELECT task_type, status FROM scheduled_tasks`
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.status).toBe('pending')
  })

  it('refuses to schedule a task type nobody defined', async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enqueue({ type: 'workshop.send_money' as any, runAfter: PAST, idempotencyKey: 'k' })
    ).rejects.toThrow('unknown task type')
  })

  it('schedules the same thing only once', async () => {
    // The whole point of the key: a retried enqueue is harmless.
    expect(await enqueue({ type: 'reader.weekly_reflection', runAfter: PAST, idempotencyKey: 'same' })).toBe(true)
    expect(await enqueue({ type: 'reader.weekly_reflection', runAfter: PAST, idempotencyKey: 'same' })).toBe(false)
    expect(await db.query(`SELECT 1 FROM scheduled_tasks`)).toHaveLength(1)
  })

  it('lays out the workshop’s fifteen-day window', async () => {
    const heldOn = new Date('2026-09-01T17:00:00Z')
    expect(await scheduleWorkshopWindow({ sessionId: 'sess-1', heldOn })).toBe(4)

    const rows = await db.query<{ task_type: string; run_after: string }>(
      `SELECT task_type, run_after FROM scheduled_tasks ORDER BY run_after`
    )
    expect(rows.map((r) => r.task_type)).toEqual([
      'workshop.day0_reflection_request',
      'workshop.day5_reminder',
      'workshop.day10_reminder',
      'workshop.day15_close_and_report',
    ])
    // Day 15 lands fifteen days out, not fourteen or sixteen.
    const first = new Date(rows[0]!.run_after).getTime()
    const last = new Date(rows[3]!.run_after).getTime()
    expect(Math.round((last - first) / 86_400_000)).toBe(15)
  })

  it('schedules twelve weekly reflections, one per week', async () => {
    expect(await scheduleReaderSeries({
      customerId: 'cust-1',
      purchasedAt: new Date('2026-09-01T00:00:00Z'),
    })).toBe(12)

    const rows = await db.query<{ payload: { week: number }; run_after: string }>(
      `SELECT payload, run_after FROM scheduled_tasks ORDER BY run_after`
    )
    expect(rows).toHaveLength(12)
    expect(rows.map((r) => r.payload.week)).toEqual([1,2,3,4,5,6,7,8,9,10,11,12])

    // Seven days apart, relative to the purchase — not a fixed calendar.
    const gap = new Date(rows[1]!.run_after).getTime() - new Date(rows[0]!.run_after).getTime()
    expect(Math.round(gap / 86_400_000)).toBe(7)
  })

  it('does not double-schedule a reader series on a repeated purchase webhook', async () => {
    const args = { customerId: 'cust-1', purchasedAt: new Date('2026-09-01T00:00:00Z') }
    expect(await scheduleReaderSeries(args)).toBe(12)
    expect(await scheduleReaderSeries(args)).toBe(0)
    expect(await db.query(`SELECT 1 FROM scheduled_tasks`)).toHaveLength(12)
  })
})

describe('dispatching', () => {
  it('runs what is due and leaves what is not', async () => {
    const ran: string[] = []
    registerHandler('workshop.day5_reminder', async (t) => {
      ran.push(t.id)
      return { status: 'done' }
    })

    await enqueue({ type: 'workshop.day5_reminder', runAfter: PAST, idempotencyKey: 'due' })
    await enqueue({ type: 'workshop.day5_reminder', runAfter: FUTURE, idempotencyKey: 'later' })

    const result = await dispatchDueTasks()
    expect(result).toMatchObject({ claimed: 1, done: 1, failed: 0 })
    expect(ran).toHaveLength(1)

    const statuses = await db.query<{ status: string }>(
      `SELECT status FROM scheduled_tasks ORDER BY run_after`
    )
    expect(statuses.map((r) => r.status)).toEqual(['done', 'pending'])
  })

  it('never runs the same task twice', async () => {
    let calls = 0
    registerHandler('workshop.day5_reminder', async () => {
      calls++
      return { status: 'done' }
    })

    await enqueue({ type: 'workshop.day5_reminder', runAfter: PAST, idempotencyKey: 'once' })
    await dispatchDueTasks()
    await dispatchDueTasks()

    expect(calls).toBe(1)
  })

  it('records "nothing to do" as success, not as failure', async () => {
    // A reminder for somebody who already submitted. Counting that as a
    // failure would make the failure number meaningless.
    registerHandler('workshop.day10_reminder', async () => ({
      status: 'skipped',
      reason: 'artifact already submitted',
    }))
    await enqueue({ type: 'workshop.day10_reminder', runAfter: PAST, idempotencyKey: 's' })

    const result = await dispatchDueTasks()
    expect(result).toMatchObject({ done: 0, skipped: 1, failed: 0 })
  })

  it('holds a task that is waiting on owner-approved content', async () => {
    // The reader series has no approved manuscript quotes yet. The handler
    // must say so and wait, not invent a quotation.
    registerHandler('reader.weekly_reflection', async () => ({
      status: 'blocked',
      awaiting: 'owner-approved manuscript quote for week 1',
    }))
    await enqueue({ type: 'reader.weekly_reflection', runAfter: PAST, idempotencyKey: 'b' })

    const result = await dispatchDueTasks()
    expect(result.blocked).toBe(1)

    const rows = await db.query<{ status: string; attempts: number; last_error: string }>(
      `SELECT status, attempts, last_error FROM scheduled_tasks`
    )
    // Still pending, and its retry budget untouched — it is waiting on a
    // person, not failing.
    expect(rows[0]!.status).toBe('pending')
    expect(rows[0]!.attempts).toBe(0)
    expect(rows[0]!.last_error).toContain('awaiting')
  })

  it('retries a genuine failure, then stops', async () => {
    registerHandler('workshop.day0_reflection_request', async () => {
      throw new Error('email provider unreachable')
    })
    await enqueue({ type: 'workshop.day0_reflection_request', runAfter: PAST, idempotencyKey: 'f' })

    for (let i = 0; i < 3; i++) await dispatchDueTasks()

    const rows = await db.query<{ status: string; attempts: number; last_error: string }>(
      `SELECT status, attempts, last_error FROM scheduled_tasks`
    )
    expect(rows[0]!.status).toBe('failed')
    expect(rows[0]!.attempts).toBe(3)
    expect(rows[0]!.last_error).toContain('email provider unreachable')
  })

  it('leaves a task alone when no handler is deployed yet', async () => {
    // A deployment gap, not a data problem. It must not burn retries.
    await enqueue({ type: 'workshop.replay_available', runAfter: PAST, idempotencyKey: 'n' })

    const result = await dispatchDueTasks()
    expect(result).toMatchObject({ claimed: 0, done: 0, failed: 0 })

    const rows = await db.query<{ status: string; attempts: number }>(
      `SELECT status, attempts FROM scheduled_tasks`
    )
    expect(rows[0]!.status).toBe('pending')
    expect(rows[0]!.attempts).toBe(0)
  })

  it('one failing handler does not stop the others', async () => {
    registerHandler('workshop.day5_reminder', async () => { throw new Error('boom') })
    registerHandler('workshop.day10_reminder', async () => ({ status: 'done' }))

    await enqueue({ type: 'workshop.day5_reminder', runAfter: PAST, idempotencyKey: 'a' })
    await enqueue({ type: 'workshop.day10_reminder', runAfter: PAST, idempotencyKey: 'b' })

    const result = await dispatchDueTasks()
    expect(result.done).toBe(1)
    expect(result.failed).toBe(1)
  })

  it('reports what is waiting and why', async () => {
    await scheduleWorkshopWindow({ sessionId: 's', heldOn: new Date() })
    const waiting = await pendingByType()
    expect(waiting.map((r) => r.task_type)).toContain('workshop.day15_close_and_report')
  })
})

describe('what the dispatcher must never carry', () => {
  it('every task type is enumerated', () => {
    // A free-string task type would let a typo create work nothing runs.
    expect(TASK_TYPES.length).toBeGreaterThan(0)
    expect(new Set(TASK_TYPES).size).toBe(TASK_TYPES.length)
  })

  it('the module composes no customer-facing message', async () => {
    const { readFileSync } = await import('fs')
    const source = readFileSync('lib/liap/scheduler.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')

    // No subject lines, no bodies, no greetings. The dispatcher says work is
    // due; owner-approved content says what it says.
    for (const forbidden of ['Subject:', 'Dear ', 'Hi ', '<html', 'Unsubscribe']) {
      expect(source).not.toContain(forbidden)
    }
  })

  it('the module grants nothing and authorizes nothing', async () => {
    const { readFileSync } = await import('fs')
    const source = readFileSync('lib/liap/scheduler.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')

    for (const forbidden of ['grantEntitlement', 'hasEntitlement', 'entitlements']) {
      expect(source).not.toContain(forbidden)
    }
  })
})

describe('the Workshop reflection artifact keeps free text isolated', () => {
  async function seedArtifact(): Promise<string> {
    const cust = await db.query<{ id: string }>(
      `INSERT INTO customers (email) VALUES ('participant@example.com') RETURNING id`
    )
    const sess = await db.query<{ id: string }>(
      `INSERT INTO workshop_sessions (title) VALUES ('September Workshop') RETURNING id`
    )
    const reg = await db.query<{ id: string }>(
      `INSERT INTO workshop_registrations (session_id, customer_id) VALUES ($1, $2) RETURNING id`,
      [sess[0]!.id, cust[0]!.id]
    )
    const art = await db.query<{ id: string }>(
      `INSERT INTO workshop_artifacts (registration_id, narrative_purge_after, usefulness, preparedness)
       VALUES ($1, now() + interval '90 days', 5, 'yes') RETURNING id`,
      [reg[0]!.id]
    )
    await db.query(
      `INSERT INTO workshop_artifact_answers (artifact_id, question_key, value) VALUES
        ($1, 'project_living', 'I am leaving a marriage of nineteen years.'),
        ($1, 'became_clearer', 'That I have been waiting for permission.')`,
      [art[0]!.id]
    )
    return art[0]!.id
  }

  it('holds the words in their own table, and nothing else with them', async () => {
    await seedArtifact()
    const cols = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'workshop_artifact_answers' ORDER BY column_name`
    )
    // Four columns. Same shape as assessment_narratives, so the purge is one
    // DELETE that cannot take completion or eligibility with it.
    expect(cols.map((c) => c.column_name)).toEqual([
      'artifact_id', 'question_key', 'recorded_at', 'value',
    ])
  })

  it('survives deletion of the free text with completion intact', async () => {
    const artifactId = await seedArtifact()
    await db.query(`DELETE FROM workshop_artifact_answers WHERE artifact_id = $1`, [artifactId])

    const rows = await db.query<{ usefulness: number; preparedness: string }>(
      `SELECT usefulness, preparedness FROM workshop_artifacts WHERE id = $1`,
      [artifactId]
    )
    // The person's words are gone; that they completed, and how they rated
    // it, remain. Both obligations satisfied at once.
    expect(rows).toHaveLength(1)
    expect(rows[0]!.usefulness).toBe(5)
    expect(rows[0]!.preparedness).toBe('yes')
  })

  it('carries no free text on the artifact row itself', async () => {
    const cols = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'workshop_artifacts'`
    )
    const names = cols.map((c) => c.column_name)
    for (const leak of ['value', 'answer', 'reflection', 'notes', 'comment']) {
      expect(names).not.toContain(leak)
    }
  })

  it('has no price column anywhere in the workshop schema', async () => {
    // The Workshop price is on HOLD. A column invites a value and a value
    // invites a charge.
    const cols = await db.query<{ column_name: string; table_name: string }>(
      `SELECT column_name, table_name FROM information_schema.columns
        WHERE table_name LIKE 'workshop%'`
    )
    for (const c of cols) {
      expect(c.column_name).not.toContain('price')
      expect(c.column_name).not.toContain('amount')
    }
  })
})

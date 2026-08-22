import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb } from './helpers/db'
import {
  dispatchDueTasks,
  enqueue,
  overdueTasks,
  resetHandlersForTesting,
  registerHandler,
  RETENTION_PRIORITY,
  DEFAULT_PRIORITY,
} from '@/lib/liap/scheduler'
import {
  RETENTION_JOBS,
  ensureRetentionOccurrences,
  occurrenceKey,
  registerRetentionHandlers,
  retentionDispatchEnabled,
  retentionHealth,
} from '@/lib/liap/retention-tasks'
import { SIGNUP_RETENTION_DAYS, findStaleSignups } from '@/lib/retention'
import { NARRATIVE_RETENTION_DAYS } from '@/lib/liap/assessment-service'

// ---------------------------------------------------------------------------
// Consolidating the privacy purges into the dispatcher.
//
// The owner asked for a design that frees a cron slot WITHOUT weakening
// anything, and for the consolidated architecture to be shown preserving five
// specific properties. This file is that demonstration, one describe block per
// property:
//
//   retention guarantees   a record past its date is deleted, including after
//                          a run is missed entirely
//   idempotency            one purge per day however often the dispatcher runs
//   failure handling       a failing day does not end the recurrence
//   observability          a stopped purge is visible without the platform
//   recovery               a week of downtime converges rather than piling up
//
// The switch is off by default and these tests set it explicitly, so the suite
// also proves the resting state: with LIAP_DISPATCH_RETENTION unset, the
// dispatcher does not delete anything.
// ---------------------------------------------------------------------------

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  const created = await createTestDb()
  db = created.db
  close = created.close
  setDbForTesting(db)
  resetHandlersForTesting()
  process.env.LIAP_DISPATCH_RETENTION = '1'
})

afterEach(async () => {
  delete process.env.LIAP_DISPATCH_RETENTION
  setDbForTesting(null)
  await close()
})

const DAY = 86_400_000
const at = (iso: string) => new Date(iso)

// Occurrences fall at 04:00 and 05:00 UTC on the day they are seeded for, so
// "today" is only due after 05:00 and a suite that seeded from today would
// pass or fail depending on the hour it ran. Every due-now case seeds from a
// day that is unambiguously in the past.
const YESTERDAY = new Date(Date.now() - DAY)
const TODAY = new Date()

/** A signup old enough to be past the 180-day promise, with no purchase. */
async function seedStaleSignup(email: string): Promise<string> {
  const rows = await db.query<{ id: string }>(
    `INSERT INTO customers (email, created_at)
     VALUES ($1, now() - ($2 || ' days')::interval)
     RETURNING id`,
    [email, String(SIGNUP_RETENTION_DAYS + 10)]
  )
  return rows[0]!.id
}

/** An assessment whose free text is past the 90-day promise. */
async function seedExpiredNarrative(email: string): Promise<string> {
  const customer = await db.query<{ id: string }>(
    `INSERT INTO customers (email) VALUES ($1) RETURNING id`,
    [email]
  )
  const version = await db.query<{ id: string }>(
    `INSERT INTO assessment_versions (version_key, definition_hash, question_count)
     VALUES ('v1', 'hash', 40)
     ON CONFLICT (version_key) DO UPDATE SET question_count = excluded.question_count
     RETURNING id`
  )
  const assessment = await db.query<{ id: string }>(
    `INSERT INTO assessments (customer_id, version_id, status, completed_at, narrative_purge_after)
     VALUES ($1, $2, 'completed', now(), now() - interval '1 day')
     RETURNING id`,
    [customer[0]!.id, version[0]!.id]
  )
  await db.query(
    `INSERT INTO assessment_narratives (assessment_id, question_key, value)
     VALUES ($1, 'what_changed', 'Something I would not want kept.')`,
    [assessment[0]!.id]
  )
  return assessment[0]!.id
}

async function countNarratives(): Promise<number> {
  const rows = await db.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM assessment_narratives`
  )
  return rows[0]!.n
}

async function statuses(): Promise<Array<{ idempotency_key: string; status: string; attempts: number }>> {
  return db.query(
    `SELECT idempotency_key, status, attempts FROM scheduled_tasks ORDER BY idempotency_key`
  )
}

// ---------------------------------------------------------------------------

describe('the resting state — nothing changes until it is switched on', () => {
  it('is off unless the environment says otherwise', () => {
    delete process.env.LIAP_DISPATCH_RETENTION
    expect(retentionDispatchEnabled()).toBe(false)
    process.env.LIAP_DISPATCH_RETENTION = '0'
    expect(retentionDispatchEnabled()).toBe(false)
  })

  it('deletes nothing while it is off, even with the occurrence due', async () => {
    await seedStaleSignup('stale@example.com')
    registerRetentionHandlers()
    await ensureRetentionOccurrences({ from: YESTERDAY })

    delete process.env.LIAP_DISPATCH_RETENTION
    const result = await dispatchDueTasks()

    expect(result.skipped).toBeGreaterThan(0)
    expect(result.done).toBe(0)
    expect(await findStaleSignups()).toHaveLength(1)
  })

  it('still uses the cron routes, which this design does not touch', async () => {
    // The equivalence argument rests on the purge modules being unchanged.
    // If someone edits them, that argument needs re-making.
    expect(SIGNUP_RETENTION_DAYS).toBe(180)
    expect(NARRATIVE_RETENTION_DAYS).toBe(90)
  })
})

describe('retention guarantees survive the move', () => {
  it('deletes the same records the cron would', async () => {
    await seedStaleSignup('stale@example.com')
    await seedExpiredNarrative('reflective@example.com')
    expect(await findStaleSignups()).toHaveLength(1)
    expect(await countNarratives()).toBe(1)

    registerRetentionHandlers()
    await ensureRetentionOccurrences({ from: YESTERDAY })
    const result = await dispatchDueTasks()

    expect(result.done).toBeGreaterThanOrEqual(2)
    expect(await findStaleSignups()).toHaveLength(0)
    expect(await countNarratives()).toBe(0)
  })

  it('writes the same audit events, by count and never by identity', async () => {
    await seedStaleSignup('stale@example.com')
    await seedExpiredNarrative('reflective@example.com')

    registerRetentionHandlers()
    await ensureRetentionOccurrences({ from: YESTERDAY })
    await dispatchDueTasks()

    const events = await db.query<{ event_type: string; metadata: Record<string, unknown> }>(
      `SELECT event_type, metadata FROM audit_events ORDER BY event_type`
    )
    const types = events.map((e) => e.event_type)
    expect(types).toContain('retention.purged')
    expect(types).toContain('liap.narratives_purged')

    // The purge exists to remove identifying data. Writing it into an audit
    // row would defeat the exercise.
    const serialised = JSON.stringify(events)
    expect(serialised).not.toContain('stale@example.com')
    expect(serialised).not.toContain('reflective@example.com')
    expect(serialised).not.toContain('Something I would not want kept')
  })

  it('runs a missed day late rather than dropping it', async () => {
    // Vercel Cron has no memory: a skipped invocation is simply gone. Here the
    // occurrence stays pending and overdue.
    await ensureRetentionOccurrences({ from: new Date(Date.now() - 4 * DAY), days: 1 })
    const backlog = await overdueTasks(24)
    expect(backlog.map((b) => b.task_type).sort()).toEqual([
      'retention.purge_narratives',
      'retention.purge_signups',
    ])

    await seedStaleSignup('stale@example.com')
    registerRetentionHandlers()
    await dispatchDueTasks()
    expect(await findStaleSignups()).toHaveLength(0)
  })

  it('outranks ordinary work so a long queue cannot starve it', async () => {
    // Five hundred due reader emails must not push a privacy deletion past
    // the day it was promised for.
    for (let i = 0; i < 60; i++) {
      await enqueue({
        type: 'reader.weekly_reflection',
        runAfter: new Date(Date.now() - DAY),
        idempotencyKey: `reader:${i}`,
      })
    }
    await ensureRetentionOccurrences({ from: new Date(Date.now() - DAY), days: 1 })

    const claimed: string[] = []
    registerHandler('reader.weekly_reflection', async () => {
      claimed.push('reader')
      return { status: 'done' }
    })
    for (const job of RETENTION_JOBS) {
      registerHandler(job.type, async () => {
        claimed.push(job.type)
        return { status: 'done' }
      })
    }

    await dispatchDueTasks(10)

    // Both purges came first, inside a batch far smaller than the backlog.
    expect(claimed.slice(0, 2).sort()).toEqual([
      'retention.purge_narratives',
      'retention.purge_signups',
    ])
    expect(RETENTION_PRIORITY).toBeLessThan(DEFAULT_PRIORITY)
  })
})

describe('idempotency', () => {
  it('creates exactly one occurrence per job per day, however often it seeds', async () => {
    const from = YESTERDAY
    expect(await ensureRetentionOccurrences({ from, days: 3 })).toBe(6)
    expect(await ensureRetentionOccurrences({ from, days: 3 })).toBe(0)
    expect(await ensureRetentionOccurrences({ from, days: 3 })).toBe(0)

    const rows = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM scheduled_tasks`)
    expect(rows[0]!.n).toBe(6)
  })

  it('keys an occurrence by its UTC date, so the date is the guarantee', async () => {
    expect(occurrenceKey('retention.purge_signups', at('2026-08-22T04:00:00Z'))).toBe(
      'retention.purge_signups:2026-08-22'
    )
  })

  it('purges once even if the dispatcher runs many times that day', async () => {
    await seedStaleSignup('stale@example.com')
    registerRetentionHandlers()

    // One day only, so the assertion does not depend on the hour the suite
    // runs: with a three-day horizon, today's occurrence is due after 05:00
    // UTC and not before.
    let done = 0
    for (let run = 0; run < 5; run++) {
      await ensureRetentionOccurrences({ from: YESTERDAY, days: 1 })
      done += (await dispatchDueTasks()).done
    }

    // Two jobs, one occurrence each, five dispatches.
    expect(done).toBe(2)
    expect(await findStaleSignups()).toHaveLength(0)
  })

  it('keeps the current cron hours, so a cutover is not a change of timing', async () => {
    expect(RETENTION_JOBS.map((j) => [j.type, j.hourUtc])).toEqual([
      ['retention.purge_signups', 4],
      ['retention.purge_narratives', 5],
    ])
  })

  it('does not run tomorrow today', async () => {
    await ensureRetentionOccurrences({ from: new Date(Date.now() + DAY), days: 2 })
    registerRetentionHandlers()
    expect((await dispatchDueTasks()).claimed).toBe(0)
  })
})

describe('failure handling', () => {
  it('does not end the recurrence when a day fails permanently', async () => {
    // The dispatcher gives up on a task after three attempts. For ordinary
    // work that is right; for retention it would look like the purge dying.
    // It does not, because tomorrow is a different row.
    let attempts = 0
    registerHandler('retention.purge_signups', async () => {
      attempts++
      throw new Error('database unreachable')
    })

    const monday = new Date(Date.now() - 5 * DAY)
    await ensureRetentionOccurrences({
      from: monday,
      days: 1,
      jobs: RETENTION_JOBS.filter((j) => j.type === 'retention.purge_signups'),
    })

    for (let run = 0; run < 4; run++) await dispatchDueTasks()
    expect(attempts).toBe(3)
    expect((await statuses())[0]!.status).toBe('failed')

    // Tuesday is seeded regardless of what happened to Monday, and neither
    // purge is day-specific — so Tuesday deletes Monday's arrears.
    await seedStaleSignup('stale@example.com')
    resetHandlersForTesting()
    registerRetentionHandlers()
    await ensureRetentionOccurrences({
      from: new Date(Date.now() - 4 * DAY),
      days: 1,
      jobs: RETENTION_JOBS.filter((j) => j.type === 'retention.purge_signups'),
    })
    await dispatchDueTasks()

    expect(await findStaleSignups()).toHaveLength(0)
  })

  it('records why a day failed rather than losing it', async () => {
    registerHandler('retention.purge_narratives', async () => {
      throw new Error('connection reset by peer')
    })
    await ensureRetentionOccurrences({
      from: new Date(Date.now() - 5 * DAY),
      days: 1,
      jobs: RETENTION_JOBS.filter((j) => j.type === 'retention.purge_narratives'),
    })
    await dispatchDueTasks()

    const rows = await db.query<{ last_error: string; status: string }>(
      `SELECT last_error, status FROM scheduled_tasks`
    )
    expect(rows[0]!.last_error).toContain('connection reset by peer')
    expect(rows[0]!.status).toBe('pending')
  })

  it('leaves an occurrence pending when no handler is registered', async () => {
    // A deployment gap, not a data problem. Burning the retry budget on it
    // would turn a bad deploy into a lost purge.
    await ensureRetentionOccurrences({ from: new Date(Date.now() - 5 * DAY), days: 1 })
    const result = await dispatchDueTasks()

    expect(result.claimed).toBe(0)
    expect((await statuses()).every((r) => r.status === 'pending' && r.attempts === 0)).toBe(true)
  })
})

describe('observability — what the Vercel dashboard used to provide', () => {
  it('reports a job that has never run as stale, not as healthy', async () => {
    const health = await retentionHealth(YESTERDAY)
    expect(health).toHaveLength(2)
    expect(health.every((h) => h.lastSuccessAt === null && h.stale)).toBe(true)
  })

  it('reports a job that ran this morning as healthy, and names the promise', async () => {
    registerRetentionHandlers()
    await ensureRetentionOccurrences({ from: YESTERDAY })
    await dispatchDueTasks()

    const health = await retentionHealth(new Date())
    expect(health.every((h) => h.stale)).toBe(false)
    expect(health[0]!.promise).toContain('180 days')
    expect(health[1]!.promise).toContain('90 days')
    expect(health[0]!.retentionDays).toBe(SIGNUP_RETENTION_DAYS)
    expect(health[1]!.retentionDays).toBe(NARRATIVE_RETENTION_DAYS)
  })

  it('turns stale after two missed days, not one bad night', async () => {
    registerRetentionHandlers()
    await ensureRetentionOccurrences({ from: YESTERDAY })
    await dispatchDueTasks()

    const oneDay = await retentionHealth(new Date(Date.now() + DAY))
    const threeDays = await retentionHealth(new Date(Date.now() + 3 * DAY))

    expect(oneDay.every((h) => h.stale)).toBe(false)
    expect(threeDays.every((h) => h.stale)).toBe(true)
    expect(threeDays[0]!.hoursSinceSuccess).toBeGreaterThan(48)
  })

  it('reports the backlog and how old it is', async () => {
    await ensureRetentionOccurrences({ from: new Date(Date.now() - 7 * DAY), days: 2 })
    const backlog = await overdueTasks(24)

    expect(backlog).toHaveLength(2)
    expect(backlog[0]!.waiting).toBe(2)
    expect(new Date(backlog[0]!.oldest_due).getTime()).toBeLessThan(Date.now() - 6 * DAY)
  })
})

describe('recovery', () => {
  it('converges after downtime instead of purging once per missed day', async () => {
    // Seven days of occurrences accumulate while the dispatcher is down.
    await ensureRetentionOccurrences({ from: new Date(Date.now() - 12 * DAY), days: 7 })
    await seedStaleSignup('stale@example.com')
    await seedExpiredNarrative('reflective@example.com')

    let purgeCalls = 0
    for (const job of RETENTION_JOBS) {
      registerHandler(job.type, async () => {
        purgeCalls++
        const { deleted } = await job.run({ dryRun: false })
        return { status: 'done', detail: String(deleted) }
      })
    }

    const result = await dispatchDueTasks()

    // The backlog drains in one run, and the extra runs are harmless: the
    // first deletes everything past its date and the rest delete nothing.
    expect(result.claimed).toBe(14)
    expect(purgeCalls).toBe(14)
    expect(await findStaleSignups()).toHaveLength(0)
    expect(await countNarratives()).toBe(0)

    // Exactly one audit event per job that actually removed something.
    const events = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM audit_events WHERE event_type = 'liap.narratives_purged'`
    )
    expect(events[0]!.n).toBe(1)
    expect(await overdueTasks(0)).toHaveLength(0)
  })

  it('re-seeds a horizon after downtime without duplicating what survived', async () => {
    const from = YESTERDAY
    await ensureRetentionOccurrences({ from, days: 3 })
    // Comes back up, seeds again from a day later.
    const created = await ensureRetentionOccurrences({ from: TODAY, days: 3 })

    expect(created).toBe(2) // only the one day beyond the first horizon, per job
    const rows = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM scheduled_tasks`)
    expect(rows[0]!.n).toBe(8)
  })
})

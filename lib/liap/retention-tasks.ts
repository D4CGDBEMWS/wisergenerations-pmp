import {
  enqueue,
  registerHandler,
  lastSuccessByType,
  RETENTION_PRIORITY,
  type TaskOutcome,
  type TaskType,
} from './scheduler'
import { purgeStaleSignups, SIGNUP_RETENTION_DAYS } from '@/lib/retention'
import { purgeExpiredNarratives } from './retention'
import { NARRATIVE_RETENTION_DAYS } from './assessment-service'

// ---------------------------------------------------------------------------
// The privacy purges, as dispatcher tasks.
//
// Owner ruling, 22 August 2026: prepare and test a design in which the two
// existing purge crons are absorbed by the single LIAP dispatcher, freeing
// cron capacity — WITHOUT changing the live schedule yet.
//
// So this file is the design, complete and tested, and switched off. Both
// existing cron routes are untouched and still in vercel.json; nothing here
// runs unless LIAP_DISPATCH_RETENTION is set, and the dispatcher itself is
// still not scheduled. Turning it on is a separate decision.
//
// ── THE ONE THING THIS FILE DELIBERATELY DOES NOT DO ───────────────────────
//
// It does not reimplement either purge. purgeStaleSignups() and
// purgeExpiredNarratives() are called exactly as the cron routes call them,
// with the same arguments, so the deletion predicates, the cascades, the
// login_token sweep and both audit events are not merely equivalent — they
// are the same code. The only thing that changes is what asks them to run.
//
// That is the whole equivalence argument, and it is deliberately boring. A
// consolidation that rewrote the SQL would need every retention guarantee
// re-proved; this one needs only the trigger proved.
//
// ── HOW RECURRENCE WORKS, AND WHY NOT A SELF-RESCHEDULING CHAIN ────────────
//
// The obvious design is: when today's purge finishes, enqueue tomorrow's.
// It is also the dangerous one. A chain has a single point of failure at
// every link — one occurrence lost to a crash between the delete and the
// enqueue and the purge stops forever, silently, while the privacy policy
// goes on promising.
//
// Instead each day is an independent, date-keyed row: `purge_signups:
// 2026-08-23`. Every dispatch seeds a short horizon of them. Seeding is
// idempotent by construction — the date IS the idempotency key — so seeding
// twice, or seeding after a week of downtime, converges on exactly one row
// per day. Nothing depends on the previous run having succeeded.
//
// ── WHY A MISSED DAY IS NOT A MISSED DELETION ──────────────────────────────
//
// Neither purge is day-specific. Both delete everything currently past its
// retention date, so a run that fails on Tuesday deletes Tuesday's arrears on
// Wednesday. The guarantee is "deleted within 180 days" (and 90 for
// narratives), and it survives any single failed run under either
// architecture.
//
// The difference is what happens to the missed day itself. Vercel Cron has no
// memory: a skipped invocation is gone, and nothing anywhere records that the
// promise went unenforced. Here the occurrence stays pending and overdue, so
// it runs late, and overdueTasks() can say how late. That is strictly more
// evidence than the platform provides today.
// ---------------------------------------------------------------------------

export interface RetentionJob {
  readonly type: TaskType
  /** For logs and the health report. */
  readonly label: string
  /** The published promise this job keeps. */
  readonly promise: string
  readonly retentionDays: number
  /** UTC hour the day's occurrence becomes due — the current cron times. */
  readonly hourUtc: number
  readonly run: (options: { dryRun?: boolean }) => Promise<{ deleted: number; detail: string }>
}

/**
 * The two jobs, with the schedule they run on today.
 *
 * Hours match vercel.json exactly (04:00 and 05:00 UTC) so that a cutover is
 * a change of mechanism and not a quiet change of timing. If the dispatcher
 * ever runs more often than daily, the date-keyed occurrence still means each
 * job runs once per day.
 */
export const RETENTION_JOBS: readonly RetentionJob[] = [
  {
    type: 'retention.purge_signups',
    label: 'signup purge',
    promise: 'Privacy policy §5 — a record that never purchased is deleted within 180 days.',
    retentionDays: SIGNUP_RETENTION_DAYS,
    hourUtc: 4,
    run: async ({ dryRun }) => {
      const result = await purgeStaleSignups({ dryRun })
      return { deleted: result.deleted, detail: `${result.deleted} signup record(s)` }
    },
  },
  {
    type: 'retention.purge_narratives',
    label: 'narrative purge',
    promise: 'LIAP §27 — assessment free text is deleted 90 days after completion.',
    retentionDays: NARRATIVE_RETENTION_DAYS,
    hourUtc: 5,
    run: async ({ dryRun }) => {
      const result = await purgeExpiredNarratives({ dryRun })
      return {
        deleted: result.narratives,
        detail: `${result.narratives} narrative row(s) across ${result.assessments} assessment(s)`,
      }
    },
  },
]

/**
 * Whether the dispatcher is allowed to carry retention work.
 *
 * OFF by default, and read per call rather than at module load so a test can
 * exercise both states and so the value cannot be baked into a build. While
 * it is off, the crons in vercel.json remain the only thing that purges
 * anything — which is the state the owner asked to preserve.
 */
export function retentionDispatchEnabled(): boolean {
  return process.env.LIAP_DISPATCH_RETENTION === '1'
}

/** The occurrence key for one job on one UTC day. The date IS the key. */
export function occurrenceKey(type: TaskType, day: Date): string {
  return `${type}:${day.toISOString().slice(0, 10)}`
}

/**
 * Ensures an occurrence exists for each job for today and the next few days.
 *
 * The horizon is short on purpose. Far enough ahead that a gap in dispatching
 * cannot leave tomorrow unscheduled; short enough that changing a job's hour
 * takes effect within days rather than needing a backlog cleared.
 *
 * Returns how many rows it actually created, which is 0 on every run after
 * the first of a given day — that is the idempotency, visible.
 */
export async function ensureRetentionOccurrences(options: {
  from: Date
  days?: number
  jobs?: readonly RetentionJob[]
}): Promise<number> {
  const days = options.days ?? 3
  const jobs = options.jobs ?? RETENTION_JOBS
  let created = 0

  for (const job of jobs) {
    for (let offset = 0; offset < days; offset++) {
      const day = new Date(
        Date.UTC(
          options.from.getUTCFullYear(),
          options.from.getUTCMonth(),
          options.from.getUTCDate() + offset,
          job.hourUtc,
          0,
          0,
          0
        )
      )
      const made = await enqueue({
        type: job.type,
        runAfter: day,
        payload: { day: day.toISOString().slice(0, 10) },
        idempotencyKey: occurrenceKey(job.type, day),
        priority: RETENTION_PRIORITY,
      })
      if (made) created++
    }
  }
  return created
}

/**
 * Registers both purges as handlers.
 *
 * ── FAILURE HANDLING, WHICH IS WHERE THE TWO ARCHITECTURES DIFFER MOST ─────
 *
 * A cron route that throws returns 500 and is simply called again tomorrow.
 * The dispatcher retries a failing task and, after three attempts, marks it
 * `failed` and stops — which for ordinary work is right, and for a retention
 * job would look like the purge dying permanently.
 *
 * It does not, and the reason is the recurrence model rather than special
 * handling here: tomorrow's occurrence is a different row that is seeded
 * regardless of what happened to today's. A permanently failed Tuesday costs
 * a log line and an audit gap for Tuesday; Wednesday deletes Tuesday's
 * arrears, because neither purge is day-specific. The behaviour is the same
 * as the cron's, and the failure is now recorded rather than transient.
 *
 * Handlers still throw on error rather than swallowing. A retention job that
 * fails quietly is the exact problem this module exists to avoid.
 */
export function registerRetentionHandlers(jobs: readonly RetentionJob[] = RETENTION_JOBS): void {
  for (const job of jobs) {
    registerHandler(job.type, async (): Promise<TaskOutcome> => {
      if (!retentionDispatchEnabled()) {
        // The switch is off, so the crons are still doing this work. Skipping
        // rather than deleting twice — and `skipped` rather than `blocked`,
        // because nothing is waiting on a person.
        return { status: 'skipped', reason: 'retention dispatch disabled; cron still owns this job' }
      }

      const { deleted, detail } = await job.run({ dryRun: false })
      console.log(`[retention] ${job.label}: deleted ${detail}`)
      return { status: 'done', detail }
    })
  }
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface RetentionHealth {
  type: TaskType
  label: string
  promise: string
  retentionDays: number
  lastSuccessAt: string | null
  hoursSinceSuccess: number | null
  /** True when this job has not completed inside its tolerance. */
  stale: boolean
}

/**
 * How each purge is doing, as of a caller-supplied clock.
 *
 * `now` is a parameter rather than a call to Date.now() so this is testable
 * and deterministic, the same rule the scoring engine follows.
 *
 * Tolerance is 48 hours for a daily job: one missed run is a bad night, two
 * is a broken mechanism. A job that has never succeeded is stale immediately
 * — "no history" and "healthy" must never be the same answer, because that
 * is precisely the state a consolidation could drift into unnoticed.
 */
export async function retentionHealth(
  now: Date,
  toleranceHours = 48
): Promise<RetentionHealth[]> {
  const successes = await lastSuccessByType()

  return RETENTION_JOBS.map((job) => {
    const last = successes.get(job.type) ?? null
    const hours = last ? (now.getTime() - last.getTime()) / 3_600_000 : null
    return {
      type: job.type,
      label: job.label,
      promise: job.promise,
      retentionDays: job.retentionDays,
      lastSuccessAt: last ? last.toISOString() : null,
      hoursSinceSuccess: hours === null ? null : Math.round(hours * 10) / 10,
      stale: hours === null || hours > toleranceHours,
    }
  })
}

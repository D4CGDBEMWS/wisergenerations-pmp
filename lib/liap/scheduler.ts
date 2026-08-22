import { getDb } from '@/lib/db/client'

// ---------------------------------------------------------------------------
// The LIAP dispatcher.
//
// Owner approval, §9 of the Master Handoff: one dispatcher for scheduled LIAP
// workflows, with the email platform handling delivery where practical.
//
// It must carry Workshop day 0, 5, 10 and 15, replay delivery, participant
// follow-up and the twelve-week reader series. Four schedulers would mean
// four things to monitor and four ways to stop working quietly; one means a
// single question — "what is due?" — with a single answer.
//
// ── THE CEILING THIS REMOVES ───────────────────────────────────────────────
//
// Vercel's Hobby plan permits two cron jobs and both are spent: the signup
// purge and the narrative purge, neither of which can be given up because
// they keep published privacy commitments. Every workflow above would have
// wanted its own slot. A dispatcher needs one, whatever it carries.
//
// ── WHAT IT DOES NOT DO ────────────────────────────────────────────────────
//
// It does not write email. Handlers below either call the email platform with
// an owner-approved template, or — where no approved content exists yet —
// record that the send is due and stop. Nothing here composes a customer-
// facing message, and a handler with no approved content fails loudly rather
// than improvising one.
//
// It does not decide anything about a person. No handler grants an
// entitlement, approves a registration, or changes what somebody may do. The
// dispatcher moves work along a timeline; judgment stays with people.
// ---------------------------------------------------------------------------

/**
 * Every workflow the dispatcher knows how to run.
 *
 * Enumerated rather than free strings, so a typo in an enqueue call fails at
 * the type level rather than creating a task nothing will ever pick up.
 */
export const TASK_TYPES = [
  // Workshop, §11–§12 of the handoff.
  'workshop.day0_reflection_request',
  'workshop.day5_reminder',
  'workshop.day10_reminder',
  'workshop.day15_close_and_report',
  'workshop.replay_available',
  // Book purchaser journey, §10.
  'reader.weekly_reflection',
  // Housekeeping, currently run by their own crons. Registered here so the
  // dispatcher CAN absorb them and free a slot — see the note in the route.
  'retention.purge_signups',
  'retention.purge_narratives',
] as const

export type TaskType = (typeof TASK_TYPES)[number]

const TASK_SET = new Set<string>(TASK_TYPES)

/** Identifiers only. Never content, never anything a person wrote. */
export type TaskPayload = Record<string, string | number>

export interface ScheduledTask {
  id: string
  task_type: TaskType
  payload: TaskPayload
  attempts: number
}

/**
 * A handler's outcome.
 *
 * `skipped` exists because the honest answer is often "there was nothing to
 * do" — a reminder for somebody who already submitted, a replay for a session
 * with no recording. That is success, and recording it as such keeps the
 * failure count meaningful.
 *
 * `blocked` is the one that matters: the work is real but cannot be done
 * because owner-approved content does not exist yet. It is not an error to
 * fix, and it must not be retried into oblivion — it is a queue of things
 * waiting on a person.
 */
export type TaskOutcome =
  | { status: 'done'; detail?: string }
  | { status: 'skipped'; reason: string }
  | { status: 'blocked'; awaiting: string }

export type TaskHandler = (task: ScheduledTask) => Promise<TaskOutcome>

const handlers = new Map<TaskType, TaskHandler>()

export function registerHandler(type: TaskType, handler: TaskHandler): void {
  handlers.set(type, handler)
}

/** Test seam. Clears registrations so suites do not leak into each other. */
export function resetHandlersForTesting(): void {
  handlers.clear()
}

// ---------------------------------------------------------------------------
// Enqueueing
// ---------------------------------------------------------------------------

export interface EnqueueInput {
  type: TaskType
  runAfter: Date
  payload?: TaskPayload
  /**
   * What makes this task unique. One day-5 reminder per registration, one
   * week-3 reflection per reader. Re-enqueueing the same key does nothing.
   */
  idempotencyKey: string
}

/**
 * Schedules a task, once.
 *
 * Returns false when the key already exists, which is the normal outcome of a
 * retry rather than a problem — the whole point of the key is that scheduling
 * twice is harmless.
 */
export async function enqueue(input: EnqueueInput): Promise<boolean> {
  if (!TASK_SET.has(input.type)) {
    throw new Error(`unknown task type: ${input.type}`)
  }

  const rows = await getDb().query<{ id: string }>(
    `INSERT INTO scheduled_tasks (task_type, run_after, payload, idempotency_key)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING id`,
    [input.type, input.runAfter.toISOString(), JSON.stringify(input.payload ?? {}), input.idempotencyKey]
  )
  return rows.length > 0
}

/**
 * The twelve weekly reader reflections, scheduled from a purchase.
 *
 * Twelve rows rather than one recurring job, because each is independently
 * skippable, retryable and cancellable — and because a reader who unsubscribes
 * in week four should lose eight rows, not have a recurring job quietly keep
 * firing.
 *
 * What each week SAYS is owner-approved verbatim manuscript text that does not
 * exist yet. This schedules the sends; the handler refuses to invent them.
 */
export async function scheduleReaderSeries(input: {
  customerId: string
  purchasedAt: Date
  weeks?: number
}): Promise<number> {
  const weeks = input.weeks ?? 12
  let scheduled = 0

  for (let week = 1; week <= weeks; week++) {
    const runAfter = new Date(input.purchasedAt.getTime())
    runAfter.setUTCDate(runAfter.getUTCDate() + week * 7)

    const created = await enqueue({
      type: 'reader.weekly_reflection',
      runAfter,
      payload: { customerId: input.customerId, week },
      idempotencyKey: `reader:${input.customerId}:${week}`,
    })
    if (created) scheduled++
  }
  return scheduled
}

/**
 * The Workshop's fifteen-day window, scheduled from the session date.
 *
 * Day 0 asks for the reflection, day 5 and day 10 remind whoever has not
 * submitted, and day 15 closes the reporting window and generates the
 * snapshot. Replay is not scheduled here: it becomes due when a recording
 * exists, which is an event rather than a date.
 */
export async function scheduleWorkshopWindow(input: {
  sessionId: string
  heldOn: Date
}): Promise<number> {
  const steps: Array<[TaskType, number]> = [
    ['workshop.day0_reflection_request', 0],
    ['workshop.day5_reminder', 5],
    ['workshop.day10_reminder', 10],
    ['workshop.day15_close_and_report', 15],
  ]

  let scheduled = 0
  for (const [type, day] of steps) {
    const runAfter = new Date(input.heldOn.getTime())
    runAfter.setUTCDate(runAfter.getUTCDate() + day)

    const created = await enqueue({
      type,
      runAfter,
      payload: { sessionId: input.sessionId, day },
      idempotencyKey: `workshop:${input.sessionId}:${type}`,
    })
    if (created) scheduled++
  }
  return scheduled
}

// ---------------------------------------------------------------------------
// Running
// ---------------------------------------------------------------------------

export interface DispatchResult {
  claimed: number
  done: number
  skipped: number
  blocked: number
  failed: number
}

/** Attempts before a task stops being retried and waits for a human. */
const MAX_ATTEMPTS = 3

/**
 * Runs everything that is due.
 *
 * Claims each task atomically before running it: the UPDATE ... WHERE status =
 * 'pending' means two overlapping dispatcher runs cannot both take the same
 * row. A scheduler that occasionally runs late is invisible; one that
 * occasionally sends twice is an apology to a customer.
 *
 * A task with no registered handler is left pending rather than failed —
 * that is a deployment gap, not a data problem, and it should resolve itself
 * on the next deploy rather than burning the retry budget.
 */
export async function dispatchDueTasks(limit = 50): Promise<DispatchResult> {
  const db = getDb()
  const result: DispatchResult = { claimed: 0, done: 0, skipped: 0, blocked: 0, failed: 0 }

  const due = await db.query<ScheduledTask>(
    `UPDATE scheduled_tasks
        SET status = 'claimed', claimed_at = now(), attempts = attempts + 1
      WHERE id IN (
        SELECT id FROM scheduled_tasks
         WHERE status = 'pending' AND run_after <= now()
         ORDER BY run_after
         LIMIT $1
         FOR UPDATE SKIP LOCKED
      )
      RETURNING id, task_type, payload, attempts`,
    [limit]
  )

  result.claimed = due.length

  for (const task of due) {
    const handler = handlers.get(task.task_type)

    if (!handler) {
      // Nothing registered. Put it back and try again next run.
      await db.query(
        `UPDATE scheduled_tasks SET status = 'pending', claimed_at = NULL, attempts = attempts - 1
          WHERE id = $1`,
        [task.id]
      )
      result.claimed--
      continue
    }

    try {
      const outcome = await handler(task)

      if (outcome.status === 'blocked') {
        // Waiting on a person, not on a retry. Held pending with the reason
        // recorded, so it runs the moment the content exists.
        await db.query(
          `UPDATE scheduled_tasks
              SET status = 'pending', claimed_at = NULL, attempts = attempts - 1, last_error = $2
            WHERE id = $1`,
          [task.id, `awaiting: ${outcome.awaiting}`]
        )
        result.blocked++
        continue
      }

      await db.query(
        `UPDATE scheduled_tasks SET status = 'done', completed_at = now(), last_error = $2
          WHERE id = $1`,
        [task.id, outcome.status === 'skipped' ? `skipped: ${outcome.reason}` : null]
      )
      if (outcome.status === 'done') result.done++
      else result.skipped++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const exhausted = task.attempts >= MAX_ATTEMPTS

      await db.query(
        `UPDATE scheduled_tasks SET status = $2, claimed_at = NULL, last_error = $3 WHERE id = $1`,
        [task.id, exhausted ? 'failed' : 'pending', message.slice(0, 500)]
      )
      result.failed++
    }
  }

  return result
}

/** What is waiting, and why. For the owner view once II-B's dashboard exists. */
export async function pendingByType(): Promise<Array<{ task_type: string; waiting: number }>> {
  return getDb().query(
    `SELECT task_type, count(*)::int AS waiting
       FROM scheduled_tasks
      WHERE status = 'pending'
      GROUP BY task_type
      ORDER BY task_type`
  )
}

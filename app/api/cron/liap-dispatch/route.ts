import { NextRequest, NextResponse } from 'next/server'
import { isDbConfigured } from '@/lib/db/client'
import { dispatchDueTasks, overdueTasks, pendingByType } from '@/lib/liap/scheduler'
import {
  ensureRetentionOccurrences,
  registerRetentionHandlers,
  retentionDispatchEnabled,
  retentionHealth,
} from '@/lib/liap/retention-tasks'

// ---------------------------------------------------------------------------
// The single scheduled entry point for LIAP workflows. §9.
//
// One route, one question: what is due? Workshop day 0, 5, 10 and 15, replay
// delivery, participant follow-up and the twelve-week reader series all come
// through here, because Vercel's Hobby plan permits two cron jobs and both are
// already spent on privacy purges that cannot be given up.
//
// ── NOT YET IN vercel.json, AND THAT IS DELIBERATE ─────────────────────────
//
// Adding a third entry would exceed the plan's limit and fail the deploy. The
// route exists, is tested and is ready; scheduling it is one of three owner
// decisions:
//
//   (a) upgrade the Vercel plan, or
//   (b) let this dispatcher absorb the two privacy purges and go from two
//       crons to one, freeing a slot, or
//   (c) leave reminder cadence to the email platform and use this only for
//       report generation.
//
// Option (b) is now built and tested — see lib/liap/retention-tasks.ts — and
// switched off. LIAP_DISPATCH_RETENTION gates it, both purge crons remain in
// vercel.json untouched, and while the switch is off this route will not seed
// a retention occurrence or delete a row. That is the state the owner asked
// for: the design proved, the live schedule unchanged.
//
// Until then nothing is scheduled, which is the correct resting state: no
// workflow currently has owner-approved content to send.
//
// Same authorization shape as the two existing crons — CRON_SECRET, failing
// closed, 404 rather than 403 so the route is not discoverable by probing.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Handlers are registered at module load, whether or not the switch is on. A
// registered handler that refuses to act is safe; an unregistered one leaves
// tasks pending forever, and "pending forever" is how a retention job dies
// without anybody noticing.
registerRetentionHandlers()

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron/liap-dispatch] CRON_SECRET is not set; refusing to run')
    return NextResponse.json({ error: 'Not configured.' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  if (!isDbConfigured()) {
    console.error('[cron/liap-dispatch] no database configured; nothing dispatched')
    return NextResponse.json({ error: 'No database.' }, { status: 503 })
  }

  const now = new Date()

  // A dry run reports what is waiting without running any of it — useful
  // before the first real dispatch, and the only safe way to look at a queue
  // whose handlers send customer email. It also carries the health report,
  // which is what makes a dry run the right first move after a cutover.
  if (new URL(req.url).searchParams.get('dry') === '1') {
    return NextResponse.json({
      dryRun: true,
      retentionDispatch: retentionDispatchEnabled() ? 'enabled' : 'disabled (cron owns the purges)',
      waiting: await pendingByType(),
      overdue: await overdueTasks(),
      retention: await retentionHealth(now),
    })
  }

  try {
    // Seed before claiming, so today's occurrence is due in the same run that
    // will pick it up. Idempotent: the date is the key, so this is a no-op on
    // every run after the first of the day.
    if (retentionDispatchEnabled()) {
      const seeded = await ensureRetentionOccurrences({ from: now })
      if (seeded > 0) console.log(`[cron/liap-dispatch] seeded ${seeded} retention occurrence(s)`)
    }

    const result = await dispatchDueTasks()
    console.log(
      `[cron/liap-dispatch] claimed ${result.claimed}: ${result.done} done, ` +
        `${result.skipped} skipped, ${result.blocked} awaiting content, ${result.failed} failed`
    )

    // The observability a Vercel cron gives away for free and a dispatcher
    // does not. A purge that quietly stops is the failure mode of this whole
    // consolidation, so it is shouted about on every run rather than left for
    // somebody to notice.
    const health = await retentionHealth(now)
    for (const job of health.filter((h) => h.stale)) {
      console.error(
        `[cron/liap-dispatch] RETENTION STALE — ${job.label} last succeeded ` +
          `${job.lastSuccessAt ?? 'never'}. ${job.promise}`
      )
    }

    return NextResponse.json({ ...result, retention: health })
  } catch (err) {
    console.error('[cron/liap-dispatch] dispatch failed:', err)
    return NextResponse.json({ error: 'Dispatch failed.' }, { status: 500 })
  }
}

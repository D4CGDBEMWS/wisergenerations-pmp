import { NextRequest, NextResponse } from 'next/server'
import { isDbConfigured } from '@/lib/db/client'
import { dispatchDueTasks, pendingByType } from '@/lib/liap/scheduler'

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
//   (b) register the two purges as handlers here and go from two crons to
//       one, freeing a slot — the scheduler already reserves the task types,
//       but changing how a live privacy commitment runs is not something to
//       do without being asked, or
//   (c) leave reminder cadence to the email platform and use this only for
//       report generation.
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

  // A dry run reports what is waiting without running any of it — useful
  // before the first real dispatch, and the only safe way to look at a queue
  // whose handlers send customer email.
  if (new URL(req.url).searchParams.get('dry') === '1') {
    return NextResponse.json({ dryRun: true, waiting: await pendingByType() })
  }

  try {
    const result = await dispatchDueTasks()
    console.log(
      `[cron/liap-dispatch] claimed ${result.claimed}: ${result.done} done, ` +
        `${result.skipped} skipped, ${result.blocked} awaiting content, ${result.failed} failed`
    )
    return NextResponse.json(result)
  } catch (err) {
    console.error('[cron/liap-dispatch] dispatch failed:', err)
    return NextResponse.json({ error: 'Dispatch failed.' }, { status: 500 })
  }
}

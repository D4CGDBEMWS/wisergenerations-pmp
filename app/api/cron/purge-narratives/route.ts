import { NextRequest, NextResponse } from 'next/server'
import { purgeExpiredNarratives } from '@/lib/liap/retention'
import { NARRATIVE_RETENTION_DAYS } from '@/lib/liap/assessment-service'
import { isDbConfigured } from '@/lib/db/client'

// ---------------------------------------------------------------------------
// §27. Deletes assessment free text 90 days after completion.
//
// Runs regardless of FEATURE_LIAP. If the flag is ever turned off with
// assessments already taken, the retention promise still has to be kept — a
// purge that stops when a feature flag flips would leave narrative sitting in
// the database indefinitely, which is the exact outcome §27 exists to prevent.
//
// Same authorization shape as the signup purge: CRON_SECRET, failing closed.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron/purge-narratives] CRON_SECRET is not set; refusing to run')
    return NextResponse.json({ error: 'Not configured.' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  if (!isDbConfigured()) {
    console.error('[cron/purge-narratives] no database configured; nothing purged')
    return NextResponse.json({ error: 'No database.' }, { status: 503 })
  }

  const dryRun = new URL(req.url).searchParams.get('dry') === '1'

  try {
    const result = await purgeExpiredNarratives({ dryRun })
    console.log(
      `[cron/purge-narratives] ${dryRun ? 'would delete' : 'deleted'} ${result.narratives} ` +
        `narrative row(s) across ${result.assessments} assessment(s)`
    )
    return NextResponse.json({ ok: true, retentionDays: NARRATIVE_RETENTION_DAYS, ...result })
  } catch (err) {
    console.error('[cron/purge-narratives] FAILED — retention promise not honoured this run:', err)
    return NextResponse.json({ error: 'Purge failed.' }, { status: 500 })
  }
}

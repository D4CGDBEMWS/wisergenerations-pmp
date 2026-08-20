import { NextRequest, NextResponse } from 'next/server'
import { purgeStaleSignups, SIGNUP_RETENTION_DAYS } from '@/lib/retention'
import { isDbConfigured } from '@/lib/db/client'

// ---------------------------------------------------------------------------
// The scheduled half of the retention promise.
//
// A script someone remembers to run is not a retention policy; the commitment
// in section 5 of the privacy policy is continuous, so the enforcement has to
// be too. Vercel Cron calls this daily — see vercel.json.
//
// Daily rather than monthly because the promise is "within 180 days". A
// monthly sweep would mean a record could sit for 210 days and still be
// reported as compliant.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Vercel Cron signs its requests with CRON_SECRET when that variable is set.
 * Without the check this route would be an unauthenticated delete endpoint —
 * narrow in what it can destroy, but still a stranger's button.
 *
 * Fails closed: no secret configured means nobody can invoke it, rather than
 * everybody. A retention job that silently stops running is a compliance
 * problem; one that anyone on the internet can trigger is a worse one.
 */
function authorize(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron/purge-signups] CRON_SECRET is not set; refusing to run')
    return NextResponse.json({ error: 'Not configured.' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }
  return null
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = authorize(req)
  if (denied) return denied

  if (!isDbConfigured()) {
    console.error('[cron/purge-signups] no database configured; nothing purged')
    return NextResponse.json({ error: 'No database.' }, { status: 503 })
  }

  // ?dry=1 reports what would go without touching anything, so the first run
  // after deployment can be inspected rather than trusted.
  const dryRun = new URL(req.url).searchParams.get('dry') === '1'

  try {
    const result = await purgeStaleSignups({ dryRun })
    console.log(
      `[cron/purge-signups] ${dryRun ? 'would delete' : 'deleted'} ${result.deleted} ` +
        `record(s) older than ${SIGNUP_RETENTION_DAYS} days`
    )
    return NextResponse.json({ ok: true, retentionDays: SIGNUP_RETENTION_DAYS, ...result })
  } catch (err) {
    // Loudly. A retention job that fails quietly leaves the business believing
    // it is honouring a published commitment that it is not.
    console.error('[cron/purge-signups] FAILED — retention promise not honoured this run:', err)
    return NextResponse.json({ error: 'Purge failed.' }, { status: 500 })
  }
}

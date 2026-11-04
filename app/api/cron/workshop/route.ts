import { NextRequest, NextResponse } from 'next/server'
import { isDbConfigured } from '@/lib/db/client'
import { sendDueReminders, sendDueReplays, sendWorkshopReport } from '@/lib/liap/workshop-service'

// ---------------------------------------------------------------------------
// Daily workshop job (vercel.json, 14:00 UTC = 9:00 am Eastern in winter):
// the morning-of reminder, replay + survey emails for sessions whose replay
// link has been added, and on Mondays the owner's workshop report.
// Same authorisation as the other cron jobs: fails closed without CRON_SECRET.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'Not configured.' }, { status: 503 })
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }
  if (!isDbConfigured()) return NextResponse.json({ error: 'No database.' }, { status: 503 })

  const now = new Date()
  const reminders = await sendDueReminders(now).catch((e) => (console.error('[cron/workshop] reminders', e), 0))
  const replays = await sendDueReplays(now).catch((e) => (console.error('[cron/workshop] replays', e), 0))
  const isMonday = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' }) === 'Monday'
  const report = isMonday ? await sendWorkshopReport().catch(() => false) : false
  console.log(`[cron/workshop] reminders=${reminders} replays=${replays} report=${report}`)
  return NextResponse.json({ reminders, replays, report })
}

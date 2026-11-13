import { NextRequest, NextResponse } from 'next/server'
import { isDbConfigured } from '@/lib/db/client'
import { sendShippingList } from '@/lib/liap/shipping-report'

// ---------------------------------------------------------------------------
// Weekly book shipping list. Vercel Cron calls this every Monday (vercel.json:
// 13:00 UTC = 8:00 am Eastern in winter). Owner ruling 2026-10-30.
// Same authorisation as the other cron jobs: fails closed without CRON_SECRET.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorize(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron/shipping-list] CRON_SECRET is not set; refusing to run')
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
  if (!isDbConfigured()) return NextResponse.json({ error: 'No database.' }, { status: 503 })

  const result = await sendShippingList()
  console.log(`[cron/shipping-list] ${result.count} unshipped; email ${result.sent ? 'sent' : 'NOT sent'}`)
  return NextResponse.json(result, { status: result.sent ? 200 : 500 })
}

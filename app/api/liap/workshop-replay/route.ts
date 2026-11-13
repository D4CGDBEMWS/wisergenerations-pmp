import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { isEnabled } from '@/lib/flags'
import { findSession } from '@/lib/liap/workshop'
import { ownerKeyValid, saveReplay, sendDueReplays } from '@/lib/liap/workshop-service'

// Owner-only: save a session's replay link, then send any replays now due.
// Authorised by the private WORKSHOP_ADMIN_KEY (sensitive env var).

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isEnabled('LIAP')) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock
  const rateBlock = await rateLimit(req, 'liap-workshop-replay', { limit: 20, windowMs: 10 * 60_000 })
  if (rateBlock) return rateBlock

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!ownerKeyValid(body?.key)) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  const s = findSession(body?.session)
  if (!s) return NextResponse.json({ error: 'Choose a session.' }, { status: 400 })
  let url: URL
  try {
    url = new URL(String(body?.replayUrl ?? '').trim())
  } catch {
    return NextResponse.json({ error: 'That does not look like a link. Paste the full replay link, starting with https://' }, { status: 400 })
  }
  if (url.protocol !== 'https:') return NextResponse.json({ error: 'The replay link must start with https://' }, { status: 400 })
  await saveReplay(s.key, url.toString())
  const sent = await sendDueReplays(new Date())
  return NextResponse.json({ ok: true, sent })
}

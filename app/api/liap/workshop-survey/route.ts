import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { isEnabled } from '@/lib/flags'
import { registrationForSurvey, saveSurvey } from '@/lib/liap/workshop-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const NEXT_STEPS = new Set(['retreat', 'coaching', 'group', 'not_now'])

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isEnabled('LIAP')) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock
  const rateBlock = await rateLimit(req, 'liap-workshop-survey', { limit: 10, windowMs: 10 * 60_000 })
  if (rateBlock) return rateBlock

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const reg = await registrationForSurvey(String(body?.token ?? ''))
  if (!reg) return NextResponse.json({ error: 'This survey link is not valid.' }, { status: 404 })
  const rating = Number(body?.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Please choose a rating from 1 to 5.' }, { status: 400 })
  }
  const nextStep = typeof body?.nextStep === 'string' && NEXT_STEPS.has(body.nextStep) ? body.nextStep : ''
  const helpful = typeof body?.mostHelpful === 'string' ? body.mostHelpful.trim() : ''
  await saveSurvey(reg.id, rating, helpful, nextStep)
  return NextResponse.json({ ok: true })
}

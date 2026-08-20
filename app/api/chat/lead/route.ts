import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { verifyTurnstile } from '@/lib/turnstile'
import { upsertSubscriber } from '@/lib/mailchimp'

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// POST /api/chat/lead
//
// Lead capture from inside the AI Guide. Writes straight to Mailchimp via the
// shared helper rather than proxying another internal route, so the origin and
// rate-limit guards actually apply to this request.
//
// Tags applied (see WISER_GENERATIONS_AI_AGENT_GUIDE.md):
//   ai-chat-lead      -- always, so AI leads are identifiable in Mailchimp
//   course-interest / coaching-interest / course-and-coaching / ebook-lead /
//   coaching-giveaway / general-inquiry   -- from the AI's read of the conversation
//   high-intent       -- when the visitor wants to start within 30 days
// ---------------------------------------------------------------------------

const NAME_MAX = 80
const EMAIL_MAX = 254
const FREE_TEXT_MAX = 500

const INTEREST_TAGS: Record<string, string[]> = {
  course: ['course-interest'],
  coaching: ['coaching-interest'],
  course_and_coaching: ['course-and-coaching', 'course-interest', 'coaching-interest'],
  ebook: ['ebook-lead'],
  giveaway: ['coaching-giveaway'],
  corporate: ['course-interest', 'corporate-interest'],
  veterans: ['course-interest', 'veterans-interest'],
  general: ['general-inquiry'],
}

const HIGH_INTENT_TIMEFRAMES = new Set(['right_away', 'within_30_days'])

function sanitize(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim()
}

export async function POST(req: NextRequest) {
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  // Counts every request, not just successful ones, so a scripted submitter
  // cannot burn through validation failures for free. Set to 10 rather than a
  // tighter number because typo corrections legitimately consume attempts —
  // a visitor fixing their email address must not get locked out.
  const rateBlock = await rateLimit(req, 'chat-lead', { limit: 10, windowMs: 10 * 60_000 })
  if (rateBlock) return rateBlock

  let body: {
    firstName?: string
    email?: string
    interest?: string
    goal?: string
    challenge?: string
    timeframe?: string
    sourcePage?: string
    turnstileToken?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const turnstile = await verifyTurnstile(body.turnstileToken, req)
  if (!turnstile.success) {
    return NextResponse.json(
      { error: 'Security check failed. Please refresh and try again.' },
      { status: 400 }
    )
  }

  const firstName = sanitize(body.firstName ?? '')
  const email = sanitize(body.email ?? '').toLowerCase()

  if (!firstName) {
    return NextResponse.json({ error: 'Please enter your first name.' }, { status: 400 })
  }
  if (!email) {
    return NextResponse.json({ error: 'Please enter your email address.' }, { status: 400 })
  }
  if (firstName.length > NAME_MAX || email.length > EMAIL_MAX) {
    return NextResponse.json({ error: 'One or more fields are too long.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'That email address does not look right. Please check it and try again.' },
      { status: 400 }
    )
  }

  // Optional context the AI gathered. Kept short and never echoed back.
  const goal = sanitize(body.goal ?? '').slice(0, FREE_TEXT_MAX)
  const challenge = sanitize(body.challenge ?? '').slice(0, FREE_TEXT_MAX)
  const timeframe = sanitize(body.timeframe ?? '').slice(0, 40)
  const sourcePage = sanitize(body.sourcePage ?? '').slice(0, 200)

  const interest = typeof body.interest === 'string' ? body.interest : 'general'
  const tags = [
    'ai-chat-lead',
    ...(INTEREST_TAGS[interest] ?? INTEREST_TAGS.general!),
    ...(HIGH_INTENT_TIMEFRAMES.has(timeframe) ? ['high-intent'] : []),
  ]

  const result = await upsertSubscriber({ email, firstName, tags })

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status })
  }

  // Structural logging only — no email address, no name, no conversation text.
  console.info('[/api/chat/lead] lead captured', {
    interest,
    timeframe: timeframe || null,
    hasGoal: goal.length > 0,
    hasChallenge: challenge.length > 0,
    sourcePage: sourcePage || null,
    delivered: !result.skipped,
  })

  return NextResponse.json({ ok: true })
}

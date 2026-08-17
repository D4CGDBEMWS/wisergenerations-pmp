import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { verifyTurnstile } from '@/lib/turnstile'
import { upsertSubscriber } from '@/lib/mailchimp'
import { GIVEAWAY, isGiveawayActive } from '@/lib/site-config'
import { campaignKey, recordEntry } from '@/lib/giveaway-store'

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// POST /api/giveaway
//
// Records an entry in the Free Coaching Session Giveaway.
//
// Order of operations matters: the entry is claimed in Redis FIRST, because
// SADD returning 0 is a race-free duplicate signal. Only a genuinely new
// entrant is then written to Mailchimp.
//
// Marketing consent is captured separately from entry, and entry is never
// conditioned on it — the tag differs depending on what the entrant agreed to.
// ---------------------------------------------------------------------------

const NAME_MAX = 80
const EMAIL_MAX = 254

function sanitize(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim()
}

export async function POST(req: NextRequest) {
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'giveaway', { limit: 10, windowMs: 10 * 60_000 })
  if (rateBlock) return rateBlock

  // A closed giveaway must not silently accept entries that will never be
  // drawn. This is checked server-side so a stale page cannot post into it.
  if (!isGiveawayActive()) {
    return NextResponse.json(
      { error: 'This giveaway is not currently open for entries.' },
      { status: 409 }
    )
  }

  const deadline = new Date(GIVEAWAY.entryDeadline)
  if (!Number.isNaN(deadline.getTime()) && Date.now() > deadline.getTime()) {
    return NextResponse.json(
      { error: 'Entries for this giveaway have closed. Watch your email for the winner announcement.' },
      { status: 409 }
    )
  }

  let body: {
    firstName?: string
    lastName?: string
    email?: string
    marketingConsent?: boolean
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
  const lastName = sanitize(body.lastName ?? '')
  const email = sanitize(body.email ?? '').toLowerCase()

  if (!firstName || !lastName || !email) {
    return NextResponse.json(
      { error: 'Please enter your first name, last name, and email address.' },
      { status: 400 }
    )
  }
  if (firstName.length > NAME_MAX || lastName.length > NAME_MAX || email.length > EMAIL_MAX) {
    return NextResponse.json({ error: 'One or more fields are too long.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'That email address does not look right. Please check it and try again.' },
      { status: 400 }
    )
  }

  const marketingConsent = body.marketingConsent === true
  const campaign = campaignKey(GIVEAWAY.entryDeadline)

  const { duplicate } = await recordEntry(campaign, {
    firstName,
    lastName,
    email,
    marketingConsent,
    enteredAt: new Date().toISOString(),
    sourcePage: 'giveaway',
  })

  if (duplicate) {
    // Not an error from the entrant's point of view — they are already in.
    return NextResponse.json({ ok: true, alreadyEntered: true })
  }

  const result = await upsertSubscriber({
    email,
    firstName,
    lastName,
    tags: marketingConsent
      ? ['coaching-giveaway', 'giveaway-marketing-opt-in']
      : ['coaching-giveaway'],
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status })
  }

  console.info('[/api/giveaway] entry recorded', {
    campaign,
    marketingConsent,
    delivered: !result.skipped,
  })

  return NextResponse.json({ ok: true, alreadyEntered: false })
}

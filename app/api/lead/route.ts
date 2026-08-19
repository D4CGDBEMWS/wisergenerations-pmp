import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { upsertSubscriber } from '@/lib/mailchimp'

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// POST /api/lead
//
// Email capture for the PMP Practice Studio free-sample gate. The studio is a
// static file served same-origin at /studio/pmp-practice-studio.html and
// iframed by /free-practice and /exam-simulator; it sets
// EMAIL_ENDPOINT = "/api/lead" and POSTs { email, source }.
//
// This route previously forwarded to /api/subscribe over HTTP while setting
// its own `origin` header. That made it an unauthenticated bypass of the
// origin guard every other POST route relies on: anything could push
// arbitrary addresses into the Mailchimp audience through a trusted internal
// hop. It now applies the guards itself and writes to Mailchimp directly, so
// there is no internal request to forge a header on.
//
// The studio ignores this response body and swallows failures so a network
// problem never blocks a learner, so the response shape is not load-bearing.
// ---------------------------------------------------------------------------

const EMAIL_MAX = 254
const DEFAULT_SOURCE = 'practice-studio-free-sample'

// An explicit allowlist rather than a character-class check. The source is
// echoed straight into a Mailchimp tag, and a permissive check would let a
// caller tag themselves `customer` — the tag the Stripe webhook applies to
// genuine purchasers — and corrupt audience segmentation. Add a value here
// when a new studio entry point is built.
const ALLOWED_SOURCES = new Set([
  'practice-studio-free-sample',
  'exam-simulator',
])

// The gate is a one-time unlock per visitor, so a low ceiling is plenty.
// Kept above 1 so shared/NAT'd IPs (a corporate office, a school) are not
// locked out by a colleague who unlocked the sample first.
const RATE_LIMIT = { limit: 5, windowMs: 10 * 60_000 }

export async function POST(req: NextRequest) {
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'lead', RATE_LIMIT)
  if (rateBlock) return rateBlock

  let body: { email?: string; source?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }
  if (email.length > EMAIL_MAX) {
    return NextResponse.json({ error: 'Email address is too long.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  // Unrecognized sources fall back to the studio's own default rather than
  // being rejected, so a future change to the static studio file can never
  // silently drop leads on the floor.
  const rawSource = (body.source ?? '').trim().toLowerCase()
  const source = ALLOWED_SOURCES.has(rawSource) ? rawSource : DEFAULT_SOURCE

  const result = await upsertSubscriber({ email, tags: [source] })

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status })
  }

  return NextResponse.json({ ok: true })
}

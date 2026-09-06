import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { verifyTurnstile } from '@/lib/turnstile'
import { isEnabled } from '@/lib/flags'
import { claimBookCode } from '@/lib/liap/book-codes'
import { tagLiapContact } from '@/lib/liap/crm'

// ---------------------------------------------------------------------------
// Claiming the access code printed inside the book.
//
// Owner-approved rule, 4 September 2026: one eligible new book = one unique
// access code = one registered reader.
//
// ── WHY EMAIL AND CODE ARRIVE TOGETHER ─────────────────────────────────────
//
// The obvious design — sign in first, then claim — cannot work, and the
// reason is the gift case. Sign-in requires an entitlement, an entitlement is
// what the code grants, so a recipient who has never bought anything would be
// locked out of the door they were given the key to. The code and the address
// therefore arrive in one request, and the code is what establishes standing.
//
// ── WHY BINDING ON SUBMISSION IS SAFE ──────────────────────────────────────
//
// A claim binds the code to an address; it does not sign anybody in. Reaching
// the assessment still means receiving a magic link at that address through
// the sign-in page that already ships. So a code typed against an address the
// typist does not control — by malice or by typo — gains them nothing, and
// support can release the claim against an audit row.
//
// ── WHY EVERY FAILURE LOOKS THE SAME ───────────────────────────────────────
//
// Unknown, already claimed and voided all return the same body. Telling them
// apart would make this endpoint an oracle: an attacker could confirm which
// codes exist by reading which refusal came back, and confirmation is most of
// the work in guessing anything.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Tighter than the assessment's limit and matched to verify-preorder: this is
// the one endpoint where a wrong answer is worth retrying at volume, so the
// budget is small enough that 80 bits of entropy never comes under pressure.
const RATE_LIMIT = { limit: 5, windowMs: 30 * 60_000 }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** One body for every refusal, so the endpoint cannot be used to enumerate. */
const UNAVAILABLE = {
  error:
    'We could not register that code. Please check it against the card in your book, ' +
    'or contact info@wisergenerations.com and we will help.',
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // The flag gates this exactly as it gates every other LIAP route: while the
  // section is off, the endpoint does not exist to a prober.
  if (!isEnabled('LIAP')) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'liap-claim-code', RATE_LIMIT)
  if (rateBlock) return rateBlock

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const turnstile = await verifyTurnstile(String(body.turnstileToken ?? ''), req)
  if (!turnstile.success) {
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  const name = String(body.name ?? '').trim().slice(0, 120)
  const code = String(body.code ?? '').trim().slice(0, 64)

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (!code) {
    return NextResponse.json(
      { error: 'Please enter the access code from your book.' },
      { status: 400 }
    )
  }

  try {
    const outcome = await claimBookCode({ code, email, name: name || null })

    if (outcome.status === 'unavailable') {
      // 400, not 404: a 404 here would say "no such code", which is exactly
      // the distinction this endpoint refuses to make.
      return NextResponse.json(UNAVAILABLE, { status: 400 })
    }

    if (outcome.status === 'already_entitled') {
      // No code was consumed. Said plainly so a reader who already has access
      // does not try again with a second copy's card and burn that one too.
      return NextResponse.json({
        ok: true,
        alreadyEntitled: true,
        message:
          'This email already has access to the Life Project-Ready™ Assessment. ' +
          'Sign in and your assessment is waiting — your code has not been used up.',
      })
    }

    // Best effort, and after the claim: a CRM hiccup must not cost somebody
    // the access they just legitimately registered.
    await tagLiapContact(email, ['liap_interest']).catch(() => {})

    return NextResponse.json({
      ok: true,
      message:
        'Your book is registered. Sign in with this email address and we will send you a ' +
        'secure link to your assessment.',
    })
  } catch (err) {
    // The code is never in the payload we log — claimBookCode takes it and
    // this handler holds only the outcome.
    console.error('[liap/claim-code] claim failed:', err)
    return NextResponse.json(
      { error: 'We could not register that just now. Please try again in a moment.' },
      { status: 503 }
    )
  }
}

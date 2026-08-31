import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { verifyTurnstile } from '@/lib/turnstile'
import { isEnabled } from '@/lib/flags'
import { getDb } from '@/lib/db/client'
import { recordAuditEvent } from '@/lib/audit'
import { tagLiapContact } from '@/lib/liap/crm'

// ---------------------------------------------------------------------------
// External retailer preorder claims. §25.
//
// A submitted order number is NOT trusted and grants nothing. The row lands as
// 'pending' and a human approves it; approval is what grants the entitlement,
// through the same fulfilment path a Stripe preorder uses.
//
// That is the whole security model here, and it is deliberate: any automatic
// rule based on a number the claimant types would be trivially farmed. §25
// explicitly accepts manual approval for Phase I.
//
// The unique index on (retailer, order_ref) means the same receipt cannot be
// claimed twice, including by two different people.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 5, windowMs: 30 * 60_000 }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RETAILERS = new Set(['amazon', 'barnes_noble', 'bookshop', 'independent', 'other'])

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isEnabled('LIAP')) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'liap-verify-preorder', RATE_LIMIT)
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
  // Collected separately, and both required. Splitting a single "name" string
  // on a space to fill a CRM merge field guesses wrongly for anyone whose name
  // does not contain exactly one, and the guess is invisible once stored.
  const firstName = String(body.firstName ?? '').trim().slice(0, 60)
  const lastName = String(body.lastName ?? '').trim().slice(0, 60)
  // Stored as before, because preorder_verifications.name is one column and
  // the owner asked for no migration where the data model already suffices.
  // The structured pair is what reaches the CRM.
  const name = [firstName, lastName].filter(Boolean).join(' ').slice(0, 120)
  const retailer = String(body.retailer ?? '').trim()
  const orderRef = String(body.orderRef ?? '').trim().slice(0, 120)

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: 'Please enter your first and last name.' },
      { status: 400 }
    )
  }
  if (!RETAILERS.has(retailer)) {
    return NextResponse.json({ error: 'Please choose where you preordered.' }, { status: 400 })
  }
  if (orderRef.length < 4) {
    return NextResponse.json({ error: 'Please enter your order or confirmation number.' }, { status: 400 })
  }

  try {
    const rows = await getDb().query<{ id: string }>(
      `INSERT INTO preorder_verifications (email, name, retailer, order_ref, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (lower(retailer), lower(order_ref)) DO NOTHING
       RETURNING id`,
      [email, name || null, retailer, orderRef]
    )

    // A duplicate claim gets the same answer as a first one. Telling the
    // caller "already claimed" would turn this into an oracle for testing
    // which order numbers exist.
    if (rows[0]) {
      await recordAuditEvent({
        eventType: 'liap.preorder_verification_submitted',
        metadata: { source_type: 'retailer', reason: retailer },
      })
      // Book INTEREST, never Book Purchaser. A preorder verification is a
      // self-reported claim about a purchase made somewhere this application
      // cannot see, and it stays 'pending' in preorder_verifications until a
      // human reviews it. Tagging it as a purchase would let an unverified
      // form submission produce the same marketing state as a paid Stripe
      // session, which is the one thing this table must never do.
      await tagLiapContact(email, ['liap_interest'], { firstName, lastName })
    }
  } catch (err) {
    console.error('[liap/verify-preorder] save failed:', err)
    return NextResponse.json(
      { error: 'We could not submit that just now. Please try again in a moment.' },
      { status: 503 }
    )
  }

  return NextResponse.json({ ok: true })
}

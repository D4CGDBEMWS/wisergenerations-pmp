import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { verifyTurnstile } from '@/lib/turnstile'
import { isEnabled } from '@/lib/flags'
import { getDb } from '@/lib/db/client'
import { upsertCustomer } from '@/lib/customers'
import { recordAuditEvent } from '@/lib/audit'
import { tagLiapContact } from '@/lib/liap/crm'
import { partnerFromSubmission, recordAttribution } from '@/lib/liap/attribution'

// ---------------------------------------------------------------------------
// Retreat, group and sponsor enquiries — the top of the managed funnel.
//
// The retreat is a premium managed experience and deliberately has no public
// "Buy Now" path. This route is the whole of the public surface: it records
// that somebody is interested, and it does nothing else. It grants no
// entitlement, confirms no place, quotes no price and promises no date.
// Everything after this is a human deciding.
//
// ── WHY THIS ONE TAKES AN EMAIL FROM THE BODY ──────────────────────────────
//
// The sibling route /api/liap/interest refuses to, because it runs behind a
// session and taking an address from the request would turn it into an open
// mailing-list injection endpoint. This route cannot do that: it is reached
// from a QR code in a barbershop by somebody who has never visited the site,
// and requiring an account first would empty the funnel.
//
// So the defences are the ones that work without an account — a CAPTCHA, a
// tight rate limit, and the same-origin guard — and the blast radius is kept
// small by what a successful submission actually achieves, which is a row
// marked 'new' awaiting review.
//
// ── WHAT IS DELIBERATELY ABSENT ────────────────────────────────────────────
//
// No price is returned. No group discount is calculated — no discount formula
// exists anywhere in this system, and group pricing is a number an owner
// records against a specific proposal. group_size is triage and display only.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 5, windowMs: 30 * 60_000 }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INQUIRY_TYPES = new Set(['individual', 'group', 'sponsor'])

/** Free text is bounded so a form post cannot become a storage attack. */
const LIMITS = { name: 120, email: 254, phone: 40, organization: 160, message: 2000 }

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isEnabled('LIAP_RETREAT')) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'liap-retreat-interest', RATE_LIMIT)
  if (rateBlock) return rateBlock

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const captcha = await verifyTurnstile(body.turnstileToken as string | undefined, req)
  if (!captcha.success) {
    return NextResponse.json({ error: 'Please complete the verification.' }, { status: 400 })
  }

  const email = text(body.email, LIMITS.email)?.toLowerCase() ?? ''
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const inquiryType = String(body.inquiryType ?? 'individual')
  if (!INQUIRY_TYPES.has(inquiryType)) {
    return NextResponse.json({ error: 'Unknown enquiry type.' }, { status: 400 })
  }

  const name = text(body.name, LIMITS.name)
  const phone = text(body.phone, LIMITS.phone)
  const organization = text(body.organization, LIMITS.organization)
  const message = text(body.message, LIMITS.message)

  // Triage only. Bounded because it is a number a stranger typed, and a
  // group of four billion is not a thing anyone needs to store.
  const rawSize = Number(body.groupSize)
  const groupSize =
    Number.isInteger(rawSize) && rawSize > 0 && rawSize <= 500 ? rawSize : null

  // The partner code came from the landing page URL, which came from the QR
  // code. An unrecognised code attributes to nobody and costs the enquirer
  // nothing — a bad code must never lose somebody's enquiry.
  const partner = await partnerFromSubmission(body.partner)

  try {
    // A customer record makes them contactable and gives consent something to
    // attach to. It grants nothing: entitlements are a separate table and
    // nothing here writes to it.
    const customer = await upsertCustomer({ email, name })

    await getDb().query(
      `INSERT INTO retreat_leads
         (email, name, phone, inquiry_type, group_size, organization, message,
          partner_id, customer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (lower(email), inquiry_type) DO UPDATE
          SET name         = COALESCE(EXCLUDED.name, retreat_leads.name),
              phone        = COALESCE(EXCLUDED.phone, retreat_leads.phone),
              group_size   = COALESCE(EXCLUDED.group_size, retreat_leads.group_size),
              organization = COALESCE(EXCLUDED.organization, retreat_leads.organization),
              message      = COALESCE(EXCLUDED.message, retreat_leads.message),
              partner_id   = COALESCE(retreat_leads.partner_id, EXCLUDED.partner_id),
              updated_at   = now()`,
      [
        email,
        name,
        phone,
        inquiryType,
        groupSize,
        organization,
        message,
        partner?.id ?? null,
        customer.id,
      ]
    )

    // Marketing consent is asked separately and defaults to no. Enquiring
    // about a retreat is not agreeing to a newsletter.
    if (body.marketingConsent === true) {
      await getDb().query(
        `INSERT INTO consents (customer_id, consent_type, version, granted, source)
         VALUES ($1, 'marketing', $2, true, 'retreat_interest')`,
        [customer.id, String(body.consentVersion ?? 'unversioned')]
      )
    }

    await recordAttribution({
      partner,
      eventType: inquiryType === 'sponsor' ? 'sponsor_inquiry' : 'retreat_interest',
      customerId: customer.id,
    })

    // The audit allow-list strips anything not explicitly permitted, so the
    // message text cannot leak into this row even by accident.
    await recordAuditEvent({
      eventType: 'liap.retreat_interest',
      customerId: customer.id,
      metadata: { reason: inquiryType },
    })
  } catch (err) {
    console.error('[liap/retreat-interest] save failed:', err)
    return NextResponse.json(
      { error: 'We could not record that just now. Please try again shortly.' },
      { status: 503 }
    )
  }

  // Tagging is not fatal: a CRM outage must not lose a lead the business
  // already has safely in its own database.
  await tagLiapContact(
    email,
    inquiryType === 'sponsor' ? ['liap_sponsor_interest'] : ['liap_retreat_interest']
  )

  return NextResponse.json({ ok: true })
}

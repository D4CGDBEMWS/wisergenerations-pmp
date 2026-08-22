import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { isEnabled } from '@/lib/flags'
import { queryOne } from '@/lib/db/client'
import { recordAuditEvent } from '@/lib/audit'
import { findByResultToken, rebuildReport } from '@/lib/liap/assessment-service'
import { RESULTS_SUBJECT, resultsEmailHtml, resultsEmailText } from '@/lib/liap/results-email'
import { positionTag, tagLiapContact } from '@/lib/liap/crm'

// ---------------------------------------------------------------------------
// Sends the plan to the address on the account. §23, §24.
//
// The address is NEVER taken from the request. The token identifies the
// assessment, the assessment identifies the customer, and the customer's own
// email is looked up server-side — otherwise this endpoint would mail
// somebody's plan wherever the caller asked, which is precisely the leak the
// opaque URL exists to prevent.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 5, windowMs: 15 * 60_000 }

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isEnabled('LIAP')) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'liap-results-email', RATE_LIMIT)
  if (rateBlock) return rateBlock

  let token = ''
  try {
    token = String(((await req.json()) as { token?: string }).token ?? '')
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const found = await findByResultToken(token)
  if (!found) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const customer = await queryOne<{ email: string }>(
    `SELECT email FROM customers WHERE id = $1`,
    [found.customerId]
  )
  if (!customer?.email) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const report = await rebuildReport(found.id)
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wisergenerations.com'
  const url = `${origin}/living-is-a-project/results/${token}`

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.MAGIC_LINK_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'info@wisergenerations.com'

  if (!apiKey) {
    // §35: the customer must not be told it was sent when it was not. Their
    // plan is still on screen and still reachable by the same link.
    console.error('[liap/results/email] RESEND_API_KEY not set; plan not sent')
    return NextResponse.json(
      { error: 'Email is not available right now. Your plan is saved at this link.' },
      { status: 503 }
    )
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `Wiser Generations <${from}>`,
        to: [customer.email],
        subject: RESULTS_SUBJECT,
        html: resultsEmailHtml(report, url),
        text: resultsEmailText(report, url),
      }),
    })

    if (!res.ok) {
      console.error(`[liap/results/email] Resend rejected the send: HTTP ${res.status}`)
      return NextResponse.json(
        { error: 'We could not send it just now. Your plan is saved at this link.' },
        { status: 502 }
      )
    }
  } catch (err) {
    console.error('[liap/results/email] send threw:', err)
    return NextResponse.json(
      { error: 'We could not send it just now. Your plan is saved at this link.' },
      { status: 502 }
    )
  }

  // The position only. Never a score, never the narrative. §26, §28.
  const tag = positionTag(report.position)
  await tagLiapContact(customer.email, tag ? ['liap_assessment_completed', tag] : ['liap_assessment_completed'])

  await recordAuditEvent({
    eventType: 'liap.results_emailed',
    customerId: found.customerId,
    metadata: { result: report.position },
  })

  return NextResponse.json({ ok: true })
}

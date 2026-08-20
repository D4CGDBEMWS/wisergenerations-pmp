import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { isEnabled } from '@/lib/flags'
import { getDb, queryOne } from '@/lib/db/client'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, validateSession } from '@/lib/auth/session'
import { tagLiapContact } from '@/lib/liap/crm'

// ---------------------------------------------------------------------------
// The priority list for offers that do not exist yet. §30.
//
// Records a request, nothing more. No price, no date, no checkout — a
// pre-order button for a workshop with no date is a sale whatever the label
// says, and §2 puts the workshop firmly out of scope.
//
// Signed in only: the results page is where this appears, and taking an email
// address from the request body would turn it into an open mailing-list
// injection endpoint.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID = new Set(['workshop', 'starter_kit'])
const RATE_LIMIT = { limit: 10, windowMs: 15 * 60_000 }

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isEnabled('LIAP')) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'liap-interest', RATE_LIMIT)
  if (rateBlock) return rateBlock

  let interest = ''
  try {
    interest = String(((await req.json()) as { interest?: string }).interest ?? '')
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  if (!VALID.has(interest)) {
    return NextResponse.json({ error: 'Unknown list.' }, { status: 400 })
  }

  const store = await cookies()
  const session = await validateSession(store.get(SESSION_COOKIE)?.value)
  if (!session) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const customer = await queryOne<{ email: string }>(
    `SELECT email FROM customers WHERE id = $1`,
    [session.customerId]
  )
  if (!customer?.email) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  try {
    await getDb().query(
      `INSERT INTO liap_interest (email, interest_key, customer_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (lower(email), interest_key) DO NOTHING`,
      [customer.email.toLowerCase(), interest, session.customerId]
    )
  } catch (err) {
    console.error('[liap/interest] save failed:', err)
    return NextResponse.json({ error: 'We could not add you just now.' }, { status: 503 })
  }

  await tagLiapContact(
    customer.email,
    interest === 'workshop' ? ['liap_workshop_interest'] : ['liap_starter_kit_interest']
  )

  return NextResponse.json({ ok: true })
}

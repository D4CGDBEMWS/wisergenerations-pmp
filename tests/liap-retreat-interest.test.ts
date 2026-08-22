import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb } from './helpers/db'
import type { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// The retreat interest list.
//
// This is the entire public surface of a $1,499.99 product, so the tests are
// mostly about restraint: what a successful submission must NOT achieve.
//
// It is also the only public LIAP route that accepts an email address from
// the request body — the sibling interest route refuses to, because it runs
// behind a session. This one cannot: it is reached from a QR code by somebody
// who has never visited the site. So the defences are a CAPTCHA, a rate limit
// and the origin guard, and the blast radius is kept small by the fact that
// success produces a row marked 'new' awaiting human review.
// ---------------------------------------------------------------------------

let db: Db
let close: () => Promise<void>

const ORIGIN = 'https://www.wisergenerations.com'

beforeEach(async () => {
  const created = await createTestDb()
  db = created.db
  close = created.close
  setDbForTesting(db)
  process.env.FEATURE_LIAP_RETREAT = 'true'
  // Unset, so verifyTurnstile skips verification the way it does in local
  // development. The CAPTCHA is exercised in production, not here.
  delete process.env.TURNSTILE_SECRET_KEY
})

afterEach(async () => {
  setDbForTesting(null)
  await close()
  delete process.env.FEATURE_LIAP_RETREAT
})

// The rate limiter is keyed by client IP and its in-memory buckets live for
// the lifetime of the module, so every request here gets its own address.
// Without that, the sixth test in the file starts failing with a 429 and the
// cause looks like a product bug rather than five previous tests sharing an
// IP. The limit itself is exercised deliberately at the bottom of this file.
let ipCounter = 0
function nextIp(): string {
  ipCounter += 1
  return `203.0.113.${ipCounter % 250}`
}

function request(body: unknown, origin: string = ORIGIN, ip: string = nextIp()): NextRequest {
  return new Request(`${ORIGIN}/api/liap/retreat-interest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

async function post(body: unknown, origin?: string, ip?: string) {
  const { POST } = await import('@/app/api/liap/retreat-interest/route')
  return POST(request(body, origin, ip))
}

async function seedPartner(code: string): Promise<string> {
  const rows = await db.query<{ id: string }>(
    `INSERT INTO partners (referral_code, partner_name, partner_type, destination_key, status)
     VALUES ($1, 'Bean and Brew', 'coffee_shop', 'retreat', 'active') RETURNING id`,
    [code]
  )
  return rows[0]!.id
}

describe('what a submission achieves', () => {
  it('records an enquiry awaiting review', async () => {
    const res = await post({ email: 'hopeful@example.com', name: 'Dana', inquiryType: 'individual' })
    expect(res.status).toBe(200)

    const rows = await db.query<{ email: string; status: string; name: string }>(
      `SELECT email, status, name FROM retreat_leads`
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.email).toBe('hopeful@example.com')
    expect(rows[0]!.name).toBe('Dana')
    // Not 'approved', not 'qualified'. A human moves this and nothing else does.
    expect(rows[0]!.status).toBe('new')
  })

  it('grants nothing — no entitlement, no order, no session', async () => {
    await post({ email: 'hopeful@example.com', inquiryType: 'individual' })

    expect(await db.query(`SELECT 1 FROM entitlements`)).toHaveLength(0)
    expect(await db.query(`SELECT 1 FROM orders`)).toHaveLength(0)
    expect(await db.query(`SELECT 1 FROM sessions`)).toHaveLength(0)
  })

  it('creates a customer record so the person is contactable', async () => {
    await post({ email: 'Hopeful@Example.com', inquiryType: 'individual' })
    const rows = await db.query<{ email: string }>(`SELECT email FROM customers`)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.email).toBe('hopeful@example.com')
  })

  it('attributes the enquiry to the partner whose code was submitted', async () => {
    const partnerId = await seedPartner('BEAN-BREW')
    await post({ email: 'scanned@example.com', inquiryType: 'individual', partner: 'bean-brew' })

    const rows = await db.query<{ partner_id: string; event_type: string }>(
      `SELECT partner_id, event_type FROM attribution_events`
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.partner_id).toBe(partnerId)
    expect(rows[0]!.event_type).toBe('retreat_interest')

    const lead = await db.query<{ partner_id: string }>(`SELECT partner_id FROM retreat_leads`)
    expect(lead[0]!.partner_id).toBe(partnerId)
  })

  it('accepts the enquiry even when the code is nonsense', async () => {
    // A bad code must never cost somebody their enquiry.
    const res = await post({
      email: 'typo@example.com',
      inquiryType: 'individual',
      partner: '../../admin',
    })
    expect(res.status).toBe(200)
    expect(await db.query(`SELECT 1 FROM retreat_leads`)).toHaveLength(1)
  })

  it('records a sponsor enquiry as a sponsor inquiry', async () => {
    await post({ email: 'giving@example.com', inquiryType: 'sponsor', organization: 'Acme' })
    const rows = await db.query<{ event_type: string }>(
      `SELECT event_type FROM attribution_events`
    )
    expect(rows[0]!.event_type).toBe('sponsor_inquiry')
  })
})

describe('consent is asked for separately', () => {
  it('records no marketing consent unless it was given', async () => {
    await post({ email: 'quiet@example.com', inquiryType: 'individual' })
    expect(await db.query(`SELECT 1 FROM consents WHERE consent_type = 'marketing'`)).toHaveLength(0)
  })

  it('records it, with its version, when it was', async () => {
    await post({
      email: 'happy@example.com',
      inquiryType: 'individual',
      marketingConsent: true,
      consentVersion: '2026-08-1',
    })
    const rows = await db.query<{ granted: boolean; version: string; source: string }>(
      `SELECT granted, version, source FROM consents WHERE consent_type = 'marketing'`
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.granted).toBe(true)
    expect(rows[0]!.version).toBe('2026-08-1')
    expect(rows[0]!.source).toBe('retreat_interest')
  })

  it('treats anything other than an explicit true as no', async () => {
    await post({ email: 'sneaky@example.com', inquiryType: 'individual', marketingConsent: 'yes' })
    expect(await db.query(`SELECT 1 FROM consents WHERE consent_type = 'marketing'`)).toHaveLength(0)
  })
})

describe('what it refuses', () => {
  it('refuses everything when the flag is off', async () => {
    delete process.env.FEATURE_LIAP_RETREAT
    const res = await post({ email: 'early@example.com', inquiryType: 'individual' })
    expect(res.status).toBe(404)
    expect(await db.query(`SELECT 1 FROM retreat_leads`)).toHaveLength(0)
  })

  it('refuses a cross-origin submission', async () => {
    const res = await post(
      { email: 'attacker@example.com', inquiryType: 'individual' },
      'https://evil.example.com'
    )
    expect(res.status).toBe(403)
    expect(await db.query(`SELECT 1 FROM retreat_leads`)).toHaveLength(0)
  })

  it('refuses an invalid email address', async () => {
    for (const email of ['', 'not-an-email', 'still@bad', undefined]) {
      const res = await post({ email, inquiryType: 'individual' })
      expect(res.status).toBe(400)
    }
    expect(await db.query(`SELECT 1 FROM retreat_leads`)).toHaveLength(0)
  })

  it('refuses an unknown enquiry type', async () => {
    const res = await post({ email: 'ok@example.com', inquiryType: 'free_retreat' })
    expect(res.status).toBe(400)
  })

  it('refuses a malformed body', async () => {
    const { POST } = await import('@/app/api/liap/retreat-interest/route')
    const bad = new Request(`${ORIGIN}/api/liap/retreat-interest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: ORIGIN,
        'x-forwarded-for': nextIp(),
      },
      body: 'not json',
    }) as unknown as NextRequest
    expect((await POST(bad)).status).toBe(400)
  })
})

describe('the fields a stranger controls are bounded', () => {
  it('truncates long free text rather than storing it whole', async () => {
    await post({
      email: 'verbose@example.com',
      inquiryType: 'individual',
      message: 'x'.repeat(50_000),
    })
    const rows = await db.query<{ message: string }>(`SELECT message FROM retreat_leads`)
    expect(rows[0]!.message.length).toBe(2000)
  })

  it('ignores an implausible group size instead of storing it', async () => {
    for (const size of [0, -5, 999_999, 'many', null]) {
      await db.query(`DELETE FROM retreat_leads`)
      await post({ email: 'group@example.com', inquiryType: 'group', groupSize: size })
      const rows = await db.query<{ group_size: number | null }>(
        `SELECT group_size FROM retreat_leads`
      )
      expect(rows[0]!.group_size).toBeNull()
    }
  })

  it('keeps a plausible one', async () => {
    await post({ email: 'group@example.com', inquiryType: 'group', groupSize: 12 })
    const rows = await db.query<{ group_size: number }>(`SELECT group_size FROM retreat_leads`)
    expect(rows[0]!.group_size).toBe(12)
  })
})

describe('a second submission updates rather than stacking', () => {
  it('keeps one open enquiry per person per type', async () => {
    await post({ email: 'twice@example.com', inquiryType: 'individual', name: 'First' })
    await post({ email: 'TWICE@example.com', inquiryType: 'individual', phone: '555-0100' })

    const rows = await db.query<{ name: string; phone: string }>(
      `SELECT name, phone FROM retreat_leads`
    )
    expect(rows).toHaveLength(1)
    // The later submission adds detail without erasing what was already known.
    expect(rows[0]!.name).toBe('First')
    expect(rows[0]!.phone).toBe('555-0100')
  })

  it('does not let a later submission steal attribution from the first partner', async () => {
    const first = await seedPartner('CHURCH-ONE')
    await db.query(
      `INSERT INTO partners (referral_code, partner_name, partner_type, destination_key, status)
       VALUES ('SHOP-TWO', 'Second', 'coffee_shop', 'retreat', 'active')`
    )

    await post({ email: 'loyal@example.com', inquiryType: 'individual', partner: 'CHURCH-ONE' })
    await post({ email: 'loyal@example.com', inquiryType: 'individual', partner: 'SHOP-TWO' })

    const rows = await db.query<{ partner_id: string }>(`SELECT partner_id FROM retreat_leads`)
    expect(rows[0]!.partner_id).toBe(first)
  })

  it('treats an individual and a group enquiry from one person as two records', async () => {
    await post({ email: 'both@example.com', inquiryType: 'individual' })
    await post({ email: 'both@example.com', inquiryType: 'group', groupSize: 8 })

    const rows = await db.query<{ inquiry_type: string }>(
      `SELECT inquiry_type FROM retreat_leads ORDER BY inquiry_type`
    )
    expect(rows.map((r) => r.inquiry_type)).toEqual(['group', 'individual'])
  })
})

describe('the rate limit', () => {
  it('stops one address flooding the interest list', async () => {
    // This route takes an email address from an unauthenticated request body,
    // which is the shape of an open mailing-list injection endpoint. The
    // CAPTCHA is the first defence and this is the second, so it is worth
    // proving rather than assuming.
    const flooder = '198.51.100.42'
    const statuses: number[] = []

    for (let i = 0; i < 8; i++) {
      const res = await post(
        { email: `flood${i}@example.com`, inquiryType: 'individual' },
        ORIGIN,
        flooder
      )
      statuses.push(res.status)
    }

    expect(statuses.filter((s) => s === 200).length).toBe(5)
    expect(statuses.filter((s) => s === 429).length).toBe(3)
    // And the throttled attempts wrote nothing.
    expect(await db.query(`SELECT 1 FROM retreat_leads`)).toHaveLength(5)
  })
})

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createTestDb,
  seedPilot,
  seedProfile,
  verifyIdentity,
  type TestDb,
} from './helpers/db'
import { conductAgreementText } from '@/lib/safety'

// ---------------------------------------------------------------------------
// The database gates, exercised against real Postgres.
//
// Each of these rules spans more than one table, which is exactly why none of
// them is a CHECK constraint. These tests exist to prove the triggers fire —
// a guard nobody has watched refuse something is not a guard.
// ---------------------------------------------------------------------------

let db: TestDb
let requester: string
let provider: string

beforeEach(async () => {
  db = await createTestDb()
  await seedPilot(db)
  requester = await seedProfile(db, 'Demo Requester')
  provider = await seedProfile(db, 'Demo Provider')
})
afterEach(async () => {
  await db.close()
})

async function makeBooking(): Promise<string> {
  const cat = await db.query<{ id: string }>(`SELECT id FROM service_categories WHERE slug='handyman'`)
  const listing = await db.query<{ id: string }>(
    `INSERT INTO listings (profile_id, category_id, title, body, listing_kind, offer_type, zip, status)
     VALUES ($1,$2,'Demo listing title','Demo listing body text','service','paid','30080','active')
     RETURNING id`,
    [provider, cat[0]!.id]
  )
  const proposal = await db.query<{ id: string }>(
    `INSERT INTO exchange_proposals
       (listing_id, requester_id, provider_id, offer_type, agreed_amount_cents, status)
     VALUES ($1,$2,$3,'paid',5000,'accepted') RETURNING id`,
    [listing[0]!.id, requester, provider]
  )
  const booking = await db.query<{ id: string }>(
    `INSERT INTO bookings (proposal_id, requester_id, provider_id, duration_kind)
     VALUES ($1,$2,$3,'half_day_4h') RETURNING id`,
    [proposal[0]!.id, requester, provider]
  )
  return booking[0]!.id
}

async function acknowledge(bookingId: string, who: string[]): Promise<void> {
  for (const p of who) {
    await db.query(
      `INSERT INTO conduct_acknowledgments (booking_id, profile_id, conduct_text)
       VALUES ($1,$2,$3)`,
      [bookingId, p, conductAgreementText()]
    )
  }
}

const confirm = (id: string) =>
  db.query(`UPDATE bookings SET status='confirmed', confirmed_at=now() WHERE id=$1`, [id])

describe('GATE: conduct acknowledgment before confirmation', () => {
  it('refuses to confirm with no acknowledgment', async () => {
    const b = await makeBooking()
    await expect(confirm(b)).rejects.toThrow(/conduct_acknowledgment/)
  })

  it('refuses to confirm when only one party has acknowledged', async () => {
    const b = await makeBooking()
    await acknowledge(b, [requester])
    await expect(confirm(b)).rejects.toThrow(/conduct_acknowledgment/)
  })

  it('allows confirmation once both parties have acknowledged', async () => {
    const b = await makeBooking()
    await acknowledge(b, [requester, provider])
    await expect(confirm(b)).resolves.toBeDefined()
  })

  it('stores the exact text the person agreed to', async () => {
    const b = await makeBooking()
    await acknowledge(b, [requester])
    const rows = await db.query<{ conduct_text: string }>(
      `SELECT conduct_text FROM conduct_acknowledgments WHERE booking_id=$1`, [b]
    )
    expect(rows[0]!.conduct_text).toContain('This is not That!~ Stay professional!')
  })
})

describe('GATE: blocking prevents a booking', () => {
  it('refuses to confirm when either party has blocked the other', async () => {
    const b = await makeBooking()
    await acknowledge(b, [requester, provider])
    await db.query(`INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1,$2)`, [requester, provider])
    await expect(confirm(b)).rejects.toThrow(/blocked_pair/)
  })
})

describe('GATE: suspension prevents a booking', () => {
  it('refuses to confirm when a party is suspended', async () => {
    const b = await makeBooking()
    await acknowledge(b, [requester, provider])
    await db.query(`UPDATE profiles SET suspended_at=now() WHERE id=$1`, [provider])
    await expect(confirm(b)).rejects.toThrow(/party_suspended/)
  })
})

describe('GATE: live bookings require identity verification', () => {
  it('with live bookings OFF (the default), verification is not demanded', async () => {
    const b = await makeBooking()
    await acknowledge(b, [requester, provider])
    await expect(confirm(b)).resolves.toBeDefined()
  })

  it('with live bookings ON, an unverified party is refused', async () => {
    const b = await makeBooking()
    await acknowledge(b, [requester, provider])
    await db.exec(`SET villagetrade.live_bookings = 'on'`)
    await expect(confirm(b)).rejects.toThrow(/identity_verification/)
  })

  it('with live bookings ON and both verified, confirmation succeeds', async () => {
    const b = await makeBooking()
    await acknowledge(b, [requester, provider])
    await verifyIdentity(db, requester)
    await verifyIdentity(db, provider)
    await db.exec(`SET villagetrade.live_bookings = 'on'`)
    await expect(confirm(b)).resolves.toBeDefined()
  })
})

describe('GATE: a review requires a completed booking', () => {
  it('refuses a review on a booking that was never completed', async () => {
    const b = await makeBooking()
    await expect(
      db.query(
        `INSERT INTO reviews (booking_id, author_id, subject_id, rating) VALUES ($1,$2,$3,5)`,
        [b, requester, provider]
      )
    ).rejects.toThrow(/requires_completed_booking/)
  })

  it('refuses a review from somebody who was not a party', async () => {
    const b = await makeBooking()
    await acknowledge(b, [requester, provider])
    await confirm(b)
    await db.query(`UPDATE bookings SET status='completed', completed_at=now() WHERE id=$1`, [b])
    const stranger = await seedProfile(db, 'Demo Stranger')
    await expect(
      db.query(
        `INSERT INTO reviews (booking_id, author_id, subject_id, rating) VALUES ($1,$2,$3,5)`,
        [b, stranger, provider]
      )
    ).rejects.toThrow(/party_mismatch/)
  })

  it('allows a review after completion, once, by a party', async () => {
    const b = await makeBooking()
    await acknowledge(b, [requester, provider])
    await confirm(b)
    await db.query(`UPDATE bookings SET status='completed', completed_at=now() WHERE id=$1`, [b])
    await expect(
      db.query(
        `INSERT INTO reviews (booking_id, author_id, subject_id, rating) VALUES ($1,$2,$3,5)`,
        [b, requester, provider]
      )
    ).resolves.toBeDefined()
    // A second review from the same author is refused by the unique index.
    await expect(
      db.query(
        `INSERT INTO reviews (booking_id, author_id, subject_id, rating) VALUES ($1,$2,$3,4)`,
        [b, requester, provider]
      )
    ).rejects.toThrow()
  })
})

describe('GATE: completion requires prior confirmation', () => {
  it('refuses to jump straight to completed', async () => {
    const b = await makeBooking()
    await expect(
      db.query(`UPDATE bookings SET status='completed', completed_at=now() WHERE id=$1`, [b])
    ).rejects.toThrow(/without_confirmation/)
  })
})

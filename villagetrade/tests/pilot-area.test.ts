import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDb, seedPilot, seedProfile, type TestDb } from './helpers/db'
import { COBB_COUNTY_ZIPS, isInPilotArea, normalizeZip, COUNTY } from '@/lib/geography'

// ---------------------------------------------------------------------------
// The pilot boundary.
//
// Founder ruling: Cobb County only; expansion requires founder approval. The
// risk is not a deliberate breach, it is drift — a ZIP added for a test, a
// radius widened "temporarily". So the boundary is asserted in two places:
// the allow-list, and the database that refuses to publish outside it.
// ---------------------------------------------------------------------------

let db: TestDb
beforeEach(async () => {
  db = await createTestDb()
  await seedPilot(db)
})
afterEach(async () => db.close())

describe('the pilot area is Cobb County, Georgia', () => {
  it('every seeded ZIP is in Cobb County', async () => {
    const rows = await db.query<{ county: string; n: number }>(
      `SELECT county, count(*)::int AS n FROM zip_areas GROUP BY county`
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.county).toBe(COUNTY)
    expect(rows[0]!.n).toBe(COBB_COUNTY_ZIPS.length)
  })

  it('recognises a pilot ZIP and rejects one outside', () => {
    expect(isInPilotArea('30080')).toBe(true)
    expect(isInPilotArea('30309')).toBe(false) // Atlanta / Fulton
    expect(isInPilotArea('90210')).toBe(false)
  })

  it('normalises real-world ZIP input', () => {
    expect(normalizeZip(' 30080 ')).toBe('30080')
    expect(normalizeZip('30080-1234')).toBe('30080')
    expect(normalizeZip('3008')).toBeNull()
    expect(normalizeZip('abcde')).toBeNull()
    expect(normalizeZip(null)).toBeNull()
    expect(normalizeZip(30080)).toBeNull()
  })

  it('the database refuses to publish a listing outside the pilot area', async () => {
    const owner = await seedProfile(db, 'Demo Owner')
    const cat = await db.query<{ id: string }>(`SELECT id FROM service_categories LIMIT 1`)
    // A ZIP that is not in zip_areas at all — the FK stops it first.
    await expect(
      db.query(
        `INSERT INTO listings (profile_id, category_id, title, body, listing_kind, offer_type, zip, status)
         VALUES ($1,$2,'Outside the pilot','Body text here','service','paid','90210','active')`,
        [owner, cat[0]!.id]
      )
    ).rejects.toThrow()
  })

  it('refuses to publish into a ZIP that has been deactivated', async () => {
    const owner = await seedProfile(db, 'Demo Owner 2')
    const cat = await db.query<{ id: string }>(`SELECT id FROM service_categories LIMIT 1`)
    await db.query(`UPDATE zip_areas SET active = false WHERE zip = '30080'`)
    await expect(
      db.query(
        `INSERT INTO listings (profile_id, category_id, title, body, listing_kind, offer_type, zip, status)
         VALUES ($1,$2,'Deactivated area','Body text here','service','paid','30080','active')`,
        [owner, cat[0]!.id]
      )
    ).rejects.toThrow(/outside_pilot_area/)
  })
})

describe('excluded service domains', () => {
  it('the database refuses childcare and eldercare categories', async () => {
    for (const slug of ['childcare', 'babysitting', 'eldercare', 'senior-care']) {
      await expect(
        db.query(`INSERT INTO service_categories (slug, name, kind) VALUES ($1,'X','service')`, [slug])
      ).rejects.toThrow()
    }
  })

  it('permits an ordinary category', async () => {
    await expect(
      db.query(`INSERT INTO service_categories (slug, name, kind) VALUES ('cleaning','Cleaning','service')`)
    ).resolves.toBeDefined()
  })
})

describe('listings carry no private contact detail', () => {
  it('the listings table has no address, phone or email column', async () => {
    const cols = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name='listings'`
    )
    const names = cols.map((c) => c.column_name)
    for (const forbidden of ['address', 'street', 'phone', 'email', 'lat', 'lng', 'latitude', 'longitude']) {
      expect(names, `listings.${forbidden} must not exist`).not.toContain(forbidden)
    }
  })

  it('a precise location may only exist on a booking agreement', async () => {
    const cols = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.columns
        WHERE table_schema='public' AND column_name='location_detail'`
    )
    expect(cols.map((c) => c.table_name)).toEqual(['booking_agreements'])
  })
})

describe('identity documents are never stored', () => {
  it('the verification table has no column that could hold one', async () => {
    const cols = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name='identity_verifications'`
    )
    const names = cols.map((c) => c.column_name)
    for (const forbidden of ['document', 'document_url', 'image', 'image_url', 'photo', 'ssn', 'dob', 'date_of_birth', 'id_number']) {
      expect(names, `identity_verifications.${forbidden} must not exist`).not.toContain(forbidden)
    }
    expect(names.sort()).toEqual(
      ['checked_at', 'expires_at', 'id', 'profile_id', 'status', 'vendor', 'vendor_ref'].sort()
    )
  })
})

describe('no payment infrastructure exists', () => {
  it('there is no payments, payouts or balances table', async () => {
    const tables = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
    )
    const names = tables.map((t) => t.table_name)
    for (const forbidden of ['payments', 'payouts', 'balances', 'transactions', 'charges', 'transfers']) {
      expect(names, `${forbidden} must not exist in the MVP`).not.toContain(forbidden)
    }
  })

  it('the agreed amount is named as an agreement, not a charge', async () => {
    const cols = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name='exchange_proposals'`
    )
    const names = cols.map((c) => c.column_name)
    expect(names).toContain('agreed_amount_cents')
    for (const forbidden of ['stripe_payment_intent', 'charge_id', 'paid_at', 'captured_at']) {
      expect(names).not.toContain(forbidden)
    }
  })
})

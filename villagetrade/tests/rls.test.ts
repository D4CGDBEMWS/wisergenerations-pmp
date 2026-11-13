import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDb, seedPilot, seedProfile, type TestDb } from './helpers/db'

// ---------------------------------------------------------------------------
// Row-level security, exercised as an unprivileged user.
//
// ── WHY THESE TESTS NEED A NON-SUPERUSER ───────────────────────────────────
//
// PGlite connects as a superuser, and PostgreSQL exempts superusers from RLS
// entirely. A test suite that forgot that would pass every policy while
// enforcing none. So each test creates a plain role, grants it table
// privileges, and runs as that role — which is how a Supabase client
// actually connects.
// ---------------------------------------------------------------------------

let db: TestDb
let alice: string
let bob: string

async function asUser(db: TestDb, profileId: string | null, isAdmin = false) {
  await db.exec(`SET ROLE vt_app`)
  await db.exec(
    profileId
      ? `SELECT set_config('villagetrade.profile_id', '${profileId}', false)`
      : `SELECT set_config('villagetrade.profile_id', '', false)`
  )
  await db.exec(`SELECT set_config('villagetrade.is_admin', '${isAdmin ? 'on' : 'off'}', false)`)
}
const asSuperuser = (db: TestDb) => db.exec(`RESET ROLE`)

beforeEach(async () => {
  db = await createTestDb()
  await seedPilot(db)
  alice = await seedProfile(db, 'Demo Alice', '30080')
  bob = await seedProfile(db, 'Demo Bob', '30060')
  // A role that is NOT exempt from RLS, mirroring how the app connects.
  await db.exec(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='vt_app') THEN
        CREATE ROLE vt_app NOLOGIN;
      END IF;
    END $$;
    GRANT USAGE ON SCHEMA public TO vt_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vt_app;
  `)
})
afterEach(async () => {
  await asSuperuser(db)
  await db.close()
})

describe('RLS is actually in force', () => {
  it('the test role is not exempt — a superuser test would prove nothing', async () => {
    await asUser(db, alice)
    const r = await db.query<{ su: boolean }>(
      `SELECT rolsuper AS su FROM pg_roles WHERE rolname = current_user`
    )
    expect(r[0]!.su).toBe(false)
  })
})

describe('profiles are private', () => {
  it('a person sees only their own profile', async () => {
    await asUser(db, alice)
    const rows = await db.query<{ id: string }>(`SELECT id FROM profiles`)
    expect(rows.map((r) => r.id)).toEqual([alice])
  })

  it('a signed-out visitor sees no profile at all', async () => {
    await asUser(db, null)
    const rows = await db.query(`SELECT id FROM profiles`)
    expect(rows).toHaveLength(0)
  })

  it('a person cannot edit somebody else’s profile', async () => {
    await asUser(db, alice)
    await db.query(`UPDATE profiles SET display_name='Hacked' WHERE id=$1`, [bob])
    await asSuperuser(db)
    const rows = await db.query<{ display_name: string }>(
      `SELECT display_name FROM profiles WHERE id=$1`, [bob]
    )
    expect(rows[0]!.display_name).toBe('Demo Bob')
  })

  it('an admin may read profiles', async () => {
    await asUser(db, alice, true)
    const rows = await db.query(`SELECT id FROM profiles`)
    expect(rows.length).toBe(2)
  })
})

describe('listings: active are public, drafts are not', () => {
  beforeEach(async () => {
    const cat = await db.query<{ id: string }>(`SELECT id FROM service_categories LIMIT 1`)
    await db.query(
      `INSERT INTO listings (profile_id, category_id, title, body, listing_kind, offer_type, zip, status)
       VALUES ($1,$2,'Alice active listing','Body text here','service','paid','30080','active')`,
      [alice, cat[0]!.id]
    )
    await db.query(
      `INSERT INTO listings (profile_id, category_id, title, body, listing_kind, offer_type, zip, status)
       VALUES ($1,$2,'Alice draft listing','Body text here','service','paid','30080','draft')`,
      [alice, cat[0]!.id]
    )
  })

  it('a stranger sees the active listing and not the draft', async () => {
    await asUser(db, bob)
    const rows = await db.query<{ title: string }>(`SELECT title FROM listings`)
    expect(rows.map((r) => r.title)).toEqual(['Alice active listing'])
  })

  it('the owner sees both', async () => {
    await asUser(db, alice)
    const rows = await db.query(`SELECT title FROM listings`)
    expect(rows).toHaveLength(2)
  })

  it('a stranger cannot edit a listing they do not own', async () => {
    await asUser(db, bob)
    await db.query(`UPDATE listings SET title='Taken over' WHERE profile_id=$1`, [alice])
    await asSuperuser(db)
    const rows = await db.query<{ title: string }>(`SELECT title FROM listings ORDER BY title`)
    expect(rows.map((r) => r.title)).toEqual(['Alice active listing', 'Alice draft listing'])
  })

  it('a person cannot create a listing in somebody else’s name', async () => {
    await asUser(db, bob)
    const cat = await db.query<{ id: string }>(`SELECT id FROM service_categories LIMIT 1`)
    await expect(
      db.query(
        `INSERT INTO listings (profile_id, category_id, title, body, listing_kind, offer_type, zip, status)
         VALUES ($1,$2,'Impersonated','Body text here','service','paid','30080','draft')`,
        [alice, cat[0]!.id]
      )
    ).rejects.toThrow(/row-level security/i)
  })
})

describe('nobody can mark themselves verified', () => {
  it('there is no INSERT policy on identity_verifications', async () => {
    await asUser(db, alice)
    await expect(
      db.query(
        `INSERT INTO identity_verifications (profile_id, vendor, vendor_ref, status)
         VALUES ($1,'self','ref-self','verified')`,
        [alice]
      )
    ).rejects.toThrow(/row-level security/i)
  })

  it('a person may read their own verification status and not another’s', async () => {
    await asSuperuser(db)
    await db.query(
      `INSERT INTO identity_verifications (profile_id, vendor, vendor_ref, status)
       VALUES ($1,'test_vendor','ref-abc','verified')`, [bob]
    )
    await asUser(db, alice)
    expect(await db.query(`SELECT id FROM identity_verifications`)).toHaveLength(0)
    await asUser(db, bob)
    expect(await db.query(`SELECT id FROM identity_verifications`)).toHaveLength(1)
  })
})

describe('the precise location is reachable only by the two parties', () => {
  let bookingId: string
  beforeEach(async () => {
    await asSuperuser(db)
    const cat = await db.query<{ id: string }>(`SELECT id FROM service_categories LIMIT 1`)
    const l = await db.query<{ id: string }>(
      `INSERT INTO listings (profile_id, category_id, title, body, listing_kind, offer_type, zip, status)
       VALUES ($1,$2,'Booked listing','Body text here','service','paid','30080','active') RETURNING id`,
      [alice, cat[0]!.id]
    )
    const p = await db.query<{ id: string }>(
      `INSERT INTO exchange_proposals (listing_id, requester_id, provider_id, offer_type, agreed_amount_cents, status)
       VALUES ($1,$2,$3,'paid',5000,'accepted') RETURNING id`,
      [l[0]!.id, bob, alice]
    )
    const b = await db.query<{ id: string }>(
      `INSERT INTO bookings (proposal_id, requester_id, provider_id, duration_kind)
       VALUES ($1,$2,$3,'individual') RETURNING id`,
      [p[0]!.id, bob, alice]
    )
    bookingId = b[0]!.id
    await db.query(
      `INSERT INTO booking_agreements (booking_id, location_detail) VALUES ($1,'123 Private Street')`,
      [bookingId]
    )
  })

  it('a party can read it', async () => {
    await asUser(db, bob)
    const rows = await db.query<{ location_detail: string }>(
      `SELECT location_detail FROM booking_agreements`
    )
    expect(rows[0]!.location_detail).toBe('123 Private Street')
  })

  it('a third party cannot', async () => {
    const carol = await (async () => {
      await asSuperuser(db)
      return seedProfile(db, 'Demo Carol', '30144')
    })()
    await asUser(db, carol)
    expect(await db.query(`SELECT location_detail FROM booking_agreements`)).toHaveLength(0)
  })

  it('a signed-out visitor cannot', async () => {
    await asUser(db, null)
    expect(await db.query(`SELECT location_detail FROM booking_agreements`)).toHaveLength(0)
  })
})

describe('reports do not expose the reporter to the reported', () => {
  it('the subject of a report cannot see it', async () => {
    await asSuperuser(db)
    await db.query(
      `INSERT INTO reports (reporter_id, subject_profile_id, reason) VALUES ($1,$2,'safety_concern')`,
      [alice, bob]
    )
    await asUser(db, bob)
    expect(await db.query(`SELECT id FROM reports`)).toHaveLength(0)
    await asUser(db, alice)
    expect(await db.query(`SELECT id FROM reports`)).toHaveLength(1)
  })

  it('moderation actions are invisible to ordinary users', async () => {
    await asSuperuser(db)
    await db.query(`INSERT INTO moderation_actions (action) VALUES ('warning_issued')`)
    await asUser(db, alice)
    expect(await db.query(`SELECT id FROM moderation_actions`)).toHaveLength(0)
    await asUser(db, alice, true)
    expect(await db.query(`SELECT id FROM moderation_actions`)).toHaveLength(1)
  })
})

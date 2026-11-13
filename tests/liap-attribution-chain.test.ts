import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb } from './helpers/db'
import { creditBookPurchase, recordAttribution } from '@/lib/liap/attribution'
import { findPartnerByCode, destinationPath } from '@/lib/liap/partners'
import { HOUSE_REFERRAL, houseReferralInsertSql } from '@/lib/liap/house-referral'

// ---------------------------------------------------------------------------
// The attribution chain, end to end, against real Postgres.
//
// PGlite applies every migration in db/migrations in order, so this suite also
// proves 0006 actually applies on top of 0001–0005 — the renumbering is
// exercised rather than asserted.
//
// What is proven here is the thing that was broken: a scan of a partner's QR
// code producing a credited book sale. 'book_preorder' existed in the event
// list and in the funnel query and was never once written by anything.
// ---------------------------------------------------------------------------

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  const created = await createTestDb()
  db = created.db
  close = created.close
  setDbForTesting(db)
})

afterEach(async () => {
  setDbForTesting(null)
  await close()
})

/** Creates the grassroots row exactly as the owner specification defines it. */
async function seedHouseReferral(): Promise<string> {
  await db.query(houseReferralInsertSql())
  const rows = await db.query<{ id: string }>(
    `SELECT id FROM partners WHERE referral_code = $1`,
    [HOUSE_REFERRAL.referralCode]
  )
  return rows[0].id
}

async function seedCustomer(email = 'reader@example.test'): Promise<string> {
  const rows = await db.query<{ id: string }>(
    `INSERT INTO customers (email) VALUES ($1) RETURNING id`,
    [email]
  )
  return rows[0].id
}

describe('migration 0006 applies on top of the existing chain', () => {
  it('creates the partner tables without disturbing 0005', async () => {
    const tables = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    )
    const names = new Set(tables.map((t) => t.table_name))
    for (const table of ['partners', 'attribution_events', 'attribution_credits', 'organizations']) {
      expect(names.has(table), table).toBe(true)
    }
    // 0005's columns are still there — the renumbering did not displace it.
    const cols = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'assessments'`
    )
    const colNames = new Set(cols.map((c) => c.column_name))
    expect(colNames.has('results_email_sent_at')).toBe(true)

    // And the retreat/campaign schema is absent, as scoped.
    for (const table of ['retreat_leads', 'campaign_goals', 'in_kind_contributions']) {
      expect(names.has(table), table).toBe(false)
    }
  })
})

describe('the grassroots house code', () => {
  it('resolves to the book page once the row exists', async () => {
    expect(await findPartnerByCode('grassroots')).toBeNull()

    await seedHouseReferral()
    const partner = await findPartnerByCode('grassroots')

    expect(partner).not.toBeNull()
    expect(partner!.partner_type).toBe('first-party')
    expect(destinationPath(partner!.destination_key)).toBe('/living-is-a-project/book')
  })

  it('resolves however it was typed off a flyer', async () => {
    await seedHouseReferral()
    for (const typed of ['grassroots', 'GRASSROOTS', 'GrassRoots']) {
      expect((await findPartnerByCode(typed))?.referral_code, typed).toBe('grassroots')
    }
  })

  it('cannot be created twice', async () => {
    await seedHouseReferral()
    await db.query(houseReferralInsertSql())
    const rows = await db.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM partners WHERE referral_code = 'grassroots'`
    )
    expect(rows[0].n).toBe('1')
  })
})

describe('scan → book → confirmed purchase', () => {
  it('credits the partner exactly once for a paid sale', async () => {
    const partnerId = await seedHouseReferral()
    const partner = await findPartnerByCode('grassroots')

    // 1. The scan. No visitor identifier: a tally, not a person.
    await recordAttribution({ partner, eventType: 'scan' })

    // 2. The purchase completes and the webhook credits it.
    const customerId = await seedCustomer()
    await creditBookPurchase({
      referralCode: 'grassroots',
      customerId,
      outcomeRef: 'cs_test_session_1',
    })

    const events = await db.query<{ event_type: string; customer_id: string | null }>(
      `SELECT event_type, customer_id FROM attribution_events
        WHERE partner_id = $1 ORDER BY id`,
      [partnerId]
    )
    expect(events.map((e) => e.event_type)).toEqual(['scan', 'book_preorder'])
    expect(events[0].customer_id).toBeNull()
    expect(events[1].customer_id).toBe(customerId)

    const credits = await db.query<{ basis: string; outcome_type: string; outcome_ref: string }>(
      `SELECT basis, outcome_type, outcome_ref FROM attribution_credits WHERE partner_id = $1`,
      [partnerId]
    )
    expect(credits).toHaveLength(1)
    expect(credits[0]).toMatchObject({
      basis: 'last_touch',
      outcome_type: 'book_preorder',
      outcome_ref: 'cs_test_session_1',
    })
  })

  it('survives a Stripe webhook retry without double-crediting', async () => {
    const partnerId = await seedHouseReferral()
    const customerId = await seedCustomer()

    // Stripe retries. The fulfilment path is deliberately re-runnable, so this
    // will happen — a partner report that overcounts is worse than one that
    // undercounts, because nobody catches it.
    for (let i = 0; i < 3; i++) {
      await creditBookPurchase({ referralCode: 'grassroots', customerId, outcomeRef: 'cs_retry' })
    }

    const credits = await db.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM attribution_credits WHERE partner_id = $1`,
      [partnerId]
    )
    expect(credits[0].n).toBe('1')
  })

  it('credits two different sales separately', async () => {
    const partnerId = await seedHouseReferral()
    const a = await seedCustomer('a@example.test')
    const b = await seedCustomer('b@example.test')
    await creditBookPurchase({ referralCode: 'grassroots', customerId: a, outcomeRef: 'cs_a' })
    await creditBookPurchase({ referralCode: 'grassroots', customerId: b, outcomeRef: 'cs_b' })

    const credits = await db.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM attribution_credits WHERE partner_id = $1`,
      [partnerId]
    )
    expect(credits[0].n).toBe('2')
  })

  it('credits nothing when there was no code', async () => {
    await seedHouseReferral()
    const customerId = await seedCustomer()
    await creditBookPurchase({ referralCode: null, customerId, outcomeRef: 'cs_direct' })
    await creditBookPurchase({ referralCode: '', customerId, outcomeRef: 'cs_direct_2' })

    const credits = await db.query<{ n: string }>(`SELECT count(*)::text AS n FROM attribution_credits`)
    expect(credits[0].n).toBe('0')
  })

  it('credits nothing for a code nobody created', async () => {
    const customerId = await seedCustomer()
    // A stale postcard, a typo, or a code that was never issued. The sale
    // still completes; it is simply unattributed.
    await creditBookPurchase({ referralCode: 'not-a-real-code', customerId, outcomeRef: 'cs_x' })

    const credits = await db.query<{ n: string }>(`SELECT count(*)::text AS n FROM attribution_credits`)
    expect(credits[0].n).toBe('0')
  })

  it('never lets a measurement failure reach the customer', async () => {
    // A credit written against a table that has been dropped from under it.
    // fulfilment has already succeeded by this point; the buyer must keep
    // their book and their assessment.
    await seedHouseReferral()
    await db.query(`DROP TABLE attribution_credits`)
    await expect(
      creditBookPurchase({ referralCode: 'grassroots', customerId: null, outcomeRef: 'cs_boom' })
    ).resolves.toBeUndefined()
  })
})

describe('a referral code carries no authority', () => {
  it('grants no entitlement, whatever it is', async () => {
    const partnerId = await seedHouseReferral()
    const customerId = await seedCustomer()
    await creditBookPurchase({ referralCode: 'grassroots', customerId, outcomeRef: 'cs_auth' })

    // Attribution wrote rows. It did not write an entitlement.
    const ents = await db.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM entitlements WHERE customer_id = $1`,
      [customerId]
    )
    expect(ents[0].n).toBe('0')
    expect(partnerId).toBeTruthy()
  })
})

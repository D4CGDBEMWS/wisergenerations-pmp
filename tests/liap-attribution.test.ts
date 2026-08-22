import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb } from './helpers/db'
import {
  findPartnerByCode,
  destinationPath,
  isWellFormedCode,
  PARTNER_DESTINATIONS,
} from '@/lib/liap/partners'
import { recordAttribution, partnerFromSubmission, partnerFunnel } from '@/lib/liap/attribution'

// ---------------------------------------------------------------------------
// Phase II-A — community partners and attribution.
//
// The tests that matter most here are the ones asserting what attribution
// CANNOT do. A referral code is printed on a postcard in a shop window: it is
// a public string that anyone can read, photograph or guess, and the entire
// safety argument for this feature is that it carries no authority at all.
//
// So the first block below does not test behaviour, it tests architecture —
// which modules are allowed to know about which. A behavioural test can only
// catch the abuses somebody thought to write down; a dependency assertion
// catches the ones nobody imagined, including the one that arrives in six
// months as a small reasonable-sounding request.
// ---------------------------------------------------------------------------

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

/** The file with every comment removed, so assertions match code not prose. */
function code(path: string): string {
  return source(path)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

/** Import specifiers, ignoring anything inside a comment. */
function imports(path: string): string[] {
  return [...code(path).matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]!)
}

describe('attribution can never become authorization', () => {
  const FORBIDDEN = ['@/lib/entitlements', '@/lib/auth/session', '@/lib/auth/guard']

  it('the attribution module knows nothing about entitlements or sessions', () => {
    const found = imports('lib/liap/attribution.ts')
    for (const banned of FORBIDDEN) expect(found).not.toContain(banned)
  })

  it('the partners module knows nothing about them either', () => {
    const found = imports('lib/liap/partners.ts')
    for (const banned of FORBIDDEN) expect(found).not.toContain(banned)
  })

  it('neither module can grant anything', () => {
    // The blunt version of the same claim, in case a future refactor reaches
    // the entitlement layer by a path these import checks do not cover.
    //
    // Asserted against the code with comments stripped: both files DISCUSS
    // grantEntitlement at length, precisely because not calling it is the
    // point. Matching raw text would fail on the documentation that exists to
    // explain the rule.
    for (const path of ['lib/liap/attribution.ts', 'lib/liap/partners.ts']) {
      expect(code(path)).not.toContain('grantEntitlement')
      expect(code(path)).not.toContain('hasEntitlement')
    }
  })

  it('the entitlement layer knows nothing about partners', () => {
    // The other direction. If entitlements ever read a referral code, the
    // public string on the postcard would have become an input to access.
    const text = code('lib/entitlements.ts')
    expect(text).not.toContain('partner')
    expect(text).not.toContain('referral')
  })
})

describe('campaign goals can never become logic', () => {
  it('the goals module is imported by nothing that makes decisions', () => {
    // Goals are business planning assumptions. "Hide the donate button once we
    // hit target" is the request that quietly kills this rule, and it would
    // show up as an import of this module from a route or a component.
    const { execSync } = require('child_process') as typeof import('child_process')
    const hits = execSync(
      `grep -rl "liap/goals" app components lib --include=*.ts --include=*.tsx || true`,
      { cwd: process.cwd(), encoding: 'utf8' }
    )
      .split('\n')
      .filter(Boolean)
      .filter((f) => f !== 'lib/liap/goals.ts')

    expect(hits).toEqual([])
  })

  it('reads targets and derives results, with no way to type a result', () => {
    const text = code('lib/liap/goals.ts')
    // The three targets are selected from the goals table…
    expect(text).toContain('cash_goal')
    // …and the three results are computed, never accepted as parameters.
    expect(text).toContain('sum(amount)')
    expect(text).not.toMatch(/cashReceived\s*[:?]\s*number\s*\n?\s*\)/)
  })
})

describe('the destination allow-list', () => {
  it('resolves every known key to an internal LIAP path', () => {
    for (const [key, path] of Object.entries(PARTNER_DESTINATIONS)) {
      expect(destinationPath(key)).toBe(path)
      expect(path.startsWith('/life-is-a-project')).toBe(true)
    }
  })

  it('refuses anything that is not on it', () => {
    // The open-redirect defence. A partner stores a KEY, never a URL, so
    // there is no value an owner could type that sends a visitor off-site.
    for (const attempt of [
      'https://evil.example.com',
      '//evil.example.com',
      '/../../etc/passwd',
      'javascript:alert(1)',
      'http://wisergenerations.com.evil.example.com',
      '',
      null,
      undefined,
    ]) {
      expect(destinationPath(attempt)).toBe('/life-is-a-project')
    }
  })

  it('never returns anything that leaves the site', () => {
    const paths = Object.values(PARTNER_DESTINATIONS)
    for (const p of paths) {
      expect(p.startsWith('/')).toBe(true)
      expect(p.startsWith('//')).toBe(false)
      expect(p).not.toContain(':')
    }
  })
})

describe('referral code shape', () => {
  it('accepts codes a human would print on a sign', () => {
    for (const code of ['GRACE-CHURCH', 'bean-and-brew', 'FADES101', 'ab']) {
      expect(isWellFormedCode(code)).toBe(true)
    }
  })

  it('rejects anything that could be smuggled somewhere else', () => {
    for (const code of [
      '',
      'a',
      '../admin',
      'code with spaces',
      'semi;colon',
      'slash/path',
      'per%cent',
      'a'.repeat(60),
      '-leading',
      'trailing-',
    ]) {
      expect(isWellFormedCode(code)).toBe(false)
    }
  })
})

describe('against a real database', () => {
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

  async function seedPartner(
    code: string,
    overrides: { status?: string; destination?: string; campaign?: string } = {}
  ): Promise<string> {
    const rows = await db.query<{ id: string }>(
      `INSERT INTO partners (referral_code, partner_name, partner_type, destination_key, status, campaign)
       VALUES ($1, $2, 'coffee_shop', $3, $4, $5) RETURNING id`,
      [
        code,
        `${code} test partner`,
        overrides.destination ?? 'retreat',
        overrides.status ?? 'active',
        overrides.campaign ?? 'LIAP_COMMUNITY_CROWDFUNDING',
      ]
    )
    return rows[0]!.id
  }

  it('finds a partner however the code was capitalised', async () => {
    await seedPartner('Bean-And-Brew')
    for (const typed of ['bean-and-brew', 'BEAN-AND-BREW', 'Bean-And-Brew']) {
      expect((await findPartnerByCode(typed))?.partner_name).toBe('Bean-And-Brew test partner')
    }
  })

  it('still resolves a retired code', async () => {
    // Printed material outlives campaigns. A 404 served to somebody holding
    // the business's own postcard makes the business look broken.
    await seedPartner('LAST-SPRING', { status: 'ended' })
    expect(await findPartnerByCode('LAST-SPRING')).not.toBeNull()
  })

  it('returns null for an unknown code rather than throwing', async () => {
    expect(await findPartnerByCode('NEVER-EXISTED')).toBeNull()
  })

  it('refuses a malformed code without reaching the database', async () => {
    expect(await findPartnerByCode('../../admin')).toBeNull()
    expect(await findPartnerByCode("' OR 1=1 --")).toBeNull()
  })

  it('records a scan with no visitor identifier attached', async () => {
    // A scan is counted without consent because it is a tally of how many
    // people used a sign — not a record of who.
    const partner = await findPartnerByCode('X')
    await seedPartner('SIGN-1')
    await recordAttribution({ partner: await findPartnerByCode('SIGN-1'), eventType: 'scan' })

    const rows = await db.query<{ visitor_key: string | null; campaign: string }>(
      `SELECT visitor_key, campaign FROM attribution_events WHERE event_type = 'scan'`
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.visitor_key).toBeNull()
    // Campaign is copied at write time so editing the partner later cannot
    // rewrite what past touches were attributed to.
    expect(rows[0]!.campaign).toBe('LIAP_COMMUNITY_CROWDFUNDING')
    expect(partner).toBeNull()
  })

  it('records an unattributed scan for an unknown code', async () => {
    await recordAttribution({ partner: null, eventType: 'scan' })
    const rows = await db.query<{ partner_id: string | null }>(
      `SELECT partner_id FROM attribution_events`
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.partner_id).toBeNull()
  })

  it('refuses an event type that is not on the list', async () => {
    await recordAttribution({
      partner: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      eventType: 'purchased_everything' as any,
    })
    expect(await db.query(`SELECT 1 FROM attribution_events`)).toHaveLength(0)
  })

  it('a scan grants nothing at all', async () => {
    // The claim the whole feature rests on, asserted directly.
    await seedPartner('FREEBIE')
    await recordAttribution({ partner: await findPartnerByCode('FREEBIE'), eventType: 'scan' })

    expect(await db.query(`SELECT 1 FROM entitlements`)).toHaveLength(0)
    expect(await db.query(`SELECT 1 FROM orders`)).toHaveLength(0)
    expect(await db.query(`SELECT 1 FROM sessions`)).toHaveLength(0)
  })

  it('attributes a submitted code, and shrugs at a bad one', async () => {
    await seedPartner('POSTCARD')
    expect((await partnerFromSubmission('POSTCARD'))?.referral_code).toBe('POSTCARD')

    // A bad code must never cost somebody their enquiry.
    for (const bad of ['UNKNOWN-CODE', '', '   ', null, undefined, 42, {}]) {
      expect(await partnerFromSubmission(bad)).toBeNull()
    }
  })

  it('counts the funnel per partner', async () => {
    await seedPartner('CHURCH-A')
    await seedPartner('SHOP-B')
    const a = await findPartnerByCode('CHURCH-A')
    const b = await findPartnerByCode('SHOP-B')

    await recordAttribution({ partner: a, eventType: 'scan' })
    await recordAttribution({ partner: a, eventType: 'scan' })
    await recordAttribution({ partner: a, eventType: 'retreat_interest' })
    await recordAttribution({ partner: b, eventType: 'scan' })

    const rows = await partnerFunnel()
    const byName = Object.fromEntries(rows.map((r) => [r.partner_name, r]))

    expect(byName['CHURCH-A test partner']!.scans).toBe(2)
    expect(byName['CHURCH-A test partner']!.retreat_interest).toBe(1)
    expect(byName['SHOP-B test partner']!.scans).toBe(1)
    expect(byName['SHOP-B test partner']!.retreat_interest).toBe(0)
  })

  it('survives a database failure without throwing', async () => {
    // Attribution is measurement. A measurement failure must not take down a
    // page somebody is trying to use.
    setDbForTesting({
      query: async () => {
        throw new Error('database is on fire')
      },
    })
    await expect(recordAttribution({ partner: null, eventType: 'scan' })).resolves.toBeUndefined()
  })
})

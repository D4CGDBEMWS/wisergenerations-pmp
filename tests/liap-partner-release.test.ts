import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { PARTNER_DESTINATIONS, destinationPath, isWellFormedCode } from '@/lib/liap/partners'
import { HOUSE_REFERRAL, houseReferralInsertSql } from '@/lib/liap/house-referral'
import { isEnabled } from '@/lib/flags'

// ---------------------------------------------------------------------------
// The pre-launch stabilization release.
//
// Everything here protects one boundary: the site is live, LIAP is not
// launched, and this release must be deployable without any of that changing.
// A flag left on, a destination pointing at a retired slug, or a referral code
// that resolves before the owner says so would each break it in a different
// way.
// ---------------------------------------------------------------------------

const root = join(__dirname, '..')
const source = (rel: string) => readFileSync(join(root, rel), 'utf8')
const code = (rel: string) =>
  source(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

describe('migration numbering', () => {
  it('preserves 0005 and adds the partner work as 0006', () => {
    const files = readdirSync(join(root, 'db/migrations')).sort()
    expect(files).toContain('0005_results_email_delivery.sql')
    expect(files).toContain('0006_liap_partner_attribution.sql')
    // One migration per number. Two files sharing a prefix is how one silently
    // marks the other as already applied.
    const numbers = files.map((f) => f.slice(0, 4))
    expect(new Set(numbers).size).toBe(numbers.length)
  })

  it('creates only the partner-attribution slice', () => {
    const sql = source('db/migrations/0006_liap_partner_attribution.sql')
    for (const table of ['organizations', 'partners', 'attribution_events', 'attribution_credits']) {
      expect(sql, table).toContain(`CREATE TABLE IF NOT EXISTS ${table}`)
    }
    // Retreat, campaign and in-kind schema came from the same original file
    // and are not authorised. A migration should not create the tables for a
    // product nobody approved.
    for (const table of ['retreat_leads', 'campaign_goals', 'in_kind_contributions']) {
      expect(sql, table).not.toContain(`CREATE TABLE IF NOT EXISTS ${table}`)
    }
    // Against the statements, not the header — the comment explains what was
    // deliberately left out and naming it there is the point.
    const statements = sql.replace(/^--.*$/gm, '')
    expect(statements).not.toContain('transaction_category')
  })

  it('is additive only, so a rollback leaves it harmless', () => {
    const sql = source('db/migrations/0006_liap_partner_attribution.sql')
    for (const destructive of ['DROP TABLE', 'DROP COLUMN', 'DELETE FROM', 'TRUNCATE']) {
      expect(sql, destructive).not.toContain(destructive)
    }
  })
})

describe('the flag stays off', () => {
  it('is off with no environment set', () => {
    delete process.env.FEATURE_LIAP_PARTNERS
    expect(isEnabled('LIAP_PARTNERS')).toBe(false)
  })

  it('is off for every value that is not exactly true', () => {
    for (const value of ['', '1', 'yes', 'TRUE', 'True', 'on']) {
      process.env.FEATURE_LIAP_PARTNERS = value
      expect(isEnabled('LIAP_PARTNERS'), value).toBe(false)
    }
    delete process.env.FEATURE_LIAP_PARTNERS
  })

  it('appears in no environment file as enabled', () => {
    for (const file of ['.env.example']) {
      if (!existsSync(join(root, file))) continue
      expect(source(file), file).not.toMatch(/FEATURE_LIAP_PARTNERS\s*=\s*true/)
    }
  })

  it('gates the referral route, which 404s rather than redirecting', () => {
    const route = code('app/liap/go/[code]/route.ts')
    expect(route).toContain("isEnabled('LIAP_PARTNERS')")
    expect(route).toContain('status: 404')
    // The flag check comes before anything touches the database or builds a
    // redirect, so a disabled channel is indistinguishable from a route that
    // does not exist. Measured inside the handler, since findPartnerByCode
    // also appears in the import line at the top of the file.
    const handler = route.slice(route.indexOf('export async function GET'))
    expect(handler.indexOf("isEnabled('LIAP_PARTNERS')")).toBeLessThan(
      handler.indexOf('findPartnerByCode'),
    )
    expect(handler.indexOf("isEnabled('LIAP_PARTNERS')")).toBeLessThan(
      handler.indexOf('NextResponse.redirect'),
    )
  })

  it('is coupled to no other LIAP flag', () => {
    const route = code('app/liap/go/[code]/route.ts')
    for (const other of ['LIAP_GAME', 'LIAP_BOOK_ACTIVATION', 'LIAP_JOURNEY']) {
      expect(route, other).not.toContain(other)
    }
    expect(route).not.toContain("isEnabled('LIAP')")
  })
})

describe('destinations are canonical and cannot leave the site', () => {
  it('points every key at the live slug', () => {
    for (const [key, path] of Object.entries(PARTNER_DESTINATIONS)) {
      expect(path.startsWith('/living-is-a-project'), key).toBe(true)
      // The retired slug would work via a 308, and a printed QR should not
      // spend a redirect on a rename that happened before it was printed.
      expect(path.startsWith('/life-is-a-project/'), key).toBe(false)
    }
    expect(PARTNER_DESTINATIONS.book).toBe('/living-is-a-project/book')
  })

  it('names no page that does not exist', () => {
    for (const [key, path] of Object.entries(PARTNER_DESTINATIONS)) {
      const page = join(root, 'app', path, 'page.tsx')
      expect(existsSync(page), `${key} → ${path}`).toBe(true)
    }
  })

  it('cannot produce an off-site redirect', () => {
    // Every input, however hostile, resolves to an internal LIAP path.
    for (const attempt of [
      'https://evil.test',
      '//evil.test',
      '/../../etc/passwd',
      'javascript:alert(1)',
      '',
      null,
      undefined,
      'hub; DROP TABLE partners',
    ]) {
      const path = destinationPath(attempt as string | null | undefined)
      expect(path.startsWith('/living-is-a-project'), String(attempt)).toBe(true)
    }
  })

  it('never stores a URL, only a key', () => {
    const partners = code('lib/liap/partners.ts')
    expect(partners).not.toMatch(/https?:\/\//)
    const sql = source('db/migrations/0006_liap_partner_attribution.sql')
    expect(sql).toContain('destination_key')
    expect(sql).not.toContain('destination_url')
  })

  it('refuses a malformed code before it reaches the database', () => {
    for (const bad of ['', 'a', '-lead', 'trail-', 'has space', 'semi;colon', '../up', 'a'.repeat(49)]) {
      expect(isWellFormedCode(bad), JSON.stringify(bad)).toBe(false)
    }
    for (const good of ['grassroots', 'ab', 'Grace-Chapel', 'shop-42']) {
      expect(isWellFormedCode(good), good).toBe(true)
    }
  })
})

describe('attribution reaches a confirmed purchase', () => {
  it('carries the code from the URL into the checkout request', () => {
    const cta = code('components/liap/LiapCta.tsx')
    expect(cta).toContain("URLSearchParams(window.location.search).get('p')")
    expect(cta).toContain('JSON.stringify(referral ? { p: referral } : {})')
    // No cookie, no storage. Pressing a preorder button is an intentional act.
    for (const forbidden of ['localStorage', 'sessionStorage', 'document.cookie']) {
      expect(cta, forbidden).not.toContain(forbidden)
    }
  })

  it('validates the code before it reaches Stripe metadata', () => {
    const route = code('app/api/liap/preorder/route.ts')
    expect(route).toContain('isWellFormedCode')
    expect(route).toContain('referral')
    // Shape-checked, then passed through. Nothing branches on it.
    expect(route.indexOf('isWellFormedCode')).toBeLessThan(route.indexOf('checkout.sessions.create'))
  })

  it('credits only after payment, and only once', () => {
    const webhook = code('app/api/stripe/webhook/route.ts')
    expect(webhook).toContain('creditBookPurchase')
    // After fulfilment, inside the paid branch.
    expect(webhook.indexOf('creditBookPurchase')).toBeGreaterThan(webhook.indexOf('fulfilPreorder'))
    expect(webhook).toContain("liapSession.payment_status === 'paid'")

    const attribution = code('lib/liap/attribution.ts')
    // Stripe retries. The unique constraint is what makes a retry a no-op
    // rather than a partner credited twice for one sale.
    expect(attribution).toContain('ON CONFLICT (partner_id, basis, outcome_type, outcome_ref) DO NOTHING')
    expect(attribution).toContain('outcomeRef')

    const sql = source('db/migrations/0006_liap_partner_attribution.sql')
    expect(sql).toContain('UNIQUE (partner_id, basis, outcome_type, outcome_ref)')
  })

  it('keeps the code attached across LIAP links', () => {
    // The gap that broke the chain: a hub landing, then an ordinary internal
    // link to the book page, and the code was gone.
    const keep = code('components/liap/KeepReferral.tsx')
    expect(keep).toContain('LIAP_PREFIXES')
    for (const forbidden of ['localStorage', 'sessionStorage', 'document.cookie', 'fetch(']) {
      expect(keep, forbidden).not.toContain(forbidden)
    }
    expect(code('app/living-is-a-project/page.tsx')).toContain('<KeepReferral />')
  })

  it('never lets attribution become authorization', () => {
    // A referral code is a public string off a postcard. It must not be able
    // to grant anything.
    for (const file of ['lib/liap/partners.ts', 'lib/liap/attribution.ts', 'lib/liap/house-referral.ts']) {
      const text = code(file)
      for (const forbidden of ['entitlement', 'lib/auth', 'grantEntitlement', 'hasEntitlement']) {
        expect(text.toLowerCase(), `${file} / ${forbidden}`).not.toContain(forbidden.toLowerCase())
      }
    }
  })
})

describe('the grassroots house code', () => {
  it('matches the owner specification exactly', () => {
    expect(HOUSE_REFERRAL.referralCode).toBe('grassroots')
    expect(HOUSE_REFERRAL.partnerType).toBe('first-party')
    expect(HOUSE_REFERRAL.destinationKey).toBe('book')
    expect(destinationPath(HOUSE_REFERRAL.destinationKey)).toBe('/living-is-a-project/book')
    expect(isWellFormedCode(HOUSE_REFERRAL.referralCode)).toBe(true)
  })

  it('is a specification and not a row', () => {
    // Nothing seeds it. Scanning the code today resolves to no partner, which
    // is the safe outcome — the visitor still reaches a real page.
    const sql = source('db/migrations/0006_liap_partner_attribution.sql')
    expect(sql.toLowerCase()).not.toContain('insert into partners')
    expect(sql).not.toContain('grassroots')
    // The insert exists as text a human runs, never as something executed.
    expect(houseReferralInsertSql()).toContain('INSERT INTO partners')
    expect(code('lib/liap/house-referral.ts')).not.toContain('getDb')
  })
})

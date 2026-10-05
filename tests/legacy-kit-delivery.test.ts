import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'
import type Stripe from 'stripe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb } from './helpers/db'
import { consentProblem } from '@/lib/legacy-kit/checkout'
import {
  LEGACY_KIT_CONSENTS,
  LEGACY_KIT_CONSENT_VERSION,
  LEGACY_KIT_DOWNLOAD_LIMIT,
  LEGACY_KIT_METADATA_KEY,
} from '@/lib/legacy-kit/product'
import {
  consumeDownload,
  emailLinkOnce,
  linkState,
  purchaseBySession,
  purchaseByToken,
  recordPurchase,
  revokeForRefund,
} from '@/lib/legacy-kit/purchases'
import { downloadToken, hashToken } from '@/lib/legacy-kit/link.mjs'
import { kitEmailHtml, kitEmailText } from '@/lib/legacy-kit/email.mjs'
import { KIT_DISCLAIMERS } from '@/lib/legacy-kit/terms'

const root = process.cwd()
const read = (rel: string) => readFileSync(join(root, rel), 'utf8')

let db: Db
let close: () => Promise<void>
const savedEnv = { ...process.env }

beforeEach(async () => {
  const c = await createTestDb()
  db = c.db
  close = c.close
  setDbForTesting(db)
  process.env.LEGACY_KIT_LINK_SECRET = 'test-secret-that-is-at-least-thirty-two-characters'
  delete process.env.MAILCHIMP_TRANSACTIONAL_API_KEY
  delete process.env.LEGACY_KIT_FROM_EMAIL
})
afterEach(async () => {
  setDbForTesting(null)
  await close()
  process.env = { ...savedEnv }
  vi.unstubAllGlobals()
})

function kitSession(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    id: 'cs_test_kit_1',
    object: 'checkout.session',
    created: 1_791_000_000,
    payment_status: 'paid',
    payment_intent: 'pi_test_kit_1',
    customer_details: { email: 'family@example.com' },
    metadata: {
      product: LEGACY_KIT_METADATA_KEY,
      consent_version: LEGACY_KIT_CONSENT_VERSION,
      consent_at: '2026-10-04T22:00:00.000Z',
    },
    ...overrides,
  } as unknown as Stripe.Checkout.Session
}

describe('checkout consent, checked on the server', () => {
  it('refuses unless both boxes are ticked', () => {
    expect(consentProblem(null)).toMatch(/tick both/)
    expect(consentProblem({ notices: true, waiver: false, consentVersion: LEGACY_KIT_CONSENT_VERSION })).toMatch(/tick both/)
    expect(consentProblem({ notices: 'true', waiver: true, consentVersion: LEGACY_KIT_CONSENT_VERSION })).toMatch(/tick both/)
  })

  it('refuses a page showing old wording', () => {
    expect(consentProblem({ notices: true, waiver: true, consentVersion: 'kit-consent-1999-01-01' })).toMatch(/updated/)
  })

  it('accepts both boxes with the current wording', () => {
    expect(consentProblem({ notices: true, waiver: true, consentVersion: LEGACY_KIT_CONSENT_VERSION })).toBeNull()
  })

  it('pins the wording to its version — change one, change both', () => {
    const digest = createHash('sha256').update(JSON.stringify(LEGACY_KIT_CONSENTS)).digest('hex').slice(0, 16)
    expect({ version: LEGACY_KIT_CONSENT_VERSION, digest }).toEqual({
      version: 'kit-consent-2026-10-04',
      digest: createHash('sha256')
        .update(
          JSON.stringify({
            notices:
              'I have read the Important Notices and Terms of Sale. I understand this kit is educational and not legal, tax or financial advice.',
            waiver:
              'I agree that my download starts immediately and I understand I lose my 14-day right to cancel once the download begins.',
          })
        )
        .digest('hex')
        .slice(0, 16),
    })
  })
})

describe('recording a purchase', () => {
  it('stores the consent and only a fingerprint of the link', async () => {
    const { link } = await recordPurchase(kitSession())
    const token = new URL(link).searchParams.get('t')!
    const rows = await db.query<Record<string, unknown>>(`SELECT * FROM legacy_kit_purchases`)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.consent_version).toBe(LEGACY_KIT_CONSENT_VERSION)
    expect(new Date(rows[0]!.consent_at as string).toISOString()).toBe('2026-10-04T22:00:00.000Z')
    expect(rows[0]!.download_token_hash).toBe(hashToken(token))
    expect(JSON.stringify(rows[0])).not.toContain(token)
  })

  it('is idempotent and never restarts the clock (webhook and thank-you page both call it)', async () => {
    await recordPurchase(kitSession())
    await db.query(`UPDATE legacy_kit_purchases SET expires_at = now() + interval '1 hour', downloads_used = 2`)
    const again = await recordPurchase(kitSession())
    expect(again.purchase.downloadsUsed).toBe(2)
    expect(again.purchase.expiresAt.getTime() - Date.now()).toBeLessThan(2 * 3600_000)
    expect((await db.query(`SELECT id FROM legacy_kit_purchases`)).length).toBe(1)
  })

  it('gives the webhook and the thank-you page the same link', async () => {
    const a = await recordPurchase(kitSession())
    const b = await recordPurchase(kitSession())
    expect(a.link).toBe(b.link)
    expect(a.link).toContain(`/legacy-kit/download?t=${downloadToken('cs_test_kit_1')}`)
  })

  it('refuses an unpaid session or another product', async () => {
    await expect(recordPurchase(kitSession({ payment_status: 'unpaid' }))).rejects.toThrow()
    await expect(recordPurchase(kitSession({ metadata: { product: 'liap-book-preorder' } }))).rejects.toThrow()
  })
})

describe('the download link', () => {
  it(`allows ${LEGACY_KIT_DOWNLOAD_LIMIT} downloads, then stops`, async () => {
    await recordPurchase(kitSession())
    const token = downloadToken('cs_test_kit_1')
    for (let i = LEGACY_KIT_DOWNLOAD_LIMIT - 1; i >= 0; i--) {
      expect(await consumeDownload(token)).toEqual({ ok: true, remaining: i })
    }
    expect(await consumeDownload(token)).toEqual({ ok: false, state: 'used-up' })
  })

  it('cannot be over-used by clicks arriving at once', async () => {
    await recordPurchase(kitSession())
    const token = downloadToken('cs_test_kit_1')
    const results = await Promise.all(Array.from({ length: 9 }, () => consumeDownload(token)))
    expect(results.filter((r) => r.ok)).toHaveLength(LEGACY_KIT_DOWNLOAD_LIMIT)
  })

  it('stops working after 72 hours', async () => {
    await recordPurchase(kitSession())
    const p = await purchaseBySession('cs_test_kit_1')
    const hours = (p!.expiresAt.getTime() - Date.now()) / 3600_000
    expect(hours).toBeGreaterThan(71.9)
    expect(hours).toBeLessThanOrEqual(72)
    await db.query(`UPDATE legacy_kit_purchases SET expires_at = now() - interval '1 minute'`)
    expect(await consumeDownload(downloadToken('cs_test_kit_1'))).toEqual({ ok: false, state: 'expired' })
  })

  it('is cancelled by a refund', async () => {
    await recordPurchase(kitSession())
    expect(await revokeForRefund('pi_test_kit_1')).toBe(1)
    expect(await consumeDownload(downloadToken('cs_test_kit_1'))).toEqual({ ok: false, state: 'revoked' })
    expect(await revokeForRefund('pi_other')).toBe(0)
  })

  it('opening the page uses nothing; a made-up token finds nothing', async () => {
    await recordPurchase(kitSession())
    const token = downloadToken('cs_test_kit_1')
    await purchaseByToken(token)
    expect((await purchaseByToken(token))!.downloadsUsed).toBe(0)
    expect(linkState(await purchaseByToken('x'.repeat(43)))).toBe('not-found')
    expect(await consumeDownload('../../etc/passwd')).toEqual({ ok: false, state: 'not-found' })
  })
})

describe('the delivery email (Mailchimp Transactional)', () => {
  function configure() {
    process.env.MAILCHIMP_TRANSACTIONAL_API_KEY = 'md-test'
    process.env.LEGACY_KIT_FROM_EMAIL = 'kit@wisergenerations.com'
  }

  it('sends once, even when the webhook is replayed', async () => {
    configure()
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([{ email: 'family@example.com', status: 'sent' }])))
    vi.stubGlobal('fetch', fetchMock)
    const { link } = await recordPurchase(kitSession())
    expect(await emailLinkOnce('cs_test_kit_1', link)).toBe('sent')
    expect(await emailLinkOnce('cs_test_kit_1', link)).toBe('already')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://mandrillapp.com/api/1.0/messages/send.json')
    const body = JSON.parse(String(init.body))
    expect(body.message.to).toEqual([{ email: 'family@example.com', type: 'to' }])
    expect(body.message.track_clicks).toBe(false)
    expect(body.message.track_opens).toBe(false)
    expect(body.message.html).toContain(link.replace(/&/g, '&amp;'))
  })

  it('lets Stripe retry when Mailchimp rejects the email', async () => {
    configure()
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([{ status: 'rejected', reject_reason: 'unsigned' }]))))
    const { link } = await recordPurchase(kitSession())
    await expect(emailLinkOnce('cs_test_kit_1', link)).rejects.toThrow(/rejected \(unsigned\)/)
    const row = await db.query<{ email_sent_at: string | null }>(`SELECT email_sent_at FROM legacy_kit_purchases`)
    expect(row[0]!.email_sent_at).toBeNull()
  })

  it('sends nothing, and claims nothing, when Mailchimp is not configured', async () => {
    const { link } = await recordPurchase(kitSession())
    expect(await emailLinkOnce('cs_test_kit_1', link)).toBe('not-configured')
  })

  it('confirms the EU/UK waiver and the no-refund policy in writing', () => {
    for (const body of [
      kitEmailHtml({ link: 'https://x/l', hours: 72, limit: 5 }),
      kitEmailText({ link: 'https://x/l', hours: 72, limit: 5 }),
    ]) {
      expect(body).toContain('you lose your 14-day right to cancel once the download begins')
      expect(body).toContain('all sales are final')
      expect(body).toContain('Educational only — not legal, tax or financial advice.')
      expect(body).toContain('72 hours')
    }
  })
})

describe('wiring', () => {
  it('keeps kit buyers out of the PMP Mailchimp audience tagging', () => {
    const webhook = read('app/api/stripe/webhook/route.ts')
    expect(webhook).toMatch(/event\.type === 'payment_intent\.succeeded' &&\s*!isKitMetadata/)
  })

  it('records the purchase and emails it from the webhook, and revokes on refund', () => {
    const webhook = read('app/api/stripe/webhook/route.ts')
    expect(webhook).toContain('await recordPurchase(kitSession)')
    expect(webhook).toContain('await emailLinkOnce(kitSession.id, link)')
    expect(webhook).toContain('await revokeForRefund(')
  })

  it('refuses a live Stripe key unless LEGACY_KIT_LIVE is true', () => {
    expect(read('app/api/legacy-kit/checkout/route.ts')).toContain(
      "secret.startsWith('sk_live_') && process.env.LEGACY_KIT_LIVE !== 'true'"
    )
  })

  it('downloads only by POST, and traces the private PDF into that function', () => {
    const route = read('app/api/legacy-kit/download/route.ts')
    expect(route).toMatch(/export async function POST/)
    expect(route).not.toMatch(/export async function GET/)
    expect(read('next.config.mjs')).toContain("'/api/legacy-kit/download': ['./private/wgi-legacy-kit.pdf']")
  })

  it('describes the kit in the privacy policy only while the kit is switched on', () => {
    expect(read('app/privacy-policy/page.tsx')).toMatch(/isEnabled\('LEGACY_KIT'\) && \(/)
  })
})

describe('the draft Terms of Sale', () => {
  const page = read('app/legacy-kit/terms-of-sale/page.tsx')

  it('is marked as a draft pending attorney review', () => {
    expect(page).toContain('DRAFT — pending attorney review')
  })

  it('carries disclaimers 1–11, with the owner’s no-refund choice', () => {
    expect(KIT_DISCLAIMERS.map((d) => d.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(KIT_DISCLAIMERS[10]!.paras).toEqual([
      'Because the Kit is a digital download delivered immediately, all sales are final.',
    ])
    expect(JSON.stringify(KIT_DISCLAIMERS)).not.toContain('[Alternative')
  })
})

describe('the partners page and short links', () => {
  it('publishes no example prices from the launch plan', () => {
    const page = read('app/legacy-kit/partners/page.tsx')
    expect(page).not.toMatch(/\$15|25 or more/)
    expect(page).toContain('partner license')
  })

  it('adds /partners and /terms-of-sale only to builds with the kit switched on', () => {
    const config = read('next.config.mjs')
    expect(config).toMatch(/process\.env\.FEATURE_LEGACY_KIT === 'true'\s*\?\s*\[\s*\{ source: '\/terms-of-sale'/)
  })
})

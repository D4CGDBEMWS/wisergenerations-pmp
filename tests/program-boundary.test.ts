import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  PROGRAMS,
  PROGRAM_ENTITLEMENTS,
  identifyProduct,
  identifyCheckoutSession,
  identifySubscription,
  productByMarker,
  productGrants,
  studyAccessPriceIds,
} from '@/lib/programs'
import { STUDY_ACCESS } from '@/lib/entitlements'
import { LIAP_ASSESSMENT_ACCESS, LIAP_BOOK_PREORDER } from '@/lib/liap/entitlements'
import {
  LOGIN_PRODUCTS,
  resolveRedirect,
  allowedDestinations,
  productForDestination,
} from '@/lib/auth/login-token'
import {
  programLogin,
  readProgram,
  firstNameOf,
  loginEmailHtml,
  loginEmailText,
} from '@/lib/auth/program-login'

// ---------------------------------------------------------------------------
// The Wiser Generations program boundary.
//
// Owner ruling, 22 August 2026. Five invariants, locked here rather than
// remembered:
//
//   Payment does not imply product.
//   Subscription does not imply program.
//   Identity does not imply entitlement.
//   Authentication does not imply authorization.
//   Access to one Wiser Generations program does not imply access to another.
//
// Every test below fails in the direction that matters. A boundary defect that
// fails closed is an inconvenience somebody reports; one that fails open is a
// product given away silently, which is exactly how all three corrected
// defects behaved.
//
// Boot Camp appears here as a NEGATIVE fixture only. Nothing in this suite or
// in lib/programs creates it — it is the thing the architecture must refuse to
// invent, and these tests prove it refuses.
// ---------------------------------------------------------------------------

const root = join(__dirname, '..')
const source = (rel: string) => readFileSync(join(root, rel), 'utf8')

/** Strips comments, so a test asserting absence cannot match prose about it. */
const code = (rel: string) =>
  source(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const paid = (metadata: Record<string, string> | null, extra: Record<string, unknown> = {}) =>
  ({ metadata, payment_status: 'paid', id: 'cs_test_1', ...extra }) as never

let savedEnv: Record<string, string | undefined>

beforeEach(() => {
  savedEnv = {
    price: process.env.NEXT_PUBLIC_STRIPE_STUDY_PRICE_ID,
    legacy: process.env.STRIPE_STUDY_LEGACY_PRICE_IDS,
  }
})

afterEach(() => {
  if (savedEnv.price === undefined) delete process.env.NEXT_PUBLIC_STRIPE_STUDY_PRICE_ID
  else process.env.NEXT_PUBLIC_STRIPE_STUDY_PRICE_ID = savedEnv.price
  if (savedEnv.legacy === undefined) delete process.env.STRIPE_STUDY_LEGACY_PRICE_IDS
  else process.env.STRIPE_STUDY_LEGACY_PRICE_IDS = savedEnv.legacy
})

// ---------------------------------------------------------------------------

describe('payment does not imply product', () => {
  it('grants nothing for a paid session with no metadata at all', () => {
    expect(identifyCheckoutSession(paid(null))).toBeNull()
    expect(productGrants(identifyCheckoutSession(paid(null)), STUDY_ACCESS)).toBe(false)
  })

  it('grants nothing for a paid session whose metadata names nothing we know', () => {
    const cases: Array<Record<string, string>> = [
      {},
      { product: '' },
      { product: 'something-else' },
      { tier: 'premium' },
      { note: 'study-access' }, // right value, wrong key
      { product: 'STUDY-ACCESS' }, // markers are exact, not case-folded
    ]
    for (const metadata of cases) {
      expect(
        productGrants(identifyCheckoutSession(paid(metadata)), STUDY_ACCESS),
        JSON.stringify(metadata)
      ).toBe(false)
    }
  })

  it('is the defect that made a book buyer a PMP customer', () => {
    // B-1, stated as the scenario. Every LIAP book buyer receives a real,
    // paid session id on their own success page.
    const liapBookSession = paid({ product: 'liap-book-preorder' })
    expect(identifyCheckoutSession(liapBookSession)!.program).toBe('liap')
    expect(productGrants(identifyCheckoutSession(liapBookSession), STUDY_ACCESS)).toBe(false)
  })

  it('does not consult payment status, amount or mode to decide what was bought', () => {
    // Identification and payment are separate questions; callers ask both.
    const unpaidStudy = { metadata: { product: 'study-access' }, payment_status: 'unpaid' } as never
    expect(identifyCheckoutSession(unpaidStudy)!.program).toBe('study')
  })
})

describe('subscription does not imply program', () => {
  it('grants nothing for a subscription checkout with no product marker', () => {
    // B-2 exactly: `Boolean(session.subscription)` used to be enough.
    const anySubscription = paid(null, { subscription: 'sub_123', mode: 'subscription' })
    expect(productGrants(identifyCheckoutSession(anySubscription), STUDY_ACCESS)).toBe(false)
  })

  it('grants nothing for a LIAP, Retreat, coaching or Boot Camp subscription', () => {
    for (const marker of [
      'liap-retreat-registration',
      'liap-coaching-monthly',
      'wg-boot-camp',
      'boot-camp-payment-plan',
    ]) {
      const sub = { metadata: { product: marker }, items: { data: [] } }
      expect(productGrants(identifySubscription(sub), STUDY_ACCESS), marker).toBe(false)
    }
  })

  it('grants nothing for a subscription on an unrecognised price', () => {
    process.env.NEXT_PUBLIC_STRIPE_STUDY_PRICE_ID = 'price_study'
    delete process.env.STRIPE_STUDY_LEGACY_PRICE_IDS
    const sub = { metadata: {}, items: { data: [{ price: { id: 'price_bootcamp' } }] } }
    expect(productGrants(identifySubscription(sub), STUDY_ACCESS)).toBe(false)
  })

  it('grants nothing when no Study Access price is configured', () => {
    // Fails closed on missing configuration rather than falling back to
    // "it is a subscription, so it must be Study Access".
    delete process.env.NEXT_PUBLIC_STRIPE_STUDY_PRICE_ID
    delete process.env.STRIPE_STUDY_LEGACY_PRICE_IDS
    expect(studyAccessPriceIds()).toEqual([])
    const sub = { metadata: {}, items: { data: [{ price: { id: 'price_study' } }] } }
    expect(productGrants(identifySubscription(sub), STUDY_ACCESS)).toBe(false)
  })

  it('no longer treats the mere existence of a subscription as Study Access', () => {
    // The shortcut, gone from both places it lived.
    expect(code('app/api/stripe/webhook/route.ts')).not.toContain('Boolean(s2.subscription)')
    expect(code('app/api/access/login/route.ts')).not.toContain('subs.data.length > 0')
  })
})

describe('existing Study Access behaviour is preserved', () => {
  it('recognises the one-time PMP Practice Studio purchase', () => {
    // /api/access writes metadata.product.
    expect(productGrants(identifyCheckoutSession(paid({ product: 'pmp-practice-studio' })), STUDY_ACCESS)).toBe(true)
  })

  it('recognises the $49/month subscription by its tier marker', () => {
    // /api/checkout-subscription writes metadata.tier — NOT metadata.product.
    // This is the case that would have regressed had the fix required
    // `product`, and the reason the old shortcut existed at all.
    expect(productGrants(identifyCheckoutSession(paid({ tier: 'study-access' })), STUDY_ACCESS)).toBe(true)
    const sub = { metadata: { tier: 'study-access' }, items: { data: [] } }
    expect(productGrants(identifySubscription(sub), STUDY_ACCESS)).toBe(true)
  })

  it('recognises a grandfathered subscription by its price id', () => {
    process.env.NEXT_PUBLIC_STRIPE_STUDY_PRICE_ID = 'price_study'
    const sub = { metadata: {}, items: { data: [{ price: { id: 'price_study' } }] } }
    expect(productGrants(identifySubscription(sub), STUDY_ACCESS)).toBe(true)
  })

  it('recognises a subscription on a retired price, once the owner lists it', () => {
    process.env.NEXT_PUBLIC_STRIPE_STUDY_PRICE_ID = 'price_study'
    process.env.STRIPE_STUDY_LEGACY_PRICE_IDS = ' price_old_2024 , price_old_2025 '
    const sub = { metadata: {}, items: { data: [{ price: { id: 'price_old_2025' } }] } }
    expect(productGrants(identifySubscription(sub), STUDY_ACCESS)).toBe(true)
    expect(studyAccessPriceIds()).toContain('price_old_2024')
  })

  it('still matches the live checkout routes, so the markers are not guesses', () => {
    expect(code('app/api/access/route.ts')).toContain("product: 'pmp-practice-studio'")
    expect(code('app/api/checkout-subscription/route.ts')).toContain("tier: 'study-access'")
    expect(code('lib/liap/product.ts')).toContain("metadataKey: 'liap-book-preorder'")
  })
})

describe('access to one program does not imply access to another', () => {
  it('gives every program its own capability set, sharing none', () => {
    const seen = new Set<string>()
    for (const program of PROGRAMS) {
      for (const key of PROGRAM_ENTITLEMENTS[program]) {
        expect(seen.has(key), `${key} is claimed by more than one program`).toBe(false)
        seen.add(key)
      }
    }
  })

  it('keeps the capability keys in step with the exported constants', () => {
    expect(PROGRAM_ENTITLEMENTS.study).toEqual([STUDY_ACCESS])
    expect(PROGRAM_ENTITLEMENTS.liap).toEqual([LIAP_ASSESSMENT_ACCESS, LIAP_BOOK_PREORDER])
  })

  it('models a program as one OR MORE capabilities, not exactly one', () => {
    // Owner ruling: do not assume one program equals one entitlement.
    expect(PROGRAM_ENTITLEMENTS.liap.length).toBeGreaterThan(1)
  })

  it('never lets a product of one program authorize another program', () => {
    for (const from of PROGRAMS) {
      for (const to of PROGRAMS) {
        if (from === to) continue
        const marker = from === 'study' ? 'study-access' : 'liap-book-preorder'
        const identity = productByMarker(marker)!
        for (const foreignKey of PROGRAM_ENTITLEMENTS[to]) {
          expect(productGrants(identity, foreignKey), `${marker} → ${foreignKey}`).toBe(false)
        }
      }
    }
  })

  it('does not know Boot Camp exists, and does not invent it', () => {
    // Boot Camp is a separate future program. Nothing here creates it, and an
    // unrecognised program inherits nothing.
    expect(PROGRAMS).not.toContain('bootcamp' as never)
    expect(productByMarker('wg-boot-camp')).toBeNull()
    expect(productGrants(productByMarker('wg-boot-camp'), STUDY_ACCESS)).toBe(false)
    expect(productGrants(productByMarker('wg-boot-camp'), LIAP_ASSESSMENT_ACCESS)).toBe(false)
  })
})

describe('authentication does not imply authorization', () => {
  it('keeps sign-in destinations scoped to their program', () => {
    // The magic-link half of the same principle, proved in both directions.
    for (const product of LOGIN_PRODUCTS) {
      for (const other of LOGIN_PRODUCTS.filter((p) => p !== product)) {
        for (const path of allowedDestinations(other)) {
          expect(resolveRedirect(path, product)).not.toBe(path)
        }
      }
    }
  })

  it('gates each program on its own entitlement, never on a session alone', () => {
    // A session is identity. Authorization is a per-key entitlement lookup,
    // and each guard names the key it needs.
    expect(code('app/exam-simulator/layout.tsx')).toContain('STUDY_ACCESS')
    expect(code('app/flashcards/layout.tsx')).toContain('STUDY_ACCESS')
    expect(code('lib/liap/entitlements.ts')).toContain('LIAP_ASSESSMENT_ACCESS')
    // The LIAP guard must not consult the PMP key, in either direction.
    expect(code('lib/liap/entitlements.ts')).not.toContain('STUDY_ACCESS')
  })
})

describe('the corrected grant paths ask before they grant', () => {
  it('identifies the product on the success page before granting', () => {
    const page = code('app/access/success/page.tsx')
    expect(page).toContain('identifyCheckoutSession')
    expect(page).toContain('productGrants(product, STUDY_ACCESS)')
  })

  it('identifies the product in the webhook before granting', () => {
    expect(code('app/api/stripe/webhook/route.ts')).toContain('productGrants(product, STUDY_ACCESS)')
  })

  it('identifies the subscription in the sign-in backfill before granting', () => {
    expect(code('app/api/access/login/route.ts')).toContain('identifySubscription')
  })

  it('keeps LIAP fulfilment on its own marker, untouched', () => {
    expect(code('lib/liap/fulfilment.ts')).toContain('LIAP_BOOK.metadataKey')
    expect(code('app/api/stripe/webhook/route.ts')).toContain('isLiapPreorder')
  })
})

// ---------------------------------------------------------------------------
// Transaction Reference ≠ Authentication.
//
// Owner ruling, 22 August 2026. A Stripe checkout session id is transaction
// evidence. It is not a secret and it is not identity proof: it sits in the
// buyer's address bar, their browser history, a screenshot sent to support, a
// link pasted to a colleague.
//
// /access/success used to mint an authenticated session for whoever held one.
// These tests assert the mechanism is gone from the source, because the
// property is an absence and an absence is what a refactor quietly restores.
// ---------------------------------------------------------------------------

describe('transaction reference does not authenticate', () => {
  const successPage = code('app/access/success/page.tsx')

  it('opens no session on the confirmation page', () => {
    expect(successPage).not.toContain('createSession')
    expect(successPage).not.toContain('SESSION_COOKIE')
    expect(successPage).not.toContain('sessionCookieOptions')
  })

  it('sets no cookie at all', () => {
    // cookies() was imported for exactly one purpose. Its absence is the proof.
    expect(successPage).not.toContain("from 'next/headers'")
    expect(successPage).not.toContain('cookieStore')
  })

  it('still records the entitlement, which authorizes nobody on its own', () => {
    // The grant attaches to the address Stripe says paid, never to the
    // visitor. Authorization without authentication is inert.
    expect(successPage).toContain('grantEntitlement')
    expect(successPage).toContain('productGrants(product, STUDY_ACCESS)')
  })

  it('routes the visitor to the login flow to become authenticated', () => {
    expect(successPage).toContain("href=\"/access/login\"")
  })

  it('still confirms the purchase, which is what the page is for', () => {
    expect(successPage).toContain('You are In!')
    expect(successPage).toContain('payment_status')
  })

  it('leaves the magic link as the only thing that opens a session', () => {
    // One authentication path across every program: a single-use token sent
    // to an address, consumed atomically.
    const login = code('app/api/access/login/route.ts')
    expect(login).toContain('consumeLoginToken')
    expect(login).toContain('createSession')
  })
})

describe('program-aware sign-in cannot become privilege escalation', () => {
  it('derives the required entitlement from the program, never from the caller', () => {
    expect(programLogin('study').entitlementKey).toBe(STUDY_ACCESS)
    expect(programLogin('liap').entitlementKey).toBe(LIAP_ASSESSMENT_ACCESS)
  })

  it('gives each program a distinct required entitlement', () => {
    const keys = LOGIN_PRODUCTS.map((p) => programLogin(p).entitlementKey)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('falls back to Study Access for an absent or unrecognised program', () => {
    // Every existing caller sends no program at all, and must keep working.
    for (const raw of [undefined, null, '', '   ', 'bootcamp', 'admin', 42, {}]) {
      expect(readProgram(raw)).toBe('study')
    }
    expect(readProgram('liap')).toBe('liap')
  })

  it('does not let a program name choose another program\u2019s destination', () => {
    for (const product of LOGIN_PRODUCTS) {
      const destination = programLogin(product).defaultDestination
      expect(productForDestination(destination)).toBe(product)
      expect(allowedDestinations(product)).toContain(destination)
    }
  })

  it('checks the program\u2019s entitlement on both halves of the flow', () => {
    const login = code('app/api/access/login/route.ts')
    // POST: which entitlement is required comes from programLogin(program).
    expect(login).toContain('hasEntitlement(existing.id, config.entitlementKey)')
    // GET: asked again, because a grant can be revoked between send and click.
    expect(login).toContain('hasEntitlement(customer.id, config.entitlementKey)')
    // And the hardcoded single-program gate is gone.
    expect(login).not.toContain('hasEntitlement(customer.id, STUDY_ACCESS)')
  })

  it('runs the Stripe reconciliation for Study Access only', () => {
    // No other program has a backfill, and none should acquire one by
    // accident: a reconciliation that ran for every program would be a third
    // place for "payment implies product" to come back.
    expect(code('app/api/access/login/route.ts')).toContain("program === 'study'")
  })

  it('keeps the login product set and the program set in step', () => {
    expect([...LOGIN_PRODUCTS].sort()).toEqual([...PROGRAMS].sort())
  })
})

describe('program-aware email language', () => {
  const url = 'https://www.wisergenerations.com/api/access/login?token=abc'

  it('uses the owner-approved LIAP wording, verbatim', () => {
    const liap = programLogin('liap')
    expect(liap.emailSubject).toBe('Your secure LIAP access link')
    expect(liap.emailIntro).toBe('Use the secure link below to continue your LIAP journey.')
    expect(liap.emailCta).toBe('CONTINUE MY LIAP JOURNEY')
    expect(liap.emailIgnore).toBe('If you didn\u2019t request this link, you can ignore this email.')
  })

  it('never mentions another program in a LIAP email', () => {
    const html = loginEmailHtml('liap', url, 'Crystal')
    const text = loginEmailText('liap', url, 'Crystal')
    for (const body of [html, text]) {
      expect(body).not.toContain('Study Access')
      expect(body).not.toContain('PMP')
      expect(body).not.toContain('exam')
    }
  })

  it('keeps Study Access email language unchanged', () => {
    expect(programLogin('study').emailSubject).toBe(
      'Your Wiser Generations Study Access login link'
    )
    expect(loginEmailText('study', url, null)).toContain('Study Access')
  })

  it('preserves the expiry and single-use facts in every program', () => {
    // Mechanism, not marketing: the same fact for everybody, and it must
    // survive any rewording of the lines around it.
    for (const product of LOGIN_PRODUCTS) {
      expect(loginEmailHtml(product, url, null)).toContain('15 minutes')
      expect(loginEmailText(product, url, null)).toContain('expires in 15 minutes')
    }
  })

  it('greets by first name, and omits the greeting rather than getting it wrong', () => {
    expect(firstNameOf('Crystal Glover Stewart')).toBe('Crystal')
    expect(firstNameOf('  ')).toBeNull()
    expect(firstNameOf(null)).toBeNull()
    expect(loginEmailHtml('liap', url, 'Crystal')).toContain('Hi Crystal,')
    expect(loginEmailHtml('liap', url, null)).not.toContain('Hi ,')
    expect(loginEmailText('liap', url, null)).not.toContain('Hi ,')
  })

  it('escapes a name rather than letting it become markup', () => {
    expect(loginEmailHtml('liap', url, '<script>')).not.toContain('<script>')
    expect(loginEmailHtml('liap', url, '<script>')).toContain('&lt;script&gt;')
  })
})

describe('program-specific entry experience', () => {
  it('gives LIAP its own sign-in page with the approved copy', () => {
    const page = source('app/life-is-a-project/access/page.tsx')
    expect(page).toContain('Continue Your LIAP Journey')
    expect(page).toContain('Enter the email associated with your LIAP access')
  })

  it('asks for LIAP by name from the LIAP form', () => {
    expect(code('components/liap/LiapAccessForm.tsx')).toContain("program: 'liap'")
  })

  it('sends a signed-out reader to the LIAP page, not the Study Access one', () => {
    const assessment = code('app/life-is-a-project/assessment/page.tsx')
    expect(assessment).toContain("redirect('/life-is-a-project/access')")
    expect(assessment).not.toContain('/access/login')
  })

  it('answers identically whether or not the address has access', () => {
    // No enumeration of customers, and none of which programs they belong to.
    const form = code('components/liap/LiapAccessForm.tsx')
    expect(form).toContain('If that address has LIAP access')
    expect(code('app/api/access/login/route.ts')).toContain('return NextResponse.json({ ok: true })')
  })
})

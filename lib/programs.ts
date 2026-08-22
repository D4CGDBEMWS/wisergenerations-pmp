import type Stripe from 'stripe'

// ---------------------------------------------------------------------------
// Program identity.
//
// Owner ruling, 22 August 2026 — the Program Boundary directive:
//
//   Payment does not imply product.
//   Subscription does not imply program.
//   Identity does not imply entitlement.
//   Authentication does not imply authorization.
//   Access to one Wiser Generations program does not imply access to another.
//
// Three grant paths used to violate the first two. The success page granted
// Study Access to any paid Stripe session, whatever it was for; the webhook
// and the sign-in backfill both treated "Stripe says subscription" as "this is
// Study Access". Subscription is a billing arrangement. It says how somebody
// pays, not what they bought.
//
// This module is the single place that answers "what product is this, and
// which program does it belong to?" — and it answers null far more readily
// than it answers a program. Absent, unknown, malformed or foreign
// identification all resolve to null, and every caller treats null as "grant
// nothing".
//
// ── WHY THE MARKERS LOOK INCONSISTENT ──────────────────────────────────────
//
// Three live checkout flows write three different things, and all three are
// legitimate:
//
//   /api/access               metadata.product = 'pmp-practice-studio'
//   /api/checkout-subscription  metadata.tier  = 'study-access'
//   /api/liap/preorder        metadata.product = 'liap-book-preorder'
//
// The subscription flow has never written `product`, which is precisely why
// the webhook needed `Boolean(session.subscription)` to recognise it — and
// that shortcut is the defect. So both keys are read here. Normalising the
// checkout routes to one key would be the tidier change and a riskier one: it
// would strand every subscription already in flight. The mess is recorded,
// not swept up.
//
// ── PROGRAM → ONE OR MORE ENTITLEMENTS ─────────────────────────────────────
//
// Owner ruling: do not assume one program grants exactly one entitlement. The
// shape below is program → a set of capability keys, which is already true of
// LIAP and costs nothing to express. It is data, not schema — see the
// structural analysis in the report.
//
// ── BOOT CAMP IS DELIBERATELY ABSENT ───────────────────────────────────────
//
// Boot Camp is a separate future Wiser Generations program and nothing here
// creates it. Its role is to be the thing this module refuses to invent: a
// test asserts that an unrecognised marker — including a Boot Camp-shaped one
// — grants nothing at all rather than inheriting Study Access.
// ---------------------------------------------------------------------------

export const PROGRAMS = ['study', 'liap'] as const
export type ProgramKey = (typeof PROGRAMS)[number]

/**
 * The capabilities each program authorizes.
 *
 * String literals rather than imported constants, so this module stays free of
 * the LIAP and auth import graphs and can be reasoned about on its own. A test
 * asserts every value here equals its exported constant, so the two cannot
 * drift apart without failing the build.
 */
export const PROGRAM_ENTITLEMENTS: Record<ProgramKey, readonly string[]> = {
  study: ['STUDY_ACCESS'],
  liap: ['LIAP_ASSESSMENT_ACCESS', 'LIAP_BOOK_PREORDER'],
}

export interface ProductIdentity {
  /** The marker as written by the checkout route that created the payment. */
  readonly marker: string
  readonly program: ProgramKey
  /** What this product authorizes. Never inferred from the program alone. */
  readonly entitlements: readonly string[]
}

/**
 * Every product marker this system recognises.
 *
 * A closed list. Adding a product is a code change and a review, which is the
 * point: an unrecognised marker must never be given the benefit of the doubt.
 */
const PRODUCTS: readonly ProductIdentity[] = [
  { marker: 'pmp-practice-studio', program: 'study', entitlements: PROGRAM_ENTITLEMENTS.study },
  { marker: 'study-access', program: 'study', entitlements: PROGRAM_ENTITLEMENTS.study },
  { marker: 'liap-book-preorder', program: 'liap', entitlements: PROGRAM_ENTITLEMENTS.liap },
]

const BY_MARKER = new Map(PRODUCTS.map((p) => [p.marker, p]))

/** Metadata keys that may carry a product marker, in the order they are read. */
const MARKER_KEYS = ['product', 'tier'] as const

export function productByMarker(marker: string | null | undefined): ProductIdentity | null {
  if (!marker) return null
  return BY_MARKER.get(marker.trim()) ?? null
}

/**
 * Identifies a product from Stripe metadata.
 *
 * Returns null for metadata that is absent, empty, or carries a marker this
 * system does not recognise. There is no default and no fallback: a payment
 * whose product cannot be named is a payment that grants nothing.
 */
export function identifyProduct(
  metadata: Stripe.Metadata | Record<string, string | undefined> | null | undefined
): ProductIdentity | null {
  if (!metadata) return null
  for (const key of MARKER_KEYS) {
    const found = productByMarker(metadata[key])
    if (found) return found
  }
  return null
}

/**
 * Identifies a checkout session.
 *
 * Note what is NOT consulted: `session.subscription`, `session.mode`,
 * `session.amount_total`, and the payment status. Those describe the
 * transaction. This function answers what was bought, and the caller decides
 * separately whether it was paid for.
 */
export function identifyCheckoutSession(
  session: Pick<Stripe.Checkout.Session, 'metadata'> | null | undefined
): ProductIdentity | null {
  return identifyProduct(session?.metadata)
}

/**
 * Study Access price ids, for subscriptions that predate metadata markers.
 *
 * Read from the environment at call time rather than module load, so a price
 * can be added without a code change.
 *
 * NEXT_PUBLIC_STRIPE_STUDY_PRICE_ID is the current price and is already set.
 * STRIPE_STUDY_LEGACY_PRICE_IDS is a comma-separated list for prices that have
 * since been archived — the lever that lets a long-standing subscriber on an
 * old price keep working without weakening the rule for everybody else. Unset
 * means no legacy prices, which is the safe default rather than a permissive
 * one.
 */
export function studyAccessPriceIds(): string[] {
  const ids = [
    process.env.NEXT_PUBLIC_STRIPE_STUDY_PRICE_ID,
    ...(process.env.STRIPE_STUDY_LEGACY_PRICE_IDS ?? '').split(','),
  ]
  return ids.map((id) => (id ?? '').trim()).filter(Boolean)
}

/**
 * Identifies a subscription.
 *
 * Metadata first. Falling back to the price id is not a loosening — it is a
 * narrower check than the one it replaces, because a price id identifies one
 * specific product rather than the entire category of "things billed monthly".
 *
 * A subscription for a LIAP payment plan, a Retreat instalment, coaching, or a
 * future Boot Camp arrangement returns null here and grants nothing.
 */
export function identifySubscription(
  subscription:
    | (Pick<Stripe.Subscription, 'metadata'> & {
        items?: { data?: Array<{ price?: { id?: string | null } | null }> }
      })
    | null
    | undefined
): ProductIdentity | null {
  if (!subscription) return null

  const byMetadata = identifyProduct(subscription.metadata)
  if (byMetadata) return byMetadata

  const allowed = new Set(studyAccessPriceIds())
  if (allowed.size === 0) return null

  for (const item of subscription.items?.data ?? []) {
    const priceId = item?.price?.id
    if (priceId && allowed.has(priceId)) return productByMarker('study-access')
  }
  return null
}

/**
 * Whether an identified product authorizes a given entitlement key.
 *
 * The question every caller should be asking, phrased so that null — an
 * unidentifiable payment — answers false rather than throwing or defaulting.
 */
export function productGrants(
  identity: ProductIdentity | null | undefined,
  entitlementKey: string
): boolean {
  return identity ? identity.entitlements.includes(entitlementKey) : false
}

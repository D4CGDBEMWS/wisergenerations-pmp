import { LIAP_BOOK } from './product'

// ---------------------------------------------------------------------------
// Book bundles. Owner ruling 2026-10-30: a bundles page for promotions on
// every book Crystal publishes, starting with a Black Friday 3-book bundle.
//
// To add a bundle: add an entry here. Prices are cents, the single source of
// truth for both the page and the Stripe charge. Dates are absolute instants;
// a bundle outside its window is shown as upcoming or ended and cannot be
// bought (the checkout route re-checks, so the page cannot be bypassed).
// ---------------------------------------------------------------------------

export interface BundleItem {
  title: string
  format: string
  quantity: number
  /** Regular price per copy, cents. */
  unitValue: number
}

export interface Bundle {
  slug: string
  name: string
  tagline: string
  items: BundleItem[]
  /** What the buyer pays for the whole bundle, cents (shipping extra). */
  price: number
  startsAt: string
  endsAt: string
  /** Shown under the price. */
  note: string
}

export const BUNDLES: readonly Bundle[] = [
  {
    slug: 'black-friday-3-pack',
    name: 'Black Friday 3-Book Bundle',
    tagline: 'One for you, two to give. Three hardcovers for the people you are making the turn with.',
    items: [
      { title: LIAP_BOOK.name, format: LIAP_BOOK.format, quantity: 3, unitValue: LIAP_BOOK.amount },
    ],
    price: 5000,
    // Black Friday through publication day, Eastern time.
    startsAt: '2026-11-27T00:00:00-05:00',
    endsAt: '2026-11-30T23:59:59-05:00',
    note: 'Ships to one US address after publication on November 30, 2026. Your purchase includes the Life Project-Ready™ Assessment.',
  },
]

export type BundleStatus = 'upcoming' | 'active' | 'ended'

export function bundleStatus(b: Bundle, now: Date = new Date()): BundleStatus {
  if (now < new Date(b.startsAt)) return 'upcoming'
  if (now > new Date(b.endsAt)) return 'ended'
  return 'active'
}

export function bundleCopies(b: Bundle): number {
  return b.items.reduce((n, i) => n + i.quantity, 0)
}

export function bundleValue(b: Bundle): number {
  return b.items.reduce((n, i) => n + i.quantity * i.unitValue, 0)
}

export function bundleSavings(b: Bundle): number {
  return bundleValue(b) - b.price
}

export function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function findBundle(slug: unknown): Bundle | null {
  if (typeof slug !== 'string') return null
  return BUNDLES.find((b) => b.slug === slug) ?? null
}

/** Stripe metadata marker for bundle checkouts. Never shared with the preorder. */
export const BUNDLE_METADATA_KEY = 'liap-book-bundle'

export function isLiapBundle(metadata: Record<string, string> | null | undefined): boolean {
  return metadata?.product === BUNDLE_METADATA_KEY
}

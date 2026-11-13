// ---------------------------------------------------------------------------
// Demonstration data for the Phase 2A local preview.
//
// ── EVERY ROW HERE IS FICTIONAL, AND SAYS SO ───────────────────────────────
//
// Founder instruction: do not invent testimonials, transaction counts,
// savings figures, or claims that the platform is already operating.
//
// So this file contains no testimonial, no dollar saved, no member count, no
// "847 users". It contains a handful of obviously-illustrative LISTINGS whose
// only purpose is to prove the layout renders, and every display name begins
// with the word "Demo" so a screenshot can never be mistaken for a real
// neighbour. The UI additionally renders a persistent banner.
//
// `isDemoMode()` gates all of it. With the flag off, the app shows empty
// states rather than fiction.
// ---------------------------------------------------------------------------

export interface DemoListing {
  readonly id: string
  readonly title: string
  readonly body: string
  readonly kind: 'service' | 'item'
  readonly offerType: 'paid' | 'barter' | 'combined'
  readonly category: string
  readonly zip: string
  readonly city: string
  readonly providerName: string
}

export const DEMO_LISTINGS: readonly DemoListing[] = [
  {
    id: 'demo-1',
    title: 'Small home repairs — shelves, doors, leaky taps',
    body: 'Example listing for layout purposes. Half-day and full-day options.',
    kind: 'service',
    offerType: 'combined',
    category: 'Handyman & Home Repair',
    zip: '30080',
    city: 'Smyrna',
    providerName: 'Demo Provider A',
  },
  {
    id: 'demo-2',
    title: 'Yard clean-up and seasonal leaf removal',
    body: 'Example listing for layout purposes. Open to barter.',
    kind: 'service',
    offerType: 'barter',
    category: 'Yard & Outdoor',
    zip: '30060',
    city: 'Marietta',
    providerName: 'Demo Provider B',
  },
  {
    id: 'demo-3',
    title: 'Dining table and four chairs',
    body: 'Example item listing for layout purposes.',
    kind: 'item',
    offerType: 'paid',
    category: 'Furniture',
    zip: '30144',
    city: 'Kennesaw',
    providerName: 'Demo Provider C',
  },
  {
    id: 'demo-4',
    title: 'Résumé review and interview practice',
    body: 'Example listing for layout purposes. Individual sessions.',
    kind: 'service',
    offerType: 'barter',
    category: 'Skills & Tutoring',
    zip: '30127',
    city: 'Powder Springs',
    providerName: 'Demo Provider D',
  },
]

/** Categories for the pilot. Childcare and eldercare are absent by ruling. */
export const DEMO_CATEGORIES: readonly string[] = [
  'Handyman & Home Repair',
  'Yard & Outdoor',
  'Moving & Hauling',
  'Cleaning',
  'Skills & Tutoring',
  'Tech Help',
  'Auto & Transport',
  'Food & Baking',
  'Furniture',
  'Tools & Equipment',
]

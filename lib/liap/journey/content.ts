import { SECTION_IDS, type SectionId, type CtaTier, tierAllowedIn } from './sections'

// ---------------------------------------------------------------------------
// The content contract.
//
// Every customer-facing word and every image slot for the journey lives here,
// and nowhere else. Components read from this file; they never contain copy.
//
// ── WHY A FILE RATHER THAN MARKUP ──────────────────────────────────────────
//
// So the owner can review the copy as prose. When the approved Marketing Kit
// arrives it drops into one document-shaped file, and not a single component
// is touched. If copy lived in JSX, every revision would be a code change,
// every review would be a diff, and the chance of an unapproved sentence
// surviving to production would rise with each pass.
//
// ── WHY UNAPPROVED COPY CANNOT REACH A VISITOR ─────────────────────────────
//
// Every copy value is one of two things: approved(), carrying text the owner
// signed off, or pending(), carrying only a note about what is still needed.
//
// pending() renders NOTHING in production. In development it renders a
// visibly marked placeholder so the layout can be worked on. That is a
// mechanical guarantee rather than a promise: even with every flag on, text
// nobody approved cannot appear on the live site, because there is no code
// path that renders it.
//
// This is not a CMS and must not become one. It is a typed constant file that
// a person edits and a reviewer reads.
// ---------------------------------------------------------------------------

/** Copy the owner has approved. The only kind that renders in production. */
export interface ApprovedCopy {
  readonly state: 'approved'
  readonly text: string
}

/** A slot awaiting approved copy. Renders nothing in production, ever. */
export interface PendingCopy {
  readonly state: 'pending'
  /** What this slot needs, for whoever is writing it. Never shown to a visitor. */
  readonly note: string
}

export type Copy = ApprovedCopy | PendingCopy

export function approved(text: string): ApprovedCopy {
  return { state: 'approved', text }
}

export function pending(note: string): PendingCopy {
  return { state: 'pending', note }
}

/** The text to render, or null. Null means render nothing at all. */
export function copyText(copy: Copy | undefined): string | null {
  if (!copy) return null
  return copy.state === 'approved' ? copy.text : null
}

/**
 * An image slot, in two crops.
 *
 * Two rather than one because a wide road shot that reads well on a laptop
 * becomes a thin strip on a phone with the subject cropped out — and because
 * a substantial share of this traffic arrives from a short on a phone.
 *
 * `alt` carries the METAPHOR, not a description of the photograph. "Two roads
 * separating", never "photograph of a road". For a page that is mostly
 * visual, alternative text is the fallback channel for the meaning itself,
 * not a caption.
 */
export interface MediaSlot {
  readonly desktop: string | null
  readonly mobile: string | null
  readonly alt: Copy
  readonly aspect: { desktop: string; mobile: string }
}

export function mediaPending(note: string, aspect: MediaSlot['aspect']): MediaSlot {
  return { desktop: null, mobile: null, alt: pending(note), aspect }
}

export interface CallToAction {
  readonly label: Copy
  readonly tier: CtaTier
  /** An internal path. Never a URL, never assembled from a request. */
  readonly href: string
}

export type SectionKind = 'narrative' | 'pillars' | 'offer' | 'proof' | 'faq' | 'chooser'

export interface SectionContent {
  readonly id: SectionId
  readonly kind: SectionKind
  readonly eyebrow?: Copy
  readonly headline: Copy
  readonly supporting?: Copy
  readonly media?: MediaSlot
  readonly cta?: CallToAction
  /** Offer sections only. Display price, approved by the owner. */
  readonly price?: string
  /** Offer sections only. Approved display name. */
  readonly productName?: string
}

const NARRATIVE_ASPECT = { desktop: '3 / 2', mobile: '4 / 5' }
const HERO_ASPECT = { desktop: '21 / 9', mobile: '4 / 5' }
const CARD_ASPECT = { desktop: '16 / 10', mobile: '16 / 10' }

// ---------------------------------------------------------------------------
// Brand language the owner has approved and asked to be held as reference.
// These are the ONLY strings in this file that are not pending, apart from
// the approved prices and product display names.
// ---------------------------------------------------------------------------

export const BRAND = {
  name: approved('LIFE IS A PROJECT™'),
  imperative: approved('BE READY.'),
  ride: approved('LIFE IS A JOURNEY. ENJOY THE RIDE!™'),
  pillars: [
    approved('FIND HIDDEN RESOURCES'),
    approved('NAVIGATE RISKS'),
    approved('BUILD SUSTAINABLE SUCCESS'),
  ],
  author: approved('Crystal Glover Stewart, PMP®'),
} as const

// ---------------------------------------------------------------------------
// The fourteen sections.
//
// Sections 1–7 carry no price, no product name and no commercial CTA. That is
// the owner's firewall, and assertContentRespectsFirewall() below refuses to
// let this file describe a violation of it.
// ---------------------------------------------------------------------------

export const JOURNEY: readonly SectionContent[] = [
  {
    id: 'journey',
    kind: 'narrative',
    eyebrow: BRAND.name,
    headline: pending('Section 1 hook. Emotional recognition; stops the visitor. No product.'),
    supporting: pending('Section 1 supporting line, one sentence at most.'),
    media: mediaPending('Section 1 hero: open road or horizon. Carries the metaphor.', HERO_ASPECT),
    cta: {
      label: pending('Section 1 CTA — continues the journey, sells nothing.'),
      tier: 'journey',
      href: '#destination',
    },
  },
  {
    id: 'destination',
    kind: 'narrative',
    headline: pending('Section 2 — do you know where you are going?'),
    supporting: pending('Section 2 supporting line.'),
    media: mediaPending('Section 2: multiple roads or directional choices.', NARRATIVE_ASPECT),
    cta: { label: pending('Section 2 CTA.'), tier: 'journey', href: '#direction' },
  },
  {
    id: 'direction',
    kind: 'narrative',
    headline: pending('Section 3 — small deviations compound.'),
    supporting: pending('Section 3 supporting line.'),
    media: mediaPending('Section 3: two routes beginning together and separating.', NARRATIVE_ASPECT),
    cta: { label: pending('Section 3 CTA.'), tier: 'journey', href: '#resources' },
  },
  {
    id: 'resources',
    kind: 'narrative',
    headline: pending('Section 4 — you may already be carrying what you need.'),
    supporting: pending('Section 4 supporting line.'),
    media: mediaPending('Section 4: luggage or resources already carried.', NARRATIVE_ASPECT),
    cta: { label: pending('Section 4 CTA.'), tier: 'journey', href: '#risk' },
  },
  {
    id: 'risk',
    kind: 'narrative',
    headline: pending('Section 5 — something may already be signalling.'),
    supporting: pending('Section 5 supporting line.'),
    media: mediaPending('Section 5: dashboard warning indicators.', NARRATIVE_ASPECT),
    cta: { label: pending('Section 5 CTA.'), tier: 'journey', href: '#change' },
  },
  {
    id: 'change',
    kind: 'narrative',
    headline: pending('Section 6 — recalculating, without abandoning the destination.'),
    supporting: pending('Section 6 supporting line.'),
    media: mediaPending('Section 6: GPS recalculating.', NARRATIVE_ASPECT),
    cta: { label: pending('Section 6 CTA.'), tier: 'journey', href: '#possibility' },
  },
  {
    id: 'possibility',
    kind: 'narrative',
    headline: pending('Section 7 — the emotional destination. No guaranteed outcomes.'),
    supporting: pending('Section 7 supporting line.'),
    media: mediaPending('Section 7: horizon, milestones, room to enjoy the journey.', NARRATIVE_ASPECT),
    cta: { label: pending('Section 7 CTA.'), tier: 'journey', href: '#reveal' },
  },

  // ── The firewall lifts here ───────────────────────────────────────────────
  {
    id: 'reveal',
    kind: 'pillars',
    eyebrow: BRAND.name,
    headline: pending('Section 8 headline introducing LIAP as the solution.'),
    supporting: pending('Section 8 supporting line.'),
  },
  {
    id: 'start',
    kind: 'offer',
    eyebrow: approved('START'),
    headline: pending('Section 9 headline — the first commercial yes.'),
    supporting: pending('Section 9 supporting line.'),
    media: mediaPending('Section 9: book cover.', CARD_ASPECT),
    price: '$24.99',
    productName: 'Life Is a Project™ Book + Life Project-Ready™ Assessment',
    cta: {
      label: pending('Section 9 CTA label.'),
      tier: 'start',
      href: '/life-is-a-project/book',
    },
  },
  {
    id: 'build',
    kind: 'offer',
    eyebrow: approved('BUILD'),
    headline: pending('Section 10 headline.'),
    supporting: pending('Section 10 supporting line.'),
    media: mediaPending('Section 10: working on a route or plan.', CARD_ASPECT),
    price: '$49',
    productName: 'LIAP Journey Workshop',
    // Phase II-E. Until the workshop exists this points at the hub rather
    // than a route that would 404 — the section is expected to be hidden
    // until then anyway, and a dead link is worse than an absent one.
    cta: { label: pending('Section 10 CTA label.'), tier: 'build', href: '/life-is-a-project' },
  },
  {
    id: 'experience',
    kind: 'offer',
    eyebrow: approved('EXPERIENCE'),
    headline: pending('Section 11 headline.'),
    supporting: pending('Section 11 supporting line. Lodging and meals included.'),
    media: mediaPending('Section 11: premium destination or resort.', CARD_ASPECT),
    price: '$1,499.99 per person',
    productName: 'LIAP Weekend Experience',
    cta: {
      label: pending('Section 11 CTA label — enquiry, never purchase.'),
      tier: 'experience',
      href: '/life-is-a-project/retreat',
    },
  },
  {
    id: 'proof',
    kind: 'proof',
    headline: pending('Section 12 headline.'),
    // No testimonial, story, statistic or endorsement may be invented. With
    // nothing approved, ProofWall renders nothing at all — not a placeholder,
    // not "coming soon". Same honest-empty behaviour as the giveaway page.
    supporting: pending('Section 12 — awaiting real testimonials and credentials.'),
  },
  {
    id: 'questions',
    kind: 'faq',
    headline: pending('Section 13 headline.'),
  },
  {
    id: 'next-step',
    kind: 'chooser',
    headline: pending('Section 14 headline — three named actions, never "Learn more".'),
  },
]

/**
 * The nine questions the owner listed. Answers are hers.
 *
 * Questions are structure and are safe to hold here; every answer is pending
 * until approved, and an unanswered question does not render.
 */
export const FAQ: ReadonlyArray<{ question: Copy; answer: Copy }> = [
  { question: approved('Who is LIAP for?'), answer: pending('FAQ 1 answer.') },
  { question: approved('Where should I start?'), answer: pending('FAQ 2 answer.') },
  { question: approved('Is the book different from the workshop?'), answer: pending('FAQ 3 answer.') },
  { question: approved('What does the assessment do?'), answer: pending('FAQ 4 answer.') },
  { question: approved('Who is the retreat for?'), answer: pending('FAQ 5 answer.') },
  { question: approved('What does the retreat price include?'), answer: pending('FAQ 6 answer.') },
  { question: approved('How do group arrangements work?'), answer: pending('FAQ 7 answer.') },
  { question: approved('Can an organization host LIAP?'), answer: pending('FAQ 8 answer.') },
  { question: approved('How can I sponsor or partner?'), answer: pending('FAQ 9 answer.') },
]

// ---------------------------------------------------------------------------
// The firewall, checked against the content itself.
// ---------------------------------------------------------------------------

export interface FirewallViolation {
  section: SectionId
  problem: string
}

/**
 * Finds any section above the firewall that carries commerce.
 *
 * Returns violations rather than throwing, so the test can report all of them
 * at once rather than one per run. Called by the test suite, and by the page
 * in development.
 */
export function firewallViolations(
  sections: readonly SectionContent[] = JOURNEY
): FirewallViolation[] {
  const found: FirewallViolation[] = []

  for (const section of sections) {
    if (section.price !== undefined && !tierAllowedIn(section.id, 'start')) {
      found.push({ section: section.id, problem: 'carries a price above the firewall' })
    }
    if (section.productName !== undefined && !tierAllowedIn(section.id, 'start')) {
      found.push({ section: section.id, problem: 'names a product above the firewall' })
    }
    if (section.cta && !tierAllowedIn(section.id, section.cta.tier)) {
      found.push({
        section: section.id,
        problem: `uses the '${section.cta.tier}' CTA tier above the firewall`,
      })
    }
  }
  return found
}

/** Every section, in order, exactly once. Guards against a drifting content file. */
export function contentIsComplete(sections: readonly SectionContent[] = JOURNEY): boolean {
  return (
    sections.length === SECTION_IDS.length &&
    sections.every((section, index) => section.id === SECTION_IDS[index])
  )
}

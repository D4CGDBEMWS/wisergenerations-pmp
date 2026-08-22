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
  /**
   * Offer sections only. The displayed price.
   *
   * A Copy value rather than a plain string, so a price on HOLD renders
   * nothing at all instead of showing a number nobody has reconfirmed. All
   * three LIAP prices are held as of 22 August 2026; a held price and a
   * missing price are the same thing to a visitor, which is the correct
   * outcome — an unconfirmed price is worse than no price.
   */
  readonly price?: Copy
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
  /**
   * The canonical customer-facing name, approved 22 August 2026.
   *
   * Stored in natural case. Where a surface wants it shouting — the section
   * eyebrow, for instance — that is a CSS text-transform, not a second
   * approved string. Holding one spelling means there is exactly one thing to
   * change if it ever changes again.
   */
  name: approved('Living Is a Project...Are You Ready?™'),

  /** The methodology. Approved 22 August 2026. */
  way: approved('The LIAP Way™'),

  author: approved('Crystal Glover Stewart, PMP®'),

  /**
   * The canonical signature concept, approved 22 August 2026.
   *
   * It is the one line that survived the J-2 ruling as live language. The
   * cycle's own copy in lib/liap/scoring.ts holds the same sentence for the
   * readiness report; this is its home for the journey page.
   */
  signature: approved('The bend is not the end. Be ready to make the turn.'),

  /**
   * J-2, ruled 22 August 2026. Rendered nowhere, kept on purpose.
   *
   *   BE READY.                              RETIRED as a standalone tagline.
   *   LIFE IS A JOURNEY. ENJOY THE RIDE!™    HELD, not rendered.
   *   FIND HIDDEN RESOURCES /
   *   NAVIGATE RISKS /
   *   BUILD SUSTAINABLE SUCCESS              HELD, not rendered as canonical
   *                                          LIAP pillars.
   *
   * The owner asked for the held material to be preserved here, so retiring
   * is recorded rather than performed: `imperative` keeps its approved string
   * and carries `retired`, because a line that was once the tagline of the
   * brand should leave a trace of having been one. Nothing in this object has
   * a render path — `renderedBrandStrings()` below proves it, and the test
   * suite fails if any of it reaches a section, a CTA or the FAQ.
   *
   * "BE READY." remains a fragment of the approved product name
   * ("...Are You Ready?™"). That is the name, not the tagline, and the two are
   * separate strings for exactly that reason.
   */
  held: {
    imperative: approved('BE READY.'),
    /** Set on anything ruled retired rather than merely held. */
    imperativeRetired: 'Retired as a standalone tagline, J-2, 22 August 2026.',
    ride: approved('LIFE IS A JOURNEY. ENJOY THE RIDE!™'),
    pillars: [
      approved('FIND HIDDEN RESOURCES'),
      approved('NAVIGATE RISKS'),
      approved('BUILD SUSTAINABLE SUCCESS'),
    ],
  },
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
    price: pending('§9 book price — HOLD, owner confirmation required 22 Aug 2026.'),
    productName: 'Living Is a Project...Are You Ready?™ Book + Life Project-Ready™ Assessment',
    cta: {
      label: pending('Section 9 CTA label.'),
      tier: 'start',
      href: '/living-is-a-project/book',
    },
  },
  {
    id: 'build',
    kind: 'offer',
    eyebrow: approved('BUILD'),
    headline: pending('Section 10 headline.'),
    supporting: pending('Section 10 supporting line.'),
    media: mediaPending('Section 10: working on a route or plan.', CARD_ASPECT),
    price: pending('§10 workshop price — HOLD, owner confirmation required 22 Aug 2026.'),
    productName: 'LIAP Virtual Workshop',
    // Phase II-E. Until the workshop exists this points at the hub rather
    // than a route that would 404 — the section is expected to be hidden
    // until then anyway, and a dead link is worse than an absent one.
    cta: { label: pending('Section 10 CTA label.'), tier: 'build', href: '/living-is-a-project' },
  },
  {
    id: 'experience',
    kind: 'offer',
    eyebrow: approved('EXPERIENCE'),
    headline: pending('Section 11 headline.'),
    supporting: pending('Section 11 supporting line. Lodging and meals included.'),
    media: mediaPending('Section 11: premium destination or resort.', CARD_ASPECT),
    price: pending('§11 retreat price — HOLD, owner confirmation required 22 Aug 2026.'),
    productName: 'LIAP Retreat',
    cta: {
      label: pending('Section 11 CTA label — enquiry, never purchase.'),
      tier: 'experience',
      href: '/living-is-a-project/retreat',
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
 * The FAQ.
 *
 * ── NO FIXED COUNT ─────────────────────────────────────────────────────────
 *
 * Owner ruling, 22 August 2026: the "exactly nine" constraint existed only in
 * this contract and its test, so it is gone. Questions may be added, and
 * obsolete ones may be retired — but retiring is a marker rather than a
 * deletion, so a question that was once published leaves a trace of having
 * existed rather than silently vanishing from the record.
 *
 * Questions are structure and can be held here. EVERY ANSWER IS PENDING
 * except the two the owner supplied verbatim: the Workshop refund and replay
 * policy, and how to reach a human. Nothing here is AI-written, and an
 * unanswered question does not render.
 */
export interface FaqEntry {
  readonly question: Copy
  readonly answer: Copy
  /**
   * Set when a question is withdrawn. Kept rather than deleted so the history
   * is legible; activeFaq() filters them out of anything a visitor sees.
   */
  readonly retired?: string
}

export const FAQ: readonly FaqEntry[] = [
  // ── Carried forward. Meaning matches the new required coverage. ──────────
  { question: approved('Who is LIAP for?'), answer: pending('FAQ answer — who LIAP is for.') },
  { question: approved('Where should I start?'), answer: pending('FAQ answer — where to start.') },
  { question: approved('What does the assessment do?'), answer: pending('FAQ answer — what the Life Project-Ready™ Assessment does.') },
  { question: approved('Who is the retreat for?'), answer: pending('FAQ answer — who the Retreat is for.') },
  { question: approved('What does the retreat price include?'), answer: pending('FAQ answer — what the Retreat includes. Price itself is on HOLD.') },
  { question: approved('How do group arrangements work?'), answer: pending('FAQ answer — group arrangements.') },
  { question: approved('Can an organization host LIAP?'), answer: pending('FAQ answer — organisational hosting.') },

  // ── Carried forward, but with no counterpart in the new required list.
  //    NOT retired: that is the owner's call (finding J-6), not mine. ───────
  { question: approved('Is the book different from the workshop?'), answer: pending('FAQ answer — book versus workshop. Owner to confirm whether this question is retained.') },
  { question: approved('How can I sponsor or partner?'), answer: pending('FAQ answer — sponsorship and partnership. Owner to confirm whether this question is retained.') },

  // ── New required coverage, 22 August 2026. ──────────────────────────────
  { question: approved('What is Living Is a Project...Are You Ready?™?'), answer: pending('FAQ answer — what LIAP is.') },
  { question: approved('What is The LIAP Way™?'), answer: pending('FAQ answer — the methodology.') },
  { question: approved('Do I need project-management experience?'), answer: pending('FAQ answer — no experience needed. §7 argues the reader already has the principles.') },
  { question: approved('What is Life Project-Ready™?'), answer: pending('FAQ answer — the readiness idea.') },
  { question: approved('What happens in the LIAP Virtual Workshop?'), answer: pending('FAQ answer — inside the Workshop.') },
  { question: approved('What happens at the LIAP Retreat?'), answer: pending('FAQ answer — inside the Retreat. Do not publish the detailed agenda.') },
  { question: approved('What do I need to do before the Retreat?'), answer: pending('FAQ answer — prerequisites: book and Workshop completion.') },

  // ── The two answers the owner supplied verbatim. ────────────────────────
  {
    question: approved('Can I get a refund for the Virtual Workshop?'),
    answer: approved(
      'Virtual Workshop registrations are non-refundable. Registered participants who cannot attend live receive access to the replay.'
    ),
  },
  {
    question: approved('How do I contact Wiser Generations?'),
    answer: approved(
      'Email info@wisergenerations.com. We aim to respond within 24 hours.'
    ),
  },
]

/** The questions a visitor may see: not retired, and with an approved answer. */
export function activeFaq(entries: readonly FaqEntry[] = FAQ): FaqEntry[] {
  return entries.filter((e) => !e.retired && e.answer.state === 'approved')
}

/** Everything still awaiting an answer, for the owner's content list. */
export function unansweredFaq(entries: readonly FaqEntry[] = FAQ): FaqEntry[] {
  return entries.filter((e) => !e.retired && e.answer.state === 'pending')
}

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

// ---------------------------------------------------------------------------
// J-2, checked against the content itself.
//
// "HELD, not rendered" is a claim, and a claim about copy is worth what the
// mechanism behind it is worth. So rather than trusting that nobody pastes
// LIFE IS A JOURNEY. ENJOY THE RIDE!™ into a hero six months from now, the
// held strings are compared against every string this file can put in front
// of a visitor, and the suite fails if one of them appears.
// ---------------------------------------------------------------------------

/**
 * Every string the journey can render — approved or pending, section or FAQ.
 *
 * Pending copy is included deliberately. It never reaches production, but a
 * held tagline sitting in a pending slot is still somebody having decided to
 * use it, and that decision should surface now rather than on the day the
 * copy is approved.
 */
export function renderedBrandStrings(
  sections: readonly SectionContent[] = JOURNEY,
  faq: readonly FaqEntry[] = FAQ
): string[] {
  const out: string[] = []
  const take = (copy: Copy | undefined) => {
    if (!copy) return
    // A pending slot's note counts. It is not shown to a visitor, but a held
    // tagline written into one is somebody planning to use it.
    out.push(copy.state === 'approved' ? copy.text : copy.note)
  }

  for (const section of sections) {
    take(section.eyebrow)
    take(section.headline)
    take(section.supporting)
    take(section.price)
    take(section.cta?.label)
    take(section.media?.alt)
    if (section.productName) out.push(section.productName)
  }
  for (const entry of faq) {
    take(entry.question)
    take(entry.answer)
  }
  return out
}

/** The J-2 material, flattened. Retired and held alike — neither renders. */
export function heldBrandStrings(): string[] {
  return [BRAND.held.imperative.text, BRAND.held.ride.text, ...BRAND.held.pillars.map((p) => p.text)]
}

/** Any held or retired J-2 string that has found its way onto a surface. */
export function heldBrandLeaks(
  sections: readonly SectionContent[] = JOURNEY,
  faq: readonly FaqEntry[] = FAQ
): string[] {
  const rendered = renderedBrandStrings(sections, faq)
  return heldBrandStrings().filter((held) => rendered.some((text) => text.includes(held)))
}

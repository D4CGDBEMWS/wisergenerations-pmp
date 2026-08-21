import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  SECTION_IDS,
  CTA_TIERS,
  FIREWALL_SECTION,
  JOURNEY_TIER,
  isAboveFirewall,
  sectionNumber,
  tierAllowedIn,
} from '@/lib/liap/journey/sections'
import {
  JOURNEY,
  FAQ,
  BRAND,
  approved,
  pending,
  copyText,
  firewallViolations,
  contentIsComplete,
} from '@/lib/liap/journey/content'
import { LIAP_EVENTS, trackLiap } from '@/lib/liap/analytics'
import { PARTNER_DESTINATIONS } from '@/lib/liap/partners'

// ---------------------------------------------------------------------------
// The journey contract.
//
// Three owner rulings are enforced here rather than remembered:
//
//   The conversion firewall. No price, no product name, no purchase CTA above
//   section 8. This is the rule most likely to erode — somebody will
//   eventually want "just a small book link in the hero" and it will sound
//   reasonable — so it fails the build instead of a review.
//
//   Copy nobody approved cannot reach a visitor. Not by policy, by mechanism:
//   there is no code path that renders a pending slot in production.
//
//   The analytics schema stays controlled and ENUMERATED. A key allow-list
//   alone would permit `section_id: "someone@example.com"` — a free-text
//   field with a narrow name.
// ---------------------------------------------------------------------------

describe('the conversion firewall', () => {
  it('sits at section 8, where the owner put it', () => {
    expect(FIREWALL_SECTION).toBe('reveal')
    expect(sectionNumber('reveal')).toBe(8)
  })

  it('treats sections 1 to 7 as above it and 8 onward as below', () => {
    for (const id of SECTION_IDS) {
      expect(isAboveFirewall(id)).toBe(sectionNumber(id) < 8)
    }
  })

  it('permits only the journey tier above it', () => {
    for (const id of SECTION_IDS.filter(isAboveFirewall)) {
      expect(tierAllowedIn(id, JOURNEY_TIER)).toBe(true)
      for (const tier of CTA_TIERS.filter((t) => t !== JOURNEY_TIER)) {
        expect(tierAllowedIn(id, tier)).toBe(false)
      }
    }
  })

  it('permits every tier below it', () => {
    for (const id of SECTION_IDS.filter((i) => !isAboveFirewall(i))) {
      for (const tier of CTA_TIERS) expect(tierAllowedIn(id, tier)).toBe(true)
    }
  })

  it('the shipped content does not violate it', () => {
    expect(firewallViolations()).toEqual([])
  })

  it('catches a price added above the firewall', () => {
    // The regression this exists for. Proving the check bites, rather than
    // trusting that it would.
    const tampered = JOURNEY.map((s) =>
      s.id === 'direction' ? { ...s, price: '$24.99' } : s
    )
    const found = firewallViolations(tampered)
    expect(found).toHaveLength(1)
    expect(found[0]!.section).toBe('direction')
    expect(found[0]!.problem).toContain('price')
  })

  it('catches a product name added above the firewall', () => {
    const tampered = JOURNEY.map((s) =>
      s.id === 'risk' ? { ...s, productName: 'LIAP Journey Workshop' } : s
    )
    expect(firewallViolations(tampered)[0]?.problem).toContain('names a product')
  })

  it('catches a purchase CTA added above the firewall', () => {
    const tampered = JOURNEY.map((s) =>
      s.id === 'journey'
        ? { ...s, cta: { label: approved('Buy the book'), tier: 'start' as const, href: '/x' } }
        : s
    )
    expect(firewallViolations(tampered)[0]?.problem).toContain("'start' CTA tier")
  })

  it('no shipped pre-firewall section carries commerce of any kind', () => {
    // The same claim asserted directly against the content, in case the
    // violation checker itself is ever weakened.
    for (const section of JOURNEY.filter((s) => isAboveFirewall(s.id))) {
      expect(section.price).toBeUndefined()
      expect(section.productName).toBeUndefined()
      expect(section.cta?.tier ?? JOURNEY_TIER).toBe(JOURNEY_TIER)
    }
  })
})

describe('the content contract', () => {
  it('describes all fourteen sections, in order, exactly once', () => {
    expect(contentIsComplete()).toBe(true)
    expect(JOURNEY).toHaveLength(14)
  })

  it('renders nothing for copy that is still pending', () => {
    expect(copyText(pending('a note for the writer'))).toBeNull()
    expect(copyText(undefined)).toBeNull()
    expect(copyText(approved('real words'))).toBe('real words')
  })

  it('never exposes a writer’s note as customer-facing text', () => {
    // A pending note describes what is missing. It is written for whoever is
    // producing the copy and must never be mistaken for the copy itself.
    const note = 'Section 1 hook. Emotional recognition; stops the visitor.'
    expect(copyText(pending(note))).not.toBe(note)
    expect(copyText(pending(note))).toBeNull()
  })

  it('has invented no marketing copy — everything is pending but approved brand language', () => {
    // The owner's instruction: do not fill missing customer-facing content by
    // inference. The only approved strings are the brand language, the
    // approved prices, the approved product display names, the journey rung
    // labels and the FAQ questions she supplied.
    const ALLOWED_APPROVED = new Set([
      ...BRAND.pillars.map((p) => p.text),
      BRAND.name.text,
      BRAND.imperative.text,
      BRAND.ride.text,
      BRAND.author.text,
      'START',
      'BUILD',
      'EXPERIENCE',
    ])

    for (const section of JOURNEY) {
      for (const slot of [section.eyebrow, section.headline, section.supporting, section.cta?.label]) {
        if (slot?.state === 'approved') {
          expect(ALLOWED_APPROVED.has(slot.text)).toBe(true)
        }
      }
    }
  })

  it('holds the approved brand language exactly, including the trademarks', () => {
    expect(BRAND.name.text).toBe('LIFE IS A PROJECT™')
    expect(BRAND.imperative.text).toBe('BE READY.')
    expect(BRAND.ride.text).toBe('LIFE IS A JOURNEY. ENJOY THE RIDE!™')
    expect(BRAND.pillars.map((p) => p.text)).toEqual([
      'FIND HIDDEN RESOURCES',
      'NAVIGATE RISKS',
      'BUILD SUSTAINABLE SUCCESS',
    ])
  })

  it('names the author correctly, with the registered mark intact', () => {
    expect(BRAND.author.text).toBe('Crystal Glover Stewart, PMP®')
    expect(BRAND.author.text).toContain('PMP®')
    expect(BRAND.author.text).not.toBe('Crystal Stewart')
  })

  it('carries the approved prices and display names, unchanged', () => {
    const byId = Object.fromEntries(JOURNEY.map((s) => [s.id, s]))
    expect(byId.start!.price).toBe('$24.99')
    expect(byId.build!.price).toBe('$49')
    expect(byId.build!.productName).toBe('LIAP Journey Workshop')
    expect(byId.experience!.price).toBe('$1,499.99 per person')
    expect(byId.experience!.productName).toBe('LIAP Weekend Experience')
  })

  it('lists the owner’s nine questions with every answer still pending', () => {
    expect(FAQ).toHaveLength(9)
    expect(FAQ.every((f) => f.question.state === 'approved')).toBe(true)
    expect(FAQ.every((f) => f.answer.state === 'pending')).toBe(true)
  })

  it('invents no proof — section 12 carries no testimonial or statistic', () => {
    const proof = JOURNEY.find((s) => s.id === 'proof')!
    expect(proof.headline.state).toBe('pending')
    expect(proof.supporting?.state).toBe('pending')
  })

  it('sends every CTA to an internal path, never a URL', () => {
    for (const section of JOURNEY) {
      if (!section.cta) continue
      const href = section.cta.href
      expect(href.startsWith('/') || href.startsWith('#')).toBe(true)
      expect(href).not.toContain('//')
      expect(href).not.toContain(':')
    }
  })
})

describe('a pending slot cannot render in production', () => {
  it('the only component that renders one refuses to outside development', () => {
    // The mechanical half of the guarantee. Asserted against the source
    // because the alternative — importing a component and switching
    // NODE_ENV inside a running module graph — proves less than it looks.
    const source = readFileSync(
      join(process.cwd(), 'components/liap/journey/PendingSlot.tsx'),
      'utf8'
    )
    expect(source).toContain("process.env.NODE_ENV === 'production'")
    expect(source).toMatch(/NODE_ENV === 'production'\)\s*return null/)
  })

  it('and no other component renders a pending note', () => {
    const { execSync } = require('child_process') as typeof import('child_process')
    const hits = execSync(
      `grep -rl "\\.note" components app --include=*.tsx || true`,
      { cwd: process.cwd(), encoding: 'utf8' }
    )
      .split('\n')
      .filter(Boolean)
      .filter((f) => f !== 'components/liap/journey/PendingSlot.tsx')

    expect(hits).toEqual([])
  })
})

describe('the analytics contract stayed controlled', () => {
  it('gained exactly two events', () => {
    expect(LIAP_EVENTS).toContain('liap_section_view')
    expect(LIAP_EVENTS).toContain('liap_cta_clicked')
    expect(LIAP_EVENTS).toHaveLength(13)
  })

  it('gained exactly two properties, and no more', () => {
    const source = readFileSync(join(process.cwd(), 'lib/liap/analytics.ts'), 'utf8')
    const allowed = source.match(/const ALLOWED_PROPS = new Set\(\[([^\]]+)\]\)/)?.[1] ?? ''
    const props = [...allowed.matchAll(/'([^']+)'/g)].map((m) => m[1])

    expect(props.sort()).toEqual(['cta_tier', 'position', 'section_id', 'step'])
  })

  it('enumerates the values, not merely the keys', () => {
    // Without this, `section_id` is a free-text field with a narrow name and
    // somebody's email address could travel to GA4 inside it.
    // trackEvent dispatches through window.gtag and returns early when there
    // is no window, so the transport has to be stood up rather than a bare
    // global stubbed — otherwise this test passes by sending nothing at all,
    // which proves the opposite of what it claims.
    const sent: Array<[string, Record<string, unknown>]> = []
    const g = globalThis as { window?: unknown }
    const hadWindow = 'window' in g
    const original = g.window

    g.window = {
      gtag: (_cmd: string, event: string, props: Record<string, unknown>) => {
        sent.push([event, props])
      },
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trackLiap('liap_section_view', { section_id: 'someone@example.com' as any })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trackLiap('liap_cta_clicked', { cta_tier: 'free-money' as any })
      trackLiap('liap_section_view', { section_id: 'risk' })
    } finally {
      if (hadWindow) g.window = original
      else delete g.window
    }

    // The transport really did carry the good event — without this, the
    // assertions below would pass on an empty array.
    expect(sent).toHaveLength(3)

    const payloads = sent.map(([, props]) => props)
    // The two bad values were dropped; the good one survived.
    expect(payloads.some((p) => 'section_id' in p && p.section_id === 'risk')).toBe(true)
    expect(JSON.stringify(payloads)).not.toContain('someone@example.com')
    expect(JSON.stringify(payloads)).not.toContain('free-money')
  })

  it('every section id is a permitted analytics value', () => {
    // The enumeration and the section list cannot drift apart.
    const source = readFileSync(join(process.cwd(), 'lib/liap/analytics.ts'), 'utf8')
    expect(source).toContain('section_id: new Set(SECTION_IDS)')
    expect(source).toContain('cta_tier: new Set(CTA_TIERS)')
  })
})

describe('campaign landing points', () => {
  it('every narrative section a short targets has a destination', () => {
    for (const id of ['destination', 'direction', 'resources', 'risk', 'change'] as const) {
      expect(PARTNER_DESTINATIONS).toHaveProperty(`section-${id}`)
    }
  })

  it('every anchored destination points at a section that exists', () => {
    // A campaign landing on an anchor with no section would scroll to the top
    // of the page, silently, and look like the story simply did not continue.
    for (const [key, path] of Object.entries(PARTNER_DESTINATIONS)) {
      if (!key.startsWith('section-')) continue
      const anchor = path.split('#')[1]!
      expect(SECTION_IDS).toContain(anchor)
    }
  })
})

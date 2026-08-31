import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { isEnabled } from '@/lib/flags'
import { decideBookEntry } from '@/lib/liap/book-entry'
import {
  SNEAK_PREVIEW_LABEL,
  SNEAK_PREVIEW_TAGLINE,
  SNEAK_PREVIEW_PATH,
  PREVIEW_CONTENT_APPROVED,
  PREVIEW_SECTIONS,
} from '@/lib/liap/preview'

// ---------------------------------------------------------------------------
// The Sneak Preview.
//
// Two things are being protected here and they pull in opposite directions.
//
// The campaign promises "SNEAK PREVIEW / Get a Look Inside" on printed and
// social collateral, so the site must eventually say exactly that — a button
// that paraphrases the poster is a defect even though it reads fine.
//
// And the book is unpublished, so until the owner supplies an approved
// excerpt nothing that looks like the author's prose may reach a reader. The
// shell exists; the content does not; the page must not blur that line.
//
// The assertions below are mostly structural, because the risks are
// structural: a flag defaulting on, a manuscript file landing in public/, a
// paraphrased CTA, a durable route quietly starting to 404.
// ---------------------------------------------------------------------------

const ROOT = process.cwd()
const source = (p: string) => readFileSync(join(ROOT, p), 'utf8')

/** Source with comments stripped, so prose cannot satisfy an assertion. */
const code = (p: string) =>
  source(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const PREVIEW_PAGE = 'app/liap/book/preview/page.tsx'
const CTA = 'components/liap/SneakPreviewCta.tsx'

beforeEach(() => vi.unstubAllEnvs())
afterEach(() => vi.unstubAllEnvs())

// ── H, I: the controls that must not have moved ──────────────────────────
describe('production defaults are unchanged', () => {
  const env = source('.env.example')

  it('FEATURE_LIAP is false', () => {
    expect(env).toMatch(/^FEATURE_LIAP=false$/m)
  })

  it('FEATURE_LIAP_PARTNERS is false', () => {
    expect(env).toMatch(/^FEATURE_LIAP_PARTNERS=false$/m)
  })

  it('the new preview flag ships off', () => {
    expect(env).toMatch(/^FEATURE_LIAP_BOOK_PREVIEW=false$/m)
  })

  it('an unset flag is off, so a missing variable cannot expose the preview', () => {
    vi.stubEnv('FEATURE_LIAP_BOOK_PREVIEW', '')
    expect(isEnabled('LIAP_BOOK_PREVIEW')).toBe(false)
    vi.stubEnv('FEATURE_LIAP_BOOK_PREVIEW', 'TRUE')
    expect(isEnabled('LIAP_BOOK_PREVIEW'), 'only the exact string "true" enables').toBe(false)
    vi.stubEnv('FEATURE_LIAP_BOOK_PREVIEW', 'true')
    expect(isEnabled('LIAP_BOOK_PREVIEW')).toBe(true)
  })

  it('PUBLICATION_DAY is still null', () => {
    expect(code('lib/liap/launch.ts')).toMatch(/export const PUBLICATION_DAY: string \| null = null/)
  })
})

// ── A: the durable route must not have been broken ───────────────────────
describe('the durable /liap/book route is intact', () => {
  it('still soft-lands rather than 404s when LIAP is off', () => {
    expect(decideBookEntry({ liapEnabled: false, activationEnabled: false, session: null }))
      .toEqual({ action: 'soft-landing' })
    expect(decideBookEntry({ liapEnabled: true, activationEnabled: false, session: null }))
      .toEqual({ action: 'soft-landing' })
  })

  it('still routes an entitled reader onward, and asks everyone else', () => {
    expect(
      decideBookEntry({ liapEnabled: true, activationEnabled: true, session: { entitled: true } }).action,
    ).toBe('assessment')
    expect(
      decideBookEntry({ liapEnabled: true, activationEnabled: true, session: null }),
    ).toEqual({ action: 'choose', signedIn: false })
  })

  it('the entry route itself still never calls notFound', () => {
    expect(code('app/liap/book/page.tsx')).not.toContain('notFound')
  })
})

// ── B, E: exposure is controlled by the flag, both ways ──────────────────
describe('the preview is closed until its flag opens it', () => {
  it('the page 404s when the flag is off', () => {
    const page = code(PREVIEW_PAGE)
    expect(page).toContain("isEnabled('LIAP_BOOK_PREVIEW')")
    expect(page).toMatch(/if \(!isEnabled\('LIAP_BOOK_PREVIEW'\)\) notFound\(\)/)
  })

  it('the CTA renders nothing at all when the flag is off — not hidden, absent', () => {
    const cta = code(CTA)
    expect(cta).toMatch(/if \(!isEnabled\('LIAP_BOOK_PREVIEW'\)\) return null/)
    expect(cta, 'a hidden link is still a link').not.toMatch(/hidden|display:\s*none|sr-only/)
  })

  it('the preview is not indexed while the content is a placeholder', () => {
    expect(code(PREVIEW_PAGE)).toMatch(/robots:\s*\{\s*index:\s*false/)
  })

  it('it is gated on its own flag, never on LIAP or the activation flow', () => {
    const page = code(PREVIEW_PAGE)
    expect(page).not.toMatch(/isEnabled\('LIAP'\)/)
    expect(page).not.toMatch(/isEnabled\('LIAP_BOOK_ACTIVATION'\)/)
  })
})

// ── C: the locked campaign wording ───────────────────────────────────────
describe('the CTA says exactly what the collateral says', () => {
  it('the approved strings are the approved strings', () => {
    expect(SNEAK_PREVIEW_LABEL).toBe('SNEAK PREVIEW')
    expect(SNEAK_PREVIEW_TAGLINE).toBe('Get a Look Inside')
  })

  it('the CTA renders them from the constants rather than retyping them', () => {
    const cta = code(CTA)
    expect(cta).toContain('{SNEAK_PREVIEW_LABEL}')
    expect(cta).toContain('{SNEAK_PREVIEW_TAGLINE}')
  })

  it('no surface paraphrases the approved wording', () => {
    // The near-misses a well-meaning edit produces.
    const files = ['app/living-is-a-project/book/page.tsx', 'components/liap/BookSoftLanding.tsx', CTA, PREVIEW_PAGE]
    for (const f of files) {
      const c = code(f)
      expect(c, `${f} paraphrases the tagline`).not.toMatch(/Take a Look Inside|Look Inside the Book|Peek Inside|Read a Sample/i)
    }
  })
})

// ── D: the destination resolves, and points where it says ────────────────
describe('the destination', () => {
  it('is nested under the durable print seam', () => {
    expect(SNEAK_PREVIEW_PATH).toBe('/liap/book/preview')
  })

  it('the file backing that path exists', () => {
    expect(() => source(PREVIEW_PAGE)).not.toThrow()
  })

  it('the CTA links to the constant, not a retyped string', () => {
    expect(code(CTA)).toContain('href={SNEAK_PREVIEW_PATH}')
  })
})

// ── F: free ──────────────────────────────────────────────────────────────
describe('a look inside costs nothing', () => {
  it('the preview page touches no payment, session, entitlement or database', () => {
    const page = code(PREVIEW_PAGE)
    for (const banned of ['stripe', 'Stripe', 'checkout', 'preorder', 'entitle', 'readLiapAccess', 'query(', 'queryOne']) {
      expect(page, `preview page references ${banned}`).not.toContain(banned)
    }
  })

  it('the CTA is a plain link, so it works without JavaScript', () => {
    const cta = code(CTA)
    expect(cta).toContain('<Link')
    expect(cta).not.toContain("'use client'")
    expect(cta).not.toContain('onClick')
  })
})

// ── G: preorder untouched ────────────────────────────────────────────────
describe('preorder still works exactly as it did', () => {
  it('the preorder CTA keeps its server-side checkout and price authority', () => {
    const c = code('components/liap/LiapCta.tsx')
    expect(c).toContain("fetch('/api/liap/preorder'")
    expect(c).toContain('window.location.href = data.url')
    expect(c, 'price must never be posted from the browser').not.toMatch(/price|amount|unit_amount/i)
  })

  it('the preorder route still reads the price from the server product record', () => {
    const r = code('app/api/liap/preorder/route.ts')
    expect(r).toContain('LIAP_BOOK')
    expect(r).toContain('success_url')
    expect(r).toContain('cancel_url')
  })

  it('the sales page still renders the preorder CTA above the preview CTA', () => {
    const page = code('app/living-is-a-project/book/page.tsx')
    expect(page).toContain('<LiapCta')
    expect(page).toContain('<SneakPreviewCta')
    expect(page.indexOf('<LiapCta')).toBeLessThan(page.indexOf('<SneakPreviewCta'))
  })
})

// ── K: only approved content is exposed ──────────────────────────────────
describe('no unapproved book content is exposed', () => {
  it('there is no approved excerpt yet, and the module says so', () => {
    expect(PREVIEW_CONTENT_APPROVED).toBe(false)
    expect(PREVIEW_SECTIONS).toEqual([])
  })

  it('the page shows a development notice instead of inventing prose', () => {
    const page = code(PREVIEW_PAGE)
    expect(page).toContain('PREVIEW_CONTENT_APPROVED')
    expect(page).toContain('PREVIEW_PENDING_NOTICE')
    expect(page).toContain('Not for publication')
  })

  it('no manuscript file was placed in public/, where nothing is gated', () => {
    const files: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) walk(full)
        else files.push(relative(ROOT, full))
      }
    }
    walk(join(ROOT, 'public'))
    const suspect = files.filter((f) =>
      /manuscript|excerpt|chapter|sneak|look[-_]inside|living[-_]is[-_]a[-_]project/i.test(f),
    )
    expect(suspect).toEqual([])
  })

  it('the preview module holds no long prose that could read as the book', () => {
    // A guard against the exact failure this design exists to prevent: an
    // excerpt-shaped string arriving without the owner's approval flag.
    // Comment-stripped and single-line, so an apostrophe in prose above cannot
    // open a pseudo-string that swallows half the file.
    const literals = [...code('lib/liap/preview.ts').matchAll(/'([^'\n]{160,})'/g)]
    expect(literals.map((m) => m[1]!.slice(0, 60))).toEqual([])
  })
})

// ── J: the Journey Map is retreat-only ───────────────────────────────────
describe('the Journey Map does not appear', () => {
  it('nothing in the new work references it', () => {
    for (const f of [PREVIEW_PAGE, CTA, 'lib/liap/preview.ts', 'components/liap/BookSoftLanding.tsx']) {
      expect(code(f), `${f} references the Journey Map`).not.toMatch(/journey ?map/i)
    }
  })
})

// ── attribution: reuse, never rebuild ────────────────────────────────────
describe('partner attribution is reused, not rebuilt', () => {
  it('the preview link is covered by the existing KeepReferral prefixes', () => {
    expect(code('components/liap/KeepReferral.tsx')).toContain("'/liap/'")
    expect(SNEAK_PREVIEW_PATH.startsWith('/liap/')).toBe(true)
  })

  it('no parallel attribution or new analytics platform was added', () => {
    for (const f of [PREVIEW_PAGE, CTA, 'lib/liap/preview.ts']) {
      const c = code(f)
      expect(c).not.toMatch(/gtag|fbq|dataLayer|document\.cookie|localStorage/)
    }
  })
})

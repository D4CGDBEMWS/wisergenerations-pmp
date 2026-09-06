import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  CAMPAIGN_AWARENESS,
  PREORDER_OPENS,
  PREORDER_PERIOD,
  PUBLICATION_DAY,
  PUBLICATION_MONTH,
  publicationDate,
  publicationDayPending,
} from '@/lib/liap/launch'
import { LIAP_BOOK } from '@/lib/liap/product'

// ---------------------------------------------------------------------------
// The publication date.
//
// Owner ruling: publication and public launch are one event, in November 2026.
// October 2026 is the Sneak Preview and preorder window and is not a release
// of any kind. Every October publication reference in the code was stale.
//
// The tests that matter here are the ones about DIVERGENCE, not about the
// current value. A date that is correct today in six hardcoded places is one
// careless edit from being correct in five.
// ---------------------------------------------------------------------------

const root = join(__dirname, '..')
const source = (rel: string) => readFileSync(join(root, rel), 'utf8')

/** Every LIAP source file that can render to a customer. */
function liapSurfaces(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(root, dir))) {
      const rel = `${dir}/${entry}`
      if (statSync(join(root, rel)).isDirectory()) walk(rel)
      else if (/\.tsx?$/.test(entry)) out.push(rel)
    }
  }
  walk('app/living-is-a-project')
  walk('app/liap')
  walk('app/api/liap')
  walk('components/liap')
  walk('lib/liap')
  return out
}

describe('November is publication, October is preorder', () => {
  it('publishes on 30 November 2026', () => {
    expect(PUBLICATION_MONTH).toBe('November 2026')
    // The owner chose the day on 4 September 2026, so the date the customer
    // reads is now the full date rather than the month.
    expect(publicationDate()).toBe('November 30, 2026')
    expect(publicationDate()).toContain('November')
  })

  it('keeps October as the preorder period and nothing else', () => {
    expect(PREORDER_PERIOD).toBe('October 2026')
    expect(PREORDER_OPENS).toBe('October 1, 2026')
    // The distinction the stale date destroyed: October is not a release.
    expect(PUBLICATION_MONTH).not.toContain('October')
    expect(publicationDate()).not.toContain('October')
  })

  it('leaves no October publication reference on any LIAP surface', () => {
    for (const file of liapSurfaces()) {
      // launch.ts is where October legitimately lives, as the preorder window.
      if (file === 'lib/liap/launch.ts') continue
      expect(source(file), file).not.toContain('October 2026')
      expect(source(file), file).not.toContain('October, 2026')
    }
  })

  it('does not touch the unrelated Delivery Pods date', () => {
    // NEGATIVE CONTROL for the sweep above: an Enterprise Academy product also
    // says November 2026, and it is nothing to do with LIAP. Its wording is
    // untouched, which proves the change was scoped rather than global.
    expect(source('app/pods/page.tsx')).toContain(
      'Delivery Pods are a new Enterprise Academy service launching November 2026',
    )
  })
})

describe('the three milestones stay three', () => {
  it('keeps Campaign Start, Preorder Opening and Publication distinct', () => {
    // Owner ruling: the distinction is intentional and must not collapse into
    // a generic "launch date". That ambiguity is what let October survive as a
    // publication month in six places — "launch" meant the campaign in one
    // document and the release in another, so neither reading looked wrong.
    expect(CAMPAIGN_AWARENESS).toBe('September 2026')
    expect(PREORDER_OPENS).toBe('October 1, 2026')
    expect(PUBLICATION_MONTH).toBe('November 2026')

    const milestones = [CAMPAIGN_AWARENESS, PREORDER_OPENS, PREORDER_PERIOD, PUBLICATION_MONTH]
    expect(new Set(milestones).size).toBe(milestones.length)
  })

  it('exports no generic launch-date constant', () => {
    // A single LAUNCH_DATE would be the collapse itself, whatever it held.
    const launch = source('lib/liap/launch.ts')
    expect(launch).not.toMatch(/export const LAUNCH_DATE\b/)
    expect(launch).not.toMatch(/export const LAUNCH\b/)
  })
})

describe('the date cannot silently diverge', () => {
  it('has exactly one place the month is written', () => {
    // Any surface that renders the date must call publicationDate(). A file
    // that spells the month out has stopped being connected to the source.
    for (const file of liapSurfaces()) {
      if (file === 'lib/liap/launch.ts') continue
      expect(source(file), `${file} hardcodes the month`).not.toContain('November 2026')
    }
  })

  it('is read from the source by every surface that shows it', () => {
    for (const file of [
      'app/living-is-a-project/book/page.tsx',
      'app/api/liap/preorder/route.ts',
      'lib/liap/product.ts',
    ]) {
      expect(source(file), file).toContain('publicationDate()')
    }

    // preorder-complete is deliberately absent. It used to say "your copy
    // ships when the book publishes in {date}", which tied delivery to
    // publication — a fulfilment promise nobody had authorised. The sentence
    // was removed under D6, so the page renders no date at all and has
    // nothing to read from the source.
    expect(source('app/living-is-a-project/preorder-complete/page.tsx')).not.toContain(
      'publicationDate',
    )
  })

  it('makes the checkout and the book page agree by construction', () => {
    // The failure this project has already had once, in the PMP checkout:
    // one price advertised, another charged, because the two numbers lived in
    // different files. A preorder page promising one month beside a receipt
    // promising another is the same mistake in front of the same customer.
    const bookPage = source('app/living-is-a-project/book/page.tsx')
    const checkout = source('app/api/liap/preorder/route.ts')
    expect(bookPage).toContain('${publicationDate()}')
    expect(checkout).toContain('${publicationDate()}')
    // Both resolve to the same string because there is only one function.
    expect(LIAP_BOOK.publishesOn).toBe(publicationDate())
  })

  it('leaves no second copy of the date in the product constant', () => {
    // publishesOn used to be a hand-typed 'October 2026' that nothing read —
    // a stale value with no consumer, which is how it survived unnoticed.
    expect(source('lib/liap/product.ts')).not.toMatch(/publishesOn:\s*'/)
  })
})

describe('the day the owner chose', () => {
  it('is the approved Publication & Official Book Launch date', () => {
    expect(PUBLICATION_DAY).toBe('November 30, 2026')
    expect(publicationDayPending()).toBe(false)
    expect(publicationDate()).toBe('November 30, 2026')
  })

  it('took one edit, and every surface moved with it', () => {
    // The point of the whole exercise, now demonstrated rather than promised:
    // one constant changed and the book page, the checkout description and
    // the product constant all read the new value.
    const launch = source('lib/liap/launch.ts')
    expect(launch).toContain('return PUBLICATION_DAY ?? PUBLICATION_MONTH')
    expect(LIAP_BOOK.publishesOn).toBe('November 30, 2026')
  })

  it('is not written out by hand on any surface', () => {
    // The same guard the month had. A file that spells the day out has
    // stopped being connected to the source and will go stale on its own.
    for (const file of liapSurfaces()) {
      if (file === 'lib/liap/launch.ts') continue
      expect(source(file), `${file} hardcodes the day`).not.toContain('November 30')
    }
  })

  it('is a publication date and never a delivery promise', () => {
    // Owner instruction, 4 September 2026: nothing may infer that a copy
    // ships, arrives or is in hand on this date. No such promise is
    // authorised, so no surface may imply one.
    for (const file of liapSurfaces()) {
      const text = source(file).toLowerCase()
      // Phrases that can only mean fulfilment. Deliberately not "arrives" on
      // its own: the approved copy says "when your book arrives", which is a
      // condition for the reader, not a promise from us — and the assessment
      // recommendations legitimately talk about problems arriving on top of
      // each other.
      for (const phrase of [
        'ships when',
        'ships on',
        'copy arrives on',
        'book arrives on',
        'delivered on',
        'in your hands',
        // "Preorder customers are charged now and receive their copy on
        // release" — a receipt promise pinned to publication day, removed on
        // owner instruction. These three catch it however it is phrased.
        'copy on release',
        'on release day',
        'receive their copy',
      ]) {
        expect(text, `${file} :: ${phrase}`).not.toContain(phrase)
      }
    }
  })
})

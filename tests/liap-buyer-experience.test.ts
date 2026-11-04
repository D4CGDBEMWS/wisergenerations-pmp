import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Owner report 2026-11-04: a pre-buyer was asked to order again, was dropped
// into a fresh assessment after finishing, and the book page cover was a placeholder.

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

describe('signed-in pre-buyers are not asked to buy again', () => {
  it('hub, book and author pre-buy buttons are wrapped in BuyerAware', () => {
    expect(read('app/living-is-a-project/page.tsx').match(/<BuyerAware/g)?.length).toBe(2)
    expect(read('app/living-is-a-project/book/page.tsx')).toContain('<BuyerAware>')
    expect(read('app/living-is-a-project/author/page.tsx')).toContain('<BuyerAware>')
  })
  it('a buyer sees a link to their assessment; anyone else sees the original button', () => {
    const c = read('components/liap/BuyerAware.tsx')
    expect(c).toContain("href=\"/living-is-a-project/assessment\"")
    expect(c).toContain('if (!entitled) return <>{children}</>')
  })
})

describe('a buyer who has finished the assessment', () => {
  const page = read('app/living-is-a-project/assessment/page.tsx')
  it('sees when they finished and where their plan is, not a fresh form', () => {
    expect(page).toContain("You&rsquo;ve completed your assessment")
    expect(page).toContain("status = 'completed'")
  })
  it('can still choose to take it again', () => {
    expect(page).toContain('/living-is-a-project/assessment?retake=1')
    expect(page).toContain("retake !== '1'")
  })
})

describe('book page cover', () => {
  it('shows the real cover image, not the text placeholder', () => {
    const p = read('app/living-is-a-project/book/page.tsx')
    expect(p).toContain('/liap/author/living-is-a-project-cover.png')
    expect(p).not.toContain('bg-gradient-to-br from-[#12233c]')
  })
})

describe('branded assessment journey (owner request 2026-11-04)', () => {
  it('no photo of Crystal on the results page or in emails', () => {
    expect(read('app/living-is-a-project/results/[token]/page.tsx')).not.toContain('crystal-glover-stewart')
    expect(read('lib/liap/email-brand.ts')).not.toContain('crystal-glover-stewart')
  })
  it('assessment and results open under the Living Is a Project banner', () => {
    expect(read('app/living-is-a-project/assessment/page.tsx')).toContain('<LiapBanner')
    expect(read('app/living-is-a-project/results/[token]/page.tsx')).toContain('<LiapBanner')
    expect(read('components/layout/Navbar.tsx')).toContain("'/living-is-a-project/assessment'")
  })
  it('emails use PNG art from the live site, never SVG', async () => {
    const { brandedEmail } = await import('@/lib/liap/email-brand')
    const html = brandedEmail({ preheader: 'x', bodyHtml: '<p>hi</p>' })
    expect(html).toContain('https://www.wisergenerations.com/liap/brand/email-banner.png')
    expect(html).not.toContain('<svg')
  })
})

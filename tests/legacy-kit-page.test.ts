import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { foreignShellLinks, shell, shellForPath, shellLinks } from '@/lib/shell'
import { parseKitOutline, readKitOutline } from '@/lib/legacy-kit/content'
import { LEGACY_KIT_CHECKOUT_OPEN, LEGACY_KIT_NAME_TM } from '@/lib/legacy-kit/product'

describe('the Legacy Kit shell', () => {
  const legacy = shell('legacy')

  it('owns /legacy-kit and everything under it', () => {
    expect(shellForPath('/legacy-kit').key).toBe('legacy')
    expect(shellForPath('/legacy-kit/thank-you').key).toBe('legacy')
    expect(shellForPath('/legacy-kitchen').key).toBe('default')
  })

  it('sends the logo to the kit, not the PMP homepage', () => {
    expect(legacy.homeHref).toBe('/legacy-kit')
  })

  it('shows no PMP or LIAP link, CTA, newsletter or pass-rate disclaimer', () => {
    expect(foreignShellLinks(legacy)).toEqual([])
    expect(shellLinks(legacy).some((h) => h.startsWith('/liap') || h.startsWith('/living-is-a-project'))).toBe(false)
    expect(legacy.showHeaderCtas).toBe(false)
    expect(legacy.showNewsletter).toBe(false)
    expect(legacy.showProgramDisclaimers).toBe(false)
  })

  it('does not link the PMP Terms of Service, which do not cover the kit', () => {
    expect(shellLinks(legacy)).not.toContain('/terms')
  })
})

describe('the kit outline read from content/wgi-legacy-kit.md', () => {
  const { sections, notices } = readKitOutline()

  it('lists the kit sections in order, notices first', () => {
    expect(sections).toEqual([
      'Important notices (read first)',
      'How to use this kit',
      'Our family profile and mission',
      'First 90 days: save, invest, protect',
      'Family budget and Legacy savings',
      'Readiness check and scorecard',
      'Family constitution starter',
      'Structure planner',
      'Resources',
    ])
  })

  it('repeats all ten Important notices verbatim', () => {
    expect(notices).toHaveLength(10)
    expect(notices[0].lead).toBe('Education only.')
    const source = readFileSync(join(process.cwd(), 'content', 'wgi-legacy-kit.md'), 'utf8')
    for (const n of notices) expect(source).toContain(`- **${n.lead}** ${n.body}`)
  })

  it('unescapes markdown escapes from the doc export', () => {
    const outline = parseKitOutline('## A \\_ B\n')
    expect(outline.sections).toEqual(['A _ B'])
  })
})

describe('the Legacy Kit page copy', () => {
  const page = readFileSync(join(process.cwd(), 'app', 'legacy-kit', 'page.tsx'), 'utf8')

  it('uses ™, never ®, on the product name', () => {
    expect(LEGACY_KIT_NAME_TM).toBe('Wiser Generations International Legacy Kit™')
    expect(page).not.toContain('®')
  })

  it('carries the educational-only line', () => {
    expect(page).toContain('Educational only — not legal, tax or financial advice.')
  })

  it('keeps checkout closed until delivery and Terms of Sale exist', () => {
    expect(LEGACY_KIT_CHECKOUT_OPEN).toBe(false)
  })

  it('states the owner’s no-refund policy', () => {
    expect(page).toContain('all sales are final')
  })

  it('has no testimonials', () => {
    // Code comments may state the rule; rendered copy may not break it.
    const code = page
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n')
    expect(code.toLowerCase()).not.toContain('testimonial')
  })
})

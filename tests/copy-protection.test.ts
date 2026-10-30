import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import robots from '@/app/robots'
import { AI_CRAWLERS } from '@/lib/ai-crawlers'
import { PREBUY_BONUS, bonusHref, BONUS_ROUTE } from '@/lib/liap/bonus'
import { withBuyerWatermark, watermarkText } from '@/lib/studio-watermark'

// Owner ruling 2026-10-30: copy-protection review, approved items.

const root = process.cwd()
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('the pre-buy bonus is no longer a public file', () => {
  it('lives outside public/ and ships with the bonus route', () => {
    expect(existsSync(join(root, 'public/liap/wiser-pivots-one-sheet.pdf'))).toBe(false)
    expect(existsSync(join(root, PREBUY_BONUS.file))).toBe(true)
    expect(PREBUY_BONUS.file.startsWith('public/')).toBe(false)
    expect(read(readdirConfig())).toContain("'/api/liap/bonus': ['./content/liap/**']")
  })

  it('builds links that carry the buyer proof', () => {
    expect(bonusHref({ sessionId: 'cs_test_123' })).toBe(`${BONUS_ROUTE}?session_id=cs_test_123`)
    expect(bonusHref({ token: 'abc' })).toBe(`${BONUS_ROUTE}?token=abc`)
    expect(bonusHref({})).toBe(BONUS_ROUTE)
  })

  it('checks entitlement, result token or a paid preorder checkout, and fails closed', () => {
    const src = read('app/api/liap/bonus/route.ts')
    expect(src).toContain('readLiapAccess')
    expect(src).toContain('findByResultToken')
    expect(src).toContain("payment_status === 'paid' && isLiapPreorder")
    expect(src).toContain('status: 403')
    expect(src).toContain("'Cache-Control': 'private, no-store'")
    // The route reads a static path (for file tracing); it must be the same file.
    expect(src).toContain(`join(process.cwd(), ${PREBUY_BONUS.file.split('/').map((p) => `'${p}'`).join(', ')})`)
  })

  it('is not linked as a static path anywhere', () => {
    for (const p of [
      'app/living-is-a-project/preorder-complete/page.tsx',
      'app/living-is-a-project/results/[token]/page.tsx',
      'app/living-is-a-project/author/page.tsx',
    ]) expect(read(p)).not.toContain('wiser-pivots-one-sheet.pdf')
  })
})

describe('AI crawlers are asked to stay out; search engines are not', () => {
  const rules = robots().rules as { userAgent: string | string[]; disallow?: string | string[]; allow?: string }[]
  it('disallows every listed AI crawler from the whole site', () => {
    const ai = rules.find((r) => Array.isArray(r.userAgent) && r.userAgent.includes('GPTBot'))!
    expect(ai.disallow).toBe('/')
    for (const bot of ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'PerplexityBot', 'Bytespider'])
      expect(AI_CRAWLERS).toContain(bot)
  })
  it('still allows everyone else, including Googlebot', () => {
    const all = rules.find((r) => r.userAgent === '*')!
    expect(all.allow).toBe('/')
    expect(AI_CRAWLERS).not.toContain('Googlebot')
    expect(AI_CRAWLERS).not.toContain('Bingbot')
  })
})

describe('framing and footer', () => {
  it('forbids other sites from framing the pages', () => {
    expect(read(readdirConfig())).toContain("\"frame-ancestors 'self'\"")
  })
  it('names the book trademarks in the footer', () => {
    const f = read('components/layout/Footer.tsx')
    expect(f).toContain('are trademarks of Crystal Glover Stewart')
    expect(f).toContain('Life Project-Ready&trade;')
  })
})

describe('buyer watermark in the PMP studio', () => {
  const page = '<html><head></head><body><main>Q1</main></body></html>'
  it('adds a click-through overlay naming the buyer, before </body>', () => {
    const out = withBuyerWatermark(page, 'pat@example.com')
    expect(out).toContain('id="wg-buyer-watermark"')
    expect(out).toContain('pointer-events:none')
    expect(out.indexOf('wg-buyer-watermark')).toBeLessThan(out.indexOf('</body>'))
    expect(watermarkText('pat@example.com')).toContain('Licensed to pat@example.com')
    expect(decodeURIComponent(out)).toContain('Licensed to pat@example.com')
  })
  it('escapes the email so it cannot break out of the overlay', () => {
    const out = decodeURIComponent(withBuyerWatermark(page, `x"'><script>@e.com`))
    expect(out).not.toContain('<script>@')
    expect(out).toContain('&lt;script&gt;')
  })
  it('is applied per request in the studio route, not to the shared cache', () => {
    const src = read('app/api/studio/route.ts')
    expect(src).toContain('withBuyerWatermark(await loadStudio(), session.email)')
  })
})

describe('free PDFs carry the ownership stamp', () => {
  for (const f of [
    'public/liap/author/words-to-know.pdf',
    'public/PMP-Exam-Change-Guide-WiserGenerations.pdf',
    PREBUY_BONUS.file,
  ]) {
    it(f, () => {
      // The stamp's text sits in a compressed content stream; the document
      // information written alongside it is plain, so that is what we check.
      const raw = readFileSync(join(root, f)).toString('latin1')
      expect(raw).toContain('/Author (Crystal Glover Stewart)')
      expect(raw).toMatch(/\/Copyright \(/)
    })
  }
})

function readdirConfig(): string {
  for (const n of ['next.config.mjs', 'next.config.js', 'next.config.ts']) if (existsSync(join(root, n))) return n
  throw new Error('no next.config')
}

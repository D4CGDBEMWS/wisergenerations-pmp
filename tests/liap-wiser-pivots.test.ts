import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { PREBUY_BONUS } from '@/lib/liap/bonus'
import { STEADY_STEPS, PIVOTS_INTRO, PIVOTS_CYCLE, PIVOT_STEP } from '@/lib/liap/scoring'

// Owner ruling 2026-10-29: S.T.E.A.D.Y. is retired from every customer surface;
// the results page carries a brief WISER Pivots™ mention and a one-sheet.

const RESULTS = join(process.cwd(), 'app/living-is-a-project/results/[token]/page.tsx')
const RECS = join(process.cwd(), 'lib/liap/recommendations.ts')

describe('WISER Pivots™ replaces S.T.E.A.D.Y.', () => {
  it('carries the approved cycle, in order, with PIVOT as the one focal step', () => {
    expect(PIVOTS_CYCLE).toEqual(['WAIT', 'INSPECT', 'SELECT', 'EMBRACE', 'PIVOT', 'REVIEW'])
    expect(STEADY_STEPS.filter((s) => s.focal)).toHaveLength(1)
    expect(PIVOT_STEP.title).toBe('PIVOT')
    expect(PIVOTS_INTRO.signature).toBe('The bend is not the end. Be ready to make the turn.')
  })

  it('no longer shows S.T.E.A.D.Y. on the results page or in plan text', () => {
    for (const f of [RESULTS, RECS]) {
      const src = readFileSync(f, 'utf8').replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
      expect(src).not.toMatch(/S\.T\.E\.A\.D\.Y/)
    }
  })

  it('links to a one-sheet that ships with the site', () => {
    const src = readFileSync(RESULTS, 'utf8')
    expect(src).toContain('PREBUY_BONUS.href')
    expect(PREBUY_BONUS.href).toBe('/liap/wiser-pivots-one-sheet.pdf')
    expect(existsSync(join(process.cwd(), 'public/liap/wiser-pivots-one-sheet.pdf'))).toBe(true)
  })
})

describe('the pre-buy bonus', () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
  it('is offered where people pre-buy and handed over on the thank-you page', () => {
    for (const p of [
      'app/living-is-a-project/author/page.tsx',
      'app/living-is-a-project/book/page.tsx',
    ]) expect(read(p)).toContain('PREBUY_BONUS.offer')
    // Both thank-you variants (Assessment open and not yet open) carry it.
    const done = read('app/living-is-a-project/preorder-complete/page.tsx')
    expect(done.match(/href=\{PREBUY_BONUS\.href\}/g)).toHaveLength(2)
  })
})

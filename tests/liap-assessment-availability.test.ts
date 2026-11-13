import { describe, it, expect, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  assessmentOpen,
  assessmentTimingShort,
  assessmentCheckoutLine,
} from '@/lib/liap/assessment-availability'

// ---------------------------------------------------------------------------
// Owner ruling 2026-10-29: pre-orders may open before the Assessment does.
// While LIAP_ASSESSMENT is off, nothing a buyer reads may promise that the
// Assessment is available now, and every surface must read the same source.
// ---------------------------------------------------------------------------

const root = join(__dirname, '..')
const source = (rel: string) => readFileSync(join(root, rel), 'utf8')

afterEach(() => {
  delete process.env.FEATURE_LIAP_ASSESSMENT
})

describe('the Assessment opens on its own switch', () => {
  it('is closed unless explicitly enabled', () => {
    expect(assessmentOpen()).toBe(false)
    process.env.FEATURE_LIAP_ASSESSMENT = 'yes'
    expect(assessmentOpen()).toBe(false)
    process.env.FEATURE_LIAP_ASSESSMENT = 'true'
    expect(assessmentOpen()).toBe(true)
  })

  it('promises nothing immediate while closed', () => {
    for (const line of [assessmentTimingShort(), assessmentCheckoutLine()]) {
      expect(line).not.toMatch(/immediately|as soon as payment/i)
      expect(line).toMatch(/when it opens|opens soon/i)
    }
  })

  it('says it is available now once open', () => {
    process.env.FEATURE_LIAP_ASSESSMENT = 'true'
    expect(assessmentTimingShort()).toMatch(/as soon as payment is confirmed/)
    expect(assessmentCheckoutLine()).toMatch(/immediately/)
  })
})

describe('every buyer-facing surface reads the same switch', () => {
  it('gates the Assessment API and page on LIAP_ASSESSMENT', () => {
    expect(source('app/api/liap/assessment/route.ts')).toContain("isEnabled('LIAP_ASSESSMENT')")
    expect(source('app/living-is-a-project/assessment/page.tsx')).toContain('assessmentOpen()')
  })

  it('leaves no hard-coded "unlocks immediately" promise on a pre-buy surface', () => {
    for (const file of [
      'app/living-is-a-project/book/page.tsx',
      'app/living-is-a-project/author/page.tsx',
      'app/living-is-a-project/preorder-complete/page.tsx',
      'app/api/liap/preorder/route.ts',
    ]) {
      const src = source(file)
      expect(src, file).not.toMatch(/'Immediately\./)
      expect(src, file).not.toContain('Assessment immediately.`')
      expect(src, file).toMatch(/assessmentOpen\(\)|assessmentTimingShort\(\)|assessmentCheckoutLine\(\)/)
    }
  })
})

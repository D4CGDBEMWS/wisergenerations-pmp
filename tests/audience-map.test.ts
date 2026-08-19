import { describe, it, expect } from 'vitest'
import { AUDIENCE_MAP } from '@/app/components/HomeClient'
import { PROGRAMS } from '@/lib/constants'

// Regression test for the audit finding: AUDIENCE_MAP referenced 'pmp-adult',
// which is not a program id, so the homepage's "Career Transitioner" filter
// silently dropped the PMP program — the single most important product for
// that audience.
//
// Asserted as a general invariant rather than a check for that one string, so
// any future rename that breaks the mapping fails here instead of shipping.
describe('homepage audience filter', () => {
  const validIds = new Set(PROGRAMS.map((p) => p.id))

  it('every mapped id refers to a real program', () => {
    for (const [audience, ids] of Object.entries(AUDIENCE_MAP)) {
      for (const id of ids) {
        expect(validIds.has(id), `audience "${audience}" maps to unknown program "${id}"`).toBe(true)
      }
    }
  })

  it('Career Transitioner includes the PMP program', () => {
    expect(AUDIENCE_MAP.professional).toContain('pmp')
  })

  it('every audience except "all" resolves to at least one program', () => {
    for (const [audience, ids] of Object.entries(AUDIENCE_MAP)) {
      if (audience === 'all') continue
      expect(ids.length, `audience "${audience}" resolves to nothing`).toBeGreaterThan(0)
    }
  })
})

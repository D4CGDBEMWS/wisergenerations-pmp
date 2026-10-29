import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { classesResumeLabel, getUpcomingCohorts } from '@/lib/site-config'
import { getSystemPrompt } from '@/lib/knowledge-base'

// Owner ruling 2026-10-29: PMP work is on hold until the book launches; live
// classes resume in May 2027.

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

describe('live classes are paused until May 2027', () => {
  it('offers no cohort and names the resume month', () => {
    expect(getUpcomingCohorts(Date.parse('2026-11-03T12:00:00Z'))).toEqual([])
    expect(classesResumeLabel()).toBe('May 2027')
  })

  it('tells the assistant the month and nothing more specific', () => {
    const prompt = getSystemPrompt()
    expect(prompt).toContain('LIVE CLASSES PAUSED')
    expect(prompt).toContain('resume in May 2027')
  })

  it('shows the notice on every page that sells or schedules live classes', () => {
    for (const p of [
      'app/pmp/page.tsx',
      'app/capm/page.tsx',
      'app/programs/page.tsx',
      'app/enroll/page.tsx',
      'app/checkout/page.tsx',
    ]) expect(read(p)).toContain('<ClassesResumeNotice />')
    expect(read('app/page.tsx')).toContain('Live classes resume in {resume}')
  })
})

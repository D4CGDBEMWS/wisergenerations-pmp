import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { WORKSHOP_SESSIONS, sessionDayLabel } from '@/lib/liap/workshop'

// ---------------------------------------------------------------------------
// One source of workshop dates, and it is lib/liap/workshop.ts.
//
// Owner ruling, 2026-11-13: use the latest workshop date. The latest is
// January 11-15, 2027 (owner rulings 2026-10-29 / 2026-11-04), and it lives in
// WORKSHOP_SESSIONS, which every route, the API and the Stripe webhook read.
//
// This branch also carries lib/liap/workshop/, an earlier take on the same
// idea that the merge with main brought alongside it. Its email templates are
// owner-approved and are kept, but it must never become a SECOND place a
// workshop date is written down: two sources drift, and the one that drifts is
// always the one nobody is looking at. Its templates carry a [Date] merge
// field precisely so they have no date of their own.
//
// So the rule this file enforces is narrow and mechanical: outside
// lib/liap/workshop.ts, no module may hardcode a workshop date.
// ---------------------------------------------------------------------------

const root = process.cwd()
const read = (p: string) => readFileSync(join(root, p), 'utf8')

/** The file with every comment removed, so assertions match code not prose. */
function code(path: string): string {
  return read(path)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

const SOURCE = 'lib/liap/workshop.ts'

describe('the workshop date has one source', () => {
  it('is January 11-15, 2027 -- the latest the owner ruled', () => {
    const days = [...new Set(WORKSHOP_SESSIONS.map((s) => s.key.slice(0, 10)))].sort()
    expect(days).toEqual([
      '2027-01-11',
      '2027-01-12',
      '2027-01-13',
      '2027-01-14',
      '2027-01-15',
    ])
    // Two sessions a day, so the picker offers ten in total.
    expect(WORKSHOP_SESSIONS).toHaveLength(10)
    expect(sessionDayLabel(WORKSHOP_SESSIONS[0]!)).toBe('Monday, January 11, 2027')
    expect(sessionDayLabel(WORKSHOP_SESSIONS.at(-1)!)).toBe('Friday, January 15, 2027')
  })

  it('no other module writes a workshop date down', () => {
    // Any 2027 January date, in ISO or in prose, outside the one source.
    const DATE = /2027-01-1[1-5]|January\s+1[1-5],?\s*(?:-|–|to)?\s*(?:1[1-5],?\s*)?2027/
    const offenders: string[] = []

    const walk = (dir: string) => {
      for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`
        if (entry.isDirectory()) {
          if (['node_modules', '.next', '.git'].includes(entry.name)) continue
          walk(rel)
        } else if (/\.tsx?$/.test(entry.name)) {
          if (rel === SOURCE) continue
          // Pages legitimately PRINT the date for the reader; they are allowed
          // to, but only by reading it from the source module.
          if (DATE.test(code(rel)) && !code(rel).includes("@/lib/liap/workshop'")) {
            offenders.push(rel)
          }
        }
      }
    }
    for (const dir of ['lib', 'components']) walk(dir)

    expect(offenders, `these hardcode a workshop date instead of reading it from ${SOURCE}`).toEqual([])
  })

  it('the superseded workshop copy has no date of its own', () => {
    // Its subject line is "Your LIAP Virtual Workshop — [Date]": a merge field,
    // filled at send time. If a literal date ever lands here it has become a
    // second source, whatever the comment above it says.
    const copy = code('lib/liap/workshop/copy.ts')
    expect(copy).not.toMatch(/2027-01-1[1-5]/)
    expect(copy).not.toMatch(/January\s+1[1-5]/)
    expect(read('lib/liap/workshop/copy.ts')).toContain('[Date]')
  })

  it('the superseded module is still wired to nothing', () => {
    // It is kept for its owner-approved copy, not because it runs. The day
    // something imports it, that import is a decision someone must make
    // deliberately -- and at that point it needs the date from the source.
    const importers: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`
        if (entry.isDirectory()) {
          if (['node_modules', '.next', '.git'].includes(entry.name)) continue
          walk(rel)
        } else if (/\.tsx?$/.test(entry.name)) {
          if (rel.startsWith('lib/liap/workshop/')) continue
          if (/@\/lib\/liap\/workshop\/(copy|lifecycle|survey)/.test(code(rel))) importers.push(rel)
        }
      }
    }
    for (const dir of ['app', 'lib', 'components']) walk(dir)
    expect(importers, 'the superseded workshop module is now reachable from the app').toEqual([])
  })
})

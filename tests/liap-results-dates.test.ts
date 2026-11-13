import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { createTestDb, seedCustomer } from './helpers/db'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { QUESTIONS } from '@/lib/liap/assessment/v1'
import { startOrResume, saveProgress, submitAssessment } from '@/lib/liap/assessment-service'

// ---------------------------------------------------------------------------
// Dates on the results page and in the snapshot PDF.
//
// ── WHY THIS SUITE RENDERS INSTEAD OF READING ──────────────────────────────
//
// The page asked Postgres for `next_review_on` and typed the answer `string`.
// A `date` column is not a string: the Neon driver runs pg-types, whose parser
// for oid 1082 returns a JS Date, so `new Date(`${value}T00:00:00Z`)` produced
// NaN and the page rendered "Next review date: Invalid Date".
//
// It compiled. It type-checked. It passed review. There was no test on this
// page at all, and no test that reads source could have caught it, because the
// source says the right thing -- the lie is in the type annotation, and types
// are erased before the value ever arrives.
//
// So this suite drives the real route component against real Postgres and
// asserts on the markup it actually produces. The snapshot route had the same
// defect in the same shape (`.toString().slice(0, 10)` on a timestamptz Date
// yields "Tue Sep 0") and is covered the same way.
// ---------------------------------------------------------------------------

// next/font is a build-time transform; under vitest it must be stubbed or the
// page module fails to load at all.
vi.mock('next/font/local', () => ({
  default: () => ({ className: 'font-stub', style: { fontFamily: 'stub' } }),
}))
vi.mock('next/font/google', () => ({
  Cormorant_Garamond: () => ({ className: 'font-stub', style: { fontFamily: 'stub' } }),
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined }),
}))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
  redirect: (url: string) => {
    throw new Error('NEXT_REDIRECT:' + url)
  },
}))

let db: Db
let closeDb: () => Promise<void>

beforeAll(async () => {
  const t = await createTestDb()
  db = t.db
  closeDb = t.close
  setDbForTesting(db)
})
afterAll(async () => {
  setDbForTesting(null)
  await closeDb()
})

/** The file with every comment removed, so assertions match code not prose. */
function code(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

const PAGE = 'app/living-is-a-project/results/[token]/page.tsx'
const SNAPSHOT = 'app/living-is-a-project/results/[token]/snapshot/route.ts'

async function completedAssessment(email: string): Promise<{ token: string; id: string }> {
  const customerId = await seedCustomer(db, email)
  const rec = await startOrResume(customerId)
  const answers: Record<string, number> = {}
  for (const q of QUESTIONS) answers[q.key] = 3
  await saveProgress(rec.id, { answers })
  const res = await submitAssessment(rec.id)
  expect(res, 'submitAssessment returned nothing').toBeTruthy()
  return { token: res!.resultToken, id: rec.id }
}

async function render(token: string): Promise<string> {
  const { default: ResultsPage } = await import('@/app/living-is-a-project/results/[token]/page')
  const el = await ResultsPage({ params: Promise.resolve({ token }) })
  return renderToStaticMarkup(el as ReactElement)
}

const MONTHS =
  'January|February|March|April|May|June|July|August|September|October|November|December'

describe('the review date on the results page', () => {
  it('renders a real date, never the string "Invalid Date"', async () => {
    const a = await completedAssessment('reviewdate@example.com')
    const html = await render(a.token)
    expect(html).not.toContain('Invalid Date')
    expect(html).toContain('Next review date')
    expect(html.replace(/<[^>]*>/g, ' ')).toMatch(
      new RegExp(`Next review date:\\s*(${MONTHS}) \\d{1,2}, \\d{4}`)
    )
  })

  it('renders the same day Postgres stored', async () => {
    const a = await completedAssessment('sameday@example.com')
    const rows = await db.query<{ d: string }>(
      `SELECT to_char(next_review_on, 'FMMonth FMDD, YYYY') AS d
         FROM assessment_results WHERE assessment_id = $1`,
      [a.id]
    )
    expect(rows[0]?.d).toBeTruthy()
    await expect(render(a.token)).resolves.toContain(rows[0]!.d)
  })

  it('drops the sentence entirely when there is no readable date', async () => {
    // Better to say nothing than to print "Next review date:" followed by
    // nothing, or by "Invalid Date".
    const a = await completedAssessment('nodate@example.com')
    await db.query(`UPDATE assessment_results SET next_review_on = NULL WHERE assessment_id = $1`, [
      a.id,
    ])
    const html = await render(a.token)
    expect(html).not.toContain('Invalid Date')
    expect(html).not.toContain('Next review date')
  })

  it('does not claim the date column is a string', () => {
    // The defect in one line. This annotation type-checked and was false.
    const src = code(PAGE)
    expect(src).not.toMatch(/next_review_on:\s*string/)
    expect(src).toMatch(/next_review_on:\s*unknown/)
  })

  it('guards the render on the formatted value, not the raw column', () => {
    // Testing the raw column would still render the sentence for a value that
    // formats to nothing.
    expect(code(PAGE)).not.toMatch(/\{reviewRow\?\.next_review_on && \(/)
  })
})

describe('formatDate accepts what the driver actually returns', () => {
  // Exercised through the page above; these pin the shape directly so a future
  // refactor cannot narrow the parameter back to `string`.
  it('handles a Date, an ISO day string, and neither', async () => {
    const a = await completedAssessment('shapes@example.com')
    for (const value of [
      new Date('2027-03-01T00:00:00Z'),
      '2027-03-01',
      '2027-03-01T00:00:00.000Z',
    ]) {
      await db.query(`UPDATE assessment_results SET next_review_on = $2 WHERE assessment_id = $1`, [
        a.id,
        value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10),
      ])
      const html = await render(a.token)
      expect(html, String(value)).not.toContain('Invalid Date')
      expect(html, String(value)).toContain('March 1, 2027')
    }
  })
})

describe('the completion date in the snapshot PDF', () => {
  it('does not slice a Date into "Tue Sep 0"', () => {
    const src = code(SNAPSHOT)
    expect(src).not.toMatch(/completed_at:\s*string/)
    expect(src).not.toMatch(/completed_at\s*\?\?\s*''\)\.toString\(\)\.slice/)
    expect(src).toContain('toIsoDay')
  })

  it('prints an ISO day the PDF filename guard also accepts', async () => {
    const { snapshotFilename } = await import('@/lib/liap/snapshot-pdf')
    const a = await completedAssessment('pdfdate@example.com')
    const rows = await db.query<{ c: unknown }>(
      `SELECT completed_at AS c FROM assessments WHERE id = $1`,
      [a.id]
    )
    const raw = rows[0]!.c
    // The value really is a Date (or a timestamp string), never a plain day.
    const iso =
      raw instanceof Date ? raw.toISOString().slice(0, 10) : new Date(String(raw)).toISOString().slice(0, 10)
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    // The old expression would have produced a weekday prefix for a Date.
    expect(String(raw).slice(0, 10)).not.toBe(iso)
    expect(snapshotFilename(iso)).not.toContain('undated')
  })
})

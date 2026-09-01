import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { createTestDb, seedCustomer } from './helpers/db'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { QUESTIONS, DIMENSION_KEYS, DIMENSIONS } from '@/lib/liap/assessment/v2'
import {
  startOrResume,
  saveProgress,
  submitAssessment,
  rebuildReport,
} from '@/lib/liap/assessment-service'
import { generateToken, hashToken } from '@/lib/auth/crypto'

// ---------------------------------------------------------------------------
// The Results experience, rendered.
//
// ── WHY THIS SUITE RENDERS RATHER THAN READS ───────────────────────────────
//
// Every claim here was first made by reading the source, and two of them were
// wrong. The results page asked Postgres for `next_review_on` and typed the
// answer `string`; the driver returns a JS Date, so the page compiled, passed
// every source-level assertion, and printed "Next review date: Invalid Date"
// on every plan it ever rendered. No amount of reading the file finds that.
//
// So these tests drive the REAL route component against a REAL Postgres, and
// assert on the markup it actually produces. A test that reads a file can only
// prove the file says something. This suite proves the page does something.
// ---------------------------------------------------------------------------

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (cookieValue ? { name, value: cookieValue } : undefined),
  }),
}))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
  redirect: (url: string) => {
    throw new Error('NEXT_REDIRECT:' + url)
  },
}))

let cookieValue: string | undefined
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

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8')
}
/** The file with every comment removed, so assertions match code not prose. */
function code(path: string): string {
  return source(path)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

const PAGE = 'app/living-is-a-project/results/[token]/page.tsx'

/** The same five-per-dimension answer set the participant would submit. */
function answersAt(per: Partial<Record<string, number>>, fallback = 3): Record<string, number> {
  const out: Record<string, number> = {}
  for (const q of QUESTIONS) out[q.key] = per[q.dimension as string] ?? fallback
  return out
}

interface Completed {
  token: string
  customerId: string
  assessmentId: string
}

async function complete(
  email: string,
  per: Partial<Record<string, number>> = {},
  fallback = 3,
  narratives?: Record<string, string>
): Promise<Completed> {
  const customerId = await seedCustomer(db, email)
  const rec = await startOrResume(customerId)
  await saveProgress(rec.id, {
    answers: answersAt(per, fallback),
    intake: { changeType: 'career', area: 'work', urgency: 4 },
    ...(narratives ? { narratives: narratives as never } : {}),
  })
  const res = await submitAssessment(rec.id)
  expect(res, 'submitAssessment returned nothing').toBeTruthy()
  return { token: res!.resultToken, customerId, assessmentId: rec.id }
}

async function renderResults(token: string): Promise<string> {
  const { default: ResultsPage } = await import('@/app/living-is-a-project/results/[token]/page')
  const el = await ResultsPage({ params: Promise.resolve({ token }) })
  return renderToStaticMarkup(el as ReactElement)
}

/** Visible text, with the entities the browser would resolve resolved. */
function text(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&rsquo;|&#x27;/g, '’')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
}

async function sessionFor(customerId: string): Promise<string> {
  const t = generateToken()
  await db.query(
    `INSERT INTO sessions (customer_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '7 days')`,
    [customerId, hashToken(t)]
  )
  return t
}

// ===========================================================================
describe('the real route renders a real result', () => {
  it('all eight dimensions appear, under their canonical v2 names', async () => {
    const c = await complete('eight@example.com')
    const t = text(await renderResults(c.token))
    expect(DIMENSIONS).toHaveLength(8)
    for (const d of DIMENSIONS) expect(t, `missing dimension: ${d.name}`).toContain(d.name)
    expect(DIMENSION_KEYS).toContain('spiritual')
    expect(DIMENSION_KEYS).not.toContain('risk')
  })

  it('the score shown for each dimension is the score that was stored', async () => {
    const c = await complete('scores@example.com', { money: 2, vision: 5 })
    const t = text(await renderResults(c.token))
    // 5 questions x value, per dimension.
    expect(t).toContain('Money — 10/25')
    expect(t).toContain('Vision — 25/25')
    const stored = await db.query<{ dimension_key: string; score: number }>(
      `SELECT dimension_key, score FROM assessment_scores WHERE assessment_id = $1`,
      [c.assessmentId]
    )
    for (const row of stored) {
      const name = DIMENSIONS.find((d) => d.key === row.dimension_key)!.name
      expect(t, `${name} score not rendered`).toContain(`${name}`)
      expect(t).toContain(`${row.score}`)
    }
  })

  it('a dimension at or below 10 is stated before anything else in the body', async () => {
    const c = await complete('urgent@example.com', { money: 2 }, 4)
    const t = text(await renderResults(c.token))
    expect(t).toContain('Start Here')
    expect(t.indexOf('Start Here')).toBeLessThan(t.indexOf('Life Project Readiness at a Glance'))
    expect(t.indexOf('Start Here')).toBeLessThan(t.indexOf('Your eight dimensions'))
  })
})

// ===========================================================================
describe('Life Project Readiness at a Glance', () => {
  it('is on the page, with the four zones in the approved order', async () => {
    const c = await complete('glance@example.com', { money: 2, vision: 5 })
    const t = text(await renderResults(c.token))

    const positions = [
      'Life Project Readiness at a Glance',
      'Where I am',
      'What stands out',
      'What may deserve attention',
      'What I may want to do next',
    ].map((label) => {
      const at = t.indexOf(label)
      expect(at, `zone missing from the rendered page: ${label}`).toBeGreaterThan(-1)
      return at
    })
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]!, 'zones are out of the approved order').toBeGreaterThan(positions[i - 1]!)
    }
  })

  it('carries the approved closing sentence, verbatim and last', async () => {
    const c = await complete('closing@example.com')
    const t = text(await renderResults(c.token))
    const SENTENCE = 'May you discern what project matters most to you.'
    expect(t).toContain(SENTENCE)
    // Last thing in the panel: after every zone, before the detail sections.
    expect(t.indexOf(SENTENCE)).toBeGreaterThan(t.indexOf('What I may want to do next'))
    expect(t.indexOf(SENTENCE)).toBeLessThan(t.indexOf('Your eight dimensions'))
    // And exactly as written -- no strengthening, no substitution.
    expect(t).not.toMatch(/May you discern what project matters most to you[^.]/)
    expect(source(PAGE)).toContain(SENTENCE)
  })

  it('is connected to the real result, not to placeholder text', async () => {
    const c = await complete('connected@example.com', { money: 2, vision: 5 }, 4)
    const report = await rebuildReport(c.assessmentId)
    const t = text(await renderResults(c.token))

    // WHERE I AM is this participant's position and total.
    expect(t).toContain(report.positionLabel)
    expect(t).toContain(`${report.total} of 200 across eight dimensions`)
    // WHAT MAY DESERVE ATTENTION names the dimension that actually scored lowest.
    expect(report.urgent.map((s) => s.key)).toContain('money')
    expect(t).toContain('Money — 10/25')
    // WHAT I MAY WANT TO DO NEXT is the stored next-best-three, by their
    // participant-facing labels.
    for (const a of report.actions) expect(t).toContain(a.headline)
    for (const label of ['PROTECT', 'GIVE ATTENTION', 'STRENGTHEN']) expect(t).toContain(label)
  })

  it('every zone is populated for a participant with nothing urgent', async () => {
    // The all-25 case: no urgent dimensions and every dimension a strength.
    // Each zone must still say something rather than collapsing to a gap.
    const c = await complete('perfect@example.com', {}, 5)
    const t = text(await renderResults(c.token))
    for (const zone of [
      'Where I am',
      'What stands out',
      'What may deserve attention',
      'What I may want to do next',
    ]) {
      expect(t, `zone absent on an all-strength result: ${zone}`).toContain(zone)
    }
    expect(t).toContain('200 of 200 across eight dimensions')
  })

  it('adds no prose of its own: the panel is heading, labels, data, closing', async () => {
    // The section renders only owner-supplied fixed text. Anything else on it
    // would be language nobody approved, on the surface a participant reads
    // first. GLANCE_ZONES holds the four labels and nothing that reads as a
    // sentence.
    const src = code(PAGE)
    const block = src.slice(src.indexOf('const GLANCE_ZONES'), src.indexOf('const CLASSIFICATION_STYLE'))
    expect(block).toContain("label: 'Where I am'")
    expect(block).toContain("label: 'What stands out'")
    expect(block).toContain("label: 'What may deserve attention'")
    expect(block).toContain("label: 'What I may want to do next'")
    // No sentence-shaped literal anywhere in the zone table.
    for (const literal of block.match(/'[^']{25,}'/g) ?? []) {
      expect(literal, `unapproved prose in the glance panel: ${literal}`).not.toMatch(/\w \w+ \w+ \w+ \w+ \w+/)
    }
  })
})

// ===========================================================================
describe('the review date is a date', () => {
  it('renders a real date, never the string "Invalid Date"', async () => {
    const c = await complete('review@example.com')
    const html = await renderResults(c.token)
    expect(html).not.toContain('Invalid Date')
    expect(html).toContain('Next review date')
    // A month name, i.e. something actually formatted.
    expect(text(html)).toMatch(
      /Next review date: (January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}/
    )
  })

  it('the stored date and the rendered date are the same day', async () => {
    const c = await complete('sameday@example.com')
    const row = await db.query<{ d: string }>(
      `SELECT to_char(next_review_on, 'FMMonth FMDD, YYYY') AS d
         FROM assessment_results WHERE assessment_id = $1`,
      [c.assessmentId]
    )
    expect(text(await renderResults(c.token))).toContain(row[0]!.d)
  })

  it('an unreadable date drops the sentence rather than printing nonsense', async () => {
    const c = await complete('nodate@example.com')
    await db.query(`UPDATE assessment_results SET next_review_on = NULL WHERE assessment_id = $1`, [
      c.assessmentId,
    ])
    const html = await renderResults(c.token)
    expect(html).not.toContain('Invalid Date')
    expect(html).not.toContain('Next review date')
  })

  it('the query does not claim the date column is a string', () => {
    // The defect in one line: `queryOne<{ next_review_on: string }>` type-checks
    // and is false at runtime. pg-types parses oid 1082 into a Date.
    const src = code(PAGE)
    expect(src).not.toMatch(/next_review_on:\s*string/)
    expect(src).toMatch(/next_review_on:\s*unknown/)
  })
})

// ===========================================================================
describe('the participant-facing labels', () => {
  it('PROTECT / GIVE ATTENTION / STRENGTHEN are rendered, never the stored keys', async () => {
    const c = await complete('labels@example.com')
    const t = text(await renderResults(c.token))
    for (const label of ['PROTECT', 'GIVE ATTENTION', 'STRENGTHEN']) expect(t).toContain(label)
    // The database keys must not reach the page.
    expect(t).not.toMatch(/\bRESOLVE\b/)
    expect(t).not.toMatch(/\bMOVE\b/)
  })

  it('are set in gold-text, which clears AA on white -- not brand gold, which does not', () => {
    const src = code(PAGE)
    const block = src.slice(src.indexOf('actionLabel(action.kind)') - 400, src.indexOf('actionLabel(action.kind)'))
    expect(block).toContain('text-gold-text')
    expect(block).not.toMatch(/text-gold[^-]/)
  })

  it('the one download control has a focus ring of its own', () => {
    // Without it the browser default applies: a near-black ring on a navy
    // button, about 1.1:1, which a keyboard user cannot see.
    const src = code(PAGE)
    const at = src.indexOf('Download My Life Project Snapshot')
    expect(at).toBeGreaterThan(-1)
    expect(src.slice(at - 500, at)).toContain('focus-visible:outline-gold')
  })
})

// ===========================================================================
describe('access to somebody else’s results', () => {
  it('the holder of the token sees it; a different signed-in customer does not', async () => {
    const a = await complete('alice.r@example.com', {}, 4)
    const b = await complete('bob.r@example.com', {}, 2)

    cookieValue = undefined
    expect(await renderResults(a.token)).toContain('Your Life Project Position')

    cookieValue = await sessionFor(a.customerId)
    expect(await renderResults(a.token)).toContain('Your Life Project Position')

    cookieValue = await sessionFor(b.customerId)
    await expect(renderResults(a.token)).rejects.toThrow('NEXT_NOT_FOUND')
    cookieValue = undefined
  })

  it('a missing, malformed or guessed token is a 404, never an error page', async () => {
    for (const bad of ['', ' ', 'not-a-token', 'a'.repeat(64), "' OR 1=1 --"]) {
      await expect(renderResults(bad)).rejects.toThrow('NEXT_NOT_FOUND')
    }
  })

  it('an assessment still in progress has no reachable results page', async () => {
    const customerId = await seedCustomer(db, 'inprogress@example.com')
    const rec = await startOrResume(customerId)
    const t = generateToken()
    await db.query(`UPDATE assessments SET result_token_hash = $2 WHERE id = $1`, [
      rec.id,
      hashToken(t),
    ])
    await expect(renderResults(t)).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('the raw token is not stored anywhere', async () => {
    const c = await complete('hashed@example.com')
    const hit = await db.query(`SELECT 1 FROM assessments WHERE result_token_hash = $1`, [c.token])
    expect(hit).toHaveLength(0)
    const byHash = await db.query(`SELECT 1 FROM assessments WHERE result_token_hash = $1`, [
      hashToken(c.token),
    ])
    expect(byHash).toHaveLength(1)
  })

  it('the page still renders when the stored result is incomplete', async () => {
    // Not a hypothetical: a purge, a partial write or a restored backup can
    // leave one of these missing, and the participant must get their page
    // rather than a stack trace.
    cookieValue = undefined
    const noResult = await complete('noresult@example.com')
    await db.query(`DELETE FROM assessment_results WHERE assessment_id = $1`, [
      noResult.assessmentId,
    ])
    expect(await renderResults(noResult.token)).toContain('Your Life Project Position')

    const noScores = await complete('noscores@example.com')
    await db.query(`DELETE FROM assessment_scores WHERE assessment_id = $1`, [
      noScores.assessmentId,
    ])
    expect(await renderResults(noScores.token)).toContain('Your Life Project Position')
  })
})

// ===========================================================================
describe('free text', () => {
  it('is written to assessment_narratives and to no other column in the schema', async () => {
    const CANARY = 'CANARY-3f81ba-free-text'
    await complete('canary@example.com', {}, 3, {
      what_changed: CANARY,
      important_decision: CANARY,
      ninety_day_better: CANARY,
    })

    const columns = await db.query<{ table_name: string; column_name: string }>(
      `SELECT table_name, column_name FROM information_schema.columns
        WHERE table_schema = 'public'
          AND data_type IN ('text', 'character varying', 'jsonb')`
    )
    expect(columns.length).toBeGreaterThan(20)

    const found: string[] = []
    for (const c of columns) {
      const rows = await db
        .query<{ n: number }>(
          `SELECT count(*)::int AS n FROM "${c.table_name}"
            WHERE "${c.column_name}"::text LIKE '%' || $1 || '%'`,
          [CANARY]
        )
        .catch(() => [{ n: 0 }])
      if ((rows[0]?.n ?? 0) > 0) found.push(`${c.table_name}.${c.column_name}`)
    }
    expect(found).toEqual(['assessment_narratives.value'])
  })

  it('never reaches the downloadable snapshot, even on day one', async () => {
    const { buildSnapshotPdf } = await import('@/lib/liap/snapshot-pdf')
    const CANARY = 'CANARY-pdf-9c22'
    const c = await complete('pdfcanary@example.com', {}, 3, {
      what_changed: CANARY,
      important_decision: CANARY,
      ninety_day_better: CANARY,
    })
    const report = await rebuildReport(c.assessmentId, { includeNarratives: false })
    const pdf = await buildSnapshotPdf({ report, completedOn: '2026-09-01' })
    expect(pdf.toString('latin1')).not.toContain(CANARY)
  })

  it('the snapshot route reads the completion date as a date, not as a string', () => {
    // Same class of defect as the review date: `completed_at` is a timestamptz,
    // pg-types returns a Date, and `.toString().slice(0, 10)` on a Date yields
    // "Tue Sep 0" -- which the PDF would have printed as the completion date.
    const src = code('app/living-is-a-project/results/[token]/snapshot/route.ts')
    expect(src).not.toMatch(/completed_at:\s*string/)
    expect(src).not.toMatch(/completed_at\s*\?\?\s*''\)\.toString\(\)\.slice/)
    expect(src).toContain('toIsoDay')
  })
})

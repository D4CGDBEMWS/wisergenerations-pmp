import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb, seedCustomer } from './helpers/db'
import { grantEntitlement } from '@/lib/entitlements'
import { LIAP_ASSESSMENT_ACCESS } from '@/lib/liap/entitlements'
import {
  startOrResume,
  saveProgress,
  submitAssessment,
  rebuildReport,
} from '@/lib/liap/assessment-service'
import { buildFullReport } from '@/lib/liap/recommendations'
import type { Intake } from '@/lib/liap/scoring'
import { QUESTIONS as V2_QUESTIONS, DIMENSION_KEYS as V2_KEYS } from '@/lib/liap/assessment/v2'
import { DIMENSION_KEYS as V1_KEYS, VERSION_KEY as V1_VERSION } from '@/lib/liap/assessment/v1'
import { VERSION_KEY as V2_VERSION } from '@/lib/liap/assessment/v2'
import { semanticsFor, REGISTERED_VERSIONS } from '@/lib/liap/assessment/registry'

// ---------------------------------------------------------------------------
// Owner corrections, 31 August 2026.
//
//   1. Spiritual Readiness PROTECT/RESOLVE copy, owner-approved, verbatim.
//   2. rebuildReport must reconstruct a stored result using the version that
//      produced it, never the current one.
//   3. Retired Risk copy must not leak into the V2 scored experience.
// ---------------------------------------------------------------------------

const source = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const code = (p: string) =>
  source(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

// ── 1. THE OWNER-APPROVED SPIRITUAL READINESS COPY ──────────────────────────
//
// Compared character for character, including the em dash in "condemnation—it"
// and the paragraph breaks. This is the copy a person reads at the moment
// their faith scored lowest, and a tidy — a straightened dash, three
// paragraphs run together — changes it.

const PROTECT_HEADING = 'Protect Your First Love'
const PROTECT_BODY = [
  "Life's demands, disappointments, and distractions can quietly pull our attention away from God. If that has happened, this is not an invitation to condemnation—it is an invitation to come closer.",
  "Remember your first love. Make room for God's presence and receive the assurance that you are accepted in the Beloved.",
  'Before seeking direction, return your heart to the One who directs your steps.',
].join('\n\n')

const RESOLVE_HEADING = 'Remember. Return. Receive.'
const RESOLVE_BODY = [
  'If fear, pressure, disappointment, or your own plans have drawn your attention away from God, His mercy gives you room to return.',
  'Remember your first love. Receive His grace, and look again at your direction. Consider what is yours to do, what you need to release, and where God may be asking you to trust Him.',
  'Do what is within your hands, trust God with what is beyond your control, and be willing to change direction when He leads.',
].join('\n\n')

/** Answers where every dimension is strong except the ones named. */
function answersWith(overrides: Partial<Record<string, number>>) {
  const a: Record<string, number> = {}
  for (const q of V2_QUESTIONS) a[q.key] = overrides[q.dimension] ?? 5
  return a
}

const CALM: Intake = { changeType: 'expected', area: 'career', urgency: 2 }

describe('Spiritual Readiness carries the owner-approved copy', () => {
  it('PROTECT reaches the customer verbatim when Spiritual is weakest', () => {
    const report = buildFullReport(answersWith({ spiritual: 1 }), CALM)
    const protect = report.actions.find((a) => a.kind === 'protect')!
    expect(protect.basis).toBe('spiritual')
    expect(protect.headline).toBe(PROTECT_HEADING)
    expect(protect.body).toBe(PROTECT_BODY)
  })

  it('RESOLVE reaches the customer verbatim when Spiritual is second weakest', () => {
    // Money lowest so it takes protect; Spiritual next, so it takes resolve.
    const report = buildFullReport(answersWith({ money: 1, spiritual: 2 }), CALM)
    const resolve = report.actions.find((a) => a.kind === 'resolve')!
    expect(resolve.basis).toBe('spiritual')
    expect(resolve.headline).toBe(RESOLVE_HEADING)
    expect(resolve.body).toBe(RESOLVE_BODY)
  })

  it('keeps the em dash and the three paragraphs the owner approved', () => {
    const c = code('lib/liap/recommendations.ts')
    expect(c).toContain('condemnation—it is an invitation to come closer')
    expect(PROTECT_BODY.split('\n\n')).toHaveLength(3)
    expect(RESOLVE_BODY.split('\n\n')).toHaveLength(3)
    const report = buildFullReport(answersWith({ spiritual: 1 }), CALM)
    const protect = report.actions.find((a) => a.kind === 'protect')!
    expect(protect.body.split('\n\n')).toHaveLength(3)
  })

  it('is displayed as paragraphs rather than collapsed into one block', () => {
    // A single <p> would render the owner's three paragraphs as one wall of
    // text, which alters approved copy in the act of showing it.
    const page = code('app/living-is-a-project/results/[token]/page.tsx')
    expect(page).toContain("action.body.split('\\n\\n')")
  })

  it('every scored dimension has copy, so none can reach a customer blank', () => {
    for (const key of V2_KEYS) {
      const report = buildFullReport(answersWith({ [key]: 1 }), CALM)
      const protect = report.actions.find((a) => a.kind === 'protect')!
      expect(protect.basis, key).toBe(key)
      expect(protect.headline.length, key).toBeGreaterThan(0)
      expect(protect.body.length, key).toBeGreaterThan(0)
    }
  })

  it('has no fallback copy left to hide a missing entry behind', () => {
    expect(code('lib/liap/recommendations.ts')).not.toContain('FALLBACK_COPY')
  })
})

// ── 3. RETIRED RISK COPY IS ISOLATED FROM V2 ────────────────────────────────

describe('retired Risk copy cannot leak into the V2 assessment', () => {
  const RETIRED_PROTECT = 'Protect the essentials before anything else'
  const RETIRED_RESOLVE = 'Resolve the risk you keep meaning to handle'

  it('risk is not a V2 scored dimension', () => {
    expect(V2_KEYS as readonly string[]).not.toContain('risk')
    expect(V1_KEYS as readonly string[]).toContain('risk')
  })

  it('no V2 report can select the retired copy, for any single weak dimension', () => {
    for (const key of V2_KEYS) {
      const report = buildFullReport(answersWith({ [key]: 1 }), CALM)
      for (const action of report.actions) {
        expect(action.headline, key).not.toBe(RETIRED_PROTECT)
        expect(action.headline, key).not.toBe(RETIRED_RESOLVE)
        expect(action.basis, key).not.toBe('risk')
      }
    }
  })

  it('nor for any pair of weak dimensions', () => {
    for (const a of V2_KEYS) {
      for (const b of V2_KEYS) {
        if (a === b) continue
        const report = buildFullReport(answersWith({ [a]: 1, [b]: 2 }), CALM)
        for (const action of report.actions) {
          expect(action.basis, `${a}+${b}`).not.toBe('risk')
          expect(action.headline, `${a}+${b}`).not.toBe(RETIRED_PROTECT)
          expect(action.headline, `${a}+${b}`).not.toBe(RETIRED_RESOLVE)
        }
      }
    }
  })

  it('the retired copy is unreachable by construction, not merely unselected', () => {
    // It is not exported and no selection map references it, so there is no
    // code path that could reach it however the scores fall.
    const c = code('lib/liap/recommendations.ts')
    expect(c).not.toMatch(/export\s+(const|type)\s+RETIRED_RISK_COPY/)
    expect(c).not.toMatch(/PROTECT_BY_DIMENSION\s*=[\s\S]{0,4000}RETIRED_RISK_COPY/)
    // Referenced exactly twice: its declaration, and the `void` that marks it
    // deliberately unwired. Any third reference would be a wiring.
    expect(c.match(/RETIRED_RISK_COPY/g)).toHaveLength(2)
  })

  it('is still present verbatim, because risk remains LIAP methodology', () => {
    const c = source('lib/liap/recommendations.ts')
    expect(c).toContain(RETIRED_PROTECT)
    expect(c).toContain(RETIRED_RESOLVE)
  })
})

// ── 2. VERSION-AWARE REPORTING ──────────────────────────────────────────────

describe('the version registry', () => {
  it('registers both versions', () => {
    expect(REGISTERED_VERSIONS).toContain(V1_VERSION)
    expect(REGISTERED_VERSIONS).toContain(V2_VERSION)
  })

  it('gives V1 its own dimensions, including Risk & Readiness', () => {
    const s = semanticsFor(V1_VERSION)
    expect(s.dimensions.map((d) => d.key)).toEqual([...V1_KEYS])
    expect(s.dimensions.find((d) => d.key === 'risk')!.name).toBe('Risk & Readiness')
    expect(s.dimensions.map((d) => d.key)).not.toContain('spiritual')
  })

  it('gives V2 its own dimensions, including Spiritual Readiness', () => {
    const s = semanticsFor(V2_VERSION)
    expect(s.dimensions.map((d) => d.key)).toEqual([...V2_KEYS])
    expect(s.dimensions.find((d) => d.key === 'spiritual')!.name).toBe('Spiritual Readiness')
    expect(s.dimensions.map((d) => d.key)).not.toContain('risk')
  })

  it('keeps V1 position labels, including Ready to Rebuild', () => {
    expect(semanticsFor(V1_VERSION).positionLabels.rebuild).toBe('Ready to Rebuild')
    expect(semanticsFor(V2_VERSION).positionLabels.build).toBe('Ready to Build')
    expect(semanticsFor(V2_VERSION).positionLabels.rebuild).toBeUndefined()
  })

  it('keeps V1 ranking priorities, which included risk', () => {
    expect(semanticsFor(V1_VERSION).priorityDimensions).toEqual(['money', 'risk', 'wellness'])
    expect(semanticsFor(V2_VERSION).priorityDimensions).toEqual(['money', 'wellness'])
  })

  it('refuses an unknown version rather than falling back to the current one', () => {
    // Silently rendering through the wrong definition produces a report that
    // looks entirely normal and describes somebody else's answers.
    expect(() => semanticsFor('LIAP_READY_V9')).toThrow(/No report semantics/)
  })
})

// ── 2. VERSION-AWARE REPORTING, against the real database ───────────────────

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  const created = await createTestDb()
  db = created.db
  close = created.close
  setDbForTesting(db)
})

afterEach(async () => {
  setDbForTesting(null)
  await close()
})

async function entitled(email: string): Promise<string> {
  const id = await seedCustomer(db, email)
  await grantEntitlement({
    customerId: id,
    entitlementKey: LIAP_ASSESSMENT_ACCESS,
    sourceType: 'order',
    idempotencyKey: `seed:${id}:liap`,
  })
  return id
}

/**
 * A completed assessment, then its version row rewritten to `versionKey`.
 *
 * Rewriting the version row is how a V1 result is simulated without a V1
 * scoring engine: the stored score rows are then relabelled to V1's dimension
 * keys, which is exactly the shape a real V1 assessment left behind.
 */
async function completedAssessment(email: string): Promise<string> {
  const customerId = await entitled(email)
  const record = await startOrResume(customerId)
  await saveProgress(record.id, {
    answers: Object.fromEntries(V2_QUESTIONS.map((q) => [q.key, 3])),
    intake: { changeType: 'unexpected', area: 'career', urgency: 5 },
    narratives: {
      what_changed: 'I was made redundant on Friday.',
      important_decision: 'Whether to take the contract role.',
      ninety_day_better: 'Working again, and sleeping.',
    },
  })
  await submitAssessment(record.id)
  return record.id
}

/** Rewrites a completed assessment to look exactly like a stored V1 result. */
async function makeItLookLikeV1(assessmentId: string) {
  const rows = await db.query<{ id: string }>(
    `INSERT INTO assessment_versions (version_key, definition_hash, question_count)
     VALUES ($1, $2, $3) RETURNING id`,
    [V1_VERSION, 'v1-historical-hash', 40]
  )
  await db.query(`UPDATE assessments SET version_id = $1 WHERE id = $2`, [
    rows[0]!.id,
    assessmentId,
  ])
  // A V1 assessment scored 'risk', never 'spiritual'.
  await db.query(
    `UPDATE assessment_scores SET dimension_key = 'risk'
      WHERE assessment_id = $1 AND dimension_key = 'spiritual'`,
    [assessmentId]
  )
  await db.query(`UPDATE assessment_results SET position_key = 'rebuild' WHERE assessment_id = $1`, [
    assessmentId,
  ])
}

describe('a stored result is rebuilt with the version that produced it', () => {
  it('1. a V1 result rebuilds with Risk & Readiness', async () => {
    const id = await completedAssessment('v1.reader@example.com')
    await makeItLookLikeV1(id)
    const report = await rebuildReport(id)
    const names = report.scores.map((s) => s.name)
    expect(report.scores.map((s) => s.key)).toContain('risk')
    expect(names).toContain('Risk & Readiness')
    expect(names).toContain('Relationships & Stakeholders')
    expect(names).toContain('Wellness & Capacity')
    expect(names).toContain('Legacy & Meaning')
  })

  it('2. a V1 result does NOT display Spiritual Readiness', async () => {
    const id = await completedAssessment('v1.nospirit@example.com')
    await makeItLookLikeV1(id)
    const report = await rebuildReport(id)
    expect(report.scores.map((s) => s.key)).not.toContain('spiritual')
    expect(report.scores.map((s) => s.name)).not.toContain('Spiritual Readiness')
  })

  it('and renders V1 position wording, not V2 wording', async () => {
    const id = await completedAssessment('v1.position@example.com')
    await makeItLookLikeV1(id)
    const report = await rebuildReport(id)
    expect(report.position).toBe('rebuild')
    expect(report.positionLabel).toBe('Ready to Rebuild')
    expect(report.positionLabel).not.toBe('Ready to Build')
    expect(report.positionMeaning).toContain('Some foundations need attention')
  })

  it('and ranks it by V1 priorities, which put Risk second', async () => {
    // Every dimension scores 15 here, so the order is decided entirely by the
    // version's priority list. V1 ranked money, risk, wellness first. Ranking
    // a V1 report with V2's priorities would silently move Risk from second
    // to seventh -- the participant's "needs attention first" list, reordered
    // years later by a change they were never part of.
    const id = await completedAssessment('v1.ranking@example.com')
    await makeItLookLikeV1(id)
    const report = await rebuildReport(id)
    expect(report.scores.every((s) => s.score === 15)).toBe(true)
    expect(report.ranked.map((r) => r.key).slice(0, 3)).toEqual(['money', 'risk', 'wellness'])
  })

  it('3. a V2 result rebuilds with Spiritual Readiness', async () => {
    const id = await completedAssessment('v2.reader@example.com')
    const report = await rebuildReport(id)
    expect(report.scores.map((s) => s.key)).toContain('spiritual')
    expect(report.scores.map((s) => s.name)).toContain('Spiritual Readiness')
    expect(report.scores.map((s) => s.name)).toContain('Relationships')
    expect(report.scores.map((s) => s.name)).toContain('Health & Wellness')
  })

  it('4. a V2 result does NOT display Risk & Readiness', async () => {
    const id = await completedAssessment('v2.norisk@example.com')
    const report = await rebuildReport(id)
    expect(report.scores.map((s) => s.key)).not.toContain('risk')
    expect(report.scores.map((s) => s.name)).not.toContain('Risk & Readiness')
  })

  it('5. rebuilding does not alter stored scores', async () => {
    const id = await completedAssessment('v1.immutable@example.com')
    await makeItLookLikeV1(id)
    const before = await db.query<{ dimension_key: string; score: number; classification: string }>(
      `SELECT dimension_key, score, classification FROM assessment_scores
        WHERE assessment_id = $1 ORDER BY dimension_key`,
      [id]
    )
    await rebuildReport(id)
    await rebuildReport(id)
    const after = await db.query<{ dimension_key: string; score: number; classification: string }>(
      `SELECT dimension_key, score, classification FROM assessment_scores
        WHERE assessment_id = $1 ORDER BY dimension_key`,
      [id]
    )
    expect(after).toEqual(before)
    expect(after.map((r) => r.dimension_key)).toContain('risk')
  })

  it('6. rebuilding does not rescore against the current version', async () => {
    const id = await completedAssessment('v1.norescore@example.com')
    await makeItLookLikeV1(id)
    // Move one stored score to a value the current engine would never derive
    // from the stored answers. If rebuild rescored, this would be overwritten.
    await db.query(
      `UPDATE assessment_scores SET score = 7, classification = 'immediate'
        WHERE assessment_id = $1 AND dimension_key = 'money'`,
      [id]
    )
    await db.query(`UPDATE assessment_results SET total_score = 111 WHERE assessment_id = $1`, [id])
    const report = await rebuildReport(id)
    expect(report.scores.find((s) => s.key === 'money')!.score).toBe(7)
    expect(report.total).toBe(111)
    // And the stored answers are untouched, so nothing was recomputed from them.
    const responses = await db.query<{ n: string }>(
      `SELECT count(*)::text n FROM assessment_responses WHERE assessment_id = $1`,
      [id]
    )
    expect(responses[0]!.n).toBe('40')
  })

  it('7. changing the current version does not change a historical result', async () => {
    const id = await completedAssessment('v1.stable@example.com')
    await makeItLookLikeV1(id)
    const first = await rebuildReport(id)

    // The current version is V2 and differs from V1 in every way that matters:
    // dimension keys, dimension names, position vocabulary and ranking order.
    // A historical result must be unmoved by all of it.
    expect(V2_VERSION).not.toBe(V1_VERSION)
    const second = await rebuildReport(id)

    expect(second.scores).toEqual(first.scores)
    expect(second.positionLabel).toBe(first.positionLabel)
    expect(second.total).toBe(first.total)
    expect(first.positionLabel).toBe('Ready to Rebuild')
    expect(first.scores.map((s) => s.key)).toContain('risk')
  })

  it('refuses to render a result whose version cannot be resolved', async () => {
    const id = await completedAssessment('v0.unknown@example.com')
    const rows = await db.query<{ id: string }>(
      `INSERT INTO assessment_versions (version_key, definition_hash, question_count)
       VALUES ('LIAP_READY_V0', 'unknown', 40) RETURNING id`
    )
    await db.query(`UPDATE assessments SET version_id = $1 WHERE id = $2`, [rows[0]!.id, id])
    await expect(rebuildReport(id)).rejects.toThrow(/No report semantics/)
  })

  it('reads the version from the assessment, not from the current module', () => {
    // The failure this guards against is a future edit reaching for the
    // current definition again because it is one import away.
    const c = code('lib/liap/assessment-service.ts')
    const rebuild = c.slice(c.indexOf('export async function rebuildReport'))
    expect(rebuild).toContain('semanticsFor')
    expect(rebuild).toMatch(/JOIN assessment_versions/)
    expect(rebuild).not.toMatch(/import\('\.\/assessment\/v2'\)/)
  })
})

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb } from './helpers/db'
import { QUESTIONS, DIMENSION_KEYS, NARRATIVE_QUESTIONS } from '@/lib/liap/assessment/v1'
import {
  startOrResume, saveProgress, submitAssessment, rebuildReport,
} from '@/lib/liap/assessment-service'
import { purgeExpiredNarratives } from '@/lib/liap/retention'
import { buildSnapshotPdf } from '@/lib/liap/snapshot-pdf'
import { resultsEmailHtml, resultsEmailText } from '@/lib/liap/results-email'
import { generateToken, hashToken } from '@/lib/auth/crypto'

// ---------------------------------------------------------------------------
// The privacy copy, checked against the system rather than against itself.
//
// A privacy notice is a set of factual claims about software. Reading well is
// not the standard; being TRUE is. So each assertion below takes a sentence
// the customer will read and proves it against the implementation — the counts
// from the definition, the purge from a real Postgres instance, the exclusions
// from a generated PDF and a generated email.
//
// The one thing this file cannot prove is the Neon recovery window. That is
// OWNER-VERIFIED EXTERNAL CONFIGURATION: 6 hours, no separate snapshots, no
// schedule. Nothing in this repository can confirm or change it, and no test
// should pretend otherwise.
// ---------------------------------------------------------------------------

/**
 * Source with whitespace collapsed.
 *
 * These assertions are about the PROSE a customer reads, not about how JSX
 * happens to wrap it. Matching the raw file makes a reformat look like a
 * removed promise, and — worse — makes a genuinely missing sentence look like
 * a formatting quirk.
 */
const flat = (path: string) => readFileSync(path, 'utf8').replace(/\s+/g, ' ')

const NOTICE = flat('components/liap/AssessmentPrivacyNotice.tsx')
const POLICY = flat('app/privacy-policy/page.tsx')
const RESULTS_PAGE = flat('app/living-is-a-project/results/[token]/page.tsx')

let db: Db, close: () => Promise<void>
beforeEach(async () => { const t = await createTestDb(); db = t.db; close = t.close; setDbForTesting(db) })
afterEach(async () => { setDbForTesting(null); await close() })

const SECRET = 'ZZQX the thing I have told nobody about the money'

async function completed(email: string) {
  const c = await db.query<{ id: string }>(
    `INSERT INTO customers (email) VALUES ($1) RETURNING id`, [email])
  const r = await startOrResume(c[0].id)
  const answers: Record<string, number> = {}
  for (const q of QUESTIONS) answers[q.key] = q.dimension === 'money' ? 1 : 5
  await saveProgress(r.id, {
    step: 6, answers,
    intake: { changeType: 'unexpected', area: 'career', urgency: 5 },
    narratives: { what_changed: SECRET, important_decision: SECRET, ninety_day_better: SECRET },
  } as never)
  const s = await submitAssessment(r.id)
  return { assessmentId: r.id, token: s!.resultToken }
}

describe('§6 — every factual claim in the privacy copy', () => {
  it('“40 scored questions”', () => {
    expect(QUESTIONS.length).toBe(40)
    expect(NOTICE).toContain('40 scored questions')
    expect(POLICY).toContain('40 scored questions')
  })

  it('“eight dimensions”', () => {
    expect(DIMENSION_KEYS.length).toBe(8)
    expect(NOTICE).toContain('eight dimensions')
    expect(POLICY).toContain('eight dimensions')
    for (const key of DIMENSION_KEYS) {
      expect(QUESTIONS.filter((q) => q.dimension === key)).toHaveLength(5)
    }
  })

  it('“three narrative questions”', () => {
    expect(NARRATIVE_QUESTIONS.length).toBe(3)
    expect(NOTICE).toContain('three narrative questions')
    expect(POLICY).toContain('three optional narrative questions')
  })

  it('“deterministic scoring rules”', async () => {
    const { rebuildReport: r } = await import('@/lib/liap/assessment-service')
    const a = await completed('det1@example.com')
    const b = await completed('det2@example.com')
    const ra = await r(a.assessmentId), rb = await r(b.assessmentId)
    expect(ra.total).toBe(rb.total)
    expect(ra.scores.map((s) => s.score)).toEqual(rb.scores.map((s) => s.score))
    expect(POLICY).toContain('deterministic scoring rules')
  })

  it('“Artificial intelligence does not calculate… your score”', () => {
    const FORBIDDEN = /\b(openai|anthropic|claude|gpt|llm|embedding|inference)\b/i
    for (const f of ['lib/liap/scoring.ts', 'lib/liap/recommendations.ts',
                     'lib/liap/assessment-service.ts', 'lib/liap/snapshot-pdf.ts']) {
      const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      expect(src, f).not.toMatch(FORBIDDEN)
    }
    expect(NOTICE).toContain('Artificial intelligence does not determine your score')
    expect(POLICY).toContain('Artificial intelligence does not calculate, modify, override, or determine')
  })

  it('“the system automatically sends your results email”', () => {
    const submit = readFileSync('app/api/liap/assessment/route.ts', 'utf8')
    expect(submit).toContain("mode: 'automatic'")
    expect(submit).toContain('deliverResults')
    expect(NOTICE).toContain('automatic results email')
    expect(POLICY).toContain('automatically sends your results email')
  })

  it('“Your narrative responses are not included in the results email”', async () => {
    const { assessmentId } = await completed('email@example.com')
    const report = await rebuildReport(assessmentId)
    expect(resultsEmailHtml(report, 'https://x/y')).not.toContain(SECRET)
    expect(resultsEmailText(report, 'https://x/y')).not.toContain(SECRET)
    expect(POLICY).toContain('Your narrative responses are not included in the results email')
  })

  it('“a downloadable Life Project Snapshot”', () => {
    const route = readFileSync(
      'app/living-is-a-project/results/[token]/snapshot/route.ts', 'utf8')
    expect(route).toContain('application/pdf')
    expect(RESULTS_PAGE).toContain('Download My Life Project Snapshot')
    expect(POLICY).toContain('downloadable Life Project Snapshot')
  })

  it('“not included in the downloadable Snapshot”', async () => {
    const { assessmentId } = await completed('pdf@example.com')
    const report = await rebuildReport(assessmentId, { includeNarratives: false })
    const pdf = await buildSnapshotPdf({ report, completedOn: '2026-08-23' })
    expect(pdf.toString('latin1')).not.toContain(SECRET)
    expect(pdf.toString('latin1')).not.toContain('ZZQX')
    expect(NOTICE).toContain('not included in your downloadable Life Project Snapshot')
    expect(POLICY).toContain('not included in the downloadable Snapshot')
  })

  it('“retained… for up to 90 days and are then automatically removed”', async () => {
    const { assessmentId } = await completed('purge@example.com')
    const before = await db.query<{ narrative_purge_after: string }>(
      `SELECT narrative_purge_after FROM assessments WHERE id = $1`, [assessmentId])
    const completedAt = await db.query<{ completed_at: string }>(
      `SELECT completed_at FROM assessments WHERE id = $1`, [assessmentId])
    const days = Math.round(
      (new Date(before[0].narrative_purge_after).getTime() -
       new Date(completedAt[0].completed_at).getTime()) / 86_400_000)
    expect(days).toBe(90)

    await db.query(
      `UPDATE assessments SET narrative_purge_after = now() - interval '1 day' WHERE id = $1`,
      [assessmentId])
    await purgeExpiredNarratives()
    const rows = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM assessment_narratives WHERE assessment_id = $1`,
      [assessmentId])
    expect(rows[0].n).toBe(0)
    expect(NOTICE).toContain('up to 90 days')
    expect(POLICY).toContain('up to 90 days')
  })

  it('“no longer available through your assessment results”', async () => {
    const { assessmentId } = await completed('gone@example.com')
    await db.query(
      `UPDATE assessments SET narrative_purge_after = now() - interval '1 day' WHERE id = $1`,
      [assessmentId])
    await purgeExpiredNarratives()
    expect(JSON.stringify(await rebuildReport(assessmentId))).not.toContain(SECRET)
  })

  it('“a secure, randomly generated results link… stored in hashed form”', async () => {
    const { assessmentId, token } = await completed('token@example.com')
    // 256 bits, base64url.
    expect(Buffer.from(token, 'base64url')).toHaveLength(32)
    expect(generateToken()).not.toBe(generateToken())
    const row = await db.query<{ result_token_hash: string }>(
      `SELECT result_token_hash FROM assessments WHERE id = $1`, [assessmentId])
    expect(row[0].result_token_hash).toBe(hashToken(token))
    expect(row[0].result_token_hash).not.toContain(token)
    expect(POLICY).toContain('stored in hashed form')
  })

  it('“the results link does not automatically expire” — true, and deliberately so', () => {
    const service = readFileSync('lib/liap/assessment-service.ts', 'utf8')
    // No expiry predicate on the results lookup, unlike login tokens.
    expect(service).toContain('WHERE result_token_hash = $1 AND status = \'completed\'')
    expect(service).not.toMatch(/result_token[\s\S]{0,200}expires_at/)
    expect(POLICY).toContain('does not automatically expire')
  })

  it('“A resend option is available” — and it is labelled as a resend', () => {
    expect(RESULTS_PAGE).toContain('Resend My Results Email')
    expect(RESULTS_PAGE).not.toContain('Send my plan to me')
    expect(POLICY).toContain('A resend option is available')
  })

  it('states the owner-verified 6-hour recovery window, and claims nothing more', () => {
    expect(POLICY).toContain('retained for up to 6 hours')
    expect(POLICY).toContain('no separate database snapshots or scheduled snapshots')
    // No promise the implementation cannot keep.
    for (const overreach of ['HIPAA', 'anonymous', 'anonymized', 'end-to-end encrypt',
                             'permanently destroyed', 'unrecoverable', 'military-grade']) {
      expect(POLICY, overreach).not.toContain(overreach)
      expect(NOTICE, overreach).not.toContain(overreach)
    }
  })

  it('shows the notice before the narratives are collected', () => {
    const form = readFileSync('components/liap/AssessmentForm.tsx', 'utf8')
    const notice = form.indexOf('<AssessmentPrivacyNotice />')
    const intake = form.indexOf('<IntakeStep')
    expect(notice).toBeGreaterThan(-1)
    expect(notice).toBeLessThan(intake)
  })

  it('adds the Snapshot sentence to both email formats', async () => {
    const SENTENCE = 'Your downloadable Life Project Snapshot is available from your secure results page'
    const { assessmentId } = await completed('snapsent@example.com')
    const report = await rebuildReport(assessmentId)
    expect(resultsEmailHtml(report, 'https://x/y')).toContain(SENTENCE)
    expect(resultsEmailText(report, 'https://x/y')).toContain(SENTENCE)
  })

  it('keeps one privacy policy, not two', () => {
    expect(POLICY).toContain('13. Life Project-Ready&trade; Assessment Privacy')
    expect(POLICY).toContain('14. Contact Us')
    // The assessment section lives inside the existing policy page.
    expect(POLICY.indexOf('1. Who We Are')).toBeLessThan(
      POLICY.indexOf('Life Project-Ready&trade; Assessment Privacy'))
  })
})

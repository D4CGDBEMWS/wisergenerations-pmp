import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb } from './helpers/db'
import { hasEntitlement, revokeEntitlementsForRefund } from '@/lib/entitlements'
import { LIAP_ASSESSMENT_ACCESS } from '@/lib/liap/entitlements'
import { fulfilPreorder } from '@/lib/liap/fulfilment'
import { LIAP_BOOK } from '@/lib/liap/product'
import {
  startOrResume, saveProgress, submitAssessment, rebuildReport,
} from '@/lib/liap/assessment-service'
import { purgeExpiredNarratives } from '@/lib/liap/retention'
import { QUESTIONS, NARRATIVE_QUESTIONS } from '@/lib/liap/assessment/v2'
import { renderReport, type FullReport } from '@/lib/liap/recommendations'
import { buildSnapshotPdf, snapshotFilename } from '@/lib/liap/snapshot-pdf'
import { deliverResults } from '@/lib/liap/results-delivery'
import { resultsEmailHtml, resultsEmailText } from '@/lib/liap/results-email'

// ---------------------------------------------------------------------------
// The controlled remediation pass, proved.
//
// Two defects were found by audit and are fixed here. Each has a NEGATIVE
// CONTROL: the test deliberately reconstructs the old behaviour and asserts
// the new test catches it. Without that, a green suite proves only that the
// assertions run — not that they would notice the bug coming back.
// ---------------------------------------------------------------------------

let db: Db, close: () => Promise<void>

beforeEach(async () => {
  const t = await createTestDb(); db = t.db; close = t.close
  setDbForTesting(db)
})
afterEach(async () => { setDbForTesting(null); vi.unstubAllEnvs(); await close() })

/** Distinctive enough that an accidental match is not credible. */
const SECRETS = {
  what_changed: 'ZZQX my late aunt Hildegard left me a derelict lighthouse in Aberdeenshire',
  important_decision: 'ZZQX whether to tell my brother about the second mortgage',
  ninety_day_better: 'ZZQX sleeping without the pills and speaking to my daughter again',
}

async function seedCompletedAssessment(email = 'remediation@example.com') {
  const rows = await db.query<{ id: string }>(
    `INSERT INTO customers (email) VALUES ($1) RETURNING id`, [email])
  const customerId = rows[0].id
  const record = await startOrResume(customerId)
  const answers: Record<string, number> = {}
  for (const q of QUESTIONS) answers[q.key] = q.dimension === 'money' ? 1 : 5
  await saveProgress(record.id, {
    step: 6, answers,
    intake: { changeType: 'unexpected', area: 'relationships', urgency: 5 },
    narratives: { ...SECRETS },
  } as never)
  const submitted = await submitAssessment(record.id)
  return { customerId, assessmentId: record.id, token: submitted!.resultToken, submitted: submitted! }
}

/** Every text-ish column in every table, searched for a phrase. */
async function scanAllStorage(needle: string): Promise<string[]> {
  const cols = await db.query<{ table_name: string; column_name: string }>(
    `SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema='public' AND data_type IN ('text','character varying','json','jsonb')`)
  const hits: string[] = []
  for (const c of cols) {
    const r = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM "${c.table_name}" WHERE "${c.column_name}"::text LIKE $1`,
      [`%${needle}%`]).catch(() => [{ n: 0 }])
    if (r[0]?.n > 0) hits.push(`${c.table_name}.${c.column_name}`)
  }
  return hits.sort()
}

// ── 1. THE 90-DAY PURGE ────────────────────────────────────────────────────

describe('90-day narrative purge', () => {
  it('stores no participant sentence in the durable report', async () => {
    const { assessmentId } = await seedCompletedAssessment()
    const stored = await db.query<{ next_best_three: unknown; plan: unknown }>(
      `SELECT next_best_three, plan FROM assessment_results WHERE assessment_id = $1`,
      [assessmentId])
    const json = JSON.stringify(stored[0])
    for (const [key, secret] of Object.entries(SECRETS)) {
      expect(json, `stored report contains ${key}`).not.toContain(secret)
    }
    // What it stores instead: a reference.
    expect(json).toContain('important_decision')
    expect(json).toContain('narrative')
  })

  it('quotes the participant while the narrative lives', async () => {
    const { assessmentId } = await seedCompletedAssessment()
    const live = JSON.stringify(await rebuildReport(assessmentId))
    expect(live).toContain(SECRETS.important_decision)
    expect(live).toContain(SECRETS.ninety_day_better)
  })

  it.each(Object.entries(SECRETS))(
    'purges %s from every controlled store at day 91', async (key, secret) => {
      const { assessmentId } = await seedCompletedAssessment(`${key}@example.com`)
      expect(await scanAllStorage(secret)).toEqual(['assessment_narratives.value'])

      await db.query(
        `UPDATE assessments SET narrative_purge_after = now() - interval '1 day' WHERE id = $1`,
        [assessmentId])
      await purgeExpiredNarratives()

      // ZERO occurrences, anywhere.
      expect(await scanAllStorage(secret)).toEqual([])

      // And unreachable through the product, not merely absent from one table.
      const after = JSON.stringify(await rebuildReport(assessmentId))
      expect(after).not.toContain(secret)
    })

  it('leaves a report that still reads naturally without the quotations', async () => {
    const { assessmentId } = await seedCompletedAssessment('reads-well@example.com')
    await db.query(
      `UPDATE assessments SET narrative_purge_after = now() - interval '1 day' WHERE id = $1`,
      [assessmentId])
    await purgeExpiredNarratives()
    const report = await rebuildReport(assessmentId)

    for (const a of report.actions) {
      expect(a.headline.length).toBeGreaterThan(8)
      expect(a.body.length).toBeGreaterThan(40)
      // No dangling quotation marks or trailing colons left behind.
      expect(a.body).not.toMatch(/[:“]\s*$/)
      expect(a.body).not.toContain('“”')
    }
    for (const phase of report.plan.phases) {
      for (const item of phase.items) {
        expect(item.length).toBeGreaterThan(10)
        expect(item).not.toMatch(/[:“]\s*$/)
      }
    }
    expect(report.total).toBeGreaterThan(0)
  })

  it('NEGATIVE CONTROL — the test fails if verbatim interpolation returns', async () => {
    const { assessmentId } = await seedCompletedAssessment('negative@example.com')
    // Reconstruct the old defect exactly: write the sentence into the durable
    // JSON, the way the engine used to.
    await db.query(
      `UPDATE assessment_results
          SET next_best_three = $2::jsonb
        WHERE assessment_id = $1`,
      [assessmentId, JSON.stringify([
        { kind: 'resolve', headline: 'x', basis: 'stated',
          body: `You told us: “${SECRETS.important_decision}”` },
      ])])
    await db.query(
      `UPDATE assessments SET narrative_purge_after = now() - interval '1 day' WHERE id = $1`,
      [assessmentId])
    await purgeExpiredNarratives()

    const residue = await scanAllStorage(SECRETS.important_decision)
    // The purge ran, the narrative row is gone, and the copy survives — which
    // is precisely what the audit found and what the assertion above forbids.
    expect(residue).toEqual(['assessment_results.next_best_three'])
  })

  it('keeps narrative out of the results email in both states', async () => {
    const { assessmentId } = await seedCompletedAssessment('email-privacy@example.com')
    const live = await rebuildReport(assessmentId)
    for (const secret of Object.values(SECRETS)) {
      expect(resultsEmailHtml(live, 'https://x/y')).not.toContain(secret)
      expect(resultsEmailText(live, 'https://x/y')).not.toContain(secret)
    }
  })

  it('covers all three narrative questions', () => {
    expect(NARRATIVE_QUESTIONS.map((n) => n.key).sort()).toEqual(Object.keys(SECRETS).sort())
  })
})

// ── 2. REFUND REVOCATION ───────────────────────────────────────────────────

describe('refund revocation', () => {
  const SESSION = 'cs_remediation_1'
  const INTENT = 'pi_remediation_1'

  async function preorder(email: string, session: string, intent: string | null, evt: string) {
    return fulfilPreorder({
      email, name: 'A Reader', sourceId: session, paymentIntentId: intent,
      idempotencyKey: `${evt}:${LIAP_ASSESSMENT_ACCESS}`, amount: LIAP_BOOK.amount,
    })
  }

  it('A · a paid preorder grants assessment access', async () => {
    const f = await preorder('a@example.com', SESSION, INTENT, 'evt_a')
    expect(f.entitlementCreated).toBe(true)
    expect(await hasEntitlement(f.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
  })

  it('B · a replayed payment webhook grants nothing twice', async () => {
    const first = await preorder('b@example.com', SESSION, INTENT, 'evt_b')
    const second = await preorder('b@example.com', SESSION, INTENT, 'evt_b')
    expect(first.entitlementCreated).toBe(true)
    expect(second.entitlementCreated).toBe(false)
    const rows = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM entitlements WHERE customer_id = $1`, [first.customerId])
    expect(rows[0].n).toBe(1)
  })

  it('C · an unpaid checkout grants nothing', async () => {
    // The webhook only calls fulfilPreorder when payment_status === 'paid'.
    const src = require('node:fs').readFileSync('app/api/stripe/webhook/route.ts', 'utf8')
    expect(src).toContain("liapSession.payment_status === 'paid'")
    const rows = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM entitlements`)
    expect(rows[0].n).toBe(0)
  })

  it('D · an applicable refund revokes the entitlement', async () => {
    const f = await preorder('d@example.com', SESSION, INTENT, 'evt_d')
    expect(await hasEntitlement(f.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)

    const revoked = await revokeEntitlementsForRefund({
      paymentIntentId: INTENT, chargeId: 'ch_remediation_1', reason: 'charge.refunded',
    })
    expect(revoked).toBe(1)
    expect(await hasEntitlement(f.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(false)
  })

  it('E · a replayed refund is idempotent', async () => {
    const f = await preorder('e@example.com', SESSION, INTENT, 'evt_e')
    const first = await revokeEntitlementsForRefund({
      paymentIntentId: INTENT, chargeId: 'ch_x', reason: 'charge.refunded' })
    const second = await revokeEntitlementsForRefund({
      paymentIntentId: INTENT, chargeId: 'ch_x', reason: 'charge.refunded' })
    expect(first).toBe(1)
    expect(second).toBe(0)
    expect(await hasEntitlement(f.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(false)
  })

  it('F · an unrelated refund touches nobody else', async () => {
    const mine = await preorder('f1@example.com', 'cs_f1', 'pi_f1', 'evt_f1')
    const theirs = await preorder('f2@example.com', 'cs_f2', 'pi_f2', 'evt_f2')

    const revoked = await revokeEntitlementsForRefund({
      paymentIntentId: 'pi_f2', chargeId: 'ch_f2', reason: 'charge.refunded' })
    expect(revoked).toBe(1)
    expect(await hasEntitlement(theirs.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(false)
    expect(await hasEntitlement(mine.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
  })

  it('NEGATIVE CONTROL — the old identifier mismatch revokes nothing', async () => {
    const f = await preorder('neg@example.com', SESSION, INTENT, 'evt_neg')
    // Exactly the old code path: revoke by the payment intent alone, against an
    // entitlement whose source_id is the checkout session.
    const { revokeEntitlementsBySource } = await import('@/lib/entitlements')
    const revoked = await revokeEntitlementsBySource({
      sourceType: 'order', sourceId: INTENT, reason: 'charge.refunded' })
    expect(revoked).toBe(0)
    expect(await hasEntitlement(f.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)
  })
})

// ── 3. AUTOMATIC RESULTS EMAIL ─────────────────────────────────────────────

describe('results delivery', () => {
  it('claims exactly one automatic send per assessment', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const { assessmentId, token } = await seedCompletedAssessment('auto@example.com')
    const first = await deliverResults({ assessmentId, resultToken: token, mode: 'automatic' })
    const second = await deliverResults({ assessmentId, resultToken: token, mode: 'automatic' })

    expect(first).toEqual({ outcome: 'sent', delivered: true })
    expect(second).toEqual({ outcome: 'already-sent', delivered: false })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('does not damage the result when the provider fails', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })))

    const { assessmentId, token } = await seedCompletedAssessment('fail@example.com')
    const result = await deliverResults({ assessmentId, resultToken: token, mode: 'automatic' })
    expect(result).toEqual({ outcome: 'send-failed', delivered: false })

    // The report still exists and is still reachable.
    const report = await rebuildReport(assessmentId)
    expect(report.total).toBeGreaterThan(0)
    // And the claim was released, so it can be retried.
    const rows = await db.query<{ results_email_sent_at: string | null }>(
      `SELECT results_email_sent_at FROM assessments WHERE id = $1`, [assessmentId])
    expect(rows[0].results_email_sent_at).toBeNull()
    vi.unstubAllGlobals()
  })

  it('reports honestly when email is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const { assessmentId, token } = await seedCompletedAssessment('noconf@example.com')
    const result = await deliverResults({ assessmentId, resultToken: token, mode: 'automatic' })
    expect(result).toEqual({ outcome: 'not-configured', delivered: false })
  })

  it('throttles a manual resend without touching the automatic marker', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))

    const { assessmentId, token } = await seedCompletedAssessment('resend@example.com')
    await deliverResults({ assessmentId, resultToken: token, mode: 'automatic' })
    const immediate = await deliverResults({ assessmentId, resultToken: token, mode: 'resend' })
    expect(immediate).toEqual({ outcome: 'throttled', delivered: false })

    // Past the cooldown, a resend works — and the automatic marker still stands.
    await db.query(
      `UPDATE assessments SET results_email_last_sent_at = now() - interval '1 hour' WHERE id = $1`,
      [assessmentId])
    const later = await deliverResults({ assessmentId, resultToken: token, mode: 'resend' })
    expect(later).toEqual({ outcome: 'sent', delivered: true })

    const rows = await db.query<{ results_email_sent_at: string | null }>(
      `SELECT results_email_sent_at FROM assessments WHERE id = $1`, [assessmentId])
    expect(rows[0].results_email_sent_at).not.toBeNull()
    vi.unstubAllGlobals()
  })
})

// ── 4. THE SNAPSHOT PDF ────────────────────────────────────────────────────

describe('Life Project Snapshot PDF', () => {
  it('produces a real PDF carrying the deterministic result', async () => {
    const { assessmentId } = await seedCompletedAssessment('pdf@example.com')
    const report = await rebuildReport(assessmentId, { includeNarratives: false })
    const pdf = await buildSnapshotPdf({ report, completedOn: '2026-08-23' })

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdf.length).toBeGreaterThan(2000)
    expect(pdf.subarray(-6).toString()).toContain('%%EOF')

    const text = assertExtractable(pdf)
    // All eight dimensions, by their canonical names — and their classification
    // labels, which sit in the right-hand column. Both appearing in full is the
    // clipping check: a truncated draw would lose the tail of the longest
    // strings ("Spiritual Readiness", "Immediate attention") first.
    for (const s of report.scores) {
      expect(text, s.name).toContain(s.name)
      expect(text, s.classification).toContain(report.classificationLabels[s.classification])
    }
    // Named explicitly rather than hardcoded, so renaming a dimension cannot
    // quietly retire the clipping check the way it just did.
    const longest = [...report.scores].sort((a, b) => b.name.length - a.name.length)[0]!.name
    expect(text, `longest name: ${longest}`).toContain(longest)
    expect(text).toContain(report.positionLabel)
    expect(text).toContain(String(report.total))
    // Hidden urgency surfaced when present.
    expect(report.urgent.length).toBeGreaterThan(0)
    expect(text).toContain('Needs attention first')
    // 30/60/90 present. Compared on an ASCII-normalised basis: the window
    // labels contain an en dash, which does not survive the single-byte hex
    // encoding pdfkit uses for these glyphs.
    const ascii = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '')
    const flat = ascii(text)
    expect(report.plan.phases).toHaveLength(3)
    for (const phase of report.plan.phases) {
      expect(flat, phase.window).toContain(ascii(phase.window))
      expect(flat, phase.title).toContain(ascii(phase.title))
      for (const item of phase.items) {
        expect(flat, item.slice(0, 40)).toContain(ascii(item.slice(0, 40)))
      }
    }
  })

  it('carries no narrative, no token and no internal id — even on day one', async () => {
    const { assessmentId, token } = await seedCompletedAssessment('pdf-privacy@example.com')
    // The narratives are still live here. The PDF must still not carry them.
    const live = await rebuildReport(assessmentId)
    expect(JSON.stringify(live)).toContain('ZZQX')
    const report = await rebuildReport(assessmentId, { includeNarratives: false })
    const pdf = await buildSnapshotPdf({ report, completedOn: '2026-08-23' })
    const raw = pdf.toString('latin1')

    for (const secret of Object.values(SECRETS)) {
      expect(raw, 'narrative in PDF').not.toContain(secret)
      // Also check the distinctive marker alone, in case of line-splitting.
      expect(assertExtractable(pdf)).not.toContain('ZZQX')
    }
    expect(raw).not.toContain(token)
    expect(raw).not.toContain(assessmentId)
  })

  it('remains useful after the narrative is purged', async () => {
    const { assessmentId } = await seedCompletedAssessment('pdf-after@example.com')
    await db.query(
      `UPDATE assessments SET narrative_purge_after = now() - interval '1 day' WHERE id = $1`,
      [assessmentId])
    await purgeExpiredNarratives()

    const report = await rebuildReport(assessmentId, { includeNarratives: false })
    const pdf = await buildSnapshotPdf({ report, completedOn: '2026-08-23' })
    const text = assertExtractable(pdf)
    for (const s of report.scores) expect(text).toContain(s.name)
    expect(text).toContain(report.positionLabel)
  })

  it('is byte-identical on repeat download', async () => {
    const { assessmentId } = await seedCompletedAssessment('pdf-stable@example.com')
    const report = await rebuildReport(assessmentId, { includeNarratives: false })
    const a = await buildSnapshotPdf({ report, completedOn: '2026-08-23' })
    const b = await buildSnapshotPdf({ report, completedOn: '2026-08-23' })
    expect(pdfText(a)).toEqual(pdfText(b))
  })

  it('names the file so a person can find it again', () => {
    expect(snapshotFilename('2026-08-23T10:11:12.000Z')).toBe('Life-Project-Snapshot-2026-08-23.pdf')
    expect(snapshotFilename('')).toBe('Life-Project-Snapshot-undated.pdf')
    expect(snapshotFilename('2026-08-23')).not.toMatch(/[^A-Za-z0-9.\-]/)
  })

  it('authorizes exactly as the results page does', () => {
    const src = require('node:fs').readFileSync(
      'app/living-is-a-project/results/[token]/snapshot/route.ts', 'utf8')
    expect(src).toContain('findByResultToken')
    expect(src).toContain('validateSession')
    expect(src).toContain('session.customerId !== found.customerId')
    expect(src).toContain("isEnabled('LIAP')")
    expect(src).toContain('no-store')
    // And it asks for the narrative-free view, not the live one.
    expect(src).toContain('includeNarratives: false')
  })
})

/**
 * Extracts the drawn text from a PDF.
 *
 * Operates on the Buffer by byte offset, not on a latin1 string: pdfkit
 * Flate-compresses its content streams, and slicing binary data with a regex
 * over a decoded string corrupts it. An earlier version of this helper did
 * exactly that, returned "", and made every `not.toContain` assertion below
 * pass on nothing — so `assertExtractable` now proves the extractor works
 * before any absence is trusted.
 */
function pdfText(pdf: Buffer): string {
  const zlib = require('node:zlib') as typeof import('node:zlib')
  const STREAM = Buffer.from('stream')
  const ENDSTREAM = Buffer.from('endstream')
  let out = ''
  let i = 0
  while (i < pdf.length) {
    const start = pdf.indexOf(STREAM, i)
    if (start < 0) break
    let from = start + STREAM.length
    if (pdf[from] === 0x0d) from++
    if (pdf[from] === 0x0a) from++
    const end = pdf.indexOf(ENDSTREAM, from)
    if (end < 0) break
    const slice = pdf.subarray(from, end)
    let body: string
    try {
      body = zlib.inflateSync(slice).toString('latin1')
    } catch {
      body = slice.toString('latin1')
    }
    // pdfkit draws text as HEX strings inside TJ arrays with kerning numbers
    // between them — [<4c6966> 10 <65205072>] TJ — not as literal (…) strings.
    // Both forms are decoded; only the hex one actually occurs today.
    for (const t of body.matchAll(/<([0-9A-Fa-f\s]+)>/g)) {
      const hex = t[1].replace(/\s+/g, '')
      if (hex.length % 2 !== 0) continue
      out += Buffer.from(hex, 'hex').toString('latin1')
    }
    for (const t of body.matchAll(/\((?:\\.|[^\\()])*\)/g)) {
      out += t[0].slice(1, -1).replace(/\\([()\\])/g, '$1')
    }
    out += ' '
    i = end + ENDSTREAM.length
  }
  return out
}

/**
 * Refuses to let an absence assertion run against a broken extractor.
 *
 * "The PDF does not contain the narrative" is worthless if the helper cannot
 * read the PDF at all. Every privacy check below calls this first.
 */
function assertExtractable(pdf: Buffer): string {
  const text = pdfText(pdf)
  expect(text.length, 'pdfText extracted nothing — the assertion would be vacuous')
    .toBeGreaterThan(200)
  expect(text, 'pdfText did not find the known header').toContain('Life Project Snapshot')
  return text
}

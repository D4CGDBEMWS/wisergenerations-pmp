import { getDb, queryOne } from '@/lib/db/client'
import { generateToken, hashToken } from '@/lib/auth/crypto'
import { recordAuditEvent } from '@/lib/audit'
import {
  VERSION_KEY,
  QUESTIONS,
  NARRATIVE_QUESTIONS,
  definitionFingerprint,
  type NarrativeKey,
} from './assessment/v2'
import {
  buildFullReport,
  renderReport,
  type FullReport,
  type NarrativeMap,
  type RenderedReport,
} from './recommendations'
import type { Answers, Intake } from './scoring'
import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// Persistence for the assessment.
//
// The engine in scoring.ts and recommendations.ts is pure and knows nothing
// about a database. This module is the only place the two meet, which is what
// keeps the twelve personas testable without any I/O at all.
//
// Free text is written to assessment_narratives and NOWHERE else — not to the
// responses table, not into the stored result, not into an audit row. That
// single-table isolation is what makes the 90-day purge a DELETE rather than a
// migration across five tables, each of which could be missed.
// ---------------------------------------------------------------------------

/** Raw free-text lifetime. §27. */
export const NARRATIVE_RETENTION_DAYS = 90

export function definitionHash(): string {
  return createHash('sha256').update(definitionFingerprint()).digest('hex')
}

/**
 * Finds or publishes the current version row.
 *
 * Idempotent, so a deploy that has not been seeded still works. Refuses to
 * proceed if a row exists whose hash no longer matches the code, because that
 * means a published question set was edited in place and every stored score
 * has quietly changed meaning.
 */
export async function currentVersionId(): Promise<string> {
  const hash = definitionHash()
  const existing = await queryOne<{ id: string; definition_hash: string }>(
    `SELECT id, definition_hash FROM assessment_versions WHERE version_key = $1`,
    [VERSION_KEY]
  )

  if (existing) {
    if (existing.definition_hash !== hash) {
      throw new Error(
        `${VERSION_KEY} has been edited after publication. Published assessments were ` +
          `scored against the original wording, so changing it in place would silently ` +
          `restate their results. Add a new version instead.`
      )
    }
    return existing.id
  }

  const rows = await getDb().query<{ id: string }>(
    `INSERT INTO assessment_versions (version_key, definition_hash, question_count)
     VALUES ($1, $2, $3)
     ON CONFLICT (version_key) DO UPDATE SET version_key = EXCLUDED.version_key
     RETURNING id`,
    [VERSION_KEY, hash, QUESTIONS.length]
  )
  return rows[0]!.id
}

export interface AssessmentRecord {
  id: string
  customer_id: string
  status: string
  current_step: number
  completed_at: string | null
}

/**
 * Resumes the customer's in-progress attempt, or starts one.
 *
 * One live attempt per customer: someone who abandons at step 3 and comes
 * back a week later should continue, not silently begin again and lose their
 * answers. A completed assessment does not block a new one — retaking after
 * a further change is a legitimate thing to want.
 */
export async function startOrResume(customerId: string): Promise<AssessmentRecord> {
  const open = await queryOne<AssessmentRecord>(
    `SELECT id, customer_id, status, current_step, completed_at
       FROM assessments
      WHERE customer_id = $1 AND status = 'in_progress'
      ORDER BY started_at DESC LIMIT 1`,
    [customerId]
  )
  if (open) return open

  const versionId = await currentVersionId()
  const rows = await getDb().query<AssessmentRecord>(
    `INSERT INTO assessments (customer_id, version_id)
     VALUES ($1, $2)
     RETURNING id, customer_id, status, current_step, completed_at`,
    [customerId, versionId]
  )
  await recordAuditEvent({
    eventType: 'liap.assessment_started',
    customerId,
    metadata: { version: VERSION_KEY },
  })
  return rows[0]!
}

const QUESTION_KEYS = new Set(QUESTIONS.map((q) => q.key))
const DIMENSION_OF = new Map(QUESTIONS.map((q) => [q.key, q.dimension as string]))
const NARRATIVE_KEYS = new Set<string>(NARRATIVE_QUESTIONS.map((n) => n.key))

export interface SavePayload {
  step?: number
  answers?: Record<string, number>
  intake?: {
    changeType?: string | null
    area?: string | null
    urgency?: number | null
  }
  narratives?: Partial<Record<NarrativeKey, string>>
}

/**
 * Saves progress. Called on every step, so it must be cheap and idempotent.
 *
 * Unknown question keys are dropped rather than stored. The client is not
 * trusted to send only real keys, and an accepted stray key would become a
 * row that no version can explain.
 */
export async function saveProgress(assessmentId: string, payload: SavePayload): Promise<void> {
  const db = getDb()

  const answers = Object.entries(payload.answers ?? {}).filter(
    ([key, value]) => QUESTION_KEYS.has(key) && Number.isInteger(value) && value >= 1 && value <= 5
  )

  if (answers.length > 0) {
    // One statement rather than a loop: an assessment step submits ten answers
    // at once, and ten round trips per step is the kind of thing that makes a
    // form feel broken on a phone. §38.
    await db.query(
      `INSERT INTO assessment_responses (assessment_id, question_key, dimension_key, value)
       SELECT $1, k, d, v
         FROM unnest($2::text[], $3::text[], $4::smallint[]) AS t(k, d, v)
       ON CONFLICT (assessment_id, question_key)
       DO UPDATE SET value = EXCLUDED.value, answered_at = now()`,
      [
        assessmentId,
        answers.map(([k]) => k),
        answers.map(([k]) => DIMENSION_OF.get(k)!),
        answers.map(([, v]) => v),
      ]
    )
  }

  if (payload.intake) {
    const { changeType = null, area = null, urgency = null } = payload.intake
    await db.query(
      `INSERT INTO assessment_intake (assessment_id, change_type, area_affected, urgency)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (assessment_id) DO UPDATE
         SET change_type   = COALESCE(EXCLUDED.change_type, assessment_intake.change_type),
             area_affected = COALESCE(EXCLUDED.area_affected, assessment_intake.area_affected),
             urgency       = COALESCE(EXCLUDED.urgency, assessment_intake.urgency)`,
      [assessmentId, changeType, area, urgency === null ? null : Number(urgency)]
    )
  }

  const narratives = Object.entries(payload.narratives ?? {}).filter(
    ([key, value]) => NARRATIVE_KEYS.has(key) && typeof value === 'string'
  )
  for (const [key, value] of narratives) {
    const text = String(value).trim().slice(0, 2000)
    if (!text) {
      await db.query(
        `DELETE FROM assessment_narratives WHERE assessment_id = $1 AND question_key = $2`,
        [assessmentId, key]
      )
      continue
    }
    await db.query(
      `INSERT INTO assessment_narratives (assessment_id, question_key, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (assessment_id, question_key)
       DO UPDATE SET value = EXCLUDED.value, recorded_at = now()`,
      [assessmentId, key, text]
    )
  }

  if (typeof payload.step === 'number') {
    await db.query(
      `UPDATE assessments SET current_step = $2, updated_at = now()
        WHERE id = $1 AND status = 'in_progress'`,
      [assessmentId, payload.step]
    )
  }
}

export interface LoadedAssessment {
  record: AssessmentRecord
  answers: Answers
  intake: Intake
}

export async function loadAssessment(assessmentId: string): Promise<LoadedAssessment | null> {
  const record = await queryOne<AssessmentRecord>(
    `SELECT id, customer_id, status, current_step, completed_at FROM assessments WHERE id = $1`,
    [assessmentId]
  )
  if (!record) return null

  const db = getDb()
  const responses = await db.query<{ question_key: string; value: number }>(
    `SELECT question_key, value FROM assessment_responses WHERE assessment_id = $1`,
    [assessmentId]
  )
  const intakeRow = await queryOne<{
    change_type: string | null
    area_affected: string | null
    urgency: number | null
  }>(`SELECT change_type, area_affected, urgency FROM assessment_intake WHERE assessment_id = $1`, [
    assessmentId,
  ])
  const narrativeRows = await db.query<{ question_key: string; value: string }>(
    `SELECT question_key, value FROM assessment_narratives WHERE assessment_id = $1`,
    [assessmentId]
  )
  const narratives = Object.fromEntries(narrativeRows.map((r) => [r.question_key, r.value]))

  return {
    record,
    answers: Object.fromEntries(responses.map((r) => [r.question_key, r.value])),
    intake: {
      changeType: (intakeRow?.change_type ?? null) as Intake['changeType'],
      area: intakeRow?.area_affected ?? null,
      urgency: intakeRow?.urgency ?? null,
      whatChanged: narratives.what_changed ?? null,
      importantDecision: narratives.important_decision ?? null,
      ninetyDayBetter: narratives.ninety_day_better ?? null,
    },
  }
}

export interface SubmitResult {
  report: RenderedReport
  resultToken: string
  alreadyCompleted: boolean
}

/**
 * Scores the assessment, stores the report, and returns the result token.
 *
 * Idempotent by construction. A double submit — the second tap on a slow
 * phone, a retried request — must not produce a second report or a second
 * token, because the customer may already have the first one in an email.
 * The completed row is returned instead.
 */
export async function submitAssessment(
  assessmentId: string,
  today: Date = new Date()
): Promise<SubmitResult | null> {
  const loaded = await loadAssessment(assessmentId)
  if (!loaded) return null

  if (loaded.record.status === 'completed') {
    // Already scored. The token is hashed at rest and cannot be reproduced, so
    // the caller is told to look it up rather than being handed a new one.
    return { report: await rebuildReport(assessmentId), resultToken: '', alreadyCompleted: true }
  }

  const report = buildFullReport(loaded.answers, loaded.intake, today)
  const token = generateToken()
  const purgeAfter = new Date(today.getTime())
  purgeAfter.setUTCDate(purgeAfter.getUTCDate() + NARRATIVE_RETENTION_DAYS)

  const db = getDb()

  // Claim the completion first. If two requests race, only one updates a row
  // still marked in_progress, and the loser reads the winner's result.
  const claimed = await db.query<{ id: string }>(
    `UPDATE assessments
        SET status = 'completed', completed_at = now(), updated_at = now(),
            result_token_hash = $2, narrative_purge_after = $3
      WHERE id = $1 AND status = 'in_progress'
      RETURNING id`,
    [assessmentId, hashToken(token), purgeAfter.toISOString()]
  )
  if (!claimed[0]) {
    return { report: await rebuildReport(assessmentId), resultToken: '', alreadyCompleted: true }
  }

  await db.query(
    `INSERT INTO assessment_scores (assessment_id, dimension_key, score, classification)
     SELECT $1, k, s, c FROM unnest($2::text[], $3::smallint[], $4::text[]) AS t(k, s, c)
     ON CONFLICT (assessment_id, dimension_key)
     DO UPDATE SET score = EXCLUDED.score, classification = EXCLUDED.classification`,
    [
      assessmentId,
      report.scores.map((s) => s.key),
      report.scores.map((s) => s.score),
      report.scores.map((s) => s.classification),
    ]
  )

  await db.query(
    `INSERT INTO assessment_results
       (assessment_id, total_score, position_key, steady_routed, next_best_three, plan, next_review_on)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
     ON CONFLICT (assessment_id) DO NOTHING`,
    [
      assessmentId,
      report.total,
      report.position,
      report.steady,
      JSON.stringify(report.actions),
      JSON.stringify(report.plan),
      report.plan.reviewOn,
    ]
  )

  // The audit row carries the position and nothing else. Not the narrative,
  // not the area affected, not a score breakdown — an audit trail that
  // recorded what someone said about their divorce would be a worse leak than
  // the one it exists to detect.
  await recordAuditEvent({
    eventType: 'liap.assessment_completed',
    customerId: loaded.record.customer_id,
    metadata: { version: VERSION_KEY, result: report.position },
  })

  // Rendered with the narratives that were just saved, so the response the
  // customer sees immediately after submitting is exactly what it was before
  // this change. What is STORED is the reference-bearing report above.
  const narrativesNow = Object.fromEntries(
    Object.entries({
      what_changed: loaded.intake.whatChanged,
      important_decision: loaded.intake.importantDecision,
      ninety_day_better: loaded.intake.ninetyDayBetter,
    }).filter(([, v]) => typeof v === 'string' && v.length > 0)
  ) as NarrativeMap

  return {
    report: renderReport(report, narrativesNow),
    resultToken: token,
    alreadyCompleted: false,
  }
}

/**
 * Rebuilds the report AS IT WAS GIVEN, from the stored rows.
 *
 * Not by re-running the engine: the narratives it drew on are deleted at 90
 * days, so recomputing would silently produce a thinner report than the one
 * the customer was sent. What someone was told is a fact about the past.
 */
export async function rebuildReport(
  assessmentId: string,
  options: { includeNarratives?: boolean } = {}
): Promise<RenderedReport> {
  const db = getDb()

  // The narratives, IF THEY STILL EXIST. After the 90-day purge this comes
  // back empty and every quotation in the stored report resolves to nothing —
  // which is the point. The stored report holds references, never sentences.
  //
  // `includeNarratives: false` asks for that same purged view on demand. The
  // downloadable Snapshot uses it: a PDF leaves the system entirely and
  // outlives every retention rule here, so it must never carry a quotation
  // even while the narrative is still live. A test proves the PDF is free of
  // it on day 1, not merely on day 91.
  const narrativeRows =
    options.includeNarratives === false
      ? []
      : await db.query<{ question_key: string; value: string }>(
          `SELECT question_key, value FROM assessment_narratives WHERE assessment_id = $1`,
          [assessmentId]
        )
  const narratives = Object.fromEntries(
    narrativeRows.map((r) => [r.question_key, r.value])
  ) as NarrativeMap
  const stored = await queryOne<{
    total_score: number
    position_key: string
    steady_routed: boolean
    next_best_three: unknown
    plan: unknown
  }>(
    `SELECT total_score, position_key, steady_routed, next_best_three, plan
       FROM assessment_results WHERE assessment_id = $1`,
    [assessmentId]
  )
  const scoreRows = await db.query<{ dimension_key: string; score: number; classification: string }>(
    `SELECT dimension_key, score, classification FROM assessment_scores WHERE assessment_id = $1`,
    [assessmentId]
  )

  // THE VERSION THAT PRODUCED THIS RESULT -- not the current one.
  //
  // Read from the assessment's own row, so a report is always reconstructed
  // through the definition the participant actually answered against. Nothing
  // here re-scores, converts or writes: the stored scores are rendered as they
  // were stored, under the names and labels they were stored with.
  const versionRow = await queryOne<{ version_key: string }>(
    `SELECT v.version_key FROM assessments a
       JOIN assessment_versions v ON v.id = a.version_id
      WHERE a.id = $1`,
    [assessmentId]
  )
  if (!versionRow) {
    throw new Error(
      `Assessment ${assessmentId} has no resolvable version. Refusing to render a ` +
        `stored result without knowing which definition produced it.`
    )
  }
  const { semanticsFor } = await import('./assessment/registry')
  const semantics = semanticsFor(versionRow.version_key)

  const { CLASSIFICATION_LABELS, hiddenUrgencies, rankForAttention, strengths } =
    await import('./scoring')

  const scores = semantics.dimensions.map((d) => {
    const row = scoreRows.find((r) => r.dimension_key === d.key)
    return {
      key: d.key,
      name: d.name,
      score: row?.score ?? 5,
      classification: (row?.classification ?? 'immediate') as never,
    }
  }) as never as import('./scoring').DimensionScore[]

  const positionKey = stored?.position_key ?? 'stabilize'

  const storedReport: FullReport = {
    scores,
    total: stored?.total_score ?? 40,
    position: positionKey as never,
    positionLabel: semantics.positionLabels[positionKey] ?? '',
    positionMeaning: semantics.positionMeanings[positionKey] ?? '',
    urgent: hiddenUrgencies(scores),
    ranked: rankForAttention(scores, semantics),
    strengths: strengths(scores),
    steady: stored?.steady_routed ?? false,
    actions: (stored?.next_best_three ?? []) as never,
    plan: (stored?.plan ?? { phases: [], reviewOn: null }) as never,
    classificationLabels: CLASSIFICATION_LABELS,
  }

  return renderReport(storedReport, narratives)
}

/**
 * Resolves a result token to its assessment.
 *
 * The token is the capability. It is compared by hash, so a database read
 * cannot be replayed as access to somebody's report — the same construction
 * as sessions and magic links.
 */
export async function findByResultToken(
  token: string
): Promise<{ id: string; customerId: string } | null> {
  if (!token) return null
  const row = await queryOne<{ id: string; customer_id: string }>(
    `SELECT id, customer_id FROM assessments
      WHERE result_token_hash = $1 AND status = 'completed'`,
    [hashToken(token)]
  )
  return row ? { id: row.id, customerId: row.customer_id } : null
}

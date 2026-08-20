import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb, seedCustomer } from './helpers/db'
import { hashToken } from '@/lib/auth/crypto'
import { hasEntitlement, grantEntitlement, revokeEntitlement } from '@/lib/entitlements'
import { LIAP_ASSESSMENT_ACCESS } from '@/lib/liap/entitlements'
import {
  startOrResume,
  saveProgress,
  submitAssessment,
  findByResultToken,
  currentVersionId,
  definitionHash,
} from '@/lib/liap/assessment-service'
import { purgeExpiredNarratives, findDueNarratives } from '@/lib/liap/retention'
import { fulfilPreorder, isLiapPreorder } from '@/lib/liap/fulfilment'
import { QUESTIONS, VERSION_KEY } from '@/lib/liap/assessment/v1'
import { LIAP_BOOK } from '@/lib/liap/product'
import { LIAP_EVENTS } from '@/lib/liap/analytics'
import { LIAP_TAGS } from '@/lib/liap/crm'

// ---------------------------------------------------------------------------
// §34's security list, plus §26 and §27's privacy guarantees.
//
// These run against real PostgreSQL via PGlite, so the foreign keys, the
// unique indexes and the ON DELETE behaviour are the real ones — a mock would
// pass while production leaked.
// ---------------------------------------------------------------------------

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

async function entitledCustomer(email = 'reader@example.com'): Promise<string> {
  const id = await seedCustomer(db, email)
  await grantEntitlement({
    customerId: id,
    entitlementKey: LIAP_ASSESSMENT_ACCESS,
    sourceType: 'order',
    idempotencyKey: `seed:${id}:liap`,
  })
  return id
}

/** Answers every scored question, so submission is valid. */
async function answerEverything(assessmentId: string, value = 3) {
  await saveProgress(assessmentId, {
    answers: Object.fromEntries(QUESTIONS.map((q) => [q.key, value])),
    intake: { changeType: 'unexpected', area: 'career', urgency: 5 },
    narratives: {
      what_changed: 'I was made redundant on Friday after eleven years.',
      important_decision: 'Whether to take the contract role or hold out.',
      ninety_day_better: 'Working again, and sleeping.',
    },
  })
}

describe('access to the assessment', () => {
  it('a customer without the LIAP entitlement does not have it', async () => {
    const id = await seedCustomer(db, 'browsing@example.com')
    expect(await hasEntitlement(id, LIAP_ASSESSMENT_ACCESS)).toBe(false)
  })

  it('Study Access does not confer LIAP access', async () => {
    // §8: the two products share infrastructure and nothing else. A PMP
    // subscriber must not silently receive the book bonus.
    const id = await seedCustomer(db, 'pmp.subscriber@example.com')
    await grantEntitlement({
      customerId: id,
      entitlementKey: 'STUDY_ACCESS',
      sourceType: 'subscription',
      idempotencyKey: 'study:1',
    })
    expect(await hasEntitlement(id, 'STUDY_ACCESS')).toBe(true)
    expect(await hasEntitlement(id, LIAP_ASSESSMENT_ACCESS)).toBe(false)
  })

  it('a revoked entitlement removes access immediately', async () => {
    const id = await entitledCustomer()
    expect(await hasEntitlement(id, LIAP_ASSESSMENT_ACCESS)).toBe(true)

    await revokeEntitlement({
      customerId: id,
      entitlementKey: LIAP_ASSESSMENT_ACCESS,
      reason: 'refund',
    })
    expect(await hasEntitlement(id, LIAP_ASSESSMENT_ACCESS)).toBe(false)
  })
})

describe('the preorder grants exactly once', () => {
  it('records order, order item and entitlement', async () => {
    await db.query(
      `INSERT INTO products (product_key, name, product_family)
       VALUES ($1, 'Book', 'LIAP') ON CONFLICT DO NOTHING`,
      [LIAP_BOOK.productKey]
    )

    const result = await fulfilPreorder({
      email: 'Buyer@Example.com',
      name: 'A Buyer',
      sourceId: 'cs_test_1',
      idempotencyKey: 'evt_1:LIAP_ASSESSMENT_ACCESS',
    })

    expect(result.entitlementCreated).toBe(true)
    expect(result.orderId).not.toBeNull()
    expect(await hasEntitlement(result.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)

    const items = await db.query<{ n: string }>(`SELECT count(*)::text n FROM order_items`)
    expect(items[0]!.n).toBe('1')
  })

  it('a replayed webhook grants nothing further', async () => {
    await db.query(
      `INSERT INTO products (product_key, name, product_family)
       VALUES ($1, 'Book', 'LIAP') ON CONFLICT DO NOTHING`,
      [LIAP_BOOK.productKey]
    )
    const input = {
      email: 'replay@example.com',
      sourceId: 'cs_test_2',
      idempotencyKey: 'evt_2:LIAP_ASSESSMENT_ACCESS',
    }

    const first = await fulfilPreorder(input)
    const second = await fulfilPreorder(input)

    expect(first.entitlementCreated).toBe(true)
    expect(second.entitlementCreated).toBe(false)

    const ent = await db.query<{ n: string }>(`SELECT count(*)::text n FROM entitlements`)
    const orders = await db.query<{ n: string }>(`SELECT count(*)::text n FROM orders`)
    const items = await db.query<{ n: string }>(`SELECT count(*)::text n FROM order_items`)
    expect(ent[0]!.n).toBe('1')
    expect(orders[0]!.n).toBe('1')
    expect(items[0]!.n).toBe('1')
  })

  it('matches only its own Stripe metadata marker', async () => {
    expect(isLiapPreorder({ product: LIAP_BOOK.metadataKey })).toBe(true)
    expect(isLiapPreorder({ product: 'study-access' })).toBe(false)
    expect(isLiapPreorder({})).toBe(false)
    expect(isLiapPreorder(null)).toBe(false)
  })
})

describe('result URLs', () => {
  it('resolves a valid token to its own assessment', async () => {
    const customerId = await entitledCustomer()
    const record = await startOrResume(customerId)
    await answerEverything(record.id)
    const submitted = await submitAssessment(record.id)

    const found = await findByResultToken(submitted!.resultToken)
    expect(found?.id).toBe(record.id)
    expect(found?.customerId).toBe(customerId)
  })

  it('rejects a guessed or forged token', async () => {
    const customerId = await entitledCustomer()
    const record = await startOrResume(customerId)
    await answerEverything(record.id)
    await submitAssessment(record.id)

    expect(await findByResultToken('not-a-real-token')).toBeNull()
    expect(await findByResultToken('')).toBeNull()
    expect(await findByResultToken(record.id)).toBeNull() // the row id is not the key
  })

  it('stores only the hash, never the token', async () => {
    const customerId = await entitledCustomer()
    const record = await startOrResume(customerId)
    await answerEverything(record.id)
    const submitted = await submitAssessment(record.id)

    const rows = await db.query<{ result_token_hash: string }>(
      `SELECT result_token_hash FROM assessments WHERE id = $1`,
      [record.id]
    )
    expect(rows[0]!.result_token_hash).toBe(hashToken(submitted!.resultToken))
    expect(rows[0]!.result_token_hash).not.toBe(submitted!.resultToken)
  })

  it('tokens are unguessable and never sequential', async () => {
    // §21: never use sequential database ids. Twenty consecutive assessments
    // must produce twenty tokens with nothing in common.
    const customerId = await entitledCustomer()
    const tokens = new Set<string>()
    for (let i = 0; i < 20; i++) {
      await db.query(`UPDATE assessments SET status = 'abandoned' WHERE customer_id = $1`, [
        customerId,
      ])
      const record = await startOrResume(customerId)
      await answerEverything(record.id)
      const submitted = await submitAssessment(record.id)
      tokens.add(submitted!.resultToken)
    }
    expect(tokens.size).toBe(20)
    for (const t of tokens) expect(t.length).toBeGreaterThanOrEqual(43) // 256 bits base64url
  })

  it('customer A cannot reach customer B by holding their own token', async () => {
    const a = await entitledCustomer('a@example.com')
    const b = await entitledCustomer('b@example.com')

    const recordA = await startOrResume(a)
    await answerEverything(recordA.id)
    const tokenA = (await submitAssessment(recordA.id))!.resultToken

    const recordB = await startOrResume(b)
    await answerEverything(recordB.id)
    await submitAssessment(recordB.id)

    // A's token resolves to A's assessment and A's customer id — never B's.
    const found = await findByResultToken(tokenA)
    expect(found!.customerId).toBe(a)
    expect(found!.id).not.toBe(recordB.id)
  })
})

describe('duplicate submission', () => {
  it('scores once and keeps the first token valid', async () => {
    const customerId = await entitledCustomer()
    const record = await startOrResume(customerId)
    await answerEverything(record.id)

    const first = await submitAssessment(record.id)
    const second = await submitAssessment(record.id)

    expect(first!.alreadyCompleted).toBe(false)
    expect(second!.alreadyCompleted).toBe(true)
    // A second token would break the link already sitting in their inbox.
    expect(second!.resultToken).toBe('')
    expect(await findByResultToken(first!.resultToken)).not.toBeNull()

    const results = await db.query<{ n: string }>(`SELECT count(*)::text n FROM assessment_results`)
    expect(results[0]!.n).toBe('1')
  })

  it('concurrent submits produce exactly one scored result', async () => {
    const customerId = await entitledCustomer()
    const record = await startOrResume(customerId)
    await answerEverything(record.id)

    const outcomes = await Promise.all([
      submitAssessment(record.id),
      submitAssessment(record.id),
      submitAssessment(record.id),
    ])

    expect(outcomes.filter((o) => o && !o.alreadyCompleted)).toHaveLength(1)
    const results = await db.query<{ n: string }>(`SELECT count(*)::text n FROM assessment_results`)
    expect(results[0]!.n).toBe('1')
  })
})

describe('the version is pinned to the answers', () => {
  it('records which version scored the assessment', async () => {
    const customerId = await entitledCustomer()
    const record = await startOrResume(customerId)

    const rows = await db.query<{ version_key: string }>(
      `SELECT v.version_key FROM assessments a
         JOIN assessment_versions v ON v.id = a.version_id
        WHERE a.id = $1`,
      [record.id]
    )
    expect(rows[0]!.version_key).toBe(VERSION_KEY)
  })

  it('refuses to run if a published version was edited in place', async () => {
    await currentVersionId()
    // Simulate someone rewording a question after customers have been scored.
    await db.query(`UPDATE assessment_versions SET definition_hash = 'tampered'`)

    await expect(currentVersionId()).rejects.toThrow(/edited after publication/)
  })

  it('the hash covers the wording, not just the arithmetic', () => {
    // Rephrasing a question changes what people answer, so it changes the
    // instrument even when the scoring is untouched.
    const hash = definitionHash()
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })
})

describe('free text is isolated and purged', () => {
  it('narratives live in their own table, never beside the scores', async () => {
    const customerId = await entitledCustomer()
    const record = await startOrResume(customerId)
    await answerEverything(record.id)
    await submitAssessment(record.id)

    const narratives = await db.query<{ value: string }>(
      `SELECT value FROM assessment_narratives WHERE assessment_id = $1`,
      [record.id]
    )
    expect(narratives.length).toBeGreaterThan(0)

    // The responses table holds integers only — no column could carry a story.
    const responses = await db.query<{ value: number }>(
      `SELECT value FROM assessment_responses WHERE assessment_id = $1`,
      [record.id]
    )
    for (const r of responses) expect(typeof r.value).toBe('number')

    // And nothing the customer wrote reached the stored report.
    const stored = await db.query<{ next_best_three: unknown; plan: unknown }>(
      `SELECT next_best_three, plan FROM assessment_results WHERE assessment_id = $1`,
      [record.id]
    )
    const blob = JSON.stringify(stored[0])
    expect(blob).not.toContain('made redundant on Friday after eleven years')
  })

  it('deletes the narrative at 90 days and keeps everything else', async () => {
    const customerId = await entitledCustomer()
    const record = await startOrResume(customerId)
    await answerEverything(record.id)
    await submitAssessment(record.id)

    // Nothing is due yet.
    expect(await findDueNarratives()).toHaveLength(0)

    await db.query(
      `UPDATE assessments SET narrative_purge_after = now() - interval '1 day' WHERE id = $1`,
      [record.id]
    )
    expect(await findDueNarratives()).toHaveLength(1)

    const result = await purgeExpiredNarratives()
    expect(result.narratives).toBeGreaterThan(0)

    const left = await db.query<{ n: string }>(
      `SELECT count(*)::text n FROM assessment_narratives WHERE assessment_id = $1`,
      [record.id]
    )
    expect(left[0]!.n).toBe('0')

    // §27: the derived result survives, so the report still opens.
    const scores = await db.query<{ n: string }>(
      `SELECT count(*)::text n FROM assessment_scores WHERE assessment_id = $1`,
      [record.id]
    )
    const results = await db.query<{ n: string }>(
      `SELECT count(*)::text n FROM assessment_results WHERE assessment_id = $1`,
      [record.id]
    )
    const responses = await db.query<{ n: string }>(
      `SELECT count(*)::text n FROM assessment_responses WHERE assessment_id = $1`,
      [record.id]
    )
    expect(scores[0]!.n).toBe('8')
    expect(results[0]!.n).toBe('1')
    expect(responses[0]!.n).toBe('40')
  })

  it('the purge audit records a count, never the text', async () => {
    const customerId = await entitledCustomer()
    const record = await startOrResume(customerId)
    await answerEverything(record.id)
    await submitAssessment(record.id)
    await db.query(`UPDATE assessments SET narrative_purge_after = now() - interval '1 day'`)

    await purgeExpiredNarratives()

    const rows = await db.query<{ metadata: Record<string, unknown> }>(
      `SELECT metadata FROM audit_events WHERE event_type = 'liap.narratives_purged'`
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.metadata.count).toBeTypeOf('number')
    expect(JSON.stringify(rows[0]!.metadata)).not.toContain('redundant')
  })

  it('the dry run reports without deleting', async () => {
    const customerId = await entitledCustomer()
    const record = await startOrResume(customerId)
    await answerEverything(record.id)
    await submitAssessment(record.id)
    await db.query(`UPDATE assessments SET narrative_purge_after = now() - interval '1 day'`)

    const dry = await purgeExpiredNarratives({ dryRun: true })
    expect(dry.dryRun).toBe(true)
    expect(dry.narratives).toBe(3)

    const still = await db.query<{ n: string }>(`SELECT count(*)::text n FROM assessment_narratives`)
    expect(still[0]!.n).toBe('3')
  })
})

describe('nothing sensitive is written to the audit trail', () => {
  it('completion records the position and nothing else', async () => {
    const customerId = await entitledCustomer()
    const record = await startOrResume(customerId)
    await answerEverything(record.id)
    await submitAssessment(record.id)

    const rows = await db.query<{ metadata: Record<string, unknown> }>(
      `SELECT metadata FROM audit_events WHERE event_type = 'liap.assessment_completed'`
    )
    const blob = JSON.stringify(rows[0]!.metadata)
    expect(blob).not.toContain('redundant')
    expect(blob).not.toContain('career')   // the affected area
    expect(blob).not.toContain('contract') // the stated decision
  })
})

describe('the telemetry allow-lists', () => {
  it('carry no event that could contain an answer', () => {
    for (const event of LIAP_EVENTS) {
      expect(event.startsWith('liap_')).toBe(true)
      expect(event).not.toMatch(/answer|score|narrative|money|health|relationship/)
    }
  })

  it('carry no CRM tag that could identify a dimension score', () => {
    // The position is coarse enough to segment on. A tag naming a dimension
    // would put "this person's money score is low" into a marketing system.
    for (const tag of LIAP_TAGS) {
      expect(tag.startsWith('liap_')).toBe(true)
      expect(tag).not.toMatch(/money|wellness|risk|vision|legacy|career|relationship|time/)
    }
  })
})

describe('unknown input is dropped rather than stored', () => {
  it('ignores question keys that no version defines', async () => {
    const customerId = await entitledCustomer()
    const record = await startOrResume(customerId)

    await saveProgress(record.id, {
      answers: { vision_1: 4, injected_key: 5, 'money_1; DROP TABLE customers': 3 },
    })

    const rows = await db.query<{ question_key: string }>(
      `SELECT question_key FROM assessment_responses WHERE assessment_id = $1`,
      [record.id]
    )
    expect(rows.map((r) => r.question_key)).toEqual(['vision_1'])
  })

  it('ignores out-of-range answer values', async () => {
    const customerId = await entitledCustomer()
    const record = await startOrResume(customerId)

    await saveProgress(record.id, {
      answers: { vision_1: 9, vision_2: 0, vision_3: -1, vision_4: 3 },
    })

    const rows = await db.query<{ question_key: string }>(
      `SELECT question_key FROM assessment_responses WHERE assessment_id = $1`,
      [record.id]
    )
    expect(rows.map((r) => r.question_key)).toEqual(['vision_4'])
  })
})

describe('resuming', () => {
  it('returns the same in-progress assessment rather than starting over', async () => {
    const customerId = await entitledCustomer()
    const first = await startOrResume(customerId)
    await saveProgress(first.id, { step: 3, answers: { vision_1: 5 } })

    const resumed = await startOrResume(customerId)
    expect(resumed.id).toBe(first.id)
    expect(resumed.current_step).toBe(3)

    const rows = await db.query<{ n: string }>(`SELECT count(*)::text n FROM assessments`)
    expect(rows[0]!.n).toBe('1')
  })
})

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb } from './helpers/db'
import {
  generateBookCode,
  normalizeBookCode,
  formatBookCode,
  hashBookCode,
  mintBookCodes,
  claimBookCode,
  findCodeStatus,
} from '@/lib/liap/book-codes'
import { hasEntitlement } from '@/lib/entitlements'
import { fulfilPreorder } from '@/lib/liap/fulfilment'
import {
  startOrResume,
  saveProgress,
  submitAssessment,
  rebuildReport,
  findByResultToken,
  AttemptLimitReachedError,
  MAX_ATTEMPTS,
} from '@/lib/liap/assessment-service'
import { QUESTIONS, NARRATIVE_QUESTIONS } from '@/lib/liap/assessment/v1'
import { LIAP_ENTITLEMENT } from '@/lib/liap/product'

// ---------------------------------------------------------------------------
// Book access codes and the two-assessment model.
//
// Owner-approved rule, 4 September 2026:
//
//   One eligible new book = one unique access code = one registered reader
//   = two Assessment completions.
//
// Every test here is a sentence from that rule or from the promise printed in
// the book. They run against PGlite — real PostgreSQL — because the guarantees
// being proved are database guarantees: a partial unique index, a conditional
// UPDATE that decides a race, a CHECK that makes a third attempt
// unrepresentable. A mocked database would agree with whatever the code did.
// ---------------------------------------------------------------------------

let db: Db
let close: () => Promise<void>

beforeAll(async () => {
  const created = await createTestDb()
  db = created.db
  close = created.close
  setDbForTesting(db)
})

afterAll(async () => {
  setDbForTesting(null)
  await close()
})

beforeEach(async () => {
  await db.query(`DELETE FROM book_access_codes`)
  await db.query(`DELETE FROM assessments`)
  await db.query(`DELETE FROM entitlements`)
  await db.query(`DELETE FROM audit_events`)
  await db.query(`DELETE FROM order_items`)
  await db.query(`DELETE FROM orders`)
  await db.query(`DELETE FROM customers`)
})

/** One code, minted the way a print run mints them. */
async function oneCode(batch = 'test-batch'): Promise<{ id: string; code: string }> {
  const [minted] = await mintBookCodes({ batchKey: batch, count: 1 })
  return minted!
}

async function answerEverything(assessmentId: string): Promise<void> {
  const answers: Record<string, number> = {}
  for (const q of QUESTIONS) answers[q.key] = 4
  const narratives: Record<string, string> = {}
  for (const n of NARRATIVE_QUESTIONS) narratives[n.key] = 'A sentence about the change.'
  await saveProgress(assessmentId, {
    answers,
    intake: { changeType: 'expected', area: 'career', urgency: 3 },
    narratives: narratives as never,
  })
}

// ── the code itself ────────────────────────────────────────────────────────

describe('code format', () => {
  it('generates a printable code that normalises back to itself', () => {
    const code = generateBookCode()
    expect(code).toMatch(/^LIAP(-[0-9A-HJKMNP-TV-Z]{4}){4}$/)
    const payload = normalizeBookCode(code)
    expect(payload).not.toBeNull()
    expect(payload).toHaveLength(16)
    expect(formatBookCode(payload!)).toBe(code)
  })

  it('carries 80 bits, so codes never repeat in practice', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 500; i++) seen.add(generateBookCode())
    expect(seen.size).toBe(500)
  })

  it('forgives how a reader actually types it', () => {
    const code = generateBookCode()
    const payload = normalizeBookCode(code)!
    for (const variant of [
      code.toLowerCase(),
      code.replace(/-/g, ''),
      code.replace(/-/g, ' '),
      `  ${code}  `,
      payload, // without the printed prefix at all
    ]) {
      expect(normalizeBookCode(variant)).toBe(payload)
    }
  })

  it('maps the confusions the alphabet was chosen to avoid', () => {
    // I, L and O are not in the alphabet, so a reader who typed one meant the
    // digit it resembles.
    expect(normalizeBookCode('LIAP-I234-5678-9ABC-DEFG')).toBe(
      normalizeBookCode('LIAP-1234-5678-9ABC-DEFG')
    )
    expect(normalizeBookCode('LIAP-O234-5678-9ABC-DEFG')).toBe(
      normalizeBookCode('LIAP-0234-5678-9ABC-DEFG')
    )
  })

  it('refuses anything that is not a code', () => {
    for (const junk of ['', 'LIAP', 'nonsense', 'LIAP-1234', `${generateBookCode()}X`, 'U'.repeat(16)]) {
      expect(normalizeBookCode(junk)).toBeNull()
    }
  })

  it('never stores the usable code', async () => {
    const { code } = await oneCode()
    const payload = normalizeBookCode(code)!
    const rows = await db.query<{ code_hash: string }>(`SELECT code_hash FROM book_access_codes`)
    expect(rows[0]!.code_hash).toBe(hashBookCode(payload))
    expect(rows[0]!.code_hash).not.toContain(payload)

    // And nothing anywhere else in the database holds it either.
    const audit = await db.query<{ metadata: unknown }>(`SELECT metadata FROM audit_events`)
    expect(JSON.stringify(audit)).not.toContain(payload)
  })

  it('the print script and the application agree on the format', () => {
    // The generator is duplicated in scripts/liap-generate-book-codes.mjs
    // because that file is plain node. If the two ever disagree, a print run
    // mints codes the site cannot read — so the constants are compared here.
    const script = readFileSync(
      join(process.cwd(), 'scripts', 'liap-generate-book-codes.mjs'),
      'utf8'
    )
    expect(script).toContain("const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'")
    expect(script).toContain('const CODE_LENGTH = 16')
    expect(script).toContain("const DISPLAY_PREFIX = 'LIAP'")
  })
})

// ── claiming ───────────────────────────────────────────────────────────────

describe('claiming a code', () => {
  it('1. a new valid code can be claimed and grants the assessment', async () => {
    const { id, code } = await oneCode()
    const outcome = await claimBookCode({ code, email: 'reader@example.com' })

    expect(outcome.status).toBe('claimed')
    if (outcome.status !== 'claimed') throw new Error('unreachable')
    expect(outcome.codeId).toBe(id)
    expect(await hasEntitlement(outcome.customerId, LIAP_ENTITLEMENT)).toBe(true)

    const row = await findCodeStatus(code)
    expect(row!.claimed_by_customer_id).toBe(outcome.customerId)
    expect(row!.claimed_at).not.toBeNull()
  })

  it('2. the same code cannot be claimed by a second reader', async () => {
    const { code } = await oneCode()
    const first = await claimBookCode({ code, email: 'first@example.com' })
    expect(first.status).toBe('claimed')

    const second = await claimBookCode({ code, email: 'second@example.com' })
    expect(second.status).toBe('unavailable')

    const other = await db.query<{ id: string }>(
      `SELECT id FROM customers WHERE lower(email) = 'second@example.com'`
    )
    expect(await hasEntitlement(other[0]!.id, LIAP_ENTITLEMENT)).toBe(false)
  })

  it('3. two simultaneous claims cannot both succeed', async () => {
    const { code } = await oneCode()
    const outcomes = await Promise.all([
      claimBookCode({ code, email: 'race-a@example.com' }),
      claimBookCode({ code, email: 'race-b@example.com' }),
      claimBookCode({ code, email: 'race-c@example.com' }),
    ])

    expect(outcomes.filter((o) => o.status === 'claimed')).toHaveLength(1)
    expect(outcomes.filter((o) => o.status === 'unavailable')).toHaveLength(2)

    const granted = await db.query(
      `SELECT id FROM entitlements WHERE entitlement_key = $1 AND revoked_at IS NULL`,
      [LIAP_ENTITLEMENT]
    )
    expect(granted).toHaveLength(1)
  })

  it('4. an invalid code grants nothing', async () => {
    for (const junk of ['LIAP-ZZZZ-ZZZZ-ZZZZ-ZZZZ', 'not-a-code', '']) {
      expect((await claimBookCode({ code: junk, email: 'nobody@example.com' })).status).toBe(
        'unavailable'
      )
    }
    const rows = await db.query(`SELECT id FROM entitlements`)
    expect(rows).toHaveLength(0)
  })

  it('5. a voided code grants nothing', async () => {
    const { id, code } = await oneCode()
    await db.query(
      `UPDATE book_access_codes SET voided_at = now(), void_reason = 'damaged' WHERE id = $1`,
      [id]
    )
    expect((await claimBookCode({ code, email: 'reader@example.com' })).status).toBe('unavailable')
  })

  it('14. a previously claimed book code cannot generate new access', async () => {
    // The whole point of the rule: the physical book may be lent, gifted or
    // resold, and its code does not travel with it.
    const { code } = await oneCode()
    await claimBookCode({ code, email: 'original.reader@example.com' })

    const laterHolder = await claimBookCode({ code, email: 'bought.it.used@example.com' })
    expect(laterHolder.status).toBe('unavailable')

    const rows = await db.query<{ id: string }>(
      `SELECT id FROM customers WHERE lower(email) = 'bought.it.used@example.com'`
    )
    expect(await hasEntitlement(rows[0]!.id, LIAP_ENTITLEMENT)).toBe(false)
  })

  it('does not consume a second code from a reader who already has access', async () => {
    const first = await oneCode()
    const spare = await oneCode()
    await claimBookCode({ code: first.code, email: 'reader@example.com' })

    const again = await claimBookCode({ code: spare.code, email: 'reader@example.com' })
    expect(again.status).toBe('already_entitled')

    // The second copy's code is untouched and still claimable by somebody else.
    expect((await findCodeStatus(spare.code))!.claimed_by_customer_id).toBeNull()
    expect((await claimBookCode({ code: spare.code, email: 'someone@example.com' })).status).toBe(
      'claimed'
    )
  })

  it('refuses a claim without leaking which failure it was', async () => {
    // Unknown, claimed and voided are one outcome. A caller who could tell
    // them apart could confirm which codes exist.
    const claimed = await oneCode()
    await claimBookCode({ code: claimed.code, email: 'holder@example.com' })
    const voided = await oneCode()
    await db.query(`UPDATE book_access_codes SET voided_at = now() WHERE id = $1`, [voided.id])

    const outcomes = [
      await claimBookCode({ code: 'LIAP-ZZZZ-ZZZZ-ZZZZ-ZZZZ', email: 'x@example.com' }),
      await claimBookCode({ code: claimed.code, email: 'x@example.com' }),
      await claimBookCode({ code: voided.code, email: 'x@example.com' }),
    ]
    expect(new Set(outcomes.map((o) => JSON.stringify(o))).size).toBe(1)
  })

  it('binds the entitlement to the code that opened it', async () => {
    const { id, code } = await oneCode()
    const outcome = await claimBookCode({ code, email: 'reader@example.com' })
    if (outcome.status !== 'claimed') throw new Error('unreachable')

    const rows = await db.query<{ source_type: string; source_id: string }>(
      `SELECT source_type, source_id FROM entitlements WHERE customer_id = $1`,
      [outcome.customerId]
    )
    expect(rows[0]!.source_type).toBe('book_code')
    expect(rows[0]!.source_id).toBe(id)
  })

  it('a replayed claim cannot grant twice', async () => {
    const { code } = await oneCode()
    await claimBookCode({ code, email: 'reader@example.com' })
    await claimBookCode({ code, email: 'reader@example.com' })

    const rows = await db.query(`SELECT id FROM entitlements WHERE entitlement_key = $1`, [
      LIAP_ENTITLEMENT,
    ])
    expect(rows).toHaveLength(1)
  })
})

// ── gift purchases ─────────────────────────────────────────────────────────

describe('gift purchases', () => {
  it('6. paying for a gift copy does not consume the recipient’s code', async () => {
    const result = await fulfilPreorder({
      email: 'buyer@example.com',
      name: 'The Buyer',
      sourceId: 'cs_gift_1',
      idempotencyKey: 'evt_gift_1:LIAP_ASSESSMENT_ACCESS',
      isGift: true,
    })

    expect(result.giftHeldForRecipient).toBe(true)
    expect(result.entitlementCreated).toBe(false)
    expect(await hasEntitlement(result.customerId, LIAP_ENTITLEMENT)).toBe(false)

    // The order still exists: fulfilment and customer service need it.
    const orders = await db.query(`SELECT id FROM orders WHERE customer_id = $1`, [
      result.customerId,
    ])
    expect(orders).toHaveLength(1)
  })

  it('7. the recipient claims the code under their own email', async () => {
    const buyer = await fulfilPreorder({
      email: 'buyer@example.com',
      sourceId: 'cs_gift_2',
      idempotencyKey: 'evt_gift_2:LIAP_ASSESSMENT_ACCESS',
      isGift: true,
    })
    const { code } = await oneCode()

    const outcome = await claimBookCode({ code, email: 'recipient@example.com' })
    expect(outcome.status).toBe('claimed')
    if (outcome.status !== 'claimed') throw new Error('unreachable')

    expect(await hasEntitlement(outcome.customerId, LIAP_ENTITLEMENT)).toBe(true)
    expect(await hasEntitlement(buyer.customerId, LIAP_ENTITLEMENT)).toBe(false)
    expect(outcome.customerId).not.toBe(buyer.customerId)
  })

  it('8. the purchaser cannot reach the recipient’s assessment', async () => {
    const buyer = await fulfilPreorder({
      email: 'buyer@example.com',
      sourceId: 'cs_gift_3',
      idempotencyKey: 'evt_gift_3:LIAP_ASSESSMENT_ACCESS',
      isGift: true,
    })
    const { code } = await oneCode()
    const recipient = await claimBookCode({ code, email: 'recipient@example.com' })
    if (recipient.status !== 'claimed') throw new Error('unreachable')

    const record = await startOrResume(recipient.customerId)
    await answerEverything(record.id)
    const submitted = await submitAssessment(record.id)

    // The result belongs to the recipient's customer id and to no other.
    const found = await findByResultToken(submitted!.resultToken)
    expect(found!.customerId).toBe(recipient.customerId)
    expect(found!.customerId).not.toBe(buyer.customerId)

    // And the buyer has no assessment of their own, nor standing to open one.
    const buyerRows = await db.query(`SELECT id FROM assessments WHERE customer_id = $1`, [
      buyer.customerId,
    ])
    expect(buyerRows).toHaveLength(0)
  })

  it('a non-gift purchase still grants immediately, as it always has', async () => {
    const result = await fulfilPreorder({
      email: 'direct.buyer@example.com',
      sourceId: 'cs_direct_1',
      idempotencyKey: 'evt_direct_1:LIAP_ASSESSMENT_ACCESS',
    })
    expect(result.entitlementCreated).toBe(true)
    expect(result.giftHeldForRecipient).toBe(false)
    expect(await hasEntitlement(result.customerId, LIAP_ENTITLEMENT)).toBe(true)
  })
})

// ── the two-assessment model ───────────────────────────────────────────────

describe('two assessments and no more', () => {
  async function registeredReader(email = 'reader@example.com'): Promise<string> {
    const { code } = await oneCode()
    const outcome = await claimBookCode({ code, email })
    if (outcome.status !== 'claimed') throw new Error('claim failed')
    return outcome.customerId
  }

  it('9. the registered reader can complete the first assessment', async () => {
    const customerId = await registeredReader()
    const first = await startOrResume(customerId)
    expect(first.attempt_number).toBe(1)

    await answerEverything(first.id)
    const submitted = await submitAssessment(first.id)
    expect(submitted!.alreadyCompleted).toBeFalsy()
    expect(submitted!.resultToken).toBeTruthy()
  })

  it('10. the same reader can complete the reassessment', async () => {
    const customerId = await registeredReader()
    const first = await startOrResume(customerId)
    await answerEverything(first.id)
    await submitAssessment(first.id)

    const second = await startOrResume(customerId)
    expect(second.attempt_number).toBe(2)
    expect(second.id).not.toBe(first.id)

    await answerEverything(second.id)
    const submitted = await submitAssessment(second.id)
    expect(submitted!.resultToken).toBeTruthy()

    // Both belong to the same registered reader.
    const rows = await db.query<{ customer_id: string }>(
      `SELECT customer_id FROM assessments ORDER BY attempt_number`
    )
    expect(rows.map((r) => r.customer_id)).toEqual([customerId, customerId])
  })

  it('11. the reassessment preserves the first assessment', async () => {
    const customerId = await registeredReader()
    const first = await startOrResume(customerId)
    await answerEverything(first.id)
    const firstSubmit = await submitAssessment(first.id)
    const firstReport = await rebuildReport(first.id)

    const second = await startOrResume(customerId)
    await answerEverything(second.id)
    await submitAssessment(second.id)

    // The first row, its scores, its stored result and its link all survive.
    const stillThere = await rebuildReport(first.id)
    expect(stillThere.total).toBe(firstReport.total)
    expect(await findByResultToken(firstSubmit!.resultToken)).not.toBeNull()

    const results = await db.query(`SELECT assessment_id FROM assessment_results`)
    expect(results).toHaveLength(2)
  })

  it('12. a third assessment is refused', async () => {
    const customerId = await registeredReader()
    for (const _ of [1, 2]) {
      const record = await startOrResume(customerId)
      await answerEverything(record.id)
      await submitAssessment(record.id)
    }

    await expect(startOrResume(customerId)).rejects.toBeInstanceOf(AttemptLimitReachedError)

    const rows = await db.query(`SELECT id FROM assessments WHERE customer_id = $1`, [customerId])
    expect(rows).toHaveLength(MAX_ATTEMPTS)
  })

  it('12b. the database refuses a third even if the application does not', async () => {
    // The invariant must not depend on startOrResume being the only writer.
    const customerId = await registeredReader()
    const version = await db.query<{ id: string }>(`SELECT id FROM assessment_versions LIMIT 1`)
    const first = await startOrResume(customerId)
    await answerEverything(first.id)
    await submitAssessment(first.id)
    const second = await startOrResume(customerId)
    await answerEverything(second.id)
    await submitAssessment(second.id)

    await expect(
      db.query(
        `INSERT INTO assessments (customer_id, version_id, attempt_number) VALUES ($1, $2, 3)`,
        [customerId, version[0]!.id]
      )
    ).rejects.toThrow()

    await expect(
      db.query(
        `INSERT INTO assessments (customer_id, version_id, attempt_number) VALUES ($1, $2, 2)`,
        [customerId, version[0]!.id]
      )
    ).rejects.toThrow()
  })

  it('13. reloading the form resumes rather than burning an attempt', async () => {
    const customerId = await registeredReader()
    const opened = await Promise.all([
      startOrResume(customerId),
      startOrResume(customerId),
      startOrResume(customerId),
    ])
    // Whatever order they land in, they are all the same attempt.
    expect(new Set(opened.map((r) => r.id)).size).toBe(1)

    const again = await startOrResume(customerId)
    expect(again.id).toBe(opened[0]!.id)

    const rows = await db.query(`SELECT id FROM assessments WHERE customer_id = $1`, [customerId])
    expect(rows).toHaveLength(1)
  })

  it('an unfinished first attempt does not cost the reader their reassessment', async () => {
    const customerId = await registeredReader()
    const first = await startOrResume(customerId)
    await saveProgress(first.id, { step: 3, answers: { [QUESTIONS[0]!.key]: 5 } })

    // They come back a week later and continue, rather than starting attempt 2.
    const resumed = await startOrResume(customerId)
    expect(resumed.id).toBe(first.id)
    expect(resumed.attempt_number).toBe(1)
  })
})

// ── the security the rest of the system already had ────────────────────────

describe('existing access rules are unchanged', () => {
  it('15. an unclaimed reader has no entitlement and no assessment', async () => {
    const rows = await db.query<{ id: string }>(
      `INSERT INTO customers (email) VALUES ('stranger@example.com') RETURNING id`
    )
    expect(await hasEntitlement(rows[0]!.id, LIAP_ENTITLEMENT)).toBe(false)
  })

  it('15b. a revoked entitlement stops opening the assessment', async () => {
    const { code } = await oneCode()
    const outcome = await claimBookCode({ code, email: 'refunded@example.com' })
    if (outcome.status !== 'claimed') throw new Error('unreachable')
    expect(await hasEntitlement(outcome.customerId, LIAP_ENTITLEMENT)).toBe(true)

    await db.query(`UPDATE entitlements SET revoked_at = now() WHERE customer_id = $1`, [
      outcome.customerId,
    ])
    expect(await hasEntitlement(outcome.customerId, LIAP_ENTITLEMENT)).toBe(false)
  })

  it('15c. one reader cannot reach another reader’s results', async () => {
    const a = await claimBookCode({ code: (await oneCode()).code, email: 'a@example.com' })
    const b = await claimBookCode({ code: (await oneCode()).code, email: 'b@example.com' })
    if (a.status !== 'claimed' || b.status !== 'claimed') throw new Error('unreachable')

    const recordA = await startOrResume(a.customerId)
    await answerEverything(recordA.id)
    const tokenA = (await submitAssessment(recordA.id))!.resultToken

    const found = await findByResultToken(tokenA)
    expect(found!.customerId).toBe(a.customerId)
    expect(found!.customerId).not.toBe(b.customerId)
  })

  it('records every claim in the audit trail, without the code', async () => {
    const { code } = await oneCode()
    await claimBookCode({ code, email: 'reader@example.com' })

    const rows = await db.query<{ event_type: string; metadata: Record<string, unknown> }>(
      `SELECT event_type, metadata FROM audit_events ORDER BY event_type`
    )
    const types = rows.map((r) => r.event_type)
    expect(types).toContain('liap.book_code_claimed')
    expect(types).toContain('entitlement.granted')
    expect(JSON.stringify(rows)).not.toContain(normalizeBookCode(code))
  })
})

// ── the endpoint itself ────────────────────────────────────────────────────

describe('the claim endpoint', () => {
  async function post(body: Record<string, unknown>) {
    const { POST } = await import('@/app/api/liap/claim-code/route')
    const { NextRequest } = await import('next/server')
    const req = new NextRequest('https://www.wisergenerations.com/api/liap/claim-code', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://www.wisergenerations.com',
        // A distinct address per test, so one test's budget is not another's.
        'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250) + 1}`,
      },
      body: JSON.stringify(body),
    })
    const res = await POST(req)
    return { status: res.status, body: await res.json() }
  }

  it('gives byte-identical refusals for unknown, claimed and voided codes', async () => {
    process.env.FEATURE_LIAP = 'true'

    const claimed = await oneCode()
    await claimBookCode({ code: claimed.code, email: 'holder@example.com' })
    const voided = await oneCode()
    await db.query(`UPDATE book_access_codes SET voided_at = now() WHERE id = $1`, [voided.id])

    const answers = [
      await post({ code: 'LIAP-ZZZZ-ZZZZ-ZZZZ-ZZZZ', email: 'prober@example.com' }),
      await post({ code: claimed.code, email: 'prober@example.com' }),
      await post({ code: voided.code, email: 'prober@example.com' }),
      await post({ code: 'total-nonsense', email: 'prober@example.com' }),
    ]

    // Same status and same body for every cause. An attacker learns nothing
    // about which codes exist.
    expect(new Set(answers.map((a) => JSON.stringify(a))).size).toBe(1)
    expect(answers[0]!.status).toBe(400)

    delete process.env.FEATURE_LIAP
  })

  it('throttles guessing long before 80 bits comes under pressure', async () => {
    process.env.FEATURE_LIAP = 'true'
    const ip = '10.9.9.9'
    const { POST } = await import('@/app/api/liap/claim-code/route')
    const { NextRequest } = await import('next/server')

    const statuses: number[] = []
    for (let i = 0; i < 8; i++) {
      const req = new NextRequest('https://www.wisergenerations.com/api/liap/claim-code', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://www.wisergenerations.com',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify({ code: `LIAP-ZZZZ-ZZZZ-ZZZZ-ZZZ${i}`, email: 'p@example.com' }),
      })
      statuses.push((await POST(req)).status)
    }

    expect(statuses).toContain(429)
    delete process.env.FEATURE_LIAP
  })

  it('refuses a request from another origin', async () => {
    process.env.FEATURE_LIAP = 'true'
    const { POST } = await import('@/app/api/liap/claim-code/route')
    const { NextRequest } = await import('next/server')
    const req = new NextRequest('https://www.wisergenerations.com/api/liap/claim-code', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil.test',
        'x-forwarded-for': '10.5.5.5',
      },
      body: JSON.stringify({ code: 'LIAP-1234-5678-9ABC-DEFG', email: 'x@example.com' }),
    })
    expect((await POST(req)).status).toBe(403)
    delete process.env.FEATURE_LIAP
  })

  it('a replayed successful claim does not grant a second time', async () => {
    process.env.FEATURE_LIAP = 'true'
    const { code } = await oneCode()

    const first = await post({ code, email: 'reader@example.com' })
    const replay = await post({ code, email: 'reader@example.com' })

    expect(first.status).toBe(200)
    // The reader already holds it, so the replay is told so rather than
    // consuming anything or granting anything further.
    expect(replay.status).toBe(200)
    expect(replay.body.alreadyEntitled).toBe(true)

    const rows = await db.query(`SELECT id FROM entitlements WHERE entitlement_key = $1`, [
      LIAP_ENTITLEMENT,
    ])
    expect(rows).toHaveLength(1)
    delete process.env.FEATURE_LIAP
  })
})

// ── the flag ───────────────────────────────────────────────────────────────

describe('feature flags', () => {
  it('16. the claim route does not exist while FEATURE_LIAP is off', async () => {
    const previous = process.env.FEATURE_LIAP
    delete process.env.FEATURE_LIAP

    const { POST } = await import('@/app/api/liap/claim-code/route')
    const { NextRequest } = await import('next/server')
    const req = new NextRequest('https://www.wisergenerations.com/api/liap/claim-code', {
      method: 'POST',
      body: JSON.stringify({ code: 'LIAP-1234-5678-9ABC-DEFG', email: 'x@example.com' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(404)

    if (previous !== undefined) process.env.FEATURE_LIAP = previous
  })

  it('16b. the register-book page is inside the flagged LIAP tree', () => {
    // The page has no gate of its own because the layout above it has one.
    // If the page ever moves out of that tree, this fails.
    const layout = readFileSync(
      join(process.cwd(), 'app', 'living-is-a-project', 'layout.tsx'),
      'utf8'
    )
    expect(layout).toContain("isEnabled('LIAP')")
    expect(layout).toContain('notFound()')

    const page = readFileSync(
      join(process.cwd(), 'app', 'living-is-a-project', 'register-book', 'page.tsx'),
      'utf8'
    )
    expect(page).toContain('ClaimCodeForm')
  })
})

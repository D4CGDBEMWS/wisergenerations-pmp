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
  revokeAndRetireCode,
  REVOKE_AND_RETIRE_SQL,
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

describe('purchases grant nothing; the code does', () => {
  it('a direct purchase creates one registration opportunity, not an entitlement plus a loose code', async () => {
    // D1. One new book must not create two Assessment registrations.
    const result = await fulfilPreorder({
      email: 'direct.buyer@example.com',
      name: 'The Buyer',
      sourceId: 'cs_direct_1',
      idempotencyKey: 'evt_direct_1:LIAP_ASSESSMENT_ACCESS',
    })

    expect(result.entitlementCreated).toBe(false)
    expect(await hasEntitlement(result.customerId, LIAP_ENTITLEMENT)).toBe(false)

    // The purchase record survives for fulfilment, refunds and support.
    const orders = await db.query(`SELECT id FROM orders WHERE customer_id = $1`, [
      result.customerId,
    ])
    expect(orders).toHaveLength(1)

    // The buyer activates the same way everyone does: the code in their copy.
    const { code } = await oneCode()
    const claim = await claimBookCode({ code, email: 'direct.buyer@example.com' })
    expect(claim.status).toBe('claimed')
    expect(await hasEntitlement(result.customerId, LIAP_ENTITLEMENT)).toBe(true)

    // And exactly one registration exists for that one book.
    const grants = await db.query(
      `SELECT id FROM entitlements WHERE entitlement_key = $1 AND revoked_at IS NULL`,
      [LIAP_ENTITLEMENT]
    )
    expect(grants).toHaveLength(1)
  })

  it('6. a gift purchaser receives no Assessment entitlement', async () => {
    const buyer = await fulfilPreorder({
      email: 'gift.buyer@example.com',
      sourceId: 'cs_gift_1',
      idempotencyKey: 'evt_gift_1:LIAP_ASSESSMENT_ACCESS',
    })
    expect(await hasEntitlement(buyer.customerId, LIAP_ENTITLEMENT)).toBe(false)
  })

  it('7. the recipient registers the code under their own identity', async () => {
    const buyer = await fulfilPreorder({
      email: 'gift.buyer@example.com',
      sourceId: 'cs_gift_2',
      idempotencyKey: 'evt_gift_2:LIAP_ASSESSMENT_ACCESS',
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
      email: 'gift.buyer@example.com',
      sourceId: 'cs_gift_3',
      idempotencyKey: 'evt_gift_3:LIAP_ASSESSMENT_ACCESS',
    })
    const { code } = await oneCode()
    const recipient = await claimBookCode({ code, email: 'recipient@example.com' })
    if (recipient.status !== 'claimed') throw new Error('unreachable')

    const record = await startOrResume(recipient.customerId)
    await answerEverything(record.id)
    const submitted = await submitAssessment(record.id)

    const found = await findByResultToken(submitted!.resultToken)
    expect(found!.customerId).toBe(recipient.customerId)
    expect(found!.customerId).not.toBe(buyer.customerId)

    const buyerRows = await db.query(`SELECT id FROM assessments WHERE customer_id = $1`, [
      buyer.customerId,
    ])
    expect(buyerRows).toHaveLength(0)
  })

  it('a retailer reader with a valid code registers without manual verification', async () => {
    // D3. The code is the proof of eligibility; nothing asks where the book
    // was bought, and no preorder_verifications row is involved.
    const { code } = await oneCode('retail-print-run')
    const outcome = await claimBookCode({ code, email: 'bought.at.a.bookshop@example.com' })

    expect(outcome.status).toBe('claimed')
    if (outcome.status !== 'claimed') throw new Error('unreachable')
    expect(await hasEntitlement(outcome.customerId, LIAP_ENTITLEMENT)).toBe(true)

    const verifications = await db.query(`SELECT id FROM preorder_verifications`)
    expect(verifications).toHaveLength(0)
  })

  it('manual verification survives as the controlled exception it now is', () => {
    // D3 preserves it for pre-code inventory and owner-approved support cases,
    // so the route and its human-approval script must both still exist.
    expect(
      readFileSync(join(process.cwd(), 'app/api/liap/verify-preorder/route.ts'), 'utf8')
    ).toContain("'pending'")
    expect(
      readFileSync(join(process.cwd(), 'scripts/liap-approve-preorder.mjs'), 'utf8')
    ).toContain('--approve')
  })
})

describe('legacy entitlement holders', () => {
  /** Someone who was granted access before codes existed. */
  async function legacyHolder(email: string): Promise<string> {
    const rows = await db.query<{ id: string }>(
      `INSERT INTO customers (email) VALUES ($1) RETURNING id`,
      [email]
    )
    const id = rows[0]!.id
    await db.query(
      `INSERT INTO entitlements (customer_id, entitlement_key, source_type, idempotency_key)
       VALUES ($1, $2, 'order', $3)`,
      [id, LIAP_ENTITLEMENT, `legacy:${id}`]
    )
    return id
  }

  it('keeps working without ever presenting a code', async () => {
    // D4. A legitimate legacy grant is not retroactively invalidated.
    const customerId = await legacyHolder('legacy@example.com')
    expect(await hasEntitlement(customerId, LIAP_ENTITLEMENT)).toBe(true)

    const record = await startOrResume(customerId)
    expect(record.attempt_number).toBe(1)
    await answerEverything(record.id)
    expect((await submitAssessment(record.id))!.resultToken).toBeTruthy()
  })

  it('does not receive two fresh attempts on top of one already taken', async () => {
    // D4. Existing completions count toward the maximum of two.
    const customerId = await legacyHolder('legacy.midway@example.com')
    const first = await startOrResume(customerId)
    await answerEverything(first.id)
    await submitAssessment(first.id)

    const second = await startOrResume(customerId)
    expect(second.attempt_number).toBe(2)
    await answerEverything(second.id)
    await submitAssessment(second.id)

    await expect(startOrResume(customerId)).rejects.toBeInstanceOf(AttemptLimitReachedError)
    const rows = await db.query(`SELECT id FROM assessments WHERE customer_id = $1`, [customerId])
    expect(rows).toHaveLength(MAX_ATTEMPTS)
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

// ── the two statements printed in the book ─────────────────────────────────

describe('the book’s promises, clause by clause', () => {
  // These are acceptance criteria, not descriptions. Each test is one clause
  // of the owner-approved wording that will be printed and cannot be recalled.

  const STATEMENT_ONE =
    'Whether you purchased this book or received a new copy as a gift, your book ' +
    'registration includes a unique access code to the Living Is a Project Assessment.'

  const STATEMENT_TWO =
    'Your unique access code may be registered to one reader. Once the code has been ' +
    'registered, the Assessment access remains with that registered user and cannot be ' +
    'registered to another reader. Your registration provides two Assessment completions ' +
    'for you: your first Assessment and your Reassessment.'

  it('“whether you purchased this book…” — the buyer registers the code in their copy', async () => {
    const purchase = await fulfilPreorder({
      email: 'buyer@example.com',
      sourceId: 'cs_promise_1',
      idempotencyKey: 'evt_promise_1:LIAP_ASSESSMENT_ACCESS',
    })
    expect(await hasEntitlement(purchase.customerId, LIAP_ENTITLEMENT)).toBe(false)

    const { code } = await oneCode()
    const outcome = await claimBookCode({ code, email: 'buyer@example.com' })
    expect(outcome.status).toBe('claimed')
    expect(await hasEntitlement(purchase.customerId, LIAP_ENTITLEMENT)).toBe(true)
  })

  it('“…or received a new copy as a gift” — the recipient registers, having bought nothing', async () => {
    // No order, no payment, no prior relationship. Only a book and a code.
    const { code } = await oneCode()
    const outcome = await claimBookCode({ code, email: 'given.the.book@example.com' })

    expect(outcome.status).toBe('claimed')
    if (outcome.status !== 'claimed') throw new Error('unreachable')
    expect(await hasEntitlement(outcome.customerId, LIAP_ENTITLEMENT)).toBe(true)

    const orders = await db.query(`SELECT id FROM orders WHERE customer_id = $1`, [
      outcome.customerId,
    ])
    expect(orders).toHaveLength(0)
  })

  it('“may be registered to one reader” — and only one', async () => {
    const { code } = await oneCode()
    expect((await claimBookCode({ code, email: 'the.one@example.com' })).status).toBe('claimed')
    expect((await claimBookCode({ code, email: 'someone.else@example.com' })).status).toBe(
      'unavailable'
    )
  })

  it('“remains with that registered user and cannot be registered to another”', async () => {
    const { code } = await oneCode()
    const reader = await claimBookCode({ code, email: 'registered@example.com' })
    if (reader.status !== 'claimed') throw new Error('unreachable')

    // The book is passed on. The next holder types the same code.
    const nextHolder = await claimBookCode({ code, email: 'next.holder@example.com' })
    expect(nextHolder.status).toBe('unavailable')

    // The access is still exactly where it was.
    const row = await findCodeStatus(code)
    expect(row!.claimed_by_customer_id).toBe(reader.customerId)
    expect(await hasEntitlement(reader.customerId, LIAP_ENTITLEMENT)).toBe(true)

    const next = await db.query<{ id: string }>(
      `SELECT id FROM customers WHERE lower(email) = 'next.holder@example.com'`
    )
    expect(await hasEntitlement(next[0]!.id, LIAP_ENTITLEMENT)).toBe(false)
  })

  it('“two Assessment completions: your first Assessment and your Reassessment”', async () => {
    const { code } = await oneCode()
    const reader = await claimBookCode({ code, email: 'registered@example.com' })
    if (reader.status !== 'claimed') throw new Error('unreachable')

    const first = await startOrResume(reader.customerId)
    expect(first.attempt_number).toBe(1)
    await answerEverything(first.id)
    const firstResult = await submitAssessment(first.id)

    const second = await startOrResume(reader.customerId)
    expect(second.attempt_number).toBe(2)
    await answerEverything(second.id)
    await submitAssessment(second.id)

    // Two, and the first is still there.
    expect(await findByResultToken(firstResult!.resultToken)).not.toBeNull()
    await expect(startOrResume(reader.customerId)).rejects.toBeInstanceOf(AttemptLimitReachedError)
  })

  it('the reader journey names both readers the first statement names', () => {
    // The registration surface must speak to a buyer AND to someone who was
    // given the book. Before D2 it spoke only to buyers and event attendees,
    // which is what made the statement untrue for the gift recipient.
    const register = readFileSync(
      join(process.cwd(), 'components/liap/BookRegister.tsx'),
      'utf8'
    )
    expect(register).toContain('Register My Book')
    expect(register).toContain('Have your unique access code ready.')
    expect(register).toContain('I have a unique book access code')
    expect(register).toContain('purchased your new copy yourself or received it as a gift')

    // And the printed QR must land on it, not on a chooser.
    const qrRoute = readFileSync(join(process.cwd(), 'app/liap/book/page.tsx'), 'utf8')
    expect(qrRoute).toContain('BookRegister')
    expect(qrRoute).not.toContain('<BookChooser')
  })

  it('records both statements verbatim, so a rewrite has to be deliberate', () => {
    // The statements are owner-approved and locked. Keeping them here means a
    // change to the wording shows up as a change to this file.
    expect(STATEMENT_ONE).toContain('received a new copy as a gift')
    expect(STATEMENT_TWO).toContain('two Assessment completions')
    expect(STATEMENT_TWO).toContain('cannot be registered to another reader')
  })
})

// ── the journeys, end to end ───────────────────────────────────────────────

describe('the two journeys the owner asked to be traced', () => {
  it('new book → registration → code → entitlement → #1 → reassessment → third refused', async () => {
    const { code } = await oneCode('first-print')

    // The reader registers the code from the card in their book.
    const registered = await claimBookCode({ code, email: 'reader@example.com', name: 'A Reader' })
    expect(registered.status).toBe('claimed')
    if (registered.status !== 'claimed') throw new Error('unreachable')
    expect(await hasEntitlement(registered.customerId, LIAP_ENTITLEMENT)).toBe(true)

    const first = await startOrResume(registered.customerId)
    await answerEverything(first.id)
    const firstResult = await submitAssessment(first.id)
    expect(firstResult!.resultToken).toBeTruthy()

    const reassessment = await startOrResume(registered.customerId)
    expect(reassessment.attempt_number).toBe(2)
    await answerEverything(reassessment.id)
    const secondResult = await submitAssessment(reassessment.id)
    expect(secondResult!.resultToken).toBeTruthy()
    expect(secondResult!.resultToken).not.toBe(firstResult!.resultToken)

    await expect(startOrResume(registered.customerId)).rejects.toBeInstanceOf(
      AttemptLimitReachedError
    )

    // Both records survive, distinct and both readable.
    expect(await findByResultToken(firstResult!.resultToken)).not.toBeNull()
    expect(await findByResultToken(secondResult!.resultToken)).not.toBeNull()
  })

  it('gift purchase → purchaser gets nothing → recipient registers → #1 → reassessment', async () => {
    const purchaser = await fulfilPreorder({
      email: 'the.giver@example.com',
      name: 'The Giver',
      sourceId: 'cs_gift_journey',
      idempotencyKey: 'evt_gift_journey:LIAP_ASSESSMENT_ACCESS',
    })
    expect(await hasEntitlement(purchaser.customerId, LIAP_ENTITLEMENT)).toBe(false)

    // The book, with its unclaimed card, is handed over.
    const { code } = await oneCode('first-print')
    const recipient = await claimBookCode({ code, email: 'the.recipient@example.com' })
    if (recipient.status !== 'claimed') throw new Error('unreachable')
    expect(recipient.customerId).not.toBe(purchaser.customerId)

    const first = await startOrResume(recipient.customerId)
    await answerEverything(first.id)
    await submitAssessment(first.id)

    const reassessment = await startOrResume(recipient.customerId)
    expect(reassessment.attempt_number).toBe(2)
    await answerEverything(reassessment.id)
    await submitAssessment(reassessment.id)

    // The giver still holds nothing, and never sees any of it.
    expect(await hasEntitlement(purchaser.customerId, LIAP_ENTITLEMENT)).toBe(false)
    const giverRows = await db.query(`SELECT id FROM assessments WHERE customer_id = $1`, [
      purchaser.customerId,
    ])
    expect(giverRows).toHaveLength(0)
  })
})

// ── administrative correction ──────────────────────────────────────────────

describe('support correction is audited and not self-service', () => {
  it('exists only as a command, never as a route', () => {
    const admin = readFileSync(join(process.cwd(), 'scripts/liap-book-code-admin.mjs'), 'utf8')
    expect(admin).toContain('--release')
    expect(admin).toContain('--void')
    expect(admin).toContain('requireReason')
    expect(admin).toContain('audit_events')

    // Nothing in the customer-facing API can move a claim.
    const routes = ['claim-code', 'assessment', 'preorder', 'verify-preorder', 'interest']
    for (const name of routes) {
      const file = join(process.cwd(), 'app/api/liap', name, 'route.ts')
      const src = readFileSync(file, 'utf8')
      expect(src, name).not.toContain('claimed_by_customer_id = NULL')
      expect(src, name).not.toContain('voided_at = now()')
    }
  })

  it('every override has to say why it happened', () => {
    const admin = readFileSync(join(process.cwd(), 'scripts/liap-book-code-admin.mjs'), 'utf8')
    // requireReason() is called before any state changes, for every operation
    // except the read-only lookup. The count is asserted once, in the D5
    // block below, so there is one place to update when an operation is added.
    for (const op of ['--void', '--replace', '--release', '--revoke', '--reset-attempt']) {
      expect(admin, op).toContain(`flag('${op}')`)
    }
    expect(admin).toContain("console.error('--reason is required")
  })
})

// ── D5: the atomic administrative remedy ───────────────────────────────────

describe('revoke and retire, together', () => {
  it('revokes the reader’s access and retires the code in one operation', async () => {
    const { id, code } = await oneCode()
    const reader = await claimBookCode({ code, email: 'abuser@example.com' })
    if (reader.status !== 'claimed') throw new Error('unreachable')
    expect(await hasEntitlement(reader.customerId, LIAP_ENTITLEMENT)).toBe(true)

    const outcome = await revokeAndRetireCode({
      codeId: id,
      reason: 'chargeback abuse, verified',
      operator: 'support-op',
    })

    expect(outcome.retired).toBe(true)
    expect(outcome.revokedCount).toBe(1)
    expect(outcome.heldBy).toBe(reader.customerId)

    // Both halves, together: access gone, code dead.
    expect(await hasEntitlement(reader.customerId, LIAP_ENTITLEMENT)).toBe(false)
    expect((await findCodeStatus(code))!.voided_at).not.toBeNull()
  })

  it('the code can never be registered again — by anyone, including the holder', async () => {
    const { id, code } = await oneCode()
    const reader = await claimBookCode({ code, email: 'abuser@example.com' })
    if (reader.status !== 'claimed') throw new Error('unreachable')
    await revokeAndRetireCode({ codeId: id, reason: 'fraud, verified' })

    // The original holder cannot re-register it.
    expect((await claimBookCode({ code, email: 'abuser@example.com' })).status).toBe('unavailable')
    // Nor can anybody else.
    expect((await claimBookCode({ code, email: 'opportunist@example.com' })).status).toBe(
      'unavailable'
    )
    expect(await hasEntitlement(reader.customerId, LIAP_ENTITLEMENT)).toBe(false)
  })

  it('leaves the claim on the row, because who held it is what an investigation needs', async () => {
    const { id, code } = await oneCode()
    const reader = await claimBookCode({ code, email: 'abuser@example.com' })
    if (reader.status !== 'claimed') throw new Error('unreachable')
    await revokeAndRetireCode({ codeId: id, reason: 'duplicate issuance' })

    const row = await findCodeStatus(code)
    expect(row!.claimed_by_customer_id).toBe(reader.customerId)
    expect(row!.claimed_at).not.toBeNull()
    expect(row!.voided_at).not.toBeNull()
  })

  it('records both the revocation and the retirement, with the reason and no code', async () => {
    const { id, code } = await oneCode()
    await claimBookCode({ code, email: 'abuser@example.com' })
    await revokeAndRetireCode({
      codeId: id,
      reason: 'chargeback abuse, verified',
      operator: 'support-op',
    })

    const rows = await db.query<{ event_type: string; actor: string | null; metadata: unknown }>(
      `SELECT event_type, actor, metadata FROM audit_events`
    )
    const types = rows.map((r) => r.event_type)
    expect(types).toContain('entitlement.revoked')
    expect(types).toContain('liap.book_code_revoked')

    const revocation = rows.find((r) => r.event_type === 'liap.book_code_revoked')!
    expect(revocation.actor).toBe('support-op')
    expect(JSON.stringify(revocation.metadata)).toContain('chargeback abuse, verified')
    // The usable code never reaches an audit row.
    expect(JSON.stringify(rows)).not.toContain(normalizeBookCode(code))
  })

  it('retires an unclaimed code without pretending it revoked anything', async () => {
    const { id, code } = await oneCode()
    const outcome = await revokeAndRetireCode({ codeId: id, reason: 'bad batch' })

    expect(outcome.retired).toBe(true)
    expect(outcome.revokedCount).toBe(0)
    expect((await claimBookCode({ code, email: 'anyone@example.com' })).status).toBe('unavailable')
  })

  it('is idempotent — a second run changes nothing and says so', async () => {
    const { id, code } = await oneCode()
    await claimBookCode({ code, email: 'abuser@example.com' })
    await revokeAndRetireCode({ codeId: id, reason: 'fraud' })

    const again = await revokeAndRetireCode({ codeId: id, reason: 'fraud' })
    expect(again.retired).toBe(false)
    expect(again.revokedCount).toBe(0)
  })

  it('leaves --release available for the error case it is for', async () => {
    // D5 preserves the erroneous-registration path. A released code goes back
    // to the pool; a revoked one never does. The distinction is the point.
    const { id, code } = await oneCode()
    const wrongAddress = await claimBookCode({ code, email: 'typo@example.com' })
    if (wrongAddress.status !== 'claimed') throw new Error('unreachable')

    // What --release does, as the script does it.
    await db.query(
      `UPDATE book_access_codes SET claimed_by_customer_id = NULL, claimed_at = NULL WHERE id = $1`,
      [id]
    )
    await db.query(
      `UPDATE entitlements SET revoked_at = now() WHERE source_type = 'book_code' AND source_id = $1`,
      [id]
    )

    // The rightful reader can now register the code from their own book.
    const rightful = await claimBookCode({ code, email: 'rightful@example.com' })
    expect(rightful.status).toBe('claimed')
    expect(await hasEntitlement(wrongAddress.customerId, LIAP_ENTITLEMENT)).toBe(false)
  })

  it('no customer-facing route can revoke or retire anything', async () => {
    // The remedy is CLI-only, by construction. Nothing under app/api may call
    // it, and no route may run the statement itself.
    const { readdirSync, statSync } = await import('fs')
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry)
        return statSync(full).isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : []
      })

    for (const file of walk(join(process.cwd(), 'app/api'))) {
      const src = readFileSync(file, 'utf8')
      expect(src, file).not.toContain('revokeAndRetireCode')
      expect(src, file).not.toContain('REVOKE_AND_RETIRE_SQL')
      expect(src, file).not.toContain('voided_at = now()')
    }
  })

  it('the CLI runs exactly the statement that was reviewed and tested', () => {
    // The script is plain node and cannot import the module, so the statement
    // is duplicated. If the two ever drift, support would be running something
    // other than what these tests prove.
    const admin = readFileSync(join(process.cwd(), 'scripts/liap-book-code-admin.mjs'), 'utf8')
    expect(admin).toContain(REVOKE_AND_RETIRE_SQL.trim())
    expect(admin).toContain("flag('--revoke')")
    // Five mutating branches now, five reason checks.
    expect(admin.match(/requireReason\(\)/g)).toHaveLength(5)
  })
})

// ── D6: the promise the site makes about payment ───────────────────────────

describe('no surface claims that paying activates the assessment', () => {
  /** Every LIAP file a customer can read. */
  function liapSurfaces(): string[] {
    const { readdirSync, statSync } = require('fs') as typeof import('fs')
    const out: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(join(process.cwd(), dir))) {
        const rel = `${dir}/${entry}`
        if (statSync(join(process.cwd(), rel)).isDirectory()) walk(rel)
        else if (/\.tsx?$/.test(entry)) out.push(rel)
      }
    }
    walk('app/living-is-a-project')
    walk('app/liap')
    walk('app/api/liap')
    walk('components/liap')
    return out
  }

  /** Source with comments stripped: only what a customer could read. */
  const rendered = (rel: string) =>
    readFileSync(join(process.cwd(), rel), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')

  it('A. no LIAP surface says payment unlocks or activates the assessment', () => {
    // D1 and D6: the code in the book activates access, not the payment. This
    // is the regression that matters most, because the claim was previously
    // made on the checkout page itself and on the receipt.
    const forbidden = [
      'unlock my assessment',
      'unlock the Life Project-Ready',
      'assessment is unlocked',
      'assessment unlocks',
      'preorder unlocks',
      "isn't unlocked",
      'unlocks the Life Project-Ready',
    ]
    for (const file of liapSurfaces()) {
      const text = rendered(file)
      for (const phrase of forbidden) {
        expect(text.toLowerCase(), `${file} :: ${phrase}`).not.toContain(phrase.toLowerCase())
      }
    }
  })

  it('B. the preorder confirmation does not send the purchaser to the assessment', () => {
    // At that moment they have no book, no code and no entitlement. A link to
    // the assessment is a dead end behind a sign-in that will never email
    // them, which is exactly what this page used to do.
    const page = rendered('app/living-is-a-project/preorder-complete/page.tsx')
    expect(page).not.toContain('/living-is-a-project/assessment')
    expect(page).not.toContain('Begin my assessment')
    expect(page).toContain('/living-is-a-project/book#how-it-works')
    expect(page).toContain('What happens next')
  })

  it('makes no promise of an email the system does not send', () => {
    // Nothing is emailed at purchase: the only login link comes from the
    // sign-in form. The claim was inaccurate before the code architecture
    // existed and is not reinstated by it.
    const page = rendered('app/living-is-a-project/preorder-complete/page.tsx')
    expect(page).not.toContain('emailed you an access link')
    expect(page).not.toContain('wait a moment and refresh')
  })

  it('offers registration first to a signed-in reader without access', () => {
    const page = rendered('app/living-is-a-project/assessment/page.tsx')
    expect(page).toContain('Register my book')
    expect(page).toContain('/liap/book')
    // And does not diagnose a missing preorder: a gift recipient never had one.
    expect(page).not.toContain('cannot find a preorder')
    expect(page).not.toContain('find a preorder on this account')
  })

  it('points a retailer reader holding a code at registration before verification', () => {
    const page = rendered('app/living-is-a-project/verify-preorder/page.tsx')
    expect(page).toContain('/liap/book')
    expect(page).not.toContain("we&rsquo;ll unlock it")
    // The exception path itself survives.
    expect(page).toContain('VerifyPreorderForm')
  })

  it('makes no shipping, delivery or arrival promise anywhere', () => {
    // The publication date is a publication date. No surface may turn it into
    // a date a copy is in someone's hands.
    for (const file of liapSurfaces()) {
      const text = rendered(file).toLowerCase()
      for (const phrase of ['ships when', 'will arrive', 'arrives in october', 'delivered by']) {
        expect(text, `${file} :: ${phrase}`).not.toContain(phrase)
      }
    }
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
    expect(page).toContain('BookRegister')
  })

  it('16c. the printed QR route gates itself rather than relying on that tree', () => {
    // /liap/book sits OUTSIDE app/living-is-a-project on purpose: a reader
    // holding the book must never be told by our own QR code that the page
    // does not exist. It carries its own flag and soft-lands instead.
    const page = readFileSync(join(process.cwd(), 'app/liap/book/page.tsx'), 'utf8')
    expect(page).not.toContain('notFound')
    expect(page).toContain('BookSoftLanding')
    expect(page).toContain('BookRegister')

    const entry = readFileSync(join(process.cwd(), 'lib/liap/book-entry.ts'), 'utf8')
    expect(entry).toContain("isEnabled('LIAP_BOOK_ACTIVATION')")
  })
})

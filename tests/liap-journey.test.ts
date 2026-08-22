import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb, seedCustomer } from './helpers/db'
import { grantEntitlement, hasEntitlement, revokeEntitlement } from '@/lib/entitlements'
import { LIAP_ASSESSMENT_ACCESS } from '@/lib/liap/entitlements'
import { fulfilPreorder } from '@/lib/liap/fulfilment'
import { findByResultToken, rebuildReport } from '@/lib/liap/assessment-service'
import { QUESTIONS } from '@/lib/liap/assessment/v1'
import { LIAP_BOOK } from '@/lib/liap/product'
import { resultsEmailHtml, resultsEmailText, RESULTS_SUBJECT } from '@/lib/liap/results-email'

// ---------------------------------------------------------------------------
// §37. The whole journey, through the actual route handlers.
//
// Not the service functions directly — the HTTP layer, because that is where
// authorization, ownership and validation live and where a real customer's
// request lands. The chain proven here is the one the brief asks for:
//
//   preorder → order → entitlement → assessment start → save → submit →
//   deterministic score → position → Protect/Resolve/Move → 30/60/90 →
//   secure results → email content → link returns to the right results
//
// Both directions, as §37 requires: the authorized path all the way through,
// and each unauthorized path refused.
// ---------------------------------------------------------------------------

let db: Db
let close: () => Promise<void>
let cookieValue: string | undefined

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'wg_session' && cookieValue ? { name, value: cookieValue } : undefined,
  }),
}))

// The routes are gated on FEATURE_LIAP and on same-origin. Both are set here so
// the tests exercise authorization rather than the flag.
const ORIGIN = 'https://www.wisergenerations.com'

beforeEach(async () => {
  const created = await createTestDb()
  db = created.db
  close = created.close
  setDbForTesting(db)
  cookieValue = undefined
  process.env.FEATURE_LIAP = 'true'
  process.env.NEXT_PUBLIC_SITE_URL = ORIGIN
})

afterEach(async () => {
  setDbForTesting(null)
  await close()
  delete process.env.FEATURE_LIAP
})

function request(method: string, body?: unknown): Request {
  return new Request(`${ORIGIN}/api/liap/assessment`, {
    method,
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function routes() {
  return import('@/app/api/liap/assessment/route')
}

/** Signs a customer in by minting a real session. */
async function signIn(customerId: string): Promise<void> {
  const { createSession } = await import('@/lib/auth/session')
  cookieValue = (await createSession({ customerId })).token
}

const ALL_ANSWERS = Object.fromEntries(QUESTIONS.map((q) => [q.key, 4]))

describe('the complete journey', () => {
  it('carries a public visitor from preorder to a results link that works', async () => {
    // --- the preorder, as the Stripe webhook delivers it --------------------
    const fulfilled = await fulfilPreorder({
      email: 'Reader@Example.com',
      name: 'A Reader',
      sourceId: 'cs_journey_1',
      idempotencyKey: 'evt_journey_1:LIAP_ASSESSMENT_ACCESS',
      amount: LIAP_BOOK.amount,
    })

    expect(fulfilled.entitlementCreated).toBe(true)
    expect(await hasEntitlement(fulfilled.customerId, LIAP_ASSESSMENT_ACCESS)).toBe(true)

    // The order and its line item exist, so a refund has something to point at.
    const orders = await db.query<{ status: string; amount: number }>(
      `SELECT status, amount FROM orders WHERE customer_id = $1`,
      [fulfilled.customerId]
    )
    expect(orders[0]!.status).toBe('paid')
    expect(orders[0]!.amount).toBe(LIAP_BOOK.amount)

    // --- the assessment -----------------------------------------------------
    await signIn(fulfilled.customerId)
    const { POST, PATCH, PUT } = await routes()

    const started = await POST(request('POST') as never)
    expect(started.status).toBe(200)
    const { assessmentId, currentStep } = await started.json()
    expect(assessmentId).toBeTruthy()
    expect(currentStep).toBe(1)

    // Step 1: the intake, including free text.
    const saved = await PATCH(
      request('PATCH', {
        assessmentId,
        step: 2,
        intake: { changeType: 'unexpected', area: 'career', urgency: 5 },
        narratives: {
          what_changed: 'My role was eliminated after eleven years.',
          important_decision: 'Whether to take the contract or hold out for permanent.',
          ninety_day_better: 'Working again, and sleeping through the night.',
        },
      }) as never
    )
    expect(saved.status).toBe(200)

    // Resuming returns the same assessment with the saved state.
    const resumed = await (await routes()).POST(request('POST') as never)
    const resumedBody = await resumed.json()
    expect(resumedBody.assessmentId).toBe(assessmentId)
    expect(resumedBody.currentStep).toBe(2)
    expect(resumedBody.intake.changeType).toBe('unexpected')

    // Steps 2–5: the scored answers.
    const answersSaved = await PATCH(
      request('PATCH', { assessmentId, step: 6, answers: ALL_ANSWERS }) as never
    )
    expect(answersSaved.status).toBe(200)

    // --- submission ---------------------------------------------------------
    const submitted = await PUT(request('PUT', { assessmentId }) as never)
    expect(submitted.status).toBe(200)
    const { resultToken } = await submitted.json()
    expect(resultToken).toBeTruthy()

    // --- the report ---------------------------------------------------------
    const found = await findByResultToken(resultToken)
    expect(found!.customerId).toBe(fulfilled.customerId)

    const report = await rebuildReport(found!.id)

    // Every answer was 4, so every dimension is 20 and the total is 160.
    expect(report.total).toBe(160)
    expect(report.position).toBe('move')
    expect(report.positionLabel).toBe('Ready to Move')
    expect(report.scores).toHaveLength(8)
    for (const s of report.scores) expect(s.score).toBe(20)

    // WISER Pivots™ routed, because the change was unexpected at urgency 5.
    expect(report.steady).toBe(true)

    // Exactly three actions, and a three-phase plan.
    expect(report.actions).toHaveLength(3)
    expect(report.actions.map((a) => a.kind)).toEqual(['protect', 'resolve', 'move'])
    expect(report.plan.phases).toHaveLength(3)

    // The customer's own words came back to them.
    const resolve = report.actions[1]!
    expect(resolve.body).toContain('Whether to take the contract')

    // --- the email ----------------------------------------------------------
    const url = `${ORIGIN}/living-is-a-project/results/${resultToken}`
    const html = resultsEmailHtml(report, url)
    const text = resultsEmailText(report, url)

    // Renamed on the owner's 22 August ruling: the Assessment produces a
    // Readiness Report, never a Plan. Life Project Plan™ is reserved for the
    // Retreat outcome, and the two must not blur.
    expect(RESULTS_SUBJECT).toBe('Your Life Project-Ready™ Readiness Report')
    expect(RESULTS_SUBJECT).not.toContain('Plan')
    expect(html).toContain(url)
    expect(html).toContain('Ready to Move')
    expect(text).toContain(url)

    // §23 and §26: the email carries the position and the headlines. It does
    // NOT carry what the person wrote, the affected area or the urgency — an
    // email sits in an inbox for years and gets forwarded.
    for (const leak of [
      'My role was eliminated',
      'Whether to take the contract',
      'sleeping through the night',
      'career',
    ]) {
      expect(html, `html leaked: ${leak}`).not.toContain(leak)
      expect(text, `text leaked: ${leak}`).not.toContain(leak)
    }

    // --- the emailed link returns to the right results ----------------------
    const reopened = await findByResultToken(resultToken)
    expect(reopened!.id).toBe(found!.id)
    expect(reopened!.customerId).toBe(fulfilled.customerId)
  })
})

describe('the same journey, refused at each door', () => {
  it('refuses someone with no session', async () => {
    const { POST } = await routes()
    expect((await POST(request('POST') as never)).status).toBe(404)
  })

  it('refuses a signed-in customer who has not preordered', async () => {
    const id = await seedCustomer(db, 'no.preorder@example.com')
    await signIn(id)
    const { POST } = await routes()
    expect((await POST(request('POST') as never)).status).toBe(404)
  })

  it('refuses a forged session cookie', async () => {
    cookieValue = 'login:attacker@example.com'
    const { POST } = await routes()
    expect((await POST(request('POST') as never)).status).toBe(404)
  })

  it('refuses when the entitlement is revoked mid-assessment', async () => {
    const id = await seedCustomer(db, 'refunded@example.com')
    await grantEntitlement({
      customerId: id,
      entitlementKey: LIAP_ASSESSMENT_ACCESS,
      sourceType: 'order',
      idempotencyKey: 'mid:1',
    })
    await signIn(id)

    const { POST, PATCH } = await routes()
    const started = await POST(request('POST') as never)
    const { assessmentId } = await started.json()
    expect(started.status).toBe(200)

    // The refund lands while they are half way through.
    await revokeEntitlement({
      customerId: id,
      entitlementKey: LIAP_ASSESSMENT_ACCESS,
      reason: 'refund',
    })

    const save = await PATCH(request('PATCH', { assessmentId, answers: { vision_1: 5 } }) as never)
    expect(save.status).toBe(404)
  })

  it('refuses customer A writing to customer B’s assessment', async () => {
    const a = await seedCustomer(db, 'a@example.com')
    const b = await seedCustomer(db, 'b@example.com')
    for (const id of [a, b]) {
      await grantEntitlement({
        customerId: id,
        entitlementKey: LIAP_ASSESSMENT_ACCESS,
        sourceType: 'order',
        idempotencyKey: `own:${id}`,
      })
    }

    // B starts an assessment.
    await signIn(b)
    const { POST, PATCH, PUT } = await routes()
    const bStarted = await POST(request('POST') as never)
    const { assessmentId: bAssessment } = await bStarted.json()

    // A signs in — genuinely entitled — and aims at B's assessment id.
    await signIn(a)
    const write = await PATCH(
      request('PATCH', { assessmentId: bAssessment, answers: { vision_1: 1 } }) as never
    )
    const submit = await PUT(request('PUT', { assessmentId: bAssessment }) as never)

    expect(write.status).toBe(404)
    expect(submit.status).toBe(404)

    // And nothing of A's reached B's record.
    const rows = await db.query<{ n: string }>(
      `SELECT count(*)::text n FROM assessment_responses WHERE assessment_id = $1`,
      [bAssessment]
    )
    expect(rows[0]!.n).toBe('0')
  })

  it('refuses a cross-origin request even with a valid session', async () => {
    const id = await seedCustomer(db, 'csrf@example.com')
    await grantEntitlement({
      customerId: id,
      entitlementKey: LIAP_ASSESSMENT_ACCESS,
      sourceType: 'order',
      idempotencyKey: 'csrf:1',
    })
    await signIn(id)

    const { POST } = await routes()
    const cross = new Request(`${ORIGIN}/api/liap/assessment`, {
      method: 'POST',
      headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
    })
    expect((await POST(cross as never)).status).toBe(403)
  })

  it('refuses everything when the feature flag is off', async () => {
    const id = await seedCustomer(db, 'gated@example.com')
    await grantEntitlement({
      customerId: id,
      entitlementKey: LIAP_ASSESSMENT_ACCESS,
      sourceType: 'order',
      idempotencyKey: 'flag:1',
    })
    await signIn(id)

    delete process.env.FEATURE_LIAP
    const { POST } = await routes()
    expect((await POST(request('POST') as never)).status).toBe(404)
  })
})

import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { isEnabled } from '@/lib/flags'
import { readLiapAccess } from '@/lib/liap/entitlements'
import {
  startOrResume,
  saveProgress,
  submitAssessment,
  loadAssessment,
  type SavePayload,
} from '@/lib/liap/assessment-service'
import { queryOne } from '@/lib/db/client'
import { FINAL_STEP } from '@/lib/liap/assessment/v1'

// ---------------------------------------------------------------------------
// Saving and submitting the assessment. §34.
//
// Every request re-checks the entitlement. Not once at the start of the
// assessment — every time. A session can be revoked and an entitlement can be
// refunded mid-assessment, and "they were entitled when they began" is not the
// question being asked.
//
// Ownership is checked separately from entitlement. A customer with a valid
// LIAP entitlement is still not allowed to write to somebody else's
// assessment, and that is a different check from whether they paid.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 120, windowMs: 10 * 60_000 }

/** 404 for everything. A prober learns nothing about which check failed. */
function deny() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 })
}

type Authorized = { ok: true; customerId: string }
type Refused = { ok: false; response: NextResponse }

async function authorize(req: NextRequest): Promise<Authorized | Refused> {
  if (!isEnabled('LIAP')) return { ok: false, response: deny() }

  const originBlock = checkOrigin(req)
  if (originBlock) return { ok: false, response: originBlock }

  const rateBlock = await rateLimit(req, 'liap-assessment', RATE_LIMIT)
  if (rateBlock) return { ok: false, response: rateBlock }

  const access = await readLiapAccess()
  if (!access || !access.entitled) return { ok: false, response: deny() }

  return { ok: true, customerId: access.session.customerId }
}

/** Confirms this customer owns this assessment. §34, customer A vs customer B. */
async function ownsAssessment(assessmentId: string, customerId: string): Promise<boolean> {
  const row = await queryOne<{ customer_id: string }>(
    `SELECT customer_id FROM assessments WHERE id = $1`,
    [assessmentId]
  )
  return row?.customer_id === customerId
}

/** Starts or resumes, returning the current state for the form to render. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const gate = await authorize(req)
  if (!gate.ok) return gate.response

  try {
    const record = await startOrResume(gate.customerId)
    const loaded = await loadAssessment(record.id)
    return NextResponse.json({
      assessmentId: record.id,
      status: record.status,
      currentStep: record.current_step,
      answers: loaded?.answers ?? {},
      intake: loaded?.intake ?? {},
    })
  } catch (err) {
    console.error('[liap/assessment] start failed:', err)
    return NextResponse.json(
      { error: 'We could not open your assessment. Please try again in a moment.' },
      { status: 503 }
    )
  }
}

/** Saves a step. Called often, so it stays small and idempotent. */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const gate = await authorize(req)
  if (!gate.ok) return gate.response

  let body: { assessmentId?: string } & SavePayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const assessmentId = body.assessmentId
  if (!assessmentId) return NextResponse.json({ error: 'Missing assessment.' }, { status: 400 })
  if (!(await ownsAssessment(assessmentId, gate.customerId))) return deny()

  try {
    await saveProgress(assessmentId, body)
    return NextResponse.json({ ok: true })
  } catch (err) {
    // §35: the customer must get a useful recovery message, and their answers
    // are still in the form. Saying "not saved" lets them retry rather than
    // continuing in the belief that their work is safe.
    console.error('[liap/assessment] save failed:', err)
    return NextResponse.json(
      { error: 'We could not save that step. Your answers are still on screen — please try again.' },
      { status: 503 }
    )
  }
}

/** Submits, scores and returns the result token. */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const gate = await authorize(req)
  if (!gate.ok) return gate.response

  let body: { assessmentId?: string } & SavePayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const assessmentId = body.assessmentId
  if (!assessmentId) return NextResponse.json({ error: 'Missing assessment.' }, { status: 400 })
  if (!(await ownsAssessment(assessmentId, gate.customerId))) return deny()

  try {
    // Save whatever the final step is carrying before scoring it, so a
    // submission never scores a version of the answers one step behind.
    await saveProgress(assessmentId, { ...body, step: FINAL_STEP })

    const result = await submitAssessment(assessmentId)
    if (!result) return deny()

    if (result.alreadyCompleted) {
      // §34, duplicate submission. The first result stands; a second token
      // would invalidate the link already sitting in the customer's inbox.
      return NextResponse.json({ ok: true, alreadyCompleted: true })
    }

    return NextResponse.json({ ok: true, resultToken: result.resultToken })
  } catch (err) {
    console.error('[liap/assessment] submit failed:', err)
    return NextResponse.json(
      { error: 'We could not score your assessment. Your answers are saved — please try again.' },
      { status: 503 }
    )
  }
}

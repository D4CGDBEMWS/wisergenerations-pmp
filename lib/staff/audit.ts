import { getDb } from '@/lib/db/client'
import type { StaffSession } from '@/lib/staff/session'

// ---------------------------------------------------------------------------
// The staff action log.
//
// Every privileged action writes a row naming the person who took it. Not
// negotiable for anything with money or access attached: when somebody asks
// in eighteen months who approved a particular registration, this is the only
// thing that answers.
//
// Separate from lib/audit.ts because the questions differ. audit_events
// records what happened TO a customer; this records what a member of staff
// DID. Different reader, different retention, different shape.
//
// The same allow-list discipline applies, and for a sharper reason here: a
// staff note about why an applicant was declined is an opinion about a real
// person, readable by them under access-request law, and it has no business
// in an audit row. Only scalars from the list below survive.
// ---------------------------------------------------------------------------

const ALLOWED_DETAIL_KEYS = new Set([
  'from_status',
  'to_status',
  'role',
  'permission',
  'inquiry_type',
  'partner_type',
  'referral_code',
  'campaign',
  'amount',
  'count',
  'reason_code',
])

export type StaffAction =
  | 'staff.signed_in'
  | 'staff.signed_out'
  | 'staff.enrolled_authenticator'
  | 'staff.second_factor_failed'
  | 'staff.invited'
  | 'staff.suspended'
  | 'staff.role_changed'
  | 'lead.status_changed'
  | 'partner.created'
  | 'partner.updated'
  | 'goal.set'
  | 'inkind.recorded'

function clean(detail: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(detail)) {
    if (!ALLOWED_DETAIL_KEYS.has(key)) continue
    if (value === null || value === undefined) continue
    if (typeof value === 'string') out[key] = value.slice(0, 120)
    else if (typeof value === 'number' || typeof value === 'boolean') out[key] = value
  }
  return out
}

/**
 * Records what a staff member did.
 *
 * actor_email is stored alongside the id deliberately: if the account is
 * later deleted the foreign key goes null, and an audit trail that says
 * "somebody who no longer exists approved this" has failed at its only job.
 *
 * Never throws. A logging failure must not roll back the action it describes
 * — but it is logged loudly, because a gap in this table is a real problem.
 */
export async function recordStaffAction(input: {
  actor: Pick<StaffSession, 'staffUserId' | 'email'>
  action: StaffAction
  subjectType?: string | null
  subjectId?: string | null
  detail?: Record<string, unknown>
}): Promise<void> {
  try {
    await getDb().query(
      `INSERT INTO staff_actions
         (staff_user_id, actor_email, action, subject_type, subject_id, detail)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        input.actor.staffUserId,
        input.actor.email,
        input.action,
        input.subjectType ?? null,
        input.subjectId ?? null,
        JSON.stringify(clean(input.detail ?? {})),
      ]
    )
  } catch (err) {
    console.error('[staff/audit] FAILED to record', input.action, err)
  }
}

/** What a staff member did, most recent first. For the accountability view. */
export async function actionsByStaff(staffUserId: string, limit = 100) {
  return getDb().query(
    `SELECT action, subject_type, subject_id, detail, occurred_at
       FROM staff_actions
      WHERE staff_user_id = $1
      ORDER BY occurred_at DESC
      LIMIT $2`,
    [staffUserId, limit]
  )
}

/** Everything that happened to one subject. "Who approved this, and when?" */
export async function actionsOnSubject(subjectType: string, subjectId: string) {
  return getDb().query(
    `SELECT actor_email, action, detail, occurred_at
       FROM staff_actions
      WHERE subject_type = $1 AND subject_id = $2
      ORDER BY occurred_at DESC`,
    [subjectType, subjectId]
  )
}

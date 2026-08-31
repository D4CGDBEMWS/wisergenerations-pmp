import { getDb, isDbConfigured, queryOne } from '@/lib/db/client'
import { recordAuditEvent } from '@/lib/audit'

// ---------------------------------------------------------------------------
// LIAP facilitation authority.
//
// ── THE PRINCIPLE THIS FILE EXISTS TO ENFORCE ──────────────────────────────
//
// Certification is permission to steward an authorized LIAP experience. It is
// not ownership, it is not permanent, and it is not portable to a Retreat
// somebody was not assigned to.
//
// ── CLEARANCE IS COMPUTED, NEVER STORED ────────────────────────────────────
//
// There is deliberately no `cleared` column anywhere in the schema. Clearance
// is derived at check time from four current facts:
//
//   certified, and not suspended or expired
//   + assigned to THIS Retreat
//   + spiritual preparation confirmed for THIS Retreat
//
// A stored boolean would be a snapshot of an answer that has since changed.
// Suspend a facilitator an hour before a Retreat and a stored flag still says
// yes until somebody remembers to clear it; a computed check says no on the
// very next request. The difference is the whole reason for the design.
//
// ── TRAINER IS NOT A FACILITATOR STATE ─────────────────────────────────────
//
// Nothing in `facilitator_profiles` can make somebody a trainer. Trainer and
// admin authority live in `liap_authorities` as separate grants, so there is
// no column a facilitator could reach that would promote them. `isTrainer`
// does not consult the facilitator profile at all.
//
// ── EVERY GRANT NAMES AN ACTOR, AND CHECKS THEM ────────────────────────────
//
// No function here takes a role from a caller and believes it. Each one is
// given an ACTOR id and looks that actor's authority up itself. A request
// body claiming `role: "trainer"` reaches nothing: there is no parameter to
// put it in.
// ---------------------------------------------------------------------------

export type FacilitatorState =
  | 'not_eligible'
  | 'eligible'
  | 'in_training'
  | 'training_completed'
  | 'observation_pending'
  | 'certified'
  | 'suspended'
  | 'expired'

export type LiapAuthority = 'trainer' | 'admin'

/** Why a clearance check failed. INTERNAL — never shown to a participant. */
export type ClearanceReason =
  | 'cleared'
  | 'no_database'
  | 'not_certified'
  | 'certification_expired'
  | 'not_assigned'
  | 'preparation_not_confirmed'

export interface Clearance {
  cleared: boolean
  /** For logs and facilitator-facing support only. Not for public responses. */
  reason: ClearanceReason
}

// ── READS ──────────────────────────────────────────────────────────────────

/**
 * Has this person completed an LIAP Retreat as a participant?
 *
 * The prerequisite for facilitator eligibility. Enrolment is not completion:
 * this requires `completed_at`, which the schema will not accept without a
 * `confirmed_by` — so a completion always names the authorized person who
 * confirmed it, and self-attestation cannot produce one.
 */
export async function hasCompletedRetreat(customerId: string): Promise<boolean> {
  if (!isDbConfigured()) return false
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM retreat_participants
      WHERE customer_id = $1 AND completed_at IS NOT NULL AND confirmed_by IS NOT NULL
      LIMIT 1`,
    [customerId]
  )
  return row !== null
}

export async function facilitatorState(customerId: string): Promise<FacilitatorState> {
  if (!isDbConfigured()) return 'not_eligible'
  const row = await queryOne<{ state: FacilitatorState; expires_at: string | null }>(
    `SELECT state, expires_at FROM facilitator_profiles WHERE customer_id = $1`,
    [customerId]
  )
  if (!row) return 'not_eligible'
  // Expiry is read as a fact about now, not as a state somebody remembered to
  // write. A certification that lapsed last night is expired this morning
  // whether or not a job ran.
  if (row.state === 'certified' && row.expires_at && new Date(row.expires_at) <= new Date()) {
    return 'expired'
  }
  return row.state
}

/** Certified, and currently in force. */
export async function isActiveCertifiedFacilitator(customerId: string): Promise<boolean> {
  return (await facilitatorState(customerId)) === 'certified'
}

/**
 * Trainer/Certifier authority.
 *
 * Reads `liap_authorities` ONLY. It never looks at the facilitator profile,
 * so no facilitator state — including 'certified' — can imply this.
 */
export async function isTrainer(customerId: string): Promise<boolean> {
  return holdsAuthority(customerId, 'trainer')
}

export async function isAdmin(customerId: string): Promise<boolean> {
  return holdsAuthority(customerId, 'admin')
}

async function holdsAuthority(customerId: string, authority: LiapAuthority): Promise<boolean> {
  if (!isDbConfigured()) return false
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM liap_authorities
      WHERE customer_id = $1 AND authority = $2 AND revoked_at IS NULL
      LIMIT 1`,
    [customerId, authority]
  )
  return row !== null
}

export async function isAssignedToRetreat(
  customerId: string,
  retreatId: string
): Promise<boolean> {
  if (!isDbConfigured()) return false
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM retreat_assignments
      WHERE facilitator_id = $1 AND retreat_id = $2 AND unassigned_at IS NULL
      LIMIT 1`,
    [customerId, retreatId]
  )
  return row !== null
}

/**
 * Has the facilitator confirmed the required preparation for THIS Retreat?
 *
 * Per Retreat, never once and for all. Reads only the boolean and the
 * timestamp, because that is all the table holds.
 */
export async function preparationConfirmed(
  customerId: string,
  retreatId: string
): Promise<boolean> {
  if (!isDbConfigured()) return false
  const row = await queryOne<{ confirmed: boolean }>(
    `SELECT confirmed FROM retreat_preparation_confirmations
      WHERE facilitator_id = $1 AND retreat_id = $2`,
    [customerId, retreatId]
  )
  return row?.confirmed === true
}

// ── THE CHECK EVERY FACILITATOR SURFACE MUST CALL ──────────────────────────

/**
 * May this person facilitate THIS Retreat, right now?
 *
 * Fails closed at every step, including when the database is unreachable: an
 * authorization question that cannot be answered is answered "no". The four
 * facts are checked in the order that makes the cheapest disqualification
 * first, but every one of them is required.
 */
export async function facilitationClearance(
  customerId: string,
  retreatId: string
): Promise<Clearance> {
  if (!isDbConfigured()) return { cleared: false, reason: 'no_database' }

  const state = await facilitatorState(customerId)
  if (state === 'expired') return { cleared: false, reason: 'certification_expired' }
  if (state !== 'certified') return { cleared: false, reason: 'not_certified' }

  if (!(await isAssignedToRetreat(customerId, retreatId))) {
    return { cleared: false, reason: 'not_assigned' }
  }
  if (!(await preparationConfirmed(customerId, retreatId))) {
    return { cleared: false, reason: 'preparation_not_confirmed' }
  }
  return { cleared: true, reason: 'cleared' }
}

/**
 * The guard a facilitator route calls before returning ANY protected content.
 *
 * Returns a boolean rather than throwing, so a route can render its own 404
 * and reveal nothing about why. A participant who probes a Retreat id must
 * not be able to tell "not assigned" from "does not exist" — so callers are
 * expected to 404 on false, not to surface `reason`.
 */
export async function mayReceiveFacilitatorContent(
  customerId: string | null | undefined,
  retreatId: string | null | undefined
): Promise<boolean> {
  if (!customerId || !retreatId) return false
  return (await facilitationClearance(customerId, retreatId)).cleared
}

/** Trainer-only material. Separate check, separate authority. */
export async function mayReceiveTrainerContent(
  customerId: string | null | undefined
): Promise<boolean> {
  if (!customerId) return false
  return (await isTrainer(customerId)) || (await isAdmin(customerId))
}

// ── WRITES, EACH WITH ITS OWN AUTHORITY CHECK ──────────────────────────────

export interface AuthorityResult {
  ok: boolean
  reason?: string
}

/**
 * Confirm that somebody completed a Retreat.
 *
 * The actor must hold real authority and must not be the participant. Both
 * halves matter: without the first anybody could confirm, and without the
 * second a candidate could confirm their own attendance and satisfy the
 * experience-before-facilitation rule by themselves.
 */
export async function confirmRetreatCompletion(input: {
  retreatId: string
  customerId: string
  actorId: string
}): Promise<AuthorityResult> {
  if (!isDbConfigured()) return { ok: false, reason: 'no_database' }
  if (input.actorId === input.customerId) {
    return { ok: false, reason: 'self_confirmation_forbidden' }
  }
  const authorised =
    (await isAdmin(input.actorId)) ||
    (await isTrainer(input.actorId)) ||
    (await isActiveCertifiedFacilitator(input.actorId))
  if (!authorised) return { ok: false, reason: 'actor_not_authorised' }

  await getDb().query(
    `UPDATE retreat_participants
        SET completed_at = now(), confirmed_by = $3
      WHERE retreat_id = $1 AND customer_id = $2`,
    [input.retreatId, input.customerId, input.actorId]
  )
  await recordAuditEvent({
    eventType: 'liap.retreat_completion_confirmed',
    customerId: input.customerId,
    actor: input.actorId,
    metadata: { retreat_id: input.retreatId },
  })
  return { ok: true }
}

/**
 * Certify a facilitator.
 *
 * Three gates, and all three are required:
 *
 *   1. The actor holds TRAINER or ADMIN authority. A certified facilitator
 *      does not qualify — certification is permission to facilitate, never
 *      permission to certify.
 *   2. The actor is not the subject. Nobody certifies themselves, including
 *      a trainer.
 *   3. The subject has completed a Retreat as a participant. The
 *      experience-before-facilitation rule, enforced here rather than trusted.
 */
export async function grantFacilitatorCertification(input: {
  subjectId: string
  actorId: string
  expiresAt?: Date | null
}): Promise<AuthorityResult> {
  if (!isDbConfigured()) return { ok: false, reason: 'no_database' }
  if (input.actorId === input.subjectId) {
    return { ok: false, reason: 'self_certification_forbidden' }
  }
  const authorised = (await isAdmin(input.actorId)) || (await isTrainer(input.actorId))
  if (!authorised) return { ok: false, reason: 'trainer_authority_required' }

  if (!(await hasCompletedRetreat(input.subjectId))) {
    return { ok: false, reason: 'retreat_completion_required' }
  }

  await getDb().query(
    `INSERT INTO facilitator_profiles (customer_id, state, certified_at, certified_by, expires_at)
     VALUES ($1, 'certified', now(), $2, $3)
     ON CONFLICT (customer_id) DO UPDATE
       SET state = 'certified',
           certified_at = now(),
           certified_by = EXCLUDED.certified_by,
           expires_at = EXCLUDED.expires_at,
           updated_at = now()`,
    [input.subjectId, input.actorId, input.expiresAt ?? null]
  )
  await recordAuditEvent({
    eventType: 'liap.facilitator_certification_granted',
    customerId: input.subjectId,
    actor: input.actorId,
    metadata: { result: 'granted' },
  })
  return { ok: true }
}

/** Suspend or revoke a certification. History is kept; access is not. */
export async function setFacilitatorState(input: {
  subjectId: string
  actorId: string
  state: Extract<FacilitatorState, 'suspended' | 'expired' | 'eligible' | 'in_training' | 'training_completed' | 'observation_pending' | 'not_eligible'>
}): Promise<AuthorityResult> {
  if (!isDbConfigured()) return { ok: false, reason: 'no_database' }
  const authorised = (await isAdmin(input.actorId)) || (await isTrainer(input.actorId))
  if (!authorised) return { ok: false, reason: 'trainer_authority_required' }

  await getDb().query(
    `INSERT INTO facilitator_profiles (customer_id, state)
     VALUES ($1, $2)
     ON CONFLICT (customer_id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
    [input.subjectId, input.state]
  )
  await recordAuditEvent({
    eventType:
      input.state === 'suspended'
        ? 'liap.facilitator_certification_suspended'
        : 'liap.facilitator_certification_revoked',
    customerId: input.subjectId,
    actor: input.actorId,
    metadata: { result: input.state },
  })
  return { ok: true }
}

/**
 * Grant Trainer/Certifier authority.
 *
 * ADMIN ONLY, and never to oneself. A trainer cannot mint another trainer,
 * and cannot mint an admin — `authority` is not a parameter, so there is no
 * value a caller could pass to escalate. Promotion to admin is not something
 * this module can do at all.
 */
export async function grantTrainerAuthority(input: {
  subjectId: string
  actorId: string
}): Promise<AuthorityResult> {
  if (!isDbConfigured()) return { ok: false, reason: 'no_database' }
  if (input.actorId === input.subjectId) {
    return { ok: false, reason: 'self_promotion_forbidden' }
  }
  if (!(await isAdmin(input.actorId))) return { ok: false, reason: 'admin_authority_required' }

  await getDb().query(
    `INSERT INTO liap_authorities (customer_id, authority, granted_by)
     VALUES ($1, 'trainer', $2)
     ON CONFLICT DO NOTHING`,
    [input.subjectId, input.actorId]
  )
  await recordAuditEvent({
    eventType: 'liap.trainer_authority_granted',
    customerId: input.subjectId,
    actor: input.actorId,
    metadata: { result: 'granted' },
  })
  return { ok: true }
}

/** Revoke trainer authority. Independent of facilitator certification. */
export async function revokeTrainerAuthority(input: {
  subjectId: string
  actorId: string
}): Promise<AuthorityResult> {
  if (!isDbConfigured()) return { ok: false, reason: 'no_database' }
  if (!(await isAdmin(input.actorId))) return { ok: false, reason: 'admin_authority_required' }

  await getDb().query(
    `UPDATE liap_authorities SET revoked_at = now()
      WHERE customer_id = $1 AND authority = 'trainer' AND revoked_at IS NULL`,
    [input.subjectId]
  )
  await recordAuditEvent({
    eventType: 'liap.trainer_authority_revoked',
    customerId: input.subjectId,
    actor: input.actorId,
    metadata: { result: 'revoked' },
  })
  return { ok: true }
}

/** Assign a facilitator to a specific Retreat. Trainer or admin only. */
export async function assignFacilitatorToRetreat(input: {
  retreatId: string
  facilitatorId: string
  actorId: string
}): Promise<AuthorityResult> {
  if (!isDbConfigured()) return { ok: false, reason: 'no_database' }
  const authorised = (await isAdmin(input.actorId)) || (await isTrainer(input.actorId))
  if (!authorised) return { ok: false, reason: 'trainer_authority_required' }

  await getDb().query(
    `INSERT INTO retreat_assignments (retreat_id, facilitator_id, assigned_by)
     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
    [input.retreatId, input.facilitatorId, input.actorId]
  )
  await recordAuditEvent({
    eventType: 'liap.retreat_facilitator_assigned',
    customerId: input.facilitatorId,
    actor: input.actorId,
    metadata: { retreat_id: input.retreatId },
  })
  return { ok: true }
}

export async function unassignFacilitatorFromRetreat(input: {
  retreatId: string
  facilitatorId: string
  actorId: string
}): Promise<AuthorityResult> {
  if (!isDbConfigured()) return { ok: false, reason: 'no_database' }
  const authorised = (await isAdmin(input.actorId)) || (await isTrainer(input.actorId))
  if (!authorised) return { ok: false, reason: 'trainer_authority_required' }

  await getDb().query(
    `UPDATE retreat_assignments SET unassigned_at = now()
      WHERE retreat_id = $1 AND facilitator_id = $2 AND unassigned_at IS NULL`,
    [input.retreatId, input.facilitatorId]
  )
  await recordAuditEvent({
    eventType: 'liap.retreat_facilitator_unassigned',
    customerId: input.facilitatorId,
    actor: input.actorId,
    metadata: { retreat_id: input.retreatId },
  })
  return { ok: true }
}

/**
 * The facilitator confirms their own required preparation for one Retreat.
 *
 * Self-confirmed, per the owner's decision — and it records only that the
 * confirmation happened. There is no parameter for what was fasted, how long,
 * or what was prayed, because the table has no column for it and this
 * function offers no way to supply it. The audit event says the same and no
 * more.
 *
 * The facilitator must be assigned to the Retreat: confirming preparation for
 * a Retreat you are not on is not a meaningful act.
 */
export async function confirmSpiritualPreparation(input: {
  retreatId: string
  facilitatorId: string
}): Promise<AuthorityResult> {
  if (!isDbConfigured()) return { ok: false, reason: 'no_database' }
  if (!(await isAssignedToRetreat(input.facilitatorId, input.retreatId))) {
    return { ok: false, reason: 'not_assigned' }
  }

  await getDb().query(
    `INSERT INTO retreat_preparation_confirmations (retreat_id, facilitator_id, confirmed)
     VALUES ($1, $2, true)
     ON CONFLICT (retreat_id, facilitator_id) DO UPDATE
       SET confirmed = true, confirmed_at = now()`,
    [input.retreatId, input.facilitatorId]
  )
  await recordAuditEvent({
    eventType: 'liap.retreat_preparation_confirmed',
    customerId: input.facilitatorId,
    metadata: { retreat_id: input.retreatId },
  })
  return { ok: true }
}

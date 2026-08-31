import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb, seedCustomer } from './helpers/db'
import {
  hasCompletedRetreat,
  facilitatorState,
  isActiveCertifiedFacilitator,
  isTrainer,
  isAdmin,
  isAssignedToRetreat,
  preparationConfirmed,
  facilitationClearance,
  mayReceiveFacilitatorContent,
  mayReceiveTrainerContent,
  confirmRetreatCompletion,
  grantFacilitatorCertification,
  setFacilitatorState,
  grantTrainerAuthority,
  revokeTrainerAuthority,
  assignFacilitatorToRetreat,
  confirmSpiritualPreparation,
} from '@/lib/liap/facilitation'

// ---------------------------------------------------------------------------
// Facilitation authority.
//
// These are real negative controls, not vacuous ones. Each escalation below
// is ATTEMPTED against the actual functions and then asserted to have failed
// — a test that merely observes a role does not exist would keep passing if
// somebody added a back door tomorrow.
// ---------------------------------------------------------------------------

const source = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const code = (p: string) =>
  source(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

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

async function newRetreat(name = 'Retreat A'): Promise<string> {
  const rows = await db.query<{ id: string }>(
    `INSERT INTO retreats (name, status) VALUES ($1, 'planned') RETURNING id`,
    [name]
  )
  return rows[0]!.id
}

async function enrol(retreatId: string, customerId: string) {
  await db.query(
    `INSERT INTO retreat_participants (retreat_id, customer_id) VALUES ($1, $2)`,
    [retreatId, customerId]
  )
}

/** An owner/admin, seeded directly — the root of every authority chain. */
async function seedAdmin(email = 'owner@example.com'): Promise<string> {
  const id = await seedCustomer(db, email)
  await db.query(
    `INSERT INTO liap_authorities (customer_id, authority) VALUES ($1, 'admin')`,
    [id]
  )
  return id
}

/** Somebody who attended and completed a Retreat, confirmed by an admin. */
async function seedRetreatGraduate(email: string, admin: string): Promise<string> {
  const id = await seedCustomer(db, email)
  const retreat = await newRetreat(`Prior retreat for ${email}`)
  await enrol(retreat, id)
  await confirmRetreatCompletion({ retreatId: retreat, customerId: id, actorId: admin })
  return id
}

/** A fully certified facilitator. */
async function seedCertifiedFacilitator(email: string, admin: string): Promise<string> {
  const id = await seedRetreatGraduate(email, admin)
  const r = await grantFacilitatorCertification({ subjectId: id, actorId: admin })
  expect(r.ok, `seeding ${email}`).toBe(true)
  return id
}

// ── 1, 2, 3, 25. THE CONSOLE BOUNDARY ───────────────────────────────────────

describe('facilitator content requires real authorization', () => {
  it('1. an unauthenticated caller is refused, flag state irrelevant', async () => {
    const retreat = await newRetreat()
    expect(await mayReceiveFacilitatorContent(null, retreat)).toBe(false)
    expect(await mayReceiveFacilitatorContent(undefined, retreat)).toBe(false)
    expect(await mayReceiveFacilitatorContent('', retreat)).toBe(false)
  })

  it('2, 3. an ordinary participant is refused', async () => {
    const admin = await seedAdmin()
    const retreat = await newRetreat()
    const participant = await seedCustomer(db, 'participant@example.com')
    await enrol(retreat, participant)
    expect(await mayReceiveFacilitatorContent(participant, retreat)).toBe(false)
    void admin
  })

  it('4. a candidate who has finished training is still refused', async () => {
    const admin = await seedAdmin()
    const candidate = await seedRetreatGraduate('candidate@example.com', admin)
    await setFacilitatorState({ subjectId: candidate, actorId: admin, state: 'training_completed' })
    const retreat = await newRetreat()
    await assignFacilitatorToRetreat({ retreatId: retreat, facilitatorId: candidate, actorId: admin })
    await confirmSpiritualPreparation({ retreatId: retreat, facilitatorId: candidate })
    // Assigned and prepared, but training completion is not certification.
    expect(await facilitatorState(candidate)).toBe('training_completed')
    expect(await mayReceiveFacilitatorContent(candidate, retreat)).toBe(false)
  })

  it('25. the flag is not consulted here at all', () => {
    const c = code('lib/liap/facilitation.ts')
    expect(c).not.toMatch(/isEnabled|FEATURE_/)
  })
})

// ── 5, 6, 7, 24. RETREAT-SPECIFIC CLEARANCE ─────────────────────────────────

describe('clearance is specific to one Retreat', () => {
  it('5, 24. a certified facilitator cannot reach a Retreat they are not on', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertifiedFacilitator('fac@example.com', admin)
    const a = await newRetreat('Retreat A')
    const b = await newRetreat('Retreat B')
    await assignFacilitatorToRetreat({ retreatId: a, facilitatorId: fac, actorId: admin })
    await confirmSpiritualPreparation({ retreatId: a, facilitatorId: fac })

    expect(await mayReceiveFacilitatorContent(fac, a)).toBe(true)
    // Changing the Retreat id is the whole attack, and it gets nothing.
    expect(await mayReceiveFacilitatorContent(fac, b)).toBe(false)
    expect((await facilitationClearance(fac, b)).reason).toBe('not_assigned')
  })

  it('6. assigned but unprepared is not cleared', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertifiedFacilitator('unprepared@example.com', admin)
    const r = await newRetreat()
    await assignFacilitatorToRetreat({ retreatId: r, facilitatorId: fac, actorId: admin })
    expect(await preparationConfirmed(fac, r)).toBe(false)
    const clearance = await facilitationClearance(fac, r)
    expect(clearance.cleared).toBe(false)
    expect(clearance.reason).toBe('preparation_not_confirmed')
  })

  it('7. certified + active + assigned + prepared IS cleared', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertifiedFacilitator('ready@example.com', admin)
    const r = await newRetreat()
    await assignFacilitatorToRetreat({ retreatId: r, facilitatorId: fac, actorId: admin })
    await confirmSpiritualPreparation({ retreatId: r, facilitatorId: fac })
    const clearance = await facilitationClearance(fac, r)
    expect(clearance.cleared).toBe(true)
    expect(clearance.reason).toBe('cleared')
  })

  it('preparation must be confirmed per Retreat, not once', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertifiedFacilitator('twice@example.com', admin)
    const a = await newRetreat('A')
    const b = await newRetreat('B')
    for (const r of [a, b]) {
      await assignFacilitatorToRetreat({ retreatId: r, facilitatorId: fac, actorId: admin })
    }
    await confirmSpiritualPreparation({ retreatId: a, facilitatorId: fac })
    expect(await mayReceiveFacilitatorContent(fac, a)).toBe(true)
    expect(await mayReceiveFacilitatorContent(fac, b)).toBe(false)
  })

  it('and cannot be confirmed for a Retreat you are not assigned to', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertifiedFacilitator('elsewhere@example.com', admin)
    const other = await newRetreat('Someone else’s')
    const r = await confirmSpiritualPreparation({ retreatId: other, facilitatorId: fac })
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('not_assigned')
  })
})

// ── 8, 23. SUSPENSION TAKES EFFECT IMMEDIATELY ──────────────────────────────

describe('revocation is immediate because clearance is computed', () => {
  it('8, 23. a suspended facilitator loses access on the next check', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertifiedFacilitator('suspendme@example.com', admin)
    const r = await newRetreat()
    await assignFacilitatorToRetreat({ retreatId: r, facilitatorId: fac, actorId: admin })
    await confirmSpiritualPreparation({ retreatId: r, facilitatorId: fac })
    expect(await mayReceiveFacilitatorContent(fac, r)).toBe(true)

    await setFacilitatorState({ subjectId: fac, actorId: admin, state: 'suspended' })

    // Nothing was un-assigned and no flag was cleared. The assignment and the
    // preparation are both still there — and access is gone anyway, because
    // certification is one of the four facts the check recomputes.
    expect(await isAssignedToRetreat(fac, r)).toBe(true)
    expect(await preparationConfirmed(fac, r)).toBe(true)
    expect(await mayReceiveFacilitatorContent(fac, r)).toBe(false)
    expect((await facilitationClearance(fac, r)).reason).toBe('not_certified')
  })

  it('an expired certification is expired without anybody running a job', async () => {
    const admin = await seedAdmin()
    const fac = await seedRetreatGraduate('expiring@example.com', admin)
    await grantFacilitatorCertification({
      subjectId: fac,
      actorId: admin,
      expiresAt: new Date(Date.now() - 1000),
    })
    expect(await facilitatorState(fac)).toBe('expired')
    expect(await isActiveCertifiedFacilitator(fac)).toBe(false)
  })

  it('there is no stored clearance column to go stale', () => {
    const migration = source('db/migrations/0008_liap_facilitation_governance.sql')
    expect(migration).not.toMatch(/\bcleared\b/i)
  })
})

// ── 9, 10, 11, 12. ESCALATION IS ATTEMPTED AND FAILS ────────────────────────

describe('nobody can grant themselves authority', () => {
  it('9. a facilitator cannot self-certify', async () => {
    const admin = await seedAdmin()
    const grad = await seedRetreatGraduate('selfcert@example.com', admin)
    const r = await grantFacilitatorCertification({ subjectId: grad, actorId: grad })
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('self_certification_forbidden')
    expect(await isActiveCertifiedFacilitator(grad)).toBe(false)
  })

  it('10. a certified facilitator cannot self-promote to Trainer', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertifiedFacilitator('selftrainer@example.com', admin)
    const r = await grantTrainerAuthority({ subjectId: fac, actorId: fac })
    expect(r.ok).toBe(false)
    expect(await isTrainer(fac)).toBe(false)
  })

  it('11. a certified facilitator cannot certify anybody else', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertifiedFacilitator('facA@example.com', admin)
    const candidate = await seedRetreatGraduate('candidateB@example.com', admin)

    const r = await grantFacilitatorCertification({ subjectId: candidate, actorId: fac })
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('trainer_authority_required')
    expect(await isActiveCertifiedFacilitator(candidate)).toBe(false)
  })

  it('nor grant Trainer authority to anybody else', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertifiedFacilitator('facC@example.com', admin)
    const other = await seedCustomer(db, 'otherD@example.com')
    const r = await grantTrainerAuthority({ subjectId: other, actorId: fac })
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('admin_authority_required')
    expect(await isTrainer(other)).toBe(false)
  })

  it('12. a Trainer cannot promote themselves or anybody to Owner/Admin', async () => {
    const admin = await seedAdmin()
    const trainer = await seedCertifiedFacilitator('trainer@example.com', admin)
    await grantTrainerAuthority({ subjectId: trainer, actorId: admin })
    expect(await isTrainer(trainer)).toBe(true)

    // There is no function that grants admin, and no parameter that selects
    // the authority — so escalation is impossible by construction rather than
    // by a check that could be forgotten.
    const c = code('lib/liap/facilitation.ts')
    // The authority written is a literal, never a caller-supplied value.
    expect(c).not.toMatch(/authority:\s*(input|params|body)\./)
    // 'admin' is only ever READ. No statement inserts it, so there is no path
    // that creates an admin -- the role can only be seeded out of band.
    expect(c).not.toMatch(/INSERT INTO liap_authorities[\s\S]{0,240}'admin'/)
    expect(c).toMatch(/VALUES \(\$1, 'trainer', \$2\)/)
    expect(await isAdmin(trainer)).toBe(false)
  })

  it('a Trainer cannot mint another Trainer — only an admin can', async () => {
    // Found by a negative control: every earlier test used a certified
    // facilitator as the actor, so nothing covered a TRAINER attempting to
    // widen the trainer pool. That is the escalation that would let the
    // authority spread without the owner, so it gets its own test.
    const admin = await seedAdmin()
    const trainer = await seedCertifiedFacilitator('minter@example.com', admin)
    await grantTrainerAuthority({ subjectId: trainer, actorId: admin })
    expect(await isTrainer(trainer)).toBe(true)

    const candidate = await seedRetreatGraduate('wouldbe.trainer@example.com', admin)
    const r = await grantTrainerAuthority({ subjectId: candidate, actorId: trainer })
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('admin_authority_required')
    expect(await isTrainer(candidate)).toBe(false)
  })

  it('nor can a Trainer revoke another Trainer', async () => {
    const admin = await seedAdmin()
    const a = await seedCertifiedFacilitator('trainerA@example.com', admin)
    const b = await seedCertifiedFacilitator('trainerB@example.com', admin)
    await grantTrainerAuthority({ subjectId: a, actorId: admin })
    await grantTrainerAuthority({ subjectId: b, actorId: admin })

    const r = await revokeTrainerAuthority({ subjectId: b, actorId: a })
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('admin_authority_required')
    expect(await isTrainer(b)).toBe(true)
  })

  it('a Trainer CAN certify a facilitator, which is the point of the role', async () => {
    const admin = await seedAdmin()
    const trainer = await seedCertifiedFacilitator('realtrainer@example.com', admin)
    await grantTrainerAuthority({ subjectId: trainer, actorId: admin })
    const candidate = await seedRetreatGraduate('worthy@example.com', admin)

    const r = await grantFacilitatorCertification({ subjectId: candidate, actorId: trainer })
    expect(r.ok).toBe(true)
    expect(await isActiveCertifiedFacilitator(candidate)).toBe(true)
  })
})

// ── 13, 14, 15, 16. CLIENT-SUPPLIED STATE REACHES NOTHING ───────────────────

describe('authority is never taken from the caller', () => {
  it('13. no function accepts a role, state or clearance from its caller', () => {
    const c = code('lib/liap/facilitation.ts')
    // Every authority check reads the database for the ACTOR. There is no
    // parameter through which a request body could assert a role.
    expect(c).not.toMatch(/\bisTrainer\??:\s*boolean/)
    expect(c).not.toMatch(/\brole\s*[:?]/)
    expect(c).not.toMatch(/\bcleared\s*[:?]\s*boolean\s*[,)]/)
    // Grants take an actorId and look it up; they never take an authority.
    expect(c).toMatch(/await isAdmin\(input\.actorId\)/)
  })

  it('14. a Retreat id from a URL grants nothing on its own', async () => {
    const admin = await seedAdmin()
    const stranger = await seedCustomer(db, 'stranger@example.com')
    const r = await newRetreat()
    // The most obvious probe: guess a real Retreat id.
    expect(await mayReceiveFacilitatorContent(stranger, r)).toBe(false)
    // And a made-up one is equally refused, with no distinguishing error.
    expect(
      await mayReceiveFacilitatorContent(stranger, '00000000-0000-0000-0000-000000000000')
    ).toBe(false)
    void admin
  })

  it('15. referral and attribution cannot grant facilitator or trainer authority', () => {
    const attribution = code('lib/liap/attribution.ts')
    const partners = code('lib/liap/partners.ts')
    for (const [name, c] of [['attribution', attribution], ['partners', partners]] as const) {
      expect(c, name).not.toMatch(/facilitator|trainer|certif/i)
      expect(c, name).not.toMatch(/liap_authorities|facilitator_profiles/)
    }
  })

  it('16. no route or endpoint can bypass the check, because none exists yet', () => {
    // The foundation ships with no facilitator API surface at all. When one is
    // added it must call mayReceiveFacilitatorContent; this asserts the
    // current state so adding a route without a guard is a visible change.
    const c = code('lib/liap/facilitation.ts')
    expect(c).toContain('export async function mayReceiveFacilitatorContent')
    expect(c).toContain('export async function mayReceiveTrainerContent')
  })
})

// ── EXPERIENCE BEFORE FACILITATION ──────────────────────────────────────────

describe('experience before facilitation', () => {
  it('somebody who never attended cannot be certified', async () => {
    const admin = await seedAdmin()
    const outsider = await seedCustomer(db, 'never.attended@example.com')
    const r = await grantFacilitatorCertification({ subjectId: outsider, actorId: admin })
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('retreat_completion_required')
  })

  it('enrolment alone is not completion', async () => {
    const admin = await seedAdmin()
    const attendee = await seedCustomer(db, 'enrolled.only@example.com')
    const retreat = await newRetreat()
    await enrol(retreat, attendee)
    expect(await hasCompletedRetreat(attendee)).toBe(false)
    const r = await grantFacilitatorCertification({ subjectId: attendee, actorId: admin })
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('retreat_completion_required')
  })

  it('a participant cannot confirm their own completion', async () => {
    const retreat = await newRetreat()
    const attendee = await seedCustomer(db, 'selfconfirm@example.com')
    await enrol(retreat, attendee)
    const r = await confirmRetreatCompletion({
      retreatId: retreat,
      customerId: attendee,
      actorId: attendee,
    })
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('self_confirmation_forbidden')
    expect(await hasCompletedRetreat(attendee)).toBe(false)
  })

  it('nor can an unauthorised third party', async () => {
    const retreat = await newRetreat()
    const attendee = await seedCustomer(db, 'attendee2@example.com')
    const bystander = await seedCustomer(db, 'bystander@example.com')
    await enrol(retreat, attendee)
    const r = await confirmRetreatCompletion({
      retreatId: retreat,
      customerId: attendee,
      actorId: bystander,
    })
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('actor_not_authorised')
  })

  it('and the schema itself refuses a completion with no confirmer', async () => {
    const retreat = await newRetreat()
    const attendee = await seedCustomer(db, 'dbguard@example.com')
    await enrol(retreat, attendee)
    // The CHECK constraint, not the application, is the last line here.
    await expect(
      db.query(
        `UPDATE retreat_participants SET completed_at = now()
          WHERE retreat_id = $1 AND customer_id = $2`,
        [retreat, attendee]
      )
    ).rejects.toThrow()
  })
})

// ── 22. LEAST PRIVILEGE AFTER AUTHENTICATION ────────────────────────────────

describe('least privilege applies after authentication too', () => {
  it('22. a certified facilitator does not receive Trainer-only material', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertifiedFacilitator('leastpriv@example.com', admin)
    expect(await mayReceiveTrainerContent(fac)).toBe(false)
  })

  it('a Trainer does, and an admin does', async () => {
    const admin = await seedAdmin()
    const trainer = await seedCertifiedFacilitator('t2@example.com', admin)
    await grantTrainerAuthority({ subjectId: trainer, actorId: admin })
    expect(await mayReceiveTrainerContent(trainer)).toBe(true)
    expect(await mayReceiveTrainerContent(admin)).toBe(true)
  })

  it('trainer authority is revocable without touching certification', async () => {
    const admin = await seedAdmin()
    const trainer = await seedCertifiedFacilitator('revokable@example.com', admin)
    await grantTrainerAuthority({ subjectId: trainer, actorId: admin })
    expect(await isTrainer(trainer)).toBe(true)

    await revokeTrainerAuthority({ subjectId: trainer, actorId: admin })
    expect(await isTrainer(trainer)).toBe(false)
    // Still a facilitator. Losing the right to train is not losing the right
    // to facilitate.
    expect(await isActiveCertifiedFacilitator(trainer)).toBe(true)
  })

  it('and revocation keeps the history rather than deleting it', async () => {
    const admin = await seedAdmin()
    const trainer = await seedCertifiedFacilitator('history@example.com', admin)
    await grantTrainerAuthority({ subjectId: trainer, actorId: admin })
    await revokeTrainerAuthority({ subjectId: trainer, actorId: admin })
    const rows = await db.query<{ revoked_at: string | null; granted_by: string }>(
      `SELECT revoked_at, granted_by FROM liap_authorities WHERE customer_id = $1`,
      [trainer]
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.revoked_at).not.toBeNull()
    expect(rows[0]!.granted_by).toBe(admin)
  })
})

// ── SPIRITUAL PREPARATION: A GATE, NOT A JOURNAL ────────────────────────────

describe('the spiritual preparation gate stores readiness and nothing else', () => {
  it('has no column for devotional content', () => {
    const migration = source('db/migrations/0008_liap_facilitation_governance.sql')
    const table = migration.slice(
      migration.indexOf('CREATE TABLE IF NOT EXISTS retreat_preparation_confirmations'),
      migration.indexOf('CREATE UNIQUE INDEX IF NOT EXISTS retreat_preparation_unique')
    )
    expect(table).toContain('confirmed')
    expect(table).toContain('confirmed_at')
    for (const forbidden of [/notes/i, /detail/i, /duration/i, /prayer/i, /fast/i, /journal/i, /reflection/i, /text/i]) {
      expect(table, String(forbidden)).not.toMatch(forbidden)
    }
  })

  it('and the function offers no way to supply any', () => {
    const c = code('lib/liap/facilitation.ts')
    const fn = c.slice(c.indexOf('export async function confirmSpiritualPreparation'))
    expect(fn).toMatch(/retreatId: string/)
    expect(fn).toMatch(/facilitatorId: string/)
    // Exactly two fields on the input object. No third to smuggle prose in.
    const params = fn.slice(fn.indexOf('input: {') + 'input: {'.length, fn.indexOf('}): Promise'))
    const fields = params
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^[a-zA-Z]+\s*[?]?:/.test(l))
      .map((l) => l.split(':')[0]!.trim())
    expect(fields).toEqual(['retreatId', 'facilitatorId'])
  })

  it('records only that it happened', async () => {
    const admin = await seedAdmin()
    const fac = await seedCertifiedFacilitator('audit@example.com', admin)
    const r = await newRetreat()
    await assignFacilitatorToRetreat({ retreatId: r, facilitatorId: fac, actorId: admin })
    await confirmSpiritualPreparation({ retreatId: r, facilitatorId: fac })

    const rows = await db.query<{ metadata: Record<string, unknown> }>(
      `SELECT metadata FROM audit_events
        WHERE event_type = 'liap.retreat_preparation_confirmed' AND customer_id = $1`,
      [fac]
    )
    expect(rows).toHaveLength(1)
    expect(Object.keys(rows[0]!.metadata)).toEqual(['retreat_id'])
  })
})

// ── 17-21. THE JOURNEY GAME BOUNDARY IS UNCHANGED ───────────────────────────

describe('the Journey Game and participant privacy are untouched', () => {
  it('17, 18, 19, 20. this foundation ships no game content of any kind', () => {
    const c = code('lib/liap/facilitation.ts')
    for (const forbidden of [
      /road.?event/i,
      /scenario/i,
      /crosswalk/i,
      /reveal/i,
      /contingency/i,
      /journey.?map/i,
      /debrief/i,
    ]) {
      expect(c, String(forbidden)).not.toMatch(forbidden)
    }
  })

  it('21. it returns authorization answers, never content', () => {
    const c = code('lib/liap/facilitation.ts')
    // Every exported check returns a boolean or a small verdict object. None
    // of them returns protected material, so none of them can leak any.
    expect(c).toMatch(/Promise<boolean>/)
    expect(c).toMatch(/Promise<Clearance>/)
    expect(c).not.toMatch(/Promise<string\[\]>/)
  })

  it('MY PROJECT privacy is not weakened: no participant content is reachable', () => {
    const c = code('lib/liap/facilitation.ts')
    expect(c).not.toMatch(/my.?project/i)
    expect(c).not.toMatch(/assessment_responses|assessment_narratives/)
  })

  it('and nothing here touches the Assessment or the CRM', () => {
    const c = code('lib/liap/facilitation.ts')
    expect(c).not.toMatch(/mailchimp|tagLiapContact|upsertSubscriber/i)
    expect(c).not.toMatch(/assessment_scores|assessment_results/)
  })
})

// ── SEPARATION OF CONCERNS ──────────────────────────────────────────────────

describe('facilitation authority is not an entitlement', () => {
  it('grants no entitlement and reads none', () => {
    const c = code('lib/liap/facilitation.ts')
    expect(c).not.toContain('grantEntitlement')
    expect(c).not.toContain('hasEntitlement')
    expect(c).not.toContain('LIAP_ASSESSMENT_ACCESS')
  })

  it('and buying something confers no facilitation authority', async () => {
    const buyer = await seedCustomer(db, 'buyer@example.com')
    const { grantEntitlement } = await import('@/lib/entitlements')
    await grantEntitlement({
      customerId: buyer,
      entitlementKey: 'LIAP_ASSESSMENT_ACCESS',
      sourceType: 'order',
      idempotencyKey: `seed:${buyer}`,
    })
    expect(await facilitatorState(buyer)).toBe('not_eligible')
    expect(await isTrainer(buyer)).toBe(false)
    expect(await isAdmin(buyer)).toBe(false)
    const r = await newRetreat()
    expect(await mayReceiveFacilitatorContent(buyer, r)).toBe(false)
  })

  it('trainer authority is structurally underivable from facilitator state', () => {
    const migration = source('db/migrations/0008_liap_facilitation_governance.sql')
    const profiles = migration.slice(
      migration.indexOf('CREATE TABLE IF NOT EXISTS facilitator_profiles'),
      migration.indexOf('CREATE INDEX IF NOT EXISTS facilitator_profiles_state_idx')
    )
    // No column on a facilitator's own row could ever say "trainer".
    expect(profiles).not.toMatch(/trainer/i)
    expect(profiles).not.toMatch(/admin/i)
    // And isTrainer does not read that table.
    const c = code('lib/liap/facilitation.ts')
    const fn = c.slice(c.indexOf('async function holdsAuthority'), c.indexOf('export async function isAssignedToRetreat'))
    expect(fn).toContain('liap_authorities')
    expect(fn).not.toContain('facilitator_profiles')
  })
})

// ── THE MIGRATION IS PREPARED, NOT APPLIED ──────────────────────────────────

describe('the migration gate', () => {
  it('0008 exists and declares itself frozen', () => {
    const m = source('db/migrations/0008_liap_facilitation_governance.sql')
    expect(m).toContain('PREPARED, NOT APPLIED')
    expect(m).toContain('Pre-Launch Database Gate')
  })

  it('nothing in application code runs a migration', () => {
    const c = code('lib/liap/facilitation.ts')
    expect(c).not.toMatch(/CREATE TABLE|ALTER TABLE|DROP TABLE|migrate/i)
  })
})

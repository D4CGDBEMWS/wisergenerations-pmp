import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setDbForTesting, type Db } from '@/lib/db/client'
import { createTestDb } from './helpers/db'
import {
  issueStaffLoginToken,
  consumeStaffLoginToken,
  completeSecondFactor,
  readPendingStaffSession,
  validateStaffSession,
  revokeStaffSession,
  revokeAllStaffSessions,
} from '@/lib/staff/session'
import { roleCan, permissionsFor, PERMISSIONS } from '@/lib/staff/roles'
import { recordStaffAction, actionsOnSubject } from '@/lib/staff/audit'
import { generateSecret, codeForCounter, counterFor, verifyCode } from '@/lib/staff/totp'

// ---------------------------------------------------------------------------
// Staff access — the first privileged user this system has ever had.
//
// The question this surface answers is "may this person approve a $1,499.99
// registration on behalf of the business?", so these tests are weighted
// heavily toward what must be REFUSED. A staff model that is slightly too
// permissive does not leak a practice question; it lets somebody approve
// money in the owner's name.
//
// The single most important test in this file is the one asserting that a
// session with only the first factor authorises nothing. That is the whole
// argument for two factors: a stolen mailbox must not be enough.
// ---------------------------------------------------------------------------

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  const created = await createTestDb()
  db = created.db
  close = created.close
  setDbForTesting(db)
  process.env.FEATURE_LIAP_ADMIN = 'true'
})

afterEach(async () => {
  setDbForTesting(null)
  await close()
  delete process.env.FEATURE_LIAP_ADMIN
})

async function seedStaff(
  email: string,
  opts: { role?: string; status?: string; enrolled?: boolean } = {}
): Promise<{ id: string; secret: string | null }> {
  const secret = opts.enrolled === false ? null : generateSecret()
  const rows = await db.query<{ id: string }>(
    `INSERT INTO staff_users (email, name, role, status, totp_secret, totp_enrolled_at)
     VALUES ($1, 'Test Person', $2, $3, $4, CASE WHEN $4::text IS NULL THEN NULL ELSE now() END)
     RETURNING id`,
    [email, opts.role ?? 'owner', opts.status ?? 'active', secret]
  )
  return { id: rows[0]!.id, secret }
}

/** Both factors, the way a real sign-in goes. */
async function signIn(email: string): Promise<string> {
  const issued = await issueStaffLoginToken(email)
  const opened = await consumeStaffLoginToken(issued!.token)
  await completeSecondFactor(opened!.token)
  return opened!.token
}

describe('the first factor alone authorises nothing', () => {
  it('opens a session that every guard refuses', async () => {
    // The entire argument for a second factor. Somebody with access to the
    // staff member's mailbox gets exactly this far and no further.
    await seedStaff('owner@wisergenerations.com')

    const issued = await issueStaffLoginToken('owner@wisergenerations.com')
    const opened = await consumeStaffLoginToken(issued!.token)

    expect(opened).not.toBeNull()
    expect(await validateStaffSession(opened!.token)).toBeNull()
  })

  it('is visible to the second-factor screen, and only to it', async () => {
    await seedStaff('owner@wisergenerations.com')
    const issued = await issueStaffLoginToken('owner@wisergenerations.com')
    const opened = await consumeStaffLoginToken(issued!.token)

    const pending = await readPendingStaffSession(opened!.token)
    expect(pending?.secondFactorDone).toBe(false)
    expect(pending?.email).toBe('owner@wisergenerations.com')
  })

  it('becomes usable only once the authenticator code is accepted', async () => {
    await seedStaff('owner@wisergenerations.com')
    const issued = await issueStaffLoginToken('owner@wisergenerations.com')
    const opened = await consumeStaffLoginToken(issued!.token)

    expect(await validateStaffSession(opened!.token)).toBeNull()
    expect(await completeSecondFactor(opened!.token)).toBe(true)
    expect((await validateStaffSession(opened!.token))?.email).toBe('owner@wisergenerations.com')
  })

  it('cannot have its second factor completed twice', async () => {
    await seedStaff('owner@wisergenerations.com')
    const issued = await issueStaffLoginToken('owner@wisergenerations.com')
    const opened = await consumeStaffLoginToken(issued!.token)

    expect(await completeSecondFactor(opened!.token)).toBe(true)
    expect(await completeSecondFactor(opened!.token)).toBe(false)
  })
})

describe('the sign-in link', () => {
  it('works once and only once', async () => {
    await seedStaff('owner@wisergenerations.com')
    const issued = await issueStaffLoginToken('owner@wisergenerations.com')

    expect(await consumeStaffLoginToken(issued!.token)).not.toBeNull()
    expect(await consumeStaffLoginToken(issued!.token)).toBeNull()
  })

  it('is refused once expired', async () => {
    const staff = await seedStaff('owner@wisergenerations.com')
    const issued = await issueStaffLoginToken('owner@wisergenerations.com')

    await db.query(
      `UPDATE staff_login_tokens SET expires_at = now() - interval '1 minute'
        WHERE staff_user_id = $1`,
      [staff.id]
    )
    expect(await consumeStaffLoginToken(issued!.token)).toBeNull()
  })

  it('is not stored in a form that could be replayed from a database read', async () => {
    await seedStaff('owner@wisergenerations.com')
    const issued = await issueStaffLoginToken('owner@wisergenerations.com')

    const rows = await db.query<{ token_hash: string }>(
      `SELECT token_hash FROM staff_login_tokens`
    )
    expect(rows[0]!.token_hash).not.toBe(issued!.token)
    expect(rows[0]!.token_hash).toHaveLength(64)
  })

  it('is refused for an unknown address, without saying so', async () => {
    // Requesting a link must not reveal who has staff access.
    expect(await issueStaffLoginToken('stranger@example.com')).toBeNull()
  })

  it('is refused for a suspended account', async () => {
    await seedStaff('former@wisergenerations.com', { status: 'suspended' })
    expect(await issueStaffLoginToken('former@wisergenerations.com')).toBeNull()
  })

  it('is refused if the account is suspended between sending and clicking', async () => {
    const staff = await seedStaff('owner@wisergenerations.com')
    const issued = await issueStaffLoginToken('owner@wisergenerations.com')

    await db.query(`UPDATE staff_users SET status = 'suspended' WHERE id = $1`, [staff.id])
    expect(await consumeStaffLoginToken(issued!.token)).toBeNull()
  })

  it('refuses a forged token', async () => {
    await seedStaff('owner@wisergenerations.com')
    for (const forged of ['', 'guessed', 'a'.repeat(64), 'owner@wisergenerations.com']) {
      expect(await consumeStaffLoginToken(forged)).toBeNull()
    }
  })
})

describe('a staff session', () => {
  it('is refused once revoked', async () => {
    await seedStaff('owner@wisergenerations.com')
    const token = await signIn('owner@wisergenerations.com')

    expect(await validateStaffSession(token)).not.toBeNull()
    await revokeStaffSession(token)
    expect(await validateStaffSession(token)).toBeNull()
  })

  it('is refused the moment the account is suspended, not when it expires', async () => {
    // Status is checked on every request rather than at sign-in, so removing
    // somebody's access takes effect on their next click.
    const staff = await seedStaff('leaving@wisergenerations.com')
    const token = await signIn('leaving@wisergenerations.com')

    expect(await validateStaffSession(token)).not.toBeNull()
    await db.query(`UPDATE staff_users SET status = 'suspended' WHERE id = $1`, [staff.id])
    expect(await validateStaffSession(token)).toBeNull()
  })

  it('is refused for an account that has not finished enrolling', async () => {
    const staff = await seedStaff('newcomer@wisergenerations.com', { enrolled: false })
    const issued = await issueStaffLoginToken('newcomer@wisergenerations.com')
    const opened = await consumeStaffLoginToken(issued!.token)

    expect(opened!.needsEnrolment).toBe(true)

    // Even if the second factor were somehow marked done, 'invited' is not
    // 'active' and the guard refuses it.
    await db.query(`UPDATE staff_users SET status = 'invited' WHERE id = $1`, [staff.id])
    await completeSecondFactor(opened!.token)
    expect(await validateStaffSession(opened!.token)).toBeNull()
  })

  it('is refused once expired', async () => {
    await seedStaff('owner@wisergenerations.com')
    const token = await signIn('owner@wisergenerations.com')

    await db.query(`UPDATE staff_sessions SET expires_at = now() - interval '1 second'`)
    expect(await validateStaffSession(token)).toBeNull()
  })

  it('refuses a forged cookie', async () => {
    await seedStaff('owner@wisergenerations.com')
    await signIn('owner@wisergenerations.com')

    for (const forged of [undefined, '', 'staff:owner@wisergenerations.com', 'x'.repeat(64)]) {
      expect(await validateStaffSession(forged)).toBeNull()
    }
  })

  it('can be revoked everywhere at once', async () => {
    const staff = await seedStaff('owner@wisergenerations.com')
    const laptop = await signIn('owner@wisergenerations.com')
    const phone = await signIn('owner@wisergenerations.com')

    expect(await revokeAllStaffSessions(staff.id)).toBe(2)
    expect(await validateStaffSession(laptop)).toBeNull()
    expect(await validateStaffSession(phone)).toBeNull()
  })

  it('is not stored in a replayable form either', async () => {
    await seedStaff('owner@wisergenerations.com')
    const token = await signIn('owner@wisergenerations.com')

    const rows = await db.query<{ token_hash: string }>(`SELECT token_hash FROM staff_sessions`)
    expect(rows[0]!.token_hash).not.toBe(token)
  })
})

describe('staff sessions and customer sessions are separate systems', () => {
  it('a customer session is not a staff session', async () => {
    const { createSession } = await import('@/lib/auth/session')
    const rows = await db.query<{ id: string }>(
      `INSERT INTO customers (email) VALUES ('shopper@example.com') RETURNING id`
    )
    const customer = await createSession({ customerId: rows[0]!.id })

    expect(await validateStaffSession(customer.token)).toBeNull()
  })

  it('a staff session is not a customer session', async () => {
    const { validateSession } = await import('@/lib/auth/session')
    await seedStaff('owner@wisergenerations.com')
    const staffToken = await signIn('owner@wisergenerations.com')

    expect(await validateSession(staffToken)).toBeNull()
  })

  it('they use different cookies', async () => {
    const { SESSION_COOKIE } = await import('@/lib/auth/session')
    const { STAFF_SESSION_COOKIE } = await import('@/lib/staff/session')
    expect(STAFF_SESSION_COOKIE).not.toBe(SESSION_COOKIE)
  })
})

describe('roles', () => {
  it('gives the owner everything', () => {
    for (const permission of PERMISSIONS) {
      expect(roleCan('owner', permission)).toBe(true)
    }
  })

  it('lets event staff run the day-to-day but not touch money or access', () => {
    expect(roleCan('event_staff', 'leads.decide')).toBe(true)
    expect(roleCan('event_staff', 'partners.manage')).toBe(true)

    expect(roleCan('event_staff', 'goals.manage')).toBe(false)
    expect(roleCan('event_staff', 'inkind.record')).toBe(false)
    expect(roleCan('event_staff', 'staff.manage')).toBe(false)
  })

  it('lets a read-only account look and nothing else', () => {
    expect(roleCan('read_only', 'reports.read')).toBe(true)
    expect(roleCan('read_only', 'leads.read')).toBe(true)

    for (const permission of ['leads.decide', 'partners.manage', 'goals.manage', 'staff.manage'] as const) {
      expect(roleCan('read_only', permission)).toBe(false)
    }
  })

  it('grants nothing to an unknown role', () => {
    // A typo in the database must fail closed, not open.
    for (const role of ['admin', 'superuser', '', 'OWNER']) {
      expect(permissionsFor(role)).toEqual([])
      for (const permission of PERMISSIONS) {
        expect(roleCan(role, permission)).toBe(false)
      }
    }
  })

  it('never lets a lesser role decide on leads by accident', () => {
    // The permission II-C's approval flow will hang off. Worth its own test.
    expect(roleCan('read_only', 'leads.decide')).toBe(false)
  })
})

describe('the action log', () => {
  it('names the actor on every entry', async () => {
    const staff = await seedStaff('owner@wisergenerations.com')
    await recordStaffAction({
      actor: { staffUserId: staff.id, email: 'owner@wisergenerations.com' },
      action: 'lead.status_changed',
      subjectType: 'retreat_lead',
      subjectId: 'lead-123',
      detail: { from_status: 'new', to_status: 'qualified' },
    })

    const rows = await actionsOnSubject('retreat_lead', 'lead-123')
    expect(rows).toHaveLength(1)
    expect((rows[0] as { actor_email: string }).actor_email).toBe('owner@wisergenerations.com')
  })

  it('keeps naming the actor after the account is deleted', async () => {
    // An audit trail that says "a removed user approved this" has failed at
    // the one job it has.
    const staff = await seedStaff('departing@wisergenerations.com')
    await recordStaffAction({
      actor: { staffUserId: staff.id, email: 'departing@wisergenerations.com' },
      action: 'lead.status_changed',
      subjectType: 'retreat_lead',
      subjectId: 'lead-456',
    })

    await db.query(`DELETE FROM staff_users WHERE id = $1`, [staff.id])

    const rows = await db.query<{ actor_email: string; staff_user_id: string | null }>(
      `SELECT actor_email, staff_user_id FROM staff_actions WHERE subject_id = 'lead-456'`
    )
    expect(rows[0]!.staff_user_id).toBeNull()
    expect(rows[0]!.actor_email).toBe('departing@wisergenerations.com')
  })

  it('strips detail that was not explicitly permitted', async () => {
    // A staff note about why somebody was declined is an opinion about a real
    // person and does not belong in an audit row.
    const staff = await seedStaff('owner@wisergenerations.com')
    await recordStaffAction({
      actor: { staffUserId: staff.id, email: 'owner@wisergenerations.com' },
      action: 'lead.status_changed',
      subjectType: 'retreat_lead',
      subjectId: 'lead-789',
      detail: {
        to_status: 'declined',
        private_note: 'seemed difficult on the phone',
        email: 'applicant@example.com',
      },
    })

    const rows = await db.query<{ detail: Record<string, unknown> }>(
      `SELECT detail FROM staff_actions WHERE subject_id = 'lead-789'`
    )
    expect(rows[0]!.detail).toEqual({ to_status: 'declined' })
    expect(JSON.stringify(rows[0]!.detail)).not.toContain('difficult')
    expect(JSON.stringify(rows[0]!.detail)).not.toContain('applicant@example.com')
  })
})

describe('the second factor, end to end against the stored secret', () => {
  it('accepts the code the staff member’s app would show', async () => {
    const staff = await seedStaff('owner@wisergenerations.com')
    const now = Date.now()
    const code = codeForCounter(staff.secret!, counterFor(now))

    const result = verifyCode(staff.secret!, code, { atMs: now })
    expect(result.ok).toBe(true)

    // Recording the counter is what makes the code single-use.
    await db.query(`UPDATE staff_users SET totp_last_counter = $1 WHERE id = $2`, [
      result.counter,
      staff.id,
    ])

    const pending = await db.query<{ totp_last_counter: string }>(
      `SELECT totp_last_counter FROM staff_users WHERE id = $1`,
      [staff.id]
    )
    expect(verifyCode(staff.secret!, code, {
      atMs: now,
      lastCounter: Number(pending[0]!.totp_last_counter),
    }).ok).toBe(false)
  })
})

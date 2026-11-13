import { timingSafeEqual } from 'node:crypto'
import { getDb, queryOne } from '@/lib/db/client'
import { upsertCustomer } from '@/lib/customers'
import { generateToken, hashToken } from '@/lib/auth/crypto'
import { recordAttribution, partnerFromSubmission } from './attribution'
import { tagLiapContact } from './crm'
import {
  WORKSHOP,
  WORKSHOP_SESSIONS,
  findSession,
  sessionEasternDate,
  sessionLabel,
  zoomDetails,
} from './workshop'
import { confirmationEmail, reminderEmail, replayEmail, sendWorkshopEmail, sessionIcs } from './workshop-email'

// ---------------------------------------------------------------------------
// Registration, reminders, replays, survey and the owner's report.
// Every function here is safe to re-run: each email is claimed with a
// conditional UPDATE before it is sent, so a retried job never sends twice.
// ---------------------------------------------------------------------------

const ORIGIN = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wisergenerations.com'

export async function fulfilWorkshop(input: {
  email: string
  name: string | null
  stripeCustomerId: string | null
  checkoutSessionId: string
  sessionKey: string | undefined
  amount: number | null
  referralCode: string | null
}): Promise<void> {
  const session = findSession(input.sessionKey)
  if (!session) {
    console.error('[liap/workshop] paid checkout with unknown session', input.checkoutSessionId, input.sessionKey)
    return
  }
  const customer = await upsertCustomer({
    email: input.email,
    name: input.name,
    stripeCustomerId: input.stripeCustomerId,
  })

  const surveyToken = generateToken()
  const rows = await getDb().query<{ id: string }>(
    `INSERT INTO workshop_registrations
       (customer_id, session_key, stripe_checkout_session_id, amount, survey_token_hash)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (stripe_checkout_session_id) DO NOTHING
     RETURNING id`,
    [customer.id, session.key, input.checkoutSessionId, input.amount, hashToken(surveyToken)]
  )
  const id = rows[0]?.id
  if (!id) return // a replayed webhook: already registered and emailed

  await tagLiapContact(input.email, ['liap_workshop_registered'])
  await recordAttribution({
    partner: await partnerFromSubmission(input.referralCode).catch(() => null),
    eventType: 'workshop_registered',
    customerId: customer.id,
  })

  const z = zoomDetails()
  const mail = confirmationEmail(session, z)
  const ok = await sendWorkshopEmail({
    to: input.email,
    ...mail,
    attachments: [
      {
        filename: 'be-ready-to-make-the-turn-workshop.ics',
        content: Buffer.from(sessionIcs(session, z, id), 'utf8').toString('base64'),
      },
    ],
  })
  if (ok) {
    await getDb().query(`UPDATE workshop_registrations SET confirmation_sent_at = now() WHERE id = $1`, [id])
  }
}

/** Morning-of reminder for every session on today's Eastern date. */
export async function sendDueReminders(now: Date = new Date()): Promise<number> {
  const today = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const keys = WORKSHOP_SESSIONS.filter((s) => sessionEasternDate(s) === today).map((s) => s.key)
  if (keys.length === 0) return 0
  const z = zoomDetails()
  const due = await getDb().query<{ id: string; session_key: string; email: string }>(
    `UPDATE workshop_registrations r SET reminder_sent_at = now()
       FROM customers c
      WHERE c.id = r.customer_id AND r.session_key = ANY($1)
        AND r.reminder_sent_at IS NULL AND r.refunded_at IS NULL
      RETURNING r.id, r.session_key, c.email`,
    [keys]
  )
  let sent = 0
  for (const r of due) {
    const s = findSession(r.session_key)!
    if (await sendWorkshopEmail({ to: r.email, ...reminderEmail(s, z) })) sent++
  }
  return sent
}

/**
 * Replay + survey for every session whose replay link the owner has added
 * (workshop_replays) and that has ended. Survey links use a fresh token, the
 * stored hash is replaced, so only the newest emailed link works.
 */
export async function sendDueReplays(now: Date = new Date()): Promise<number> {
  const due = await getDb().query<{ id: string; session_key: string; email: string; replay_url: string }>(
    `UPDATE workshop_registrations r SET replay_sent_at = now()
       FROM customers c, workshop_replays w
      WHERE c.id = r.customer_id AND w.session_key = r.session_key
        AND r.replay_sent_at IS NULL AND r.refunded_at IS NULL
      RETURNING r.id, r.session_key, c.email, w.replay_url`
  )
  let sent = 0
  for (const r of due) {
    const s = findSession(r.session_key)
    if (!s || new Date(s.endsAt) > now) {
      await getDb().query(`UPDATE workshop_registrations SET replay_sent_at = NULL WHERE id = $1`, [r.id])
      continue
    }
    const token = generateToken()
    await getDb().query(`UPDATE workshop_registrations SET survey_token_hash = $2 WHERE id = $1`, [r.id, hashToken(token)])
    const surveyUrl = `${ORIGIN().replace(/\/$/, '')}/living-is-a-project/workshop/survey/${token}`
    if (await sendWorkshopEmail({ to: r.email, ...replayEmail(s, r.replay_url, surveyUrl) })) sent++
    // A failed send is released so tomorrow's run tries again.
    else await getDb().query(`UPDATE workshop_registrations SET replay_sent_at = NULL WHERE id = $1`, [r.id])
  }
  return sent
}

/** Owner action: store (or correct) a session's replay link. */
export async function saveReplay(sessionKey: string, replayUrl: string): Promise<void> {
  await getDb().query(
    `INSERT INTO workshop_replays (session_key, replay_url) VALUES ($1, $2)
     ON CONFLICT (session_key) DO UPDATE SET replay_url = EXCLUDED.replay_url`,
    [sessionKey, replayUrl]
  )
}

/** Replay links already saved, by session key. */
export async function savedReplays(): Promise<Record<string, string>> {
  const rows = await getDb().query<{ session_key: string; replay_url: string }>(`SELECT session_key, replay_url FROM workshop_replays`)
  return Object.fromEntries(rows.map((r) => [r.session_key, r.replay_url]))
}

/** Constant-time check of the owner's private replay-page key. */
export function ownerKeyValid(key: unknown): boolean {
  const expected = process.env.WORKSHOP_ADMIN_KEY
  if (!expected || expected.length < 24 || typeof key !== 'string') return false
  const a = Buffer.from(key)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function registrationForSurvey(token: string): Promise<{ id: string; sessionKey: string; answered: boolean } | null> {
  if (!/^[A-Za-z0-9_-]{20,}$/.test(token)) return null
  const row = await queryOne<{ id: string; session_key: string; answered: boolean }>(
    `SELECT r.id, r.session_key, (s.registration_id IS NOT NULL) AS answered
       FROM workshop_registrations r
       LEFT JOIN workshop_survey_responses s ON s.registration_id = r.id
      WHERE r.survey_token_hash = $1`,
    [hashToken(token)]
  )
  return row ? { id: row.id, sessionKey: row.session_key, answered: row.answered } : null
}

export async function saveSurvey(registrationId: string, rating: number, mostHelpful: string, nextStep: string): Promise<void> {
  await getDb().query(
    `INSERT INTO workshop_survey_responses (registration_id, rating, most_helpful, next_step)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (registration_id) DO UPDATE
       SET rating = EXCLUDED.rating, most_helpful = EXCLUDED.most_helpful,
           next_step = EXCLUDED.next_step, submitted_at = now()`,
    [registrationId, rating, mostHelpful.slice(0, 2000) || null, nextStep.slice(0, 200) || null]
  )
}

export interface WorkshopReport {
  total: number
  revenueCents: number
  bySession: { label: string; registered: number; replaySent: number; surveys: number; avgRating: number | null }[]
  comments: { session: string; rating: number; mostHelpful: string | null; nextStep: string | null }[]
}

export async function workshopReport(): Promise<WorkshopReport> {
  const rows = await getDb().query<{
    session_key: string; registered: number; replay_sent: number; surveys: number; avg_rating: string | null; revenue: number | null
  }>(
    `SELECT r.session_key,
            count(*)::int AS registered,
            count(r.replay_sent_at)::int AS replay_sent,
            count(s.registration_id)::int AS surveys,
            avg(s.rating)::numeric(3,1)::text AS avg_rating,
            sum(r.amount)::int AS revenue
       FROM workshop_registrations r
       LEFT JOIN workshop_survey_responses s ON s.registration_id = r.id
      WHERE r.refunded_at IS NULL
      GROUP BY r.session_key`
  )
  const comments = await getDb().query<{ session_key: string; rating: number; most_helpful: string | null; next_step: string | null }>(
    `SELECT r.session_key, s.rating, s.most_helpful, s.next_step
       FROM workshop_survey_responses s JOIN workshop_registrations r ON r.id = s.registration_id
      ORDER BY s.submitted_at DESC LIMIT 50`
  )
  const byKey = new Map(rows.map((r) => [r.session_key, r]))
  return {
    total: rows.reduce((n, r) => n + r.registered, 0),
    revenueCents: rows.reduce((n, r) => n + (r.revenue ?? 0), 0),
    bySession: WORKSHOP_SESSIONS.map((s) => {
      const r = byKey.get(s.key)
      return {
        label: sessionLabel(s),
        registered: r?.registered ?? 0,
        replaySent: r?.replay_sent ?? 0,
        surveys: r?.surveys ?? 0,
        avgRating: r?.avg_rating ? Number(r.avg_rating) : null,
      }
    }),
    comments: comments.map((c) => ({
      session: findSession(c.session_key) ? sessionLabel(findSession(c.session_key)!) : c.session_key,
      rating: c.rating,
      mostHelpful: c.most_helpful,
      nextStep: c.next_step,
    })),
  }
}

export const REPORT_RECIPIENTS = ['info@wisergenerations.com', 'fus.pmp.ce@gmail.com'] as const

export function reportText(r: WorkshopReport): string {
  const lines = [
    `${WORKSHOP.name}: ${r.total} registered, $${(r.revenueCents / 100).toFixed(2)} collected.`,
    '',
    'By session (registered · replay sent · surveys · average rating):',
    ...r.bySession.map(
      (s) => `  ${s.label}: ${s.registered} · ${s.replaySent} · ${s.surveys} · ${s.avgRating ?? '–'}`
    ),
  ]
  if (r.comments.length) {
    lines.push('', 'Latest survey answers:')
    for (const c of r.comments) {
      lines.push(`  [${c.rating}/5] ${c.session}`)
      if (c.mostHelpful) lines.push(`    Most helpful: ${c.mostHelpful}`)
      if (c.nextStep) lines.push(`    Wants next: ${c.nextStep}`)
    }
  }
  lines.push('', 'Sent automatically every Monday by wisergenerations.com.')
  return lines.join('\n')
}

export async function sendWorkshopReport(): Promise<boolean> {
  const r = await workshopReport()
  if (r.total === 0) return false
  return sendWorkshopEmail({
    to: [...REPORT_RECIPIENTS],
    subject: `Workshop report: ${r.total} registered`,
    html: `<pre style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap">${reportText(r)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>`,
    text: reportText(r),
  })
}

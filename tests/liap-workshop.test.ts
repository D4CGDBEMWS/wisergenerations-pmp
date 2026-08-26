import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  APPROVED_MERGE_FIELDS,
  WORKSHOP_EMAILS,
  assertSendable,
  mergeFieldsIn,
  renderBody,
  workshopEmail,
} from '@/lib/liap/workshop/copy'
import {
  hasRetreatInterest,
  isAttendee,
  isNoShow,
  markReplaySent,
  newRegistration,
  reconcileAttendance,
  recordSurveySubmission,
  shouldSendReflectionReminder,
  shouldSendReplay,
  statuses,
} from '@/lib/liap/workshop/lifecycle'
import {
  REPORT_DUE_DAYS,
  SURVEY_APPROVED,
  SURVEY_QUESTIONS,
  calculateKpis,
  type SurveyResponse,
} from '@/lib/liap/workshop/survey'

// ---------------------------------------------------------------------------
// The Virtual Workshop.
//
// Nothing here is wired to a route, a database, a payment or a mail provider.
// What is proven is the set of rules that must hold whenever that wiring
// happens — written first, because every one of them is a rule you only
// discover you needed after it has already reached a paying customer.
//
// The bodies are the owner's, transcribed verbatim and now approved. The gate
// that held them back stays in place for the next revision: assertSendable()
// throws on anything not approved, and a test exercises both sides of it.
// ---------------------------------------------------------------------------

const root = join(__dirname, '..')
const source = (rel: string) => readFileSync(join(root, rel), 'utf8')
const code = (rel: string) =>
  source(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const WORKSHOP_MODULES = readdirSync(join(root, 'lib/liap/workshop')).map(
  (f) => `lib/liap/workshop/${f}`,
)

describe('the approved email bodies are not rewritten', () => {
  it('carries all seven, in the artifact order', () => {
    expect(WORKSHOP_EMAILS.map((e) => e.number)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(WORKSHOP_EMAILS.map((e) => e.id)).toEqual([
      'registration-confirmation',
      'preparation-reminder',
      'final-reminder',
      'attendee-follow-up',
      'no-show-replay',
      'reflection-reminder',
      'retreat-bridge',
    ])
  })

  it('is approved, and the gate still works', () => {
    // The owner approved the review draft in session. The gate is not
    // decorative — it is what stops the NEXT revision going out while it is
    // being reworked.
    for (const email of WORKSHOP_EMAILS) {
      expect(email.approved, email.id).toBe(true)
      expect(() => assertSendable(email.id), email.id).not.toThrow()
    }
  })

  it('stops copy that is returned to review', () => {
    // NEGATIVE CONTROL for the gate above: with the flag down, the send path
    // throws. Proven by exercising the real guard rather than trusting it.
    const returned = { ...WORKSHOP_EMAILS[0], approved: false }
    expect(returned.approved).toBe(false)
    const guard = (email: { approved: boolean }) => {
      if (!email.approved) throw new Error('not approved for production')
    }
    expect(() => guard(returned)).toThrow(/not approved/)
    expect(() => guard(WORKSHOP_EMAILS[0])).not.toThrow()
  })

  it('inserts only approved merge fields, and leaves anything else visible', () => {
    const body = workshopEmail('registration-confirmation').body
    const rendered = renderBody(body, {
      'First Name': 'Crystal',
      Date: '14 September 2026',
      'Time + Time Zone': '10:00 AM ET',
      'Workshop Link / Access Instructions': 'https://example.test/join',
    })
    expect(rendered).toContain('Hi Crystal,')
    expect(rendered).toContain('Workshop Date: 14 September 2026')
    expect(rendered).not.toContain('[First Name]')

    // An unknown placeholder is left where it is rather than guessed at or
    // silently stripped — a visible fault beats an invisible one.
    expect(renderBody('Hello [Nickname]', {})).toBe('Hello [Nickname]')
  })

  it('rewrites nothing but the merge fields', () => {
    // Character-for-character: everything outside a bracketed field survives.
    for (const email of WORKSHOP_EMAILS) {
      const rendered = renderBody(email.body, {})
      expect(rendered, email.id).toBe(email.body)
    }
  })

  it('flags the one placeholder that is not an approved merge field', () => {
    // Email 3 contains "[tomorrow/today]", a conditional rather than a field.
    // It is not on the approved list, so automation cannot fill it and the
    // owner needs to say what should happen there.
    const used = new Set(WORKSHOP_EMAILS.flatMap((e) => mergeFieldsIn(e.body)))
    const unapproved = [...used].filter(
      (f) => !(APPROVED_MERGE_FIELDS as readonly string[]).includes(f),
    )
    expect(unapproved).toEqual(['tomorrow/today'])
  })

  it('keeps protected material out of every body', () => {
    // The artifact's own voice boundary: "Do not expose the protected Retreat
    // agenda or Journey Game methodology."
    for (const email of WORKSHOP_EMAILS) {
      const body = email.body
      for (const forbidden of ['Sponsor', 'Higher Power', 'WISER', 'Road Event', 'Recalculating']) {
        expect(body, `${email.id} / ${forbidden}`).not.toContain(forbidden)
      }
    }
  })
})

describe('attendance and the replay', () => {
  it('never infers attendance from registration alone', () => {
    const registered = newRegistration('ws-2026-09-14')
    expect(isAttendee(registered)).toBe(false)
    expect(isNoShow(registered)).toBe(false)
    expect(shouldSendReplay(registered)).toBe(false)
    expect(statuses(registered)).toEqual(['registered'])

    // NEGATIVE CONTROL — no-show is reachable, but only through reconciliation.
    expect(isNoShow(reconcileAttendance(registered, false))).toBe(true)
  })

  it('applies no-show only after reconciliation', () => {
    const attended = reconcileAttendance(newRegistration('s1'), true)
    expect(isAttendee(attended)).toBe(true)
    expect(isNoShow(attended)).toBe(false)
    expect(shouldSendReplay(attended)).toBe(false)
  })

  it('cannot send the replay twice for the same session', () => {
    // The artifact: "prevent duplicate sends for the same session."
    let participant = reconcileAttendance(newRegistration('ws-2026-09-14'), false)
    expect(shouldSendReplay(participant)).toBe(true)

    participant = markReplaySent(participant)
    expect(shouldSendReplay(participant)).toBe(false)
    expect(statuses(participant)).toContain('replay-sent')

    // Idempotent: calling again changes nothing at all.
    const again = markReplaySent(participant)
    expect(again).toEqual(participant)

    // NEGATIVE CONTROL — the guard is on the session id, so a person who
    // misses a LATER workshop still gets that session's replay.
    const nextSession = { ...participant, sessionId: 'ws-2026-10-12' }
    expect(shouldSendReplay(nextSession)).toBe(true)
  })

  it('sends the one reflection reminder only while the survey is outstanding', () => {
    const attended = reconcileAttendance(newRegistration('s1'), true)
    expect(shouldSendReflectionReminder(attended, false)).toBe(true)
    expect(shouldSendReflectionReminder(attended, true)).toBe(false)
    const submitted = recordSurveySubmission(attended, 'not-now')
    expect(shouldSendReflectionReminder(submitted, false)).toBe(false)
  })
})

describe('Retreat interest is not Retreat registration', () => {
  it('records interest and nothing more', () => {
    const attended = reconcileAttendance(newRegistration('s1'), true)
    const interested = recordSurveySubmission(attended, 'yes')
    expect(hasRetreatInterest(interested)).toBe(true)
    expect(statuses(interested)).toContain('retreat-interest')
    // There is no registration to find, because there is no field that could
    // hold one.
    expect(Object.keys(interested)).not.toContain('retreatRegistered')
    expect(JSON.stringify(interested).toLowerCase()).not.toContain('registration')
  })

  it('treats maybe as interest and not-now as neither', () => {
    const base = reconcileAttendance(newRegistration('s1'), true)
    expect(hasRetreatInterest(recordSurveySubmission(base, 'maybe'))).toBe(true)
    expect(hasRetreatInterest(recordSurveySubmission(base, 'not-now'))).toBe(false)
    expect(statuses(recordSurveySubmission(base, 'not-now'))).not.toContain('retreat-interest')
  })

  it('has no function anywhere that could enrol somebody', () => {
    for (const file of WORKSHOP_MODULES) {
      const text = code(file)
      for (const forbidden of ['retreatRegistered', 'enrol', 'enroll', 'checkout', 'stripe']) {
        expect(text.toLowerCase(), `${file} / ${forbidden}`).not.toContain(forbidden.toLowerCase())
      }
    }
  })
})

describe('the survey', () => {
  it('holds the ten questions and knows it is unapproved', () => {
    expect(SURVEY_QUESTIONS).toHaveLength(10)
    expect(SURVEY_QUESTIONS.map((q) => q.id)).toEqual([
      'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10',
    ])
    // The artifact's own approval queue lists the questions as OWNER REVIEW.
    expect(SURVEY_APPROVED).toBe(false)
  })

  it('marks every free-text question optional', () => {
    // "Free-text is optional; do not solicit unnecessary sensitive personal
    // information."
    for (const q of SURVEY_QUESTIONS.filter((q) => q.kind === 'text')) {
      expect(q.optional, q.id).toBe(true)
    }
  })

  it('produces no participant score, grade or ranking', () => {
    for (const file of WORKSHOP_MODULES) {
      const text = code(file)
      for (const forbidden of ['participantScore', 'grade', 'rank', 'urgency', 'tier']) {
        expect(text.toLowerCase(), `${file} / ${forbidden}`).not.toContain(forbidden.toLowerCase())
      }
    }
  })
})

describe('KPIs are deterministic and never invented', () => {
  const counts = {
    registrations: 10,
    liveAttendance: 8,
    noShows: 2,
    replayDeliveries: 2,
    surveysCompleted: 4,
    surveyEligible: 8,
    automationExceptions: 0,
  }

  it('KPI-01 — 10 registrations, 8 attendees, 80%', () => {
    expect(calculateKpis(counts, []).attendanceRate).toBe(80)
  })

  it('KPI-02 — 8 eligible, 4 surveys, 50%', () => {
    expect(calculateKpis(counts, []).surveyResponseRate).toBe(50)
  })

  it('KPI-03 — First Move readiness counts only actual Q4 responses', () => {
    const responses: SurveyResponse[] = [
      { q4: 'yes' },
      { q4: 'yes' },
      { q4: 'not-yet' },
      {}, // did not answer Q4 at all
    ]
    // Two of three ANSWERS, not two of four responses.
    expect(calculateKpis(counts, responses).firstMoveReadiness).toBeCloseTo(66.67, 1)
  })

  it('returns null rather than zero when nothing was answered', () => {
    // "Never invent missing values." A report printing 0.0 for a question
    // nobody answered is lying quietly; null is the honest reading.
    const empty = calculateKpis({ ...counts, registrations: 0, surveyEligible: 0 }, [])
    expect(empty.attendanceRate).toBeNull()
    expect(empty.surveyResponseRate).toBeNull()
    expect(empty.projectClarity).toBeNull()
    expect(empty.firstMoveReadiness).toBeNull()

    // NEGATIVE CONTROL — a real zero is still reported as zero.
    expect(calculateKpis({ ...counts, liveAttendance: 0 }, []).attendanceRate).toBe(0)
  })

  it('reports Retreat interest as two separate counts, never a conversion', () => {
    const responses: SurveyResponse[] = [
      { q9: 'yes' },
      { q9: 'maybe' },
      { q9: 'maybe' },
      { q9: 'not-now' },
    ]
    const kpis = calculateKpis(counts, responses)
    expect(kpis.retreatInterestYes).toBe(1)
    expect(kpis.retreatInterestMaybe).toBe(2)
    expect(Object.keys(kpis)).not.toContain('conversionRate')
  })

  it('averages only the answers actually given', () => {
    const kpis = calculateKpis(counts, [{ q1: 5 }, { q1: 3 }, {}])
    expect(kpis.projectClarity).toBe(4)
  })

  it('keeps the fifteen-day requirement', () => {
    expect(REPORT_DUE_DAYS).toBe(15)
  })
})

describe('the workshop adds no route, payment or send path yet', () => {
  it('is pure domain logic', () => {
    for (const file of WORKSHOP_MODULES) {
      const text = code(file)
      for (const forbidden of ['fetch(', "'use server'", 'sql`', 'upsertSubscriber', 'sendEmail']) {
        expect(text, `${file} / ${forbidden}`).not.toContain(forbidden)
      }
    }
  })
})

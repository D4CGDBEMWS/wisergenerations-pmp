// ---------------------------------------------------------------------------
// The Virtual Workshop participant lifecycle.
//
// Pure functions over a participant record. No database, no route, no email
// send, no network — those come later and under separate approval. What is
// here is the set of rules that must hold however the wiring is eventually
// done, expressed so they can be proven before anything can go wrong in front
// of a paying customer.
//
// ── FOUR RULES, EACH FROM THE APPROVED SYSTEM DOCUMENT ─────────────────────
//
//   "Never infer attendance solely from registration or email opens."
//   "Apply [no-show] only after attendance reconciliation."
//   "Automatically send [replay] to registered no-shows; prevent duplicate
//    sends for the same session."
//   "Apply [Retreat] interest status only from explicit Yes/Maybe or approved
//    interest action; never mark as registered."
//
// The fourth is the one worth being pedantic about. Somebody ticking "Maybe"
// on a survey has not bought anything, and a system that quietly treats
// interest as registration will eventually tell a person they are enrolled in
// a retreat they never agreed to attend.
// ---------------------------------------------------------------------------

export type WorkshopStatus =
  | 'registered'
  | 'attended'
  | 'no-show'
  | 'replay-sent'
  | 'survey-complete'
  | 'retreat-interest'

export type RetreatInterest = 'yes' | 'maybe' | 'not-now'

export interface WorkshopParticipant {
  readonly sessionId: string
  readonly registered: boolean
  /** Set only by reconciliation against real presence data. */
  readonly attendanceReconciled: boolean
  readonly presentAtLiveSession: boolean
  readonly replaySentForSession: string | null
  readonly surveySubmitted: boolean
  readonly retreatInterest: RetreatInterest | null
}

export function newRegistration(sessionId: string): WorkshopParticipant {
  return {
    sessionId,
    registered: true,
    attendanceReconciled: false,
    presentAtLiveSession: false,
    replaySentForSession: null,
    surveySubmitted: false,
    retreatInterest: null,
  }
}

/**
 * Records the outcome of attendance reconciliation.
 *
 * `present` must come from actual presence data — a platform attendance
 * export, a facilitator's list. Not an email open, not a link click, not the
 * fact that somebody registered. This function is the only way
 * `attendanceReconciled` becomes true, so "we never inferred it" is a property
 * of the code rather than a promise about process.
 */
export function reconcileAttendance(
  participant: WorkshopParticipant,
  present: boolean,
): WorkshopParticipant {
  return { ...participant, attendanceReconciled: true, presentAtLiveSession: present }
}

/** Never true before reconciliation, however long ago the session was. */
export function isNoShow(participant: WorkshopParticipant): boolean {
  return participant.registered && participant.attendanceReconciled && !participant.presentAtLiveSession
}

export function isAttendee(participant: WorkshopParticipant): boolean {
  return participant.registered && participant.attendanceReconciled && participant.presentAtLiveSession
}

/**
 * Whether the replay should go out now.
 *
 * False once it has gone out for this session — the duplicate guard is on the
 * SESSION id rather than a boolean, so a participant who attends a later
 * workshop and misses that one still gets that session's replay.
 */
export function shouldSendReplay(participant: WorkshopParticipant): boolean {
  if (!isNoShow(participant)) return false
  return participant.replaySentForSession !== participant.sessionId
}

/** Claims the replay. Idempotent: a second call is a no-op, not a second send. */
export function markReplaySent(participant: WorkshopParticipant): WorkshopParticipant {
  if (!shouldSendReplay(participant)) return participant
  return { ...participant, replaySentForSession: participant.sessionId }
}

/** Survey-complete only on actual submission — never on open, never on send. */
export function recordSurveySubmission(
  participant: WorkshopParticipant,
  interest: RetreatInterest | null,
): WorkshopParticipant {
  return { ...participant, surveySubmitted: true, retreatInterest: interest }
}

/**
 * Interest is an interest signal. It is never a registration.
 *
 * There is deliberately no function in this module that could produce a
 * retreat registration, and no field on WorkshopParticipant that could hold
 * one. The nearest thing to a booking this file can express is "this person
 * said maybe".
 */
export function hasRetreatInterest(participant: WorkshopParticipant): boolean {
  return participant.retreatInterest === 'yes' || participant.retreatInterest === 'maybe'
}

/** The statuses that currently apply. Derived, never stored ahead of the facts. */
export function statuses(participant: WorkshopParticipant): WorkshopStatus[] {
  const out: WorkshopStatus[] = []
  if (participant.registered) out.push('registered')
  if (isAttendee(participant)) out.push('attended')
  if (isNoShow(participant)) out.push('no-show')
  if (participant.replaySentForSession === participant.sessionId) out.push('replay-sent')
  if (participant.surveySubmitted) out.push('survey-complete')
  if (hasRetreatInterest(participant)) out.push('retreat-interest')
  return out
}

/** Whether the one approved reflection reminder is due. One, and only one. */
export function shouldSendReflectionReminder(
  participant: WorkshopParticipant,
  reminderAlreadySent: boolean,
): boolean {
  if (reminderAlreadySent || participant.surveySubmitted) return false
  return isAttendee(participant) || participant.replaySentForSession === participant.sessionId
}

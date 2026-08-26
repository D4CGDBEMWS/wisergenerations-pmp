// ---------------------------------------------------------------------------
// The Virtual Workshop survey and its KPIs.
//
// ── THE QUESTIONS ARE TRANSCRIBED AND NOT YET APPROVED ─────────────────────
//
// Ten questions, verbatim from the Survey & 15-Day Reporting System artifact,
// whose own Owner Approval Queue lists "10 survey questions … OWNER REVIEW".
// So `SURVEY_APPROVED` is false and stays false until the owner says
// otherwise. Nothing participant-facing should ship on OWNER REVIEW wording.
//
// ── WHAT THIS IS NOT ───────────────────────────────────────────────────────
//
// Not a score. Not a grade. Not a ranking. Not an urgency inference. The
// artifact is explicit — "This is not an assessment score or participant
// ranking" — and the assessment work already established what happens when a
// system starts quietly classifying people from their answers.
//
// So there is no participantScore() here and no function that returns a
// verdict about a person. The KPIs below describe a COHORT and an operation.
//
// ── NEVER INVENT A MISSING VALUE ───────────────────────────────────────────
//
// "Calculate formulas deterministically; never invent missing values."
//
// Every rate and average returns null rather than zero when the denominator is
// empty. Zero is a real, reportable finding — "nobody answered" is not, and a
// report that prints 0.0 for an unanswered question is lying quietly.
// ---------------------------------------------------------------------------

export const SURVEY_APPROVED = false

export type SurveyResponseKind = 'scale-1-5' | 'agreement-1-5' | 'yes-not-yet' | 'text' | 'interest'

export interface SurveyQuestion {
  readonly id: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5' | 'Q6' | 'Q7' | 'Q8' | 'Q9' | 'Q10'
  readonly measure: string
  readonly question: string
  readonly kind: SurveyResponseKind
  readonly optional: boolean
}

/** Verbatim. Pending owner approval; see SURVEY_APPROVED. */
export const SURVEY_QUESTIONS: readonly SurveyQuestion[] = [
  {
    id: 'Q1',
    measure: 'Clarity',
    question:
      'After the workshop, how clear are you about the project that deserves your attention now?',
    kind: 'scale-1-5',
    optional: false,
  },
  {
    id: 'Q2',
    measure: 'Current reality',
    question: 'The workshop helped me see what is true about my project today.',
    kind: 'agreement-1-5',
    optional: false,
  },
  {
    id: 'Q3',
    measure: 'Road awareness',
    question:
      'The workshop helped me recognize resources, people, risks, issues, opportunities, or dependencies that may affect my project.',
    kind: 'agreement-1-5',
    optional: false,
  },
  {
    id: 'Q4',
    measure: 'First Move',
    question: 'I can identify a First Move or Next Wise Move for my project.',
    kind: 'yes-not-yet',
    optional: false,
  },
  {
    id: 'Q5',
    measure: 'Action',
    question: 'What is the Next Wise Move you plan to take within the next 24–48 hours?',
    kind: 'text',
    optional: true,
  },
  {
    id: 'Q6',
    measure: 'Value',
    question:
      'How useful was this workshop in helping you approach your project more intentionally?',
    kind: 'scale-1-5',
    optional: false,
  },
  {
    id: 'Q7',
    measure: 'Transfer',
    question:
      'How confident are you that you can use what you practiced today on another project in your life?',
    kind: 'scale-1-5',
    optional: false,
  },
  {
    id: 'Q8',
    measure: 'Continue',
    question: 'What would help you continue moving your project forward?',
    kind: 'text',
    optional: true,
  },
  {
    id: 'Q9',
    measure: 'Retreat interest',
    question:
      'Would you like information about an upcoming LIAP Retreat, where participants work through their project in a deeper facilitated experience and leave with a Completed Life Project Plan™?',
    kind: 'interest',
    optional: false,
  },
  {
    id: 'Q10',
    measure: 'Experience',
    question: 'Is there anything else you would like us to know about your workshop experience?',
    kind: 'text',
    optional: true,
  },
]

export interface SurveyResponse {
  readonly q1?: number
  readonly q2?: number
  readonly q3?: number
  readonly q4?: 'yes' | 'not-yet'
  readonly q6?: number
  readonly q7?: number
  readonly q9?: 'yes' | 'maybe' | 'not-now'
}

export interface CohortCounts {
  readonly registrations: number
  readonly liveAttendance: number
  readonly noShows: number
  readonly replayDeliveries: number
  readonly surveysCompleted: number
  readonly surveyEligible: number
  readonly automationExceptions: number
}

export interface WorkshopKpis {
  readonly registrations: number
  readonly liveAttendance: number
  readonly noShows: number
  /** Percent, or null when nobody registered. */
  readonly attendanceRate: number | null
  readonly replayDeliveries: number
  readonly surveyResponseRate: number | null
  readonly projectClarity: number | null
  readonly currentRealityValue: number | null
  readonly roadAwareness: number | null
  /** Percent of Q4 responses that were Yes. Denominator is Q4 answers only. */
  readonly firstMoveReadiness: number | null
  readonly workshopUsefulness: number | null
  readonly transferConfidence: number | null
  readonly retreatInterestYes: number
  readonly retreatInterestMaybe: number
  readonly automationExceptions: number
}

/** Null on an empty denominator. A rate nobody could compute is not zero. */
function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return (numerator / denominator) * 100
}

function average(values: readonly (number | undefined)[]): number | null {
  const given = values.filter((v): v is number => typeof v === 'number')
  if (given.length === 0) return null
  return given.reduce((a, b) => a + b, 0) / given.length
}

/**
 * The KPI dictionary, computed. Nothing here interprets.
 *
 * It will not tell you a cohort was satisfied, will not compare one
 * participant to another, and will not read a non-response as a signal. It
 * counts what happened and divides where the dictionary says to divide.
 */
export function calculateKpis(
  counts: CohortCounts,
  responses: readonly SurveyResponse[],
): WorkshopKpis {
  const q4 = responses.map((r) => r.q4).filter((v): v is 'yes' | 'not-yet' => v !== undefined)
  return {
    registrations: counts.registrations,
    liveAttendance: counts.liveAttendance,
    noShows: counts.noShows,
    attendanceRate: rate(counts.liveAttendance, counts.registrations),
    replayDeliveries: counts.replayDeliveries,
    surveyResponseRate: rate(counts.surveysCompleted, counts.surveyEligible),
    projectClarity: average(responses.map((r) => r.q1)),
    currentRealityValue: average(responses.map((r) => r.q2)),
    roadAwareness: average(responses.map((r) => r.q3)),
    firstMoveReadiness: rate(q4.filter((v) => v === 'yes').length, q4.length),
    workshopUsefulness: average(responses.map((r) => r.q6)),
    transferConfidence: average(responses.map((r) => r.q7)),
    // Reported separately, per the dictionary. Summing them would turn two
    // different answers into one number and imply a pipeline that does not
    // exist.
    retreatInterestYes: responses.filter((r) => r.q9 === 'yes').length,
    retreatInterestMaybe: responses.filter((r) => r.q9 === 'maybe').length,
    automationExceptions: counts.automationExceptions,
  }
}

/** The 15-day timeline. LOCKED REQUIREMENT per the artifact's approval queue. */
export const REPORTING_TIMELINE = [
  { when: 'Event day', action: 'Capture registrations, attendance, and operational exceptions.' },
  { when: 'Days 0–1', action: 'Send approved attendee follow-up and no-show replay after reconciliation.' },
  { when: 'Days 1–7', action: 'Collect surveys; send one approved reminder if configured.' },
  { when: 'Days 8–12', action: 'Reconcile statuses, calculate KPIs, summarize themes, investigate exceptions.' },
  { when: 'Days 13–14', action: 'Draft owner report and identify decisions requiring approval.' },
  { when: 'By Day 15', action: 'Deliver final owner report.' },
] as const

export const REPORT_DUE_DAYS = 15

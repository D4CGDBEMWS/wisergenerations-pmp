// ---------------------------------------------------------------------------
// Life Project-Ready™ Assessment — version LIAP_READY_V1.
//
// THIS FILE IS IMMUTABLE ONCE PUBLISHED.
//
// A completed assessment records the version that scored it. Editing a
// question or a scale here would silently change what an existing customer's
// 17/25 means, and there would be no way to tell from the stored result that
// it had happened. A test compares a hash of this definition against the
// assessment_versions row, so an edit fails the build.
//
// To change the assessment: add v2.ts, publish it as a new version, and leave
// this file alone.
//
// Voice: every question is written so that agreeing is the healthier answer
// and so that a low score reads as "not yet", never as a verdict on the
// person. Someone completing this has usually just had something happen to
// them.
// ---------------------------------------------------------------------------

export const VERSION_KEY = 'LIAP_READY_V1'

export const DIMENSION_KEYS = [
  'vision',
  'time',
  'money',
  'career',
  'relationships',
  'risk',
  'wellness',
  'legacy',
] as const

export type DimensionKey = (typeof DIMENSION_KEYS)[number]

export interface Dimension {
  key: DimensionKey
  name: string
  /** Shown above the five questions, so the section has a stated purpose. */
  intro: string
}

export const DIMENSIONS: readonly Dimension[] = [
  {
    key: 'vision',
    name: 'Vision',
    intro: 'How clearly you can picture where this is going.',
  },
  {
    key: 'time',
    name: 'Time',
    intro: 'Whether your days currently have room for what matters.',
  },
  {
    key: 'money',
    name: 'Money',
    intro: 'How steady your financial footing is while this plays out.',
  },
  {
    key: 'career',
    name: 'Career & Purpose',
    intro: 'How well your work and your sense of purpose line up right now.',
  },
  {
    key: 'relationships',
    name: 'Relationships & Stakeholders',
    intro: 'Who is alongside you, and whether they know what you need.',
  },
  {
    key: 'risk',
    name: 'Risk & Readiness',
    intro: 'What is protected, and what would hurt if it went wrong.',
  },
  {
    key: 'wellness',
    name: 'Wellness & Capacity',
    intro: 'The energy and health you have available to spend on this.',
  },
  {
    key: 'legacy',
    name: 'Legacy & Meaning',
    intro: 'What you want this chapter to have been for.',
  },
] as const

export interface ScoredQuestion {
  key: string
  dimension: DimensionKey
  text: string
}

/** The 1–5 scale, worded so the midpoint is honest rather than evasive. */
export const SCALE = [
  { value: 1, label: 'Not true for me right now' },
  { value: 2, label: 'Rarely true' },
  { value: 3, label: 'Somewhat true' },
  { value: 4, label: 'Mostly true' },
  { value: 5, label: 'Very true' },
] as const

export const QUESTIONS: readonly ScoredQuestion[] = [
  // --- Vision ---------------------------------------------------------------
  { key: 'vision_1', dimension: 'vision', text: 'I can describe what I want the next chapter of my life to look like.' },
  { key: 'vision_2', dimension: 'vision', text: 'I know what a good outcome would be for the change I am going through.' },
  { key: 'vision_3', dimension: 'vision', text: 'I have thought past the immediate problem to what comes after it.' },
  { key: 'vision_4', dimension: 'vision', text: 'The decisions I am making now point in a direction I have chosen.' },
  { key: 'vision_5', dimension: 'vision', text: 'I could explain where I am headed to someone who cares about me.' },

  // --- Time -----------------------------------------------------------------
  { key: 'time_1', dimension: 'time', text: 'I have time in an ordinary week to work on what matters, not only on what is urgent.' },
  { key: 'time_2', dimension: 'time', text: 'I can protect a block of time when something is important to me.' },
  { key: 'time_3', dimension: 'time', text: 'My commitments are ones I chose rather than ones that accumulated.' },
  { key: 'time_4', dimension: 'time', text: 'I know which things I would set down if I needed to make room.' },
  { key: 'time_5', dimension: 'time', text: 'I am not so busy that I am unable to think clearly about this.' },

  // --- Money ----------------------------------------------------------------
  { key: 'money_1', dimension: 'money', text: 'I know what I have coming in and going out each month.' },
  { key: 'money_2', dimension: 'money', text: 'I could cover an unexpected expense without it becoming a crisis.' },
  { key: 'money_3', dimension: 'money', text: 'My finances could absorb this change without immediate damage.' },
  { key: 'money_4', dimension: 'money', text: 'I know what I would cut first if income dropped.' },
  { key: 'money_5', dimension: 'money', text: 'Money worries are not the loudest thing in my head right now.' },

  // --- Career & Purpose -----------------------------------------------------
  { key: 'career_1', dimension: 'career', text: 'What I do most days is worth doing.' },
  { key: 'career_2', dimension: 'career', text: 'My skills and experience are relevant to where I want to go next.' },
  { key: 'career_3', dimension: 'career', text: 'I know what I would want to be doing if the current arrangement ended.' },
  { key: 'career_4', dimension: 'career', text: 'I have kept up with what my field now expects.' },
  { key: 'career_5', dimension: 'career', text: 'My work and my sense of purpose are pointed in the same direction.' },

  // --- Relationships & Stakeholders ----------------------------------------
  { key: 'relationships_1', dimension: 'relationships', text: 'The people affected by this change know what is happening.' },
  { key: 'relationships_2', dimension: 'relationships', text: 'There is someone I can be honest with about how this is going.' },
  { key: 'relationships_3', dimension: 'relationships', text: 'I know who needs to be part of the decisions ahead.' },
  { key: 'relationships_4', dimension: 'relationships', text: 'I am able to ask for help when I need it.' },
  { key: 'relationships_5', dimension: 'relationships', text: 'The important relationships in my life are in reasonable repair.' },

  // --- Risk & Readiness -----------------------------------------------------
  { key: 'risk_1', dimension: 'risk', text: 'I know what would hurt most if it went wrong in the next few months.' },
  { key: 'risk_2', dimension: 'risk', text: 'The essentials — housing, income, insurance, health cover — are in order.' },
  { key: 'risk_3', dimension: 'risk', text: 'I could put my hands on the documents and records I would need quickly.' },
  { key: 'risk_4', dimension: 'risk', text: 'I have thought about what happens if this does not go the way I hope.' },
  { key: 'risk_5', dimension: 'risk', text: 'I am not carrying a risk I keep meaning to deal with and have not.' },

  // --- Wellness & Capacity --------------------------------------------------
  { key: 'wellness_1', dimension: 'wellness', text: 'I have the energy to take on what this change asks of me.' },
  { key: 'wellness_2', dimension: 'wellness', text: 'I am sleeping well enough to think clearly.' },
  { key: 'wellness_3', dimension: 'wellness', text: 'My health is not something I am currently ignoring.' },
  { key: 'wellness_4', dimension: 'wellness', text: 'I have something in my week that restores rather than drains me.' },
  { key: 'wellness_5', dimension: 'wellness', text: 'I can carry the current level of stress for as long as this will take.' },

  // --- Legacy & Meaning -----------------------------------------------------
  { key: 'legacy_1', dimension: 'legacy', text: 'I know what I want this period of my life to have counted for.' },
  { key: 'legacy_2', dimension: 'legacy', text: 'The way I am handling this is one I would be willing to explain later.' },
  { key: 'legacy_3', dimension: 'legacy', text: 'I am building something that outlasts the immediate situation.' },
  { key: 'legacy_4', dimension: 'legacy', text: 'What I value and how I spend my time are reasonably close together.' },
  { key: 'legacy_5', dimension: 'legacy', text: 'I could name what I would want said about how I handled this.' },
] as const

// ---------------------------------------------------------------------------
// Transition intake.
//
// Asked BEFORE the scored questions, because a score means something different
// depending on what happened. A Money score of 12 is a different situation for
// someone who chose to retire than for someone who lost a job on Friday.
// ---------------------------------------------------------------------------

export const CHANGE_TYPES = [
  { key: 'expected', label: 'Expected or chosen' },
  { key: 'unexpected', label: 'Unexpected or disruptive' },
  { key: 'opportunity', label: 'An opportunity or a chance to grow' },
  { key: 'preparing', label: 'Preparing for a possible change' },
] as const

export type ChangeType = (typeof CHANGE_TYPES)[number]['key']

export const AREAS = [
  { key: 'career', label: 'Career or work' },
  { key: 'business', label: 'Business' },
  { key: 'money', label: 'Money' },
  { key: 'relationship', label: 'Relationship or family' },
  { key: 'relocation', label: 'Relocation' },
  { key: 'education', label: 'Education' },
  { key: 'retirement', label: 'Retirement' },
  { key: 'caregiving', label: 'Caregiving' },
  { key: 'loss', label: 'Loss' },
  { key: 'purpose', label: 'Purpose or calling' },
  { key: 'other', label: 'Something else' },
] as const

export type AreaKey = (typeof AREAS)[number]['key']

/**
 * The open-ended questions. Every key here is stored in
 * assessment_narratives and deleted at 90 days — nowhere else.
 */
export const NARRATIVE_QUESTIONS = [
  {
    key: 'what_changed',
    label: 'In one sentence, what changed — or what are you preparing to change?',
    placeholder: 'You do not need to explain it fully. A sentence is enough.',
  },
  {
    key: 'important_decision',
    label: 'What decision or next step feels most important right now?',
    placeholder: 'The one that is hardest to stop thinking about.',
  },
  {
    key: 'ninety_day_better',
    label: 'What would better look like 90 days from now?',
    placeholder: 'Describe the situation you would like to be in.',
  },
] as const

export type NarrativeKey = (typeof NARRATIVE_QUESTIONS)[number]['key']

// ---------------------------------------------------------------------------
// Steps. Deliberately not one long page: forty questions in a single scroll is
// where people abandon, and the section headings let someone see the shape of
// what they are being asked.
// ---------------------------------------------------------------------------

export interface Step {
  index: number
  title: string
  /** Empty for the intake, review and results steps. */
  dimensions: readonly DimensionKey[]
}

export const STEPS: readonly Step[] = [
  { index: 1, title: 'Your change', dimensions: [] },
  { index: 2, title: 'Vision & Time', dimensions: ['vision', 'time'] },
  { index: 3, title: 'Money & Career', dimensions: ['money', 'career'] },
  { index: 4, title: 'Relationships & Risk', dimensions: ['relationships', 'risk'] },
  { index: 5, title: 'Wellness & Legacy', dimensions: ['wellness', 'legacy'] },
  { index: 6, title: 'Review', dimensions: [] },
] as const

/** The last step a customer fills in. Step 7 is the result, which is a page. */
export const FINAL_STEP = 6

export function questionsForDimension(dimension: DimensionKey): readonly ScoredQuestion[] {
  return QUESTIONS.filter((q) => q.dimension === dimension)
}

export function questionsForStep(index: number): readonly ScoredQuestion[] {
  const step = STEPS.find((s) => s.index === index)
  if (!step) return []
  return QUESTIONS.filter((q) => step.dimensions.includes(q.dimension))
}

/**
 * A stable fingerprint of everything that affects a score.
 *
 * Question keys, their order, their dimension and their text, plus the scale.
 * Wording is included on purpose: rephrasing a question changes what people
 * answer, so it changes the instrument even though the arithmetic is
 * untouched.
 */
export function definitionFingerprint(): string {
  return JSON.stringify({
    version: VERSION_KEY,
    scale: SCALE.map((s) => [s.value, s.label]),
    dimensions: DIMENSIONS.map((d) => d.key),
    questions: QUESTIONS.map((q) => [q.key, q.dimension, q.text]),
    narratives: NARRATIVE_QUESTIONS.map((n) => n.key),
  })
}

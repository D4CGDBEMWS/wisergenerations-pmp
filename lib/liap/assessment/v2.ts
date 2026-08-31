// ---------------------------------------------------------------------------
// Life Project-Ready™ Assessment — version LIAP_READY_V2.
//
// THIS FILE IS IMMUTABLE ONCE PUBLISHED. Same contract as v1: a completed
// assessment records the version that scored it, and assessment-service
// refuses to proceed if this definition's hash stops matching the published
// row. To change the assessment again, add v3 and leave this alone.
//
// ── WHY A NEW VERSION RATHER THAN AN EDIT ──────────────────────────────────
//
// The owner's question-by-question review, 31 August 2026, replaced one scored
// dimension and reworded all forty questions. v1 says in its own header that
// it must not be edited after publication, and the service enforces it. So v1
// stays exactly as it is, as the record of what any v1 assessment was scored
// against, and this file is what the assessment is now.
//
// ── WHAT CHANGED FROM V1 ───────────────────────────────────────────────────
//
//   Risk & Readiness           → Spiritual Readiness   (key risk → spiritual)
//   Relationships & Stakeholders → Relationships       (label only)
//   Wellness & Capacity        → Health & Wellness     (label only)
//   Legacy & Meaning           → Legacy & Impact       (label only)
//
// One key changes, three are renamed labels over stable keys. That asymmetry
// is deliberate: a stored dimension_key is the join between a saved score and
// its meaning, so a key is only changed when the dimension genuinely became a
// different thing. Renaming a label costs nothing; renaming a key orphans data.
//
// Risk is not gone from LIAP. It is no longer one of the eight scored
// dimensions, and it remains in the planning logic, the recommendations and
// the hidden-urgency safeguard — see lib/liap/recommendations.ts.
//
// ── QUESTION TEXT ──────────────────────────────────────────────────────────
//
// All forty questions are transcribed verbatim from the owner-approved master.
// Not reworded, not tidied, not shortened. A test compares every one of them
// character for character.
// ---------------------------------------------------------------------------

export const VERSION_KEY = 'LIAP_READY_V2'

export const DIMENSION_KEYS = [
  'vision',
  'time',
  'money',
  'career',
  'relationships',
  'wellness',
  'spiritual',
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
    name: 'Relationships',
    intro: 'Who is alongside you, and whether they know what you need.',
  },
  {
    key: 'wellness',
    name: 'Health & Wellness',
    intro: 'The energy and health you have available to spend on this.',
  },
  {
    key: 'spiritual',
    name: 'Spiritual Readiness',
    intro: 'Where you are seeking wisdom, and what you are trusting God with.',
  },
  {
    key: 'legacy',
    name: 'Legacy & Impact',
    intro: 'What you want this chapter to have been for, and who it reaches.',
  },
] as const

export interface ScoredQuestion {
  key: string
  dimension: DimensionKey
  text: string
}

/** The 1–5 scale, unchanged from v1. Deterministic; nothing infers a score. */
export const SCALE = [
  { value: 1, label: 'Not true for me right now' },
  { value: 2, label: 'Rarely true' },
  { value: 3, label: 'Somewhat true' },
  { value: 4, label: 'Mostly true' },
  { value: 5, label: 'Very true' },
] as const

/**
 * The forty approved questions, in the owner's order.
 *
 * Keys follow {dimension}_{1..5} rather than q1..q40 so a key still says what
 * it measures when it turns up alone in a database row. The canonical Q number
 * is the position in this array: Vision is Q1–Q5, Time Q6–Q10, and so on.
 */
export const QUESTIONS: readonly ScoredQuestion[] = [
  // --- 1. Vision — Q1–Q5 ----------------------------------------------------
  { key: 'vision_1', dimension: 'vision', text: 'I can describe what I want the next season of my life to look like.' },
  { key: 'vision_2', dimension: 'vision', text: 'I know which outcomes matter most to me right now.' },
  { key: 'vision_3', dimension: 'vision', text: 'I can distinguish what I truly want from what others expect of me.' },
  { key: 'vision_4', dimension: 'vision', text: 'I have identified what I want to preserve even though circumstances are changing.' },
  { key: 'vision_5', dimension: 'vision', text: 'I can describe what “better” would look like 90 days from now.' },

  // --- 2. Time — Q6–Q10 -----------------------------------------------------
  { key: 'time_1', dimension: 'time', text: 'I know where most of my time is currently going.' },
  { key: 'time_2', dimension: 'time', text: 'My calendar reflects the priorities I say matter most.' },
  { key: 'time_3', dimension: 'time', text: 'I have enough margin to respond when something unexpected happens.' },
  { key: 'time_4', dimension: 'time', text: 'I can identify commitments that no longer deserve my time.' },
  { key: 'time_5', dimension: 'time', text: 'I consistently protect time for what matters most.' },

  // --- 3. Money — Q11–Q15 ---------------------------------------------------
  { key: 'money_1', dimension: 'money', text: 'I understand my current financial picture well enough to make informed decisions.' },
  { key: 'money_2', dimension: 'money', text: 'My spending generally reflects what I say matters most.' },
  { key: 'money_3', dimension: 'money', text: 'I know which financial obligations limit my options right now.' },
  { key: 'money_4', dimension: 'money', text: 'I have identified financial resources I may be overlooking or underusing.' },
  { key: 'money_5', dimension: 'money', text: 'I am taking practical steps to strengthen my financial position.' },

  // --- 4. Career & Purpose — Q16–Q20 ----------------------------------------
  { key: 'career_1', dimension: 'career', text: 'I can explain what meaningful work looks like for me in this season.' },
  { key: 'career_2', dimension: 'career', text: 'I understand which of my skills and experiences are most valuable right now.' },
  { key: 'career_3', dimension: 'career', text: 'I know where my current work aligns—and does not align—with my values and priorities.' },
  { key: 'career_4', dimension: 'career', text: 'I can identify opportunities to use my abilities in ways I may not have considered before.' },
  { key: 'career_5', dimension: 'career', text: 'I am taking intentional steps toward work or contribution that reflects my purpose.' },

  // --- 5. Relationships — Q21–Q25 -------------------------------------------
  { key: 'relationships_1', dimension: 'relationships', text: 'I can identify the people who provide healthy support, wisdom, or encouragement in this season of my life.' },
  { key: 'relationships_2', dimension: 'relationships', text: 'I am giving appropriate time and attention to the relationships that matter most to me.' },
  { key: 'relationships_3', dimension: 'relationships', text: 'I communicate clearly with people who may be affected by the decisions I make.' },
  { key: 'relationships_4', dimension: 'relationships', text: 'I can establish healthy boundaries when they are necessary to protect my well-being, priorities, or relationships.' },
  { key: 'relationships_5', dimension: 'relationships', text: 'I know when to seek input or support from others and when a decision is mine to make.' },

  // --- 6. Health & Wellness — Q26–Q30 ---------------------------------------
  { key: 'wellness_1', dimension: 'wellness', text: 'I pay attention to signs that stress, exhaustion, or lack of rest may be affecting my well-being or decisions.' },
  { key: 'wellness_2', dimension: 'wellness', text: 'I understand my current capacity and can recognize when I am taking on more than I can realistically carry.' },
  { key: 'wellness_3', dimension: 'wellness', text: 'I have healthy routines or practices that support my physical, mental, and emotional well-being.' },
  { key: 'wellness_4', dimension: 'wellness', text: 'I know when to seek appropriate professional, practical, or community support rather than trying to handle everything alone.' },
  { key: 'wellness_5', dimension: 'wellness', text: 'I make room for rest, reflection, and recovery so I can make thoughtful rather than purely reactive decisions.' },

  // --- 7. Spiritual Readiness — Q31–Q35 -------------------------------------
  { key: 'spiritual_1', dimension: 'spiritual', text: 'I make intentional time to seek God for wisdom and direction before making important decisions.' },
  { key: 'spiritual_2', dimension: 'spiritual', text: 'I can distinguish between moving from faith and purpose and reacting from fear, pressure, or impatience.' },
  { key: 'spiritual_3', dimension: 'spiritual', text: 'I consider whether my choices align with my faith, values, and the principles I believe God has called me to live by.' },
  { key: 'spiritual_4', dimension: 'spiritual', text: 'I can trust God with what I cannot control while taking responsibility for what He has placed within my ability to do.' },
  { key: 'spiritual_5', dimension: 'spiritual', text: 'I am willing to adjust my plans when prayer, wisdom, or circumstances reveal that a different direction may be needed.' },

  // --- 8. Legacy & Impact — Q36–Q40 -----------------------------------------
  { key: 'legacy_1', dimension: 'legacy', text: 'My decisions reflect the values and principles I want my life to be known for.' },
  { key: 'legacy_2', dimension: 'legacy', text: 'I consider how the decisions I make today may shape my future and the opportunities available to me later.' },
  { key: 'legacy_3', dimension: 'legacy', text: 'I consider how my choices may affect my family, the people connected to me, and those who may come after me.' },
  { key: 'legacy_4', dimension: 'legacy', text: 'I am intentional about turning what I have learned, overcome, or been entrusted with into something that can benefit others.' },
  { key: 'legacy_5', dimension: 'legacy', text: 'I can identify something of lasting value—wisdom, resources, relationships, opportunities, or impact—that I want to leave behind.' },
] as const

// Intake vocabulary, unchanged from v1. These describe the change a person is
// going through; the owner's review covered the scored questions, not these.
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

/** Free text. Isolated in its own table and purged at ninety days. */
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

export interface Step {
  index: number
  title: string
  dimensions: readonly DimensionKey[]
}

/** Two dimensions a step, so no screen asks for more than ten answers. */
export const STEPS: readonly Step[] = [
  { index: 1, title: 'Your change', dimensions: [] },
  { index: 2, title: 'Vision & Time', dimensions: ['vision', 'time'] },
  { index: 3, title: 'Money & Career', dimensions: ['money', 'career'] },
  { index: 4, title: 'Relationships & Health', dimensions: ['relationships', 'wellness'] },
  { index: 5, title: 'Spiritual Readiness & Legacy', dimensions: ['spiritual', 'legacy'] },
  { index: 6, title: 'Review', dimensions: [] },
] as const

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
 * answer, so it changes the instrument even though the arithmetic is untouched.
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

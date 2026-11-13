// ---------------------------------------------------------------------------
// The professional conduct standard.
//
// ── WHY THIS IS A MODULE AND NOT COPY IN A COMPONENT ───────────────────────
//
// This text appears on the safety page, in the booking confirmation flow, and
// is stored verbatim in conduct_acknowledgments so that a record of what
// somebody agreed to survives any later rewording. Three consumers, one
// source. A test asserts the message character-for-character.
//
// The wording is the founder's. It is not to be softened, expanded,
// paraphrased or "improved".
// ---------------------------------------------------------------------------

/** Founder-approved, verbatim. Do not alter. */
export const SAFETY_MESSAGE = 'This is not That!~ Stay professional!'

/** What is prohibited between providers and customers. Founder-approved. */
export const PROHIBITED_CONDUCT: readonly string[] = [
  'Sexual favors',
  'Romantic or intimate services',
  'Hugs',
  'Kisses',
  'Massages',
  'Affectionate touching',
  'Physical contact between providers and customers',
]

/** Service domains VillageTrade does not host. Founder ruling. */
export const EXCLUDED_SERVICES: readonly string[] = ['Childcare', 'Eldercare']

/**
 * The exact text a person acknowledges before a booking is confirmed, stored
 * verbatim alongside their acknowledgment.
 */
export function conductAgreementText(): string {
  return [
    SAFETY_MESSAGE,
    '',
    'VillageTrade exchanges are professional services between neighbours. The following are prohibited:',
    ...PROHIBITED_CONDUCT.map((p) => `- ${p}`),
    '',
    `VillageTrade does not host: ${EXCLUDED_SERVICES.join(', ')}.`,
    '',
    'I understand that identity verification does not guarantee anyone’s safety or conduct, that VillageTrade does not supervise exchanges, and that I am responsible for my own judgement about whom I meet and where.',
  ].join('\n')
}

/**
 * Phrases that must never appear on a customer-facing surface.
 *
 * Founder instruction: do not imply that verification guarantees safety. The
 * failure mode here is not a lie somebody tells on purpose — it is a
 * well-meaning marketing sentence written months from now by someone who
 * never read this file. A test scans the rendered copy for these.
 */
export const FORBIDDEN_SAFETY_CLAIMS: readonly string[] = [
  'guaranteed safe',
  'guarantees your safety',
  'guaranteed secure',
  '100% safe',
  'completely safe',
  'fully vetted',
  'background checked',
  'we verify everyone',
  'always safe',
  'risk-free',
]

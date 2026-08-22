import { STUDY_ACCESS } from '@/lib/entitlements'
import { LOGIN_PRODUCTS, type LoginProduct } from '@/lib/auth/login-token'

// ---------------------------------------------------------------------------
// Program-aware sign-in.
//
// Owner ruling, 22 August 2026:
//
//   ONE IDENTITY
//   + SHARED AUTHENTICATION INFRASTRUCTURE
//   + PROGRAM-SPECIFIC ENTRY EXPERIENCE
//   + PROGRAM-SPECIFIC AUTHORIZATION
//
// One customer record, one session mechanism, one token table — and a LIAP
// reader who has never heard of the PMP exam should never be shown a page
// about Study Access, nor receive an email about it.
//
// ── THE RULE THAT KEEPS THIS FROM BEING A PRIVILEGE ESCALATION ─────────────
//
// A caller chooses the program. That choice controls PRESENTATION and
// DESTINATION and nothing else. It cannot be used to obtain access the caller
// does not already hold, because the entitlement required is a property of the
// program looked up here — never a value the caller supplies.
//
// Asking for `program: 'study'` does not grant Study Access; it asks whether
// this address already holds it, and sends nothing if it does not. Choosing a
// program you have no standing in gets you the same silence as choosing one
// you do: the response is identical either way, so the endpoint cannot be used
// to discover which programs an address belongs to.
//
// ── WHY THE COPY LIVES HERE ────────────────────────────────────────────────
//
// The LIAP strings are the owner's approved wording, verbatim. Keeping them in
// one table rather than inline in a route means the next program is a new
// entry rather than a new branch in an email function, and means the approved
// text has exactly one home to check.
//
// Boot Camp is deliberately absent. Adding it is an entry here plus a page —
// and it is not authorised.
// ---------------------------------------------------------------------------

export interface ProgramLogin {
  /** Held by anyone permitted to sign in to this program. Never caller-supplied. */
  readonly entitlementKey: string
  /** Where the sign-in form lives, for redirects that need to send someone to it. */
  readonly signInPath: string
  /** Where the link lands. Must be on this program's destination allow-list. */
  readonly defaultDestination: string
  readonly emailSubject: string
  /** The line under the greeting. */
  readonly emailIntro: string
  readonly emailCta: string
  readonly emailIgnore: string
}

const PROGRAM_LOGIN: Record<LoginProduct, ProgramLogin> = {
  // Unchanged wording, so a Study Access customer's experience is exactly what
  // it was before programs became a concept.
  study: {
    entitlementKey: STUDY_ACCESS,
    signInPath: '/access/login',
    defaultDestination: '/exam-simulator',
    emailSubject: 'Your Wiser Generations Study Access login link',
    emailIntro: 'Use the secure link below to sign in to Study Access.',
    emailCta: 'Sign in',
    emailIgnore: 'If you didn’t request this, you can ignore it.',
  },

  // Owner-approved wording, 22 August 2026. Verbatim; not to be rewritten.
  liap: {
    entitlementKey: 'LIAP_ASSESSMENT_ACCESS',
    signInPath: '/life-is-a-project/access',
    defaultDestination: '/life-is-a-project/assessment',
    emailSubject: 'Your secure LIAP access link',
    emailIntro: 'Use the secure link below to continue your LIAP journey.',
    emailCta: 'CONTINUE MY LIAP JOURNEY',
    emailIgnore: 'If you didn’t request this link, you can ignore this email.',
  },
}

export function programLogin(product: LoginProduct): ProgramLogin {
  return PROGRAM_LOGIN[product]
}

/**
 * Reads a caller-supplied program name.
 *
 * Anything unrecognised becomes Study Access, which preserves every existing
 * caller — the current sign-in form sends no program at all. Falling back to a
 * program rather than rejecting is safe here for the reason above: the choice
 * selects which entitlement is REQUIRED, so the worst a wrong value can do is
 * ask the wrong question and get no email.
 */
export function readProgram(raw: unknown): LoginProduct {
  const value = typeof raw === 'string' ? raw.trim() : ''
  return (LOGIN_PRODUCTS as readonly string[]).includes(value)
    ? (value as LoginProduct)
    : 'study'
}

/**
 * The first name to greet with, or null.
 *
 * Null means the greeting line is omitted entirely rather than rendering
 * "Hi ," — an email that gets someone's name wrong reads worse than one that
 * does not use it.
 */
export function firstNameOf(name: string | null | undefined): string | null {
  const first = (name ?? '').trim().split(/\s+/)[0] ?? ''
  return first.length > 0 ? first : null
}

const BRAND_HEADER =
  `<div style="background:#0A1628;padding:24px;text-align:center;border-radius:8px 8px 0 0">` +
  `<h1 style="color:#C9A84C;margin:0;font-size:24px">Wiser Generations</h1></div>`

/**
 * The email body for one program.
 *
 * The expiry sentence is not part of the per-program copy: it describes the
 * authentication mechanism rather than the program, it is the same fact for
 * everybody, and it must survive any rewording of the marketing lines around
 * it.
 */
export function loginEmailHtml(
  product: LoginProduct,
  loginUrl: string,
  firstName: string | null
): string {
  const copy = programLogin(product)
  const greeting = firstName
    ? `<p style="color:#374151;line-height:1.6;margin-top:0">Hi ${escapeHtml(firstName)},</p>`
    : ''

  return (
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">` +
    BRAND_HEADER +
    `<div style="background:#f9fafb;padding:32px;border-radius:0 0 8px 8px">` +
    greeting +
    `<p style="color:#374151;line-height:1.6">${escapeHtml(copy.emailIntro)}</p>` +
    `<p style="text-align:center;margin:32px 0">` +
    `<a href="${loginUrl}" style="background:#C9A84C;color:#0A1628;padding:14px 32px;` +
    `border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">` +
    `${escapeHtml(copy.emailCta)}</a></p>` +
    `<p style="color:#6b7280;font-size:14px">This link works once and expires in ` +
    `<strong>15 minutes</strong>.</p>` +
    `<p style="color:#6b7280;font-size:14px">${escapeHtml(copy.emailIgnore)}</p>` +
    `</div></div>`
  )
}

export function loginEmailText(
  product: LoginProduct,
  loginUrl: string,
  firstName: string | null
): string {
  const copy = programLogin(product)
  const greeting = firstName ? `Hi ${firstName},\n\n` : ''
  return (
    `${greeting}${copy.emailIntro}\n\n${loginUrl}\n\n` +
    `This link works once and expires in 15 minutes.\n\n${copy.emailIgnore}`
  )
}

/**
 * Minimal HTML escaping for values that reach the email body.
 *
 * Only the first name is interpolated from stored data, and a customer name
 * containing a bracket should render as that bracket rather than as markup.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

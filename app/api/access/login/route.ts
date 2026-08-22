import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { upsertCustomer, findCustomerByEmail } from '@/lib/customers'
import { grantEntitlement, hasEntitlement, STUDY_ACCESS } from '@/lib/entitlements'
import {
  issueLoginToken,
  consumeLoginToken,
  productForDestination,
  type LoginProduct,
} from '@/lib/auth/login-token'
import {
  programLogin,
  readProgram,
  firstNameOf,
  loginEmailHtml,
  loginEmailText,
} from '@/lib/auth/program-login'
import { identifyCheckoutSession, identifySubscription, productGrants } from '@/lib/programs'
import {
  createSession,
  SESSION_COOKIE,
  LEGACY_COOKIE,
  sessionCookieOptions,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth/session'
import { recordAuditEvent } from '@/lib/audit'

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// Study Access login.
//
// Two things changed here from the implementation the Phase 0 audit flagged:
//
//   1. Tokens live in the database, not a module-level Map. The old store was
//      per-lambda, so on Vercel a link issued by one instance was frequently
//      unverifiable by another.
//
//   2. Authorization reads an entitlement record, not Stripe. The old path ran
//      `stripe.checkout.sessions.list({ limit: 100 })` account-wide, which
//      silently stopped recognising a customer once 100 newer sessions existed.
//
// Stripe is still consulted, but only to BACKFILL a customer who has no
// entitlement row yet — bounded to that email's own customers and their own
// subscriptions and sessions, never an account-wide scan. After the first
// login the database answers on its own. That is what keeps grandfathered
// one-time purchasers working without the scan.
// ---------------------------------------------------------------------------

const RATE_LIMIT = { limit: 5, windowMs: 15 * 60_000 }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ---------------------------------------------------------------------------
// Magic-link delivery.
//
// Two providers, tried in the order of whichever is actually configured:
//
//   RESEND_API_KEY    Resend. The contact form already uses it and the free
//                     tier covers 3,000 emails a month, so this is the path
//                     that costs nothing extra.
//   MANDRILL_API_KEY  Mailchimp Transactional.
//
// The previous fallback to MAILCHIMP_API_KEY has been REMOVED. Mandrill is a
// separate add-on from the Mailchimp marketing plan and issues its own keys;
// a marketing key is rejected by Mandrill's API. Accepting it as a fallback
// could only ever produce a silent failure, which is what it did.
//
// Failures are recorded in audit_events. The POST handler deliberately always
// returns ok so the response cannot be used to enumerate customers, and that
// same silence would otherwise hide a completely dead mailer from the owner.
// The audit row is the operator's channel; the HTTP response is not.
// ---------------------------------------------------------------------------

const MAGIC_LINK_FROM =
  process.env.MAGIC_LINK_FROM_EMAIL ||
  process.env.RESEND_FROM_EMAIL ||
  'info@wisergenerations.com'
// Subject, greeting, body and call to action all come from the program the
// sign-in started in — see lib/auth/program-login. A LIAP reader receives LIAP
// language; a Study Access customer receives exactly what they received before
// programs became a concept.
interface MagicLinkMessage {
  subject: string
  html: string
  text: string
}

function magicLinkMessage(
  product: LoginProduct,
  loginUrl: string,
  firstName: string | null
): MagicLinkMessage {
  return {
    subject: programLogin(product).emailSubject,
    html: loginEmailHtml(product, loginUrl, firstName),
    text: loginEmailText(product, loginUrl, firstName),
  }
}

async function sendViaResend(apiKey: string, toEmail: string, message: MagicLinkMessage): Promise<number> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Wiser Generations <${MAGIC_LINK_FROM}>`,
      to: [toEmail],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  })
  return res.status
}

async function sendViaMandrill(apiKey: string, toEmail: string, message: MagicLinkMessage): Promise<number> {
  const res = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: apiKey,
      message: {
        from_email: MAGIC_LINK_FROM,
        from_name: 'Wiser Generations',
        to: [{ email: toEmail, type: 'to' }],
        subject: message.subject,
        html: message.html,
        text: message.text,
      },
    }),
  })
  return res.status
}

async function sendMagicLinkEmail(toEmail: string, message: MagicLinkMessage): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  const mandrillKey = process.env.MANDRILL_API_KEY
  const provider = resendKey ? 'resend' : mandrillKey ? 'mandrill' : null

  if (!provider) {
    console.warn('[access/login] no email provider configured; magic link not sent')
    await recordAuditEvent({
      eventType: 'login.email_failed',
      metadata: { result: 'no_provider_configured' },
    })
    return
  }

  try {
    const status =
      provider === 'resend'
        ? await sendViaResend(resendKey!, toEmail, message)
        : await sendViaMandrill(mandrillKey!, toEmail, message)

    // Only the provider name and HTTP status are recorded. Response bodies can
    // echo the address or the key back, and neither belongs in an audit row.
    if (status < 200 || status >= 300) {
      console.error(`[access/login] ${provider} rejected the send: HTTP ${status}`)
      await recordAuditEvent({
        eventType: 'login.email_failed',
        metadata: { result: `${provider}_http_${status}` },
      })
    }
  } catch (err) {
    console.error(`[access/login] ${provider} send threw:`, err)
    await recordAuditEvent({
      eventType: 'login.email_failed',
      metadata: { result: `${provider}_unreachable` },
    })
  }
}

/**
 * Backfills an entitlement from Stripe for a customer who does not have one.
 *
 * Bounded by construction: it looks up only the customers matching this email,
 * then only those customers' own subscriptions and sessions. It never lists
 * the account's recent activity.
 */
async function backfillEntitlementFromStripe(email: string): Promise<boolean> {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return false

  const stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' })
  const customers = await stripe.customers.list({ email, limit: 10 })

  for (const customer of customers.data) {
    // ── B-3. Same rule as the webhook, second location ──────────────────
    //
    // This used to grant Study Access for ANY active subscription on the
    // address. Identification now comes from the subscription's own marker,
    // falling back to the Study Access price id for subscriptions old enough
    // to predate metadata — a narrower test than the one it replaces, because
    // a price identifies one product rather than the whole category of things
    // billed monthly.
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 5,
    })
    const studySub = subs.data.find((sub) => productGrants(identifySubscription(sub), STUDY_ACCESS))
    if (studySub) {
      const record = await upsertCustomer({ email, stripeCustomerId: customer.id })
      await grantEntitlement({
        customerId: record.id,
        entitlementKey: STUDY_ACCESS,
        sourceType: 'subscription',
        sourceId: studySub.id,
        idempotencyKey: `backfill:sub:${studySub.id}`,
      })
      return true
    }

    // Grandfathered one-time purchasers, scoped to this customer only. This
    // branch always checked the product marker; it now asks the same module
    // as everything else so there is one answer to "what is this?".
    const sessions = await stripe.checkout.sessions.list({ customer: customer.id, limit: 20 })
    const paid = sessions.data.find(
      (s) =>
        s.payment_status === 'paid' &&
        productGrants(identifyCheckoutSession(s), STUDY_ACCESS)
    )
    if (paid) {
      const record = await upsertCustomer({ email, stripeCustomerId: customer.id })
      await grantEntitlement({
        customerId: record.id,
        entitlementKey: STUDY_ACCESS,
        sourceType: 'order',
        sourceId: paid.id,
        idempotencyKey: `backfill:cs:${paid.id}`,
      })
      return true
    }
  }

  return false
}

export async function POST(req: NextRequest) {
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'access-login', RATE_LIMIT)
  if (rateBlock) {
    await recordAuditEvent({ eventType: 'login.rate_limited', metadata: { result: 'blocked' } })
    return rateBlock
  }

  try {
    const body = (await req.json()) as { email?: string; from?: string; program?: string }
    const email = (body.email ?? '').trim().toLowerCase()

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 })
    }

    // The caller chooses the program. That choice selects which entitlement is
    // REQUIRED and which language the email uses — it is never itself a claim
    // of access. Asking for 'study' does not grant Study Access; it asks
    // whether this address already holds it. An omitted or unrecognised value
    // is Study Access, which is what every existing caller sends: nothing.
    const program = readProgram(body.program)
    const config = programLogin(program)

    const existing = await findCustomerByEmail(email)
    let entitled = existing ? await hasEntitlement(existing.id, config.entitlementKey) : false

    // Stripe reconciliation exists only for Study Access, whose grandfathered
    // purchasers predate the entitlement table. No other program has a
    // backfill, and none should acquire one by accident.
    if (!entitled && program === 'study') {
      entitled = await backfillEntitlementFromStripe(email)
    }

    if (entitled) {
      const { token } = await issueLoginToken({ email, product: program, redirectTo: body.from })
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wisergenerations.com'
      // The email is NOT in the URL: the token alone identifies the request,
      // so there is no address to tamper with and no destination to smuggle.
      await sendMagicLinkEmail(
        email,
        magicLinkMessage(program, `${siteUrl}/api/access/login?token=${token}`, firstNameOf(existing?.name))
      )
    }

    // Always ok — for a wrong address, an unentitled one, and a program this
    // address has no standing in alike. The response cannot be used to
    // enumerate customers, nor to discover which programs an address belongs
    // to.
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/access/login] error:', err)
    return NextResponse.json({ ok: true })
  }
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/access?error=invalid', req.url))
  }

  const consumed = await consumeLoginToken(token)
  if (!consumed) {
    await recordAuditEvent({ eventType: 'login.failed', metadata: { result: 'invalid_or_expired' } })
    return NextResponse.redirect(new URL('/access?error=expired', req.url))
  }

  // Which program this link belongs to is derived from the destination stored
  // against the token — a value only this system writes, chosen from a
  // per-program allow-list. It is not carried in the callback URL, so there is
  // nothing here for a holder of the link to change.
  const program = productForDestination(consumed.redirectTo) ?? 'study'
  const config = programLogin(program)

  const customer = await upsertCustomer({ email: consumed.email })

  // Authentication succeeded; authorization is a separate question, asked
  // again here because an entitlement can be revoked between the link being
  // sent and the link being clicked.
  if (!(await hasEntitlement(customer.id, config.entitlementKey))) {
    await recordAuditEvent({
      eventType: 'login.failed',
      customerId: customer.id,
      metadata: { result: 'not_entitled', reason: program },
    })
    return NextResponse.redirect(new URL(`${config.signInPath}?error=no-access`, req.url))
  }

  const { token: sessionToken } = await createSession({
    customerId: customer.id,
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for'),
  })

  await recordAuditEvent({
    eventType: 'login.success',
    customerId: customer.id,
    metadata: { result: 'ok', reason: program },
  })

  // Already resolved, and resolved within the product the link was issued
  // for. Re-normalising here would imply the stored value is untrusted; only
  // lib/auth/login-token writes it, and it writes nothing but allow-listed
  // paths.
  const response = NextResponse.redirect(new URL(consumed.redirectTo, req.url))
  response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions(SESSION_MAX_AGE_SECONDS))
  // Clear the compromised cookie from every browser that still carries one.
  response.cookies.set(LEGACY_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}

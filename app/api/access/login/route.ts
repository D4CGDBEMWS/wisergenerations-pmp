import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { upsertCustomer, findCustomerByEmail } from '@/lib/customers'
import { grantEntitlement, hasEntitlement, STUDY_ACCESS } from '@/lib/entitlements'
import { issueLoginToken, consumeLoginToken, normalizeRedirect } from '@/lib/auth/login-token'
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

const MAGIC_LINK_FROM = process.env.MAGIC_LINK_FROM_EMAIL || 'info@wisergenerations.com'
const MAGIC_LINK_SUBJECT = 'Your Wiser Generations Study Access login link'

function magicLinkHtml(loginUrl: string): string {
  return (
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">` +
    `<div style="background:#0A1628;padding:24px;text-align:center;border-radius:8px 8px 0 0">` +
    `<h1 style="color:#C9A84C;margin:0;font-size:24px">Wiser Generations</h1></div>` +
    `<div style="background:#f9fafb;padding:32px;border-radius:0 0 8px 8px">` +
    `<h2 style="color:#0A1628;margin-top:0">Your login link</h2>` +
    `<p style="color:#374151;line-height:1.6">This link signs you in to Study Access and expires in <strong>15 minutes</strong>.</p>` +
    `<p style="text-align:center;margin:32px 0"><a href="${loginUrl}" style="background:#C9A84C;color:#0A1628;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">Sign in</a></p>` +
    `<p style="color:#6b7280;font-size:14px">If you didn't request this, you can ignore it.</p></div></div>`
  )
}

function magicLinkText(loginUrl: string): string {
  return `Your Wiser Generations login link:\n\n${loginUrl}\n\nIt expires in 15 minutes.`
}

async function sendViaResend(apiKey: string, toEmail: string, loginUrl: string): Promise<number> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Wiser Generations <${MAGIC_LINK_FROM}>`,
      to: [toEmail],
      subject: MAGIC_LINK_SUBJECT,
      html: magicLinkHtml(loginUrl),
      text: magicLinkText(loginUrl),
    }),
  })
  return res.status
}

async function sendViaMandrill(apiKey: string, toEmail: string, loginUrl: string): Promise<number> {
  const res = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: apiKey,
      message: {
        from_email: MAGIC_LINK_FROM,
        from_name: 'Wiser Generations',
        to: [{ email: toEmail, type: 'to' }],
        subject: MAGIC_LINK_SUBJECT,
        html: magicLinkHtml(loginUrl),
        text: magicLinkText(loginUrl),
      },
    }),
  })
  return res.status
}

async function sendMagicLinkEmail(toEmail: string, loginUrl: string): Promise<void> {
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
        ? await sendViaResend(resendKey!, toEmail, loginUrl)
        : await sendViaMandrill(mandrillKey!, toEmail, loginUrl)

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
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 5,
    })
    if (subs.data.length > 0) {
      const record = await upsertCustomer({ email, stripeCustomerId: customer.id })
      await grantEntitlement({
        customerId: record.id,
        entitlementKey: STUDY_ACCESS,
        sourceType: 'subscription',
        sourceId: subs.data[0]!.id,
        idempotencyKey: `backfill:sub:${subs.data[0]!.id}`,
      })
      return true
    }

    // Grandfathered one-time purchasers, scoped to this customer only.
    const sessions = await stripe.checkout.sessions.list({ customer: customer.id, limit: 20 })
    const paid = sessions.data.find(
      (s) =>
        s.payment_status === 'paid' &&
        (s.metadata?.product === 'study-access' || s.metadata?.product === 'pmp-practice-studio')
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
    const body = (await req.json()) as { email?: string; from?: string }
    const email = (body.email ?? '').trim().toLowerCase()

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 })
    }

    const existing = await findCustomerByEmail(email)
    let entitled = existing ? await hasEntitlement(existing.id, STUDY_ACCESS) : false

    if (!entitled) {
      entitled = await backfillEntitlementFromStripe(email)
    }

    if (entitled) {
      const { token } = await issueLoginToken({ email, redirectTo: body.from })
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wisergenerations.com'
      // The email is NOT in the URL: the token alone identifies the request,
      // so there is no address to tamper with and no destination to smuggle.
      await sendMagicLinkEmail(email, `${siteUrl}/api/access/login?token=${token}`)
    }

    // Always ok, so the response cannot be used to enumerate customers.
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

  const customer = await upsertCustomer({ email: consumed.email })
  if (!(await hasEntitlement(customer.id, STUDY_ACCESS))) {
    await recordAuditEvent({
      eventType: 'login.failed',
      customerId: customer.id,
      metadata: { result: 'not_entitled' },
    })
    return NextResponse.redirect(new URL('/access?error=no-access', req.url))
  }

  const { token: sessionToken } = await createSession({
    customerId: customer.id,
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for'),
  })

  await recordAuditEvent({
    eventType: 'login.success',
    customerId: customer.id,
    metadata: { result: 'ok' },
  })

  const response = NextResponse.redirect(
    new URL(normalizeRedirect(consumed.redirectTo), req.url)
  )
  response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions(SESSION_MAX_AGE_SECONDS))
  // Clear the compromised cookie from every browser that still carries one.
  response.cookies.set(LEGACY_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}

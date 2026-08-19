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

async function sendMagicLinkEmail(toEmail: string, loginUrl: string): Promise<void> {
  // Mandrill (Mailchimp Transactional) issues its own API keys, separate from
  // the marketing key. MANDRILL_API_KEY is preferred; MAILCHIMP_API_KEY is
  // accepted as a fallback because that is what production currently supplies.
  // See docs/PHASE-0.5-FOUNDATION.md — this needs verifying against the live
  // Mandrill account.
  const apiKey = process.env.MANDRILL_API_KEY || process.env.MAILCHIMP_API_KEY
  if (!apiKey) {
    console.warn('[access/login] no transactional key set; magic link not sent')
    return
  }

  const res = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: apiKey,
      message: {
        from_email: 'info@wisergenerations.com',
        from_name: 'Wiser Generations',
        to: [{ email: toEmail, type: 'to' }],
        subject: 'Your Wiser Generations Study Access login link',
        html:
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">` +
          `<div style="background:#0A1628;padding:24px;text-align:center;border-radius:8px 8px 0 0">` +
          `<h1 style="color:#C9A84C;margin:0;font-size:24px">Wiser Generations</h1></div>` +
          `<div style="background:#f9fafb;padding:32px;border-radius:0 0 8px 8px">` +
          `<h2 style="color:#0A1628;margin-top:0">Your login link</h2>` +
          `<p style="color:#374151;line-height:1.6">This link signs you in to Study Access and expires in <strong>15 minutes</strong>.</p>` +
          `<p style="text-align:center;margin:32px 0"><a href="${loginUrl}" style="background:#C9A84C;color:#0A1628;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">Sign in</a></p>` +
          `<p style="color:#6b7280;font-size:14px">If you didn't request this, you can ignore it.</p></div></div>`,
        text: `Your Wiser Generations login link:\n\n${loginUrl}\n\nIt expires in 15 minutes.`,
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`Mandrill send failed: ${res.status}`)
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

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { checkOrigin, rateLimit } from '@/lib/api-guard'

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// POST /api/contact
//
// Receives a contact-form submission, validates it, and emails it into the
// info@wisergenerations.com inbox via Resend.
//
// Required env vars:
//   RESEND_API_KEY     — from https://resend.com (free tier 3,000/mo)
//   CONTACT_TO_EMAIL   — destination inbox (defaults to info@wisergenerations.com)
//   CONTACT_FROM_EMAIL — verified sender on your Resend domain
//                        (defaults to onboarding@resend.dev for first-run testing)
//
// In development without RESEND_API_KEY set we log the submission and return
// success so the UI flow can be tested without the integration. Same pattern
// the existing /api/free-guide route uses.
// ---------------------------------------------------------------------------

const NAME_MAX = 120
const EMAIL_MAX = 254
const SUBJECT_MAX = 200
const MESSAGE_MAX = 5_000

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
  // ── Origin & rate-limit guards ────────────────────────────────────────────
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  // Tighter limit than checkout: 3 messages / 5 minutes per IP. Contact-form
  // spam is the main abuse vector here.
  const rateBlock = await rateLimit(req, 'contact', { limit: 3, windowMs: 5 * 60_000 })
  if (rateBlock) return rateBlock

  // ── Parse and validate body ───────────────────────────────────────────────
  let body: {
    name?: string
    email?: string
    subject?: string
    message?: string
    // Honeypot field — real users won't fill this; bots usually do.
    company?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // Honeypot: silently accept and drop. Returning 200 keeps bots from probing.
  if (body.company && body.company.trim().length > 0) {
    console.warn('[/api/contact] honeypot tripped, dropping submission')
    return NextResponse.json({ ok: true })
  }

  const name = (body.name ?? '').trim()
  const email = (body.email ?? '').trim()
  const subject = (body.subject ?? '').trim()
  const message = (body.message ?? '').trim()

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'Name, email, and message are required.' },
      { status: 400 }
    )
  }

  if (
    name.length > NAME_MAX ||
    email.length > EMAIL_MAX ||
    subject.length > SUBJECT_MAX ||
    message.length > MESSAGE_MAX
  ) {
    return NextResponse.json({ error: 'One or more fields are too long.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  // ── Resend integration ────────────────────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY
  const toAddress = process.env.CONTACT_TO_EMAIL || 'info@wisergenerations.com'
  const fromAddress = process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev'

  if (!apiKey) {
    // In development without Resend configured, log a redacted notice and
    // return success so the UI flow can be tested. Same pattern used by
    // /api/free-guide. We deliberately do NOT log the visitor's name, email,
    // subject, or message body — those are PII and would otherwise end up in
    // Vercel function logs / log aggregators every time Resend is missing.
    console.warn('[/api/contact] RESEND_API_KEY not set — submission accepted but not delivered. Fields present:', {
      hasName: name.length > 0,
      hasEmail: email.length > 0,
      hasSubject: subject.length > 0,
      messageLength: message.length,
    })
    return NextResponse.json({ ok: true })
  }

  try {
    const resend = new Resend(apiKey)

    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeSubject = escapeHtml(subject || '(no subject)')
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>')

    const { error } = await resend.emails.send({
      from: `Wiser Generations Contact <${fromAddress}>`,
      to: [toAddress],
      replyTo: email,
      subject: subject ? `[Contact] ${subject}` : `[Contact] New message from ${name}`,
      text: `From: ${name} <${email}>\nSubject: ${subject || '(no subject)'}\n\n${message}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; max-width: 560px;">
          <h2 style="color:#0a1628;margin:0 0 16px;">New contact form submission</h2>
          <p style="margin:4px 0;"><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
          <p style="margin:4px 0;"><strong>Subject:</strong> ${safeSubject}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">
          <div style="white-space:pre-wrap;line-height:1.5;color:#1e293b;">${safeMessage}</div>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">
          <p style="font-size:12px;color:#64748b;">Reply directly to this email to respond — the sender's address is set as Reply-To.</p>
        </div>
      `,
    })

    if (error) {
      console.error('[/api/contact] Resend error:', error)
      return NextResponse.json(
        { error: 'Could not send your message. Please try again or email info@wisergenerations.com directly.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/contact] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

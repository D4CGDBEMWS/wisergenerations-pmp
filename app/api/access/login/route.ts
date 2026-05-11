import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import crypto from 'crypto'

export const runtime = 'nodejs'

// Simple token store - works for serverless with short-lived tokens
// Replace with Redis for multi-region deployments
const tokenStore = new Map<string, { email: string; expires: number }>()

async function sendMagicLinkEmail(toEmail: string, loginUrl: string): Promise<void> {
  const apiKey = process.env.MAILCHIMP_API_KEY
  if (!apiKey) {
    console.warn('[access/login] MAILCHIMP_API_KEY not set - logging magic link instead')
    console.log('[access/login] Magic link for', toEmail, ':', loginUrl)
    return
  }

  const payload = {
    key: apiKey,
    message: {
      from_email: 'info@wisergenerations.com',
      from_name: 'Wiser Generations',
      to: [{ email: toEmail, type: 'to' }],
      subject: 'Your Wiser Generations Study Access Login Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0a1628; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #facc15; margin: 0; font-size: 24px;">Wiser Generations</h1>
            <p style="color: #fff; margin: 8px 0 0;">PMP &amp; CAPM Certification Training</p>
          </div>
          <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #0a1628; margin-top: 0;">Your Magic Login Link</h2>
            <p style="color: #374151; line-height: 1.6;">
              Click the button below to sign in to your Study Access account. This link expires in <strong>15 minutes</strong>.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}"
                 style="background: #facc15; color: #0a1628; padding: 14px 32px; border-radius: 6px;
                        text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                Access My Study Tools
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              If you didn't request this, you can safely ignore this email.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              Or copy and paste this URL into your browser:<br/>
              <span style="color: #0a1628; word-break: break-all;">${loginUrl}</span>
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            &copy; 2025 Wiser Generations International. All rights reserved.
          </p>
        </div>
      `,
      text: `Your Wiser Generations magic login link:\n\n${loginUrl}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
    },
  }

  const response = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Mandrill send failed: ${response.status} ${errorText}`)
  }

  const result = await response.json()
  const status = Array.isArray(result) ? result[0]?.status : 'unknown'
  console.log('[access/login] Email sent to', toEmail, 'status:', status)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = (body.email || '').trim().toLowerCase()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 })
    }

    // Verify purchase in Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' })
    const sessions = await stripe.checkout.sessions.list({ limit: 100 })
    const hasPurchased = sessions.data.some(
      s => s.customer_email === email && s.payment_status === 'paid' && s.metadata?.product === 'study-access'
    )

    // Always return ok to prevent email enumeration
    if (hasPurchased) {
      const token = crypto.randomBytes(32).toString('hex')
      const expires = Date.now() + 15 * 60 * 1000
      tokenStore.set(token, { email, expires })

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wisergenerations.com'
      const loginUrl = siteUrl + '/api/access/login?token=' + token + '&email=' + encodeURIComponent(email)

      // Send magic link via Mailchimp Transactional (Mandrill)
      await sendMagicLinkEmail(email, loginUrl)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/access/login] error:', err)
    return NextResponse.json({ ok: true })
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const email = url.searchParams.get('email')

  if (!token || !email) {
    return NextResponse.redirect(new URL('/access/login?error=invalid', req.url))
  }

  const record = tokenStore.get(token)

  if (!record || record.email !== email || Date.now() > record.expires) {
    tokenStore.delete(token)
    return NextResponse.redirect(new URL('/access/login?error=expired', req.url))
  }

  tokenStore.delete(token)

  const response = NextResponse.redirect(new URL('/exam-simulator', req.url))
  response.cookies.set('wg_study_access', 'login:' + email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })

  return response
}

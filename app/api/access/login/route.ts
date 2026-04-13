import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import crypto from 'crypto'

export const runtime = 'nodejs'

// Simple token store - works for serverless with short-lived tokens
// Replace with Redis for multi-region deployments
const tokenStore = new Map<string, { email: string; expires: number }>()

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

      // Log for admin - in production would send via email service
      console.log('[access/login] Magic link for', email, ':', loginUrl)
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

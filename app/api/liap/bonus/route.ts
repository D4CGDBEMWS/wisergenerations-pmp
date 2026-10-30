import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { rateLimit } from '@/lib/api-guard'
import { isEnabled } from '@/lib/flags'
import { readLiapAccess } from '@/lib/liap/entitlements'
import { findByResultToken } from '@/lib/liap/assessment-service'
import { isLiapPreorder } from '@/lib/liap/fulfilment'
import { PREBUY_BONUS } from '@/lib/liap/bonus'

// ---------------------------------------------------------------------------
// The WISER Pivots™ one-sheet, for pre-buyers only.
//
// Owner ruling 2026-10-30. It used to be a static file anyone could fetch. Any
// ONE of these proves the person bought, and the file is served:
//
//   1. a signed-in session holding the LIAP entitlement;
//   2. ?token= — a completed assessment's result token (only buyers can take it);
//   3. ?session_id= — a paid Stripe checkout carrying the preorder marker. This
//      is what the thank-you page has in hand the moment Stripe redirects,
//      before the webhook has granted anything, so a new buyer is never turned
//      away in the seconds after paying.
//
// Everything fails closed: a Stripe or database error is "no", not a crash.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 20, windowMs: 10 * 60_000 }

async function paidPreorderSession(sessionId: string): Promise<boolean> {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return false
  try {
    const stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' })
    const s = await stripe.checkout.sessions.retrieve(sessionId)
    return s.payment_status === 'paid' && isLiapPreorder(s.metadata)
  } catch (err) {
    console.error('[liap/bonus] stripe lookup failed:', err)
    return false
  }
}

async function validResultToken(token: string): Promise<boolean> {
  try {
    return (await findByResultToken(token)) !== null
  } catch (err) {
    console.error('[liap/bonus] token lookup failed:', err)
    return false
  }
}

async function entitledSession(): Promise<boolean> {
  try {
    return (await readLiapAccess())?.entitled === true
  } catch {
    return false
  }
}

async function isBuyer(params: URLSearchParams): Promise<boolean> {
  if (await entitledSession()) return true
  const token = params.get('token')
  if (token && (await validResultToken(token))) return true
  const sessionId = params.get('session_id')
  if (sessionId && (await paidPreorderSession(sessionId))) return true
  return false
}

const LOCKED_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Pre-buyer bonus</title></head>
<body style="font-family:system-ui,sans-serif;max-width:36rem;margin:4rem auto;padding:0 1rem;color:#1E2F55;line-height:1.6">
<h1 style="color:#001B3A">This download is a pre-buyer bonus</h1>
<p>The WISER Pivots&trade; one-sheet comes with every pre-order of <em>Living Is a Project&hellip;Are You Ready?&trade;</em></p>
<p>Already ordered? Use the download button on your order confirmation page or your results page.
Need help? Email <a href="mailto:info@wisergenerations.com">info@wisergenerations.com</a>.</p>
<p><a href="/author">Pre-order the book</a></p></body></html>`

export async function GET(req: NextRequest): Promise<Response> {
  if (!isEnabled('LIAP')) return new Response('Not found', { status: 404 })

  const rateBlock = await rateLimit(req, 'liap-bonus', RATE_LIMIT)
  if (rateBlock) return rateBlock

  if (!(await isBuyer(req.nextUrl.searchParams))) {
    return new Response(LOCKED_PAGE, {
      status: 403,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  }

  // Statically scoped path so the bundler traces only this folder.
  const pdf = await readFile(join(process.cwd(), 'content', 'liap', 'wiser-pivots-one-sheet.pdf'))
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${PREBUY_BONUS.downloadName}"`,
      // Per-buyer authorized response: no shared cache may keep it.
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}

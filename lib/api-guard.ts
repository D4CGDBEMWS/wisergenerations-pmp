import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Lightweight request guards for unauthenticated POST routes.
//
// These are intentionally dependency-free so they run on Vercel serverless
// without any external store. The rate limiter is BEST-EFFORT only: it uses
// a per-instance in-memory Map, so a warm instance will throttle bursts from
// the same IP, but it does NOT coordinate across instances. Move to Upstash
// Ratelimit (or similar) when you need hard guarantees.
// ---------------------------------------------------------------------------

/**
 * Reject cross-origin POSTs. Same-origin requests from the site itself are
 * allowed; everything else (including direct curl with no Origin) is rejected
 * unless the request comes from one of the explicit allow-list hosts.
 */
export function checkOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')

  if (!origin) {
    // No Origin header at all → not a browser fetch from our app.
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const allowed = new Set<string>(
    [
      host,
      'wisergenerations.com',
      'www.wisergenerations.com',
      process.env.NEXT_PUBLIC_SITE_HOST,
      process.env.VERCEL_URL,
    ].filter((value): value is string => Boolean(value))
  )

  if (!allowed.has(originHost)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  return null
}

// ---------------------------------------------------------------------------
// In-memory token bucket. Keyed by `${routeId}:${ip}`.
// ---------------------------------------------------------------------------
type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

/**
 * Returns null if the request is within the limit, or a 429 NextResponse if
 * it should be rejected.
 */
export function rateLimit(
  req: NextRequest,
  routeId: string,
  opts: { limit: number; windowMs: number }
): NextResponse | null {
  const ip = getClientIp(req)
  const key = `${routeId}:${ip}`
  const now = Date.now()

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return null
  }

  if (existing.count >= opts.limit) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  existing.count += 1
  return null
}

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Lightweight request guards for unauthenticated POST routes.
//
// rateLimit() prefers Upstash Ratelimit (coordinated across all serverless
// instances) when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
// Otherwise it falls back to a per-instance in-memory token bucket so the
// site still has *some* protection in environments without Upstash.
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
// Rate limiter — Upstash when configured, in-memory fallback otherwise.
// ---------------------------------------------------------------------------
function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

const upstashConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const upstashRedis = upstashConfigured ? Redis.fromEnv() : null
const upstashLimiters = new Map<string, Ratelimit>()

function getUpstashLimiter(routeId: string, limit: number, windowMs: number) {
  if (!upstashRedis) return null
  const cacheKey = `${routeId}:${limit}:${windowMs}`
  let limiter = upstashLimiters.get(cacheKey)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: false,
      prefix: `wg:rl:${routeId}`,
    })
    upstashLimiters.set(cacheKey, limiter)
  }
  return limiter
}

// In-memory fallback bucket. Keyed by `${routeId}:${ip}`.
type Bucket = { count: number; resetAt: number }
const memoryBuckets = new Map<string, Bucket>()

function memoryRateLimit(
  routeId: string,
  ip: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number } {
  const key = `${routeId}:${ip}`
  const now = Date.now()
  const existing = memoryBuckets.get(key)

  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfter: 0 }
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) }
  }

  existing.count += 1
  return { ok: true, retryAfter: 0 }
}

/**
 * Returns null if the request is within the limit, or a 429 NextResponse if
 * it should be rejected. Uses Upstash when configured, in-memory fallback
 * otherwise.
 */
export async function rateLimit(
  req: NextRequest,
  routeId: string,
  opts: { limit: number; windowMs: number }
): Promise<NextResponse | null> {
  const ip = getClientIp(req)
  const limiter = getUpstashLimiter(routeId, opts.limit, opts.windowMs)

  if (limiter) {
    try {
      const result = await limiter.limit(ip)
      if (!result.success) {
        const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
        return NextResponse.json(
          { error: 'Too many requests. Please try again shortly.' },
          { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        )
      }
      return null
    } catch (err) {
      // Upstash outage → fall through to in-memory so we still throttle.
      console.error('[api-guard] Upstash rate limit failed, falling back:', err)
    }
  }

  const result = memoryRateLimit(routeId, ip, opts.limit, opts.windowMs)
  if (!result.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(result.retryAfter) } }
    )
  }
  return null
}

import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// POST /api/lead
//
// Email capture endpoint for the PMP Practice Studio free-sample gate.
// Accepts { email, source } and proxies to /api/subscribe (Mailchimp).
//
// The studio file sets:  EMAIL_ENDPOINT = "/api/lead"
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: { email?: string; source?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = (body.email ?? '').trim()
  const source = body.source ?? 'practice-studio-free-sample'

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  // Forward to the main subscribe route which handles Mailchimp integration,
  // rate limiting, and CORS checks.
  try {
    const base = req.nextUrl.origin
    const res = await fetch(`${base}/api/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass along origin so api-guard origin check passes
        origin: req.headers.get('origin') ?? base,
      },
      body: JSON.stringify({ email, source, tags: [source] }),
    })

    const data = await res.json().catch(() => ({ ok: true }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[/api/lead] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

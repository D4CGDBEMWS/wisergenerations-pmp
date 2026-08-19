import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/exam-simulator', '/flashcards']
const SESSION_COOKIE = 'wg_session'

// ---------------------------------------------------------------------------
// This middleware is a UX affordance, NOT the security control.
//
// It runs on the edge, cannot reach the database, and therefore cannot tell a
// real session from a forged one — which is exactly the mistake the previous
// implementation made when it treated "cookie is non-empty" as authorization.
// All it does now is spare a signed-out visitor a wasted round trip.
//
// The actual decision is made server-side by requireEntitlement() in the
// route's layout, against the sessions and entitlements tables. A request that
// gets past this check still renders nothing without a valid session and a
// live entitlement.
// ---------------------------------------------------------------------------
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'))
  if (!isProtected) return NextResponse.next()

  if (req.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/access'
  url.searchParams.set('from', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/exam-simulator', '/exam-simulator/:path*', '/flashcards', '/flashcards/:path*'],
}

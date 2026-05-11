import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/exam-simulator', '/flashcards']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!isProtected) return NextResponse.next()

  const accessCookie = req.cookies.get('wg_study_access')
  if (accessCookie?.value) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/access'
  url.searchParams.set('from', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/exam-simulator', '/exam-simulator/:path*', '/flashcards', '/flashcards/:path*'],
}

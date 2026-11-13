import { NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// VillageTrade's own middleware — deliberately minimal, and present for a
// reason that is not obvious.
//
// While this application lives in a subdirectory of the Wiser Generations
// repository, a build run from here WALKS UP and compiles the parent's
// middleware into VillageTrade's edge bundle. That was observed, not
// theorised: a build without this file emitted `/exam-simulator`,
// `/flashcards`, `/access` and the `wg_session` cookie name into
// VillageTrade's own middleware chunk, registered to run on every request.
//
// Nothing about that is dangerous today — VillageTrade has no such routes —
// but it is a demonstrated leak between two applications that are supposed to
// share nothing, and it is evidence that the nested arrangement is temporary.
// Declaring our own middleware shadows the parent's.
//
// WHEN THIS APPLICATION MOVES TO ITS OWN REPOSITORY, this file can go, unless
// it has by then acquired a purpose of its own.
// ---------------------------------------------------------------------------

export function middleware() {
  return NextResponse.next()
}

// Match nothing. There is no edge-level gate in VillageTrade: authorization
// is decided server-side against the database, never at the edge, for the
// same reason the sibling project documents — the edge cannot tell a real
// session from a forged one.
export const config = { matcher: [] }

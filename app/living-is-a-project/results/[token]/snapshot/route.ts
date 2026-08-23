import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isEnabled } from '@/lib/flags'
import { queryOne } from '@/lib/db/client'
import { SESSION_COOKIE, validateSession } from '@/lib/auth/session'
import { findByResultToken, rebuildReport } from '@/lib/liap/assessment-service'
import { buildSnapshotPdf, snapshotFilename } from '@/lib/liap/snapshot-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET /living-is-a-project/results/<token>/snapshot — the downloadable PDF.
//
// ── AUTHORIZATION IS THE PAGE'S, EXACTLY ───────────────────────────────────
//
// This endpoint is deliberately a child of the results route and repeats its
// checks rather than inventing softer ones. The token is the capability, it is
// compared by hash, and a signed-in customer holding somebody else's token
// gets the same 404 the page gives them.
//
// That symmetry is the point: a download link that authorised differently from
// the page it sits on would be a new way in, added while fixing something
// else. There is nothing here the results page does not already permit.
//
// The token is not written into the file, the filename or the PDF metadata.
// ---------------------------------------------------------------------------

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  if (!isEnabled('LIAP')) return new NextResponse('Not found.', { status: 404 })

  const { token } = await params

  let found: Awaited<ReturnType<typeof findByResultToken>> = null
  try {
    found = await findByResultToken(token)
  } catch (err) {
    console.error('[liap/snapshot] lookup failed:', err)
  }
  if (!found) return new NextResponse('Not found.', { status: 404 })

  const store = await cookies()
  const session = await validateSession(store.get(SESSION_COOKIE)?.value)
  if (session && session.customerId !== found.customerId) {
    return new NextResponse('Not found.', { status: 404 })
  }

  // Narrative-free by construction. The PDF is the one artefact that leaves
  // this system for good; it must not carry a sentence the 90-day rule
  // promises to delete, and asking for the purged view is how that is
  // guaranteed rather than remembered.
  const report = await rebuildReport(found.id, { includeNarratives: false })
  const row = await queryOne<{ completed_at: string | null }>(
    `SELECT completed_at FROM assessments WHERE id = $1`,
    [found.id]
  )
  const completedOn = (row?.completed_at ?? '').toString().slice(0, 10) || 'undated'

  const pdf = await buildSnapshotPdf({ report, completedOn })

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${snapshotFilename(completedOn)}"`,
      // Never cached by a shared cache: the URL contains a bearer token.
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

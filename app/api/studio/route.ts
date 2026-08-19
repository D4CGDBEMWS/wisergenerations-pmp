import { readFile } from 'fs/promises'
import { join } from 'path'
import { getCurrentSession } from '@/lib/auth/guard'
import { hasEntitlement, STUDY_ACCESS } from '@/lib/entitlements'

// ---------------------------------------------------------------------------
// The paid studio, served only to entitled customers.
//
// It used to live at /studio/pmp-practice-studio.html in the public directory.
// Phase 0.5 closed the paywall on /exam-simulator, but the page inside that
// route is an iframe, and its source was a static asset on the CDN that no
// middleware and no guard ever saw. Anyone could fetch it directly: 694
// questions with answers and rationale, a 200-question mock exam, 40 ITTO
// cards and a 30-term glossary, in one 1 MB response, no session required.
//
// The unlock was client-side by construction —
//
//   const STUDENT_MODE = window.STUDENT_MODE === true
//                     || new URLSearchParams(location.search).get("full") === "1"
//
// — so appending ?full=1 was the whole of the attack. That is the same shape as
// the cookie bug the Phase 0 audit found: the check ran where the visitor
// controls the input.
//
// Serving the file from here puts it behind the same entitlement the rest of
// the paid surface uses. STUDENT_MODE is then set server-side rather than left
// to the query string, so the copy a paying customer receives is unlocked
// because of who they are, not because of what is in their address bar.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
// Reads the session cookie, so it can never be statically rendered or cached.
export const dynamic = 'force-dynamic'

const STUDIO_PATH = join(process.cwd(), 'content', 'studio', 'pmp-practice-studio.html')

// The file is ~1 MB and immutable between deploys; re-reading it from disk on
// every question set would be wasteful. A warm lambda keeps it, a cold one
// pays the read once.
let cachedStudio: string | null = null

async function loadStudio(): Promise<string> {
  if (cachedStudio) return cachedStudio

  const html = await readFile(STUDIO_PATH, 'utf8')

  // Injected into <head> so it runs before the studio's own script, which is
  // what its FREE-SAMPLE HOOK CONFIG block documents as the supported way in.
  const unlock = '<script>window.STUDENT_MODE=true</script>'
  cachedStudio = html.includes('</head>')
    ? html.replace('</head>', `${unlock}</head>`)
    : `${unlock}${html}`

  return cachedStudio
}

export async function GET(): Promise<Response> {
  const session = await getCurrentSession()
  // 404 rather than 403: a distinct status would confirm to a prober that
  // there is something here worth getting a session for. The visitor-facing
  // route already redirects to /access with an explanation, so nobody who
  // arrives legitimately ever sees this.
  if (!session) return new Response('Not found', { status: 404 })

  if (!(await hasEntitlement(session.customerId, STUDY_ACCESS))) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(await loadStudio(), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Never let a shared cache hold a copy of a per-customer authorized
      // response — that would hand it to the next visitor through the CDN.
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}

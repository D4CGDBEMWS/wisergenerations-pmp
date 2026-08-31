import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { isEnabled } from '@/lib/flags'
import { SESSION_COOKIE, validateSession } from '@/lib/auth/session'
import { mayReceiveFacilitatorContent } from '@/lib/liap/facilitation'
import { FacilitatorConsole } from '@/components/liap/journey/FacilitatorConsole'

export const metadata = {
  title: 'Facilitator Console',
  robots: { index: false, follow: false, nocache: true },
  keywords: [],
  openGraph: { images: [] },
}

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// /liap/journey/facilitator/[retreatId] — the private console. JG-1 closed.
//
// ── WHAT CHANGED, AND WHY THE ROUTE GREW A SEGMENT ─────────────────────────
//
// This page previously took the feature flag as its only gate, on a Version 1
// owner ruling. A flag is a release control: it decides whether a route is
// live, never who may use it. With the flag on, anybody who typed the URL got
// the console and everything its bundle carries.
//
// Authorization is now server-side and happens BEFORE the console is
// rendered, so an unauthorized request receives no protected content at all
// rather than content it is asked not to look at.
//
// The Retreat id is in the path because clearance is not a property of a
// person — it is a property of a person AND a Retreat. A facilitator cleared
// for one Retreat must not reach another by editing the address bar, and
// there is no way to check that without knowing which Retreat is being
// asked for.
//
// ── FOUR FACTS, RECOMPUTED EVERY REQUEST ───────────────────────────────────
//
// mayReceiveFacilitatorContent asks: certified and in force, assigned to THIS
// Retreat, and preparation confirmed for THIS Retreat. Nothing is cached and
// no `cleared` flag is stored, so suspending a facilitator takes effect on
// their next request rather than when somebody remembers to revoke a token.
//
// ── WHY notFound() AND NOT A 403 ───────────────────────────────────────────
//
// A 403 confirms the Retreat exists. Somebody probing ids would learn the
// shape of the schedule from the difference between "forbidden" and "no such
// thing". Both answers are 404 here, so a probe learns nothing either way —
// which is also why the guard returns a boolean and keeps its reason internal.
//
// The flag remains, as a release control, in front of the authorization.
// ---------------------------------------------------------------------------

export default async function FacilitatorPage({
  params,
}: {
  params: Promise<{ retreatId: string }>
}) {
  if (!isEnabled('LIAP_JOURNEY')) notFound()

  const { retreatId } = await params
  const session = await validateSession((await cookies()).get(SESSION_COOKIE)?.value)

  // Fails closed: no session, no clearance, or an unreachable database all
  // land here, and all of them look identical from outside.
  if (!(await mayReceiveFacilitatorContent(session?.customerId, retreatId))) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <FacilitatorConsole />
    </div>
  )
}

import { notFound } from 'next/navigation'
import { isEnabled } from '@/lib/flags'
import { FacilitatorConsole } from '@/components/liap/journey/FacilitatorConsole'

export const metadata = {
  title: 'Facilitator Console',
  robots: { index: false, follow: false, nocache: true },
  keywords: [],
  openGraph: { images: [] },
}

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// /liap/journey/facilitator — the private console.
//
// ── NO AUTHENTICATION, AND WHY THAT IS SAFE HERE ───────────────────────────
//
// Owner ruling for Version 1, on these grounds: FEATURE_LIAP_JOURNEY is the
// release gate; session state is browser-local; BroadcastChannel is
// same-origin AND same browser profile, so no other device can reach a live
// session; there is no participant personal-project data here; and no
// protected reveal is exposed on the participant display.
//
// The worst case for a stranger who guesses this URL while the flag is on is
// an empty console they can play with alone. To be revisited before any
// multi-device or remotely hosted session architecture.
// ---------------------------------------------------------------------------

export default function FacilitatorPage() {
  if (!isEnabled('LIAP_JOURNEY')) notFound()
  return (
    <div className="min-h-screen bg-slate-950">
      <FacilitatorConsole />
    </div>
  )
}

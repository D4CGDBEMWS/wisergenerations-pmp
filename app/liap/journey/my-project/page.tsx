import { notFound } from 'next/navigation'
import { isEnabled } from '@/lib/flags'
import { MyProject } from '@/components/liap/journey/MyProject'

export const metadata = {
  title: 'My Project',
  robots: { index: false, follow: false, nocache: true },
  keywords: [],
  openGraph: { images: [] },
}

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// /liap/journey/my-project — each participant, on their own device.
//
// ── THERE IS NO SERVER SIDE TO THIS PAGE ───────────────────────────────────
//
// The route renders a client component and stops. No route handler sits behind
// it, no server action is reachable from it, and nothing a participant types
// crosses the network. The Journey Game adds no API routes at all — a fact
// that is asserted rather than assumed, in tests/liap-journey.test.ts.
//
// A participant keeps their roadmap by printing or saving it. Close the tab
// and it is gone, which is the correct lifetime for somebody's real life.
// ---------------------------------------------------------------------------

export default function MyProjectPage() {
  if (!isEnabled('LIAP_JOURNEY')) notFound()
  return <MyProject />
}

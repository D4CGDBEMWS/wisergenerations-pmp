import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { isEnabled } from '@/lib/flags'

// ---------------------------------------------------------------------------
// The Phase I stop gate, enforced in one place. §39, §41.
//
// Every LIAP route nests under this layout, so a page added later is gated by
// default rather than by remembering to gate it. FEATURE_LIAP is off unless
// the environment sets it to exactly "true".
//
// notFound() rather than a "coming soon" page: an unreleased product should
// not be discoverable by probing, and a 404 is indistinguishable from a route
// that was never built. The book has not been announced.
// ---------------------------------------------------------------------------

// Rendered per request, never prerendered. FEATURE_LIAP is an environment
// variable read at request time, and a statically generated page would bake in
// whatever the flag said during the build. That cuts both ways, and the
// dangerous direction is the second one: if this ever has to be pulled from
// production, it must go the moment the flag flips — not after a rebuild.
export const dynamic = 'force-dynamic'

export default function LiapLayout({ children }: { children: ReactNode }) {
  if (!isEnabled('LIAP')) notFound()
  return <>{children}</>
}

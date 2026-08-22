import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { isEnabled } from '@/lib/flags'

// ---------------------------------------------------------------------------
// The retreat funnel's own gate, on top of the LIAP gate in the parent layout.
//
// Two flags rather than one because the two have different launch dates: the
// book and assessment may be live long before a retreat date is announced,
// and the retreat must be withdrawable without taking them with it.
//
// Read per request for the same reason the parent is — if this has to come
// down, it must go when the flag flips, not after a rebuild.
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

export default function RetreatLayout({ children }: { children: ReactNode }) {
  if (!isEnabled('LIAP_RETREAT')) notFound()
  return <>{children}</>
}

import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isEnabled } from '@/lib/flags'

// ---------------------------------------------------------------------------
// The Legacy Kit stop gate, in one place — the same pattern as LIAP.
//
// Every /legacy-kit route nests under this layout, so a page added later is
// gated by default. FEATURE_LEGACY_KIT is off unless the environment sets it to
// exactly "true", and off means a plain 404: an unreleased product should not
// be discoverable by probing.
//
// Rendered per request so flipping the flag takes effect without a rebuild.
// ---------------------------------------------------------------------------
export const dynamic = 'force-dynamic'

// The root layout's PMP keywords and share image must not become the kit's.
// Cleared, not replaced: the kit's share image and keywords are the owner's to
// choose. noindex until launch is a deliberate act.
export const metadata: Metadata = {
  keywords: [],
  openGraph: {
    images: [],
    siteName: 'Wiser Generations International',
  },
  robots: { index: false, follow: false },
}

export default function LegacyKitLayout({ children }: { children: ReactNode }) {
  if (!isEnabled('LEGACY_KIT')) notFound()
  return <>{children}</>
}

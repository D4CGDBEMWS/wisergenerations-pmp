import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Header, BottomNav } from '@/components/Nav'
import { DemoBanner } from '@/components/DemoBanner'
import { BRAND_NAME, MISSION, PILOT_AREA } from '@/lib/brand'

export const metadata: Metadata = {
  title: `${BRAND_NAME} — ${MISSION}`,
  description: `A local exchange for neighbours in ${PILOT_AREA}. Services, work, barter and items.`,
  manifest: '/manifest.json',
  // In development nothing is indexable. Flipping this is a launch decision.
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#1B2F4E',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <DemoBanner />
        <Header />
        {/* pb-20 clears the fixed bottom nav on phones. */}
        <main className="flex-1 pb-20 sm:pb-8">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import NewsletterSignup from '@/components/layout/NewsletterSignup'

export const metadata: Metadata = {
  metadataBase: new URL('https://wisergenerations.com'),
  title: { default: 'Wiser Generations™ — PMP® & CAPM® Certification Training', template: '%s | Wiser Generations™' },
  description: 'PMP® and CAPM® certification prep for career transitioners, corporate teams, and veterans. Mentor-led, PMI-aligned training from Enterprise Academy™. Smyrna, GA and virtual nationwide.',
  keywords: ['PMP certification prep', 'CAPM certification', 'project management training', 'career transition PM', 'veterans project management', 'corporate PM training', 'Crystal Stewart', 'Enterprise Academy'],
  openGraph: { type: 'website', url: 'https://wisergenerations.com', siteName: 'Wiser Generations™', images: [{ url: '/og-image.png', width: 1200, height: 630 }] },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <NewsletterSignup />
        <Footer />
      </body>
    </html>
  )
}

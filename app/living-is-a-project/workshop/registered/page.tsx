import Link from 'next/link'
import localFont from 'next/font/local'
import { notFound } from 'next/navigation'
import { LiapBanner } from '@/components/liap/LiapBanner'
import { isEnabled } from '@/lib/flags'
import { WORKSHOP, findSession, sessionLabel } from '@/lib/liap/workshop'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false }, title: 'You are registered | Be Ready to Make the Turn Workshop' }

const cormorant = localFont({
  src: '../../../fonts/liap/cormorant-garamond-latin-600-normal.woff2',
  weight: '600',
  display: 'swap',
})

export default async function WorkshopRegistered({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  if (!isEnabled('LIAP') || !isEnabled('LIAP_WORKSHOP')) notFound()
  const { session: key } = await searchParams
  const s = findSession(key)
  return (
    <main className="bg-white text-[#1E2F55]">
      <LiapBanner eyebrow="You're registered" />
      <section className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <img src="/liap/brand/crown.png" alt="" width={72} height={60} className="mx-auto h-14 w-auto" />
        <h1 className={`${cormorant.className} mt-4 text-4xl leading-tight text-[#001B3A]`}>Thank you. Your seat is saved.</h1>
        <p className="mt-4 text-[17px]">{WORKSHOP.name}</p>
        {s && <p className="mt-1 font-semibold text-[#001B3A]">{sessionLabel(s)}</p>}
        <p className="mt-6 text-[15px] leading-relaxed">
          Your confirmation email is on its way with your Zoom link and a calendar invite. If you don&rsquo;t see it in a few
          minutes, check your spam or promotions folder, or write to info@wisergenerations.com.
        </p>
        <Link href="/living-is-a-project" className="mt-8 inline-flex min-h-[48px] items-center rounded-full border border-[#001B3A] px-6 text-xs font-semibold uppercase tracking-[0.16em]">
          Back to Living Is a Project
        </Link>
      </section>
    </main>
  )
}

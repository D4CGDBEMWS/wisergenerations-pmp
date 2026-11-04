import localFont from 'next/font/local'
import { notFound } from 'next/navigation'
import { LiapBanner } from '@/components/liap/LiapBanner'
import { LiapPageView } from '@/components/liap/LiapPageView'
import { BrandIcon } from '@/components/liap/BrandIcon'
import { WorkshopRegister, type PickerDay } from '@/components/liap/WorkshopRegister'
import { isEnabled } from '@/lib/flags'
import { WORKSHOP, WORKSHOP_SESSIONS, sessionDayLabel, sessionLabel, sessionOpen, sessionTimeLabel } from '@/lib/liap/workshop'

// ---------------------------------------------------------------------------
// Be Ready to Make the Turn Workshop registration. Owner ruling 2026-11-04.
// Hidden behind LIAP_WORKSHOP until the owner switches it on. The Zoom link is
// never on this page: it goes only to paid registrants by email.
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

const cormorant = localFont({
  src: '../../fonts/liap/cormorant-garamond-latin-600-normal.woff2',
  weight: '600',
  display: 'swap',
})
const greatVibes = localFont({
  src: '../../fonts/liap/great-vibes-latin-400-normal.woff2',
  weight: '400',
  display: 'swap',
})

export const metadata = {
  title: 'Be Ready to Make the Turn Workshop | Living Is a Project…Are You Ready?™',
  description:
    'A live 90-minute Zoom workshop with Crystal Glover Stewart, PMP®. January 11–15, 2027. Choose one session: 12:00–1:30 pm or 7:00–8:30 pm Eastern.',
}

const EYEBROW = 'text-xs font-semibold uppercase tracking-[0.3em] text-[#8A5A0C]'

const WHAT = [
  { icon: 'attention', title: 'Know your position', text: 'Bring your Life Project-Ready™ results, or start fresh, and see clearly where you stand.' },
  { icon: 'plan', title: 'Shape your 30/60/90 days', text: 'Turn what needs attention into a starting plan you can actually work.' },
  { icon: 'move', title: 'Make your next move', text: 'Leave with your next three steps and the WISER Pivots™ to adjust as life changes.' },
] as const

export default function WorkshopPage() {
  if (!isEnabled('LIAP') || !isEnabled('LIAP_WORKSHOP')) notFound()

  const now = new Date()
  const byDay = new Map<string, PickerDay>()
  for (const s of WORKSHOP_SESSIONS) {
    const day = sessionDayLabel(s)
    if (!byDay.has(day)) byDay.set(day, { day, sessions: [] })
    byDay.get(day)!.sessions.push({ key: s.key, time: sessionTimeLabel(s), label: sessionLabel(s), open: sessionOpen(s, now) })
  }

  return (
    <main className="bg-white text-[#1E2F55]">
      <LiapPageView event="liap_workshop_viewed" />
      <LiapBanner eyebrow="Live on Zoom · January 2027" />

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className={EYEBROW}>The workshop</p>
        <h1 className={`${cormorant.className} mt-3 text-4xl leading-tight text-[#001B3A] sm:text-5xl`}>{WORKSHOP.name}</h1>
        <p className={`${greatVibes.className} mt-2 text-3xl text-[#A86F14]`}>The bend is not the end.</p>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed">
          Ninety minutes, live with Crystal Glover Stewart, PMP®, working your plan alongside others going through their own
          change. The same workshop runs twice a day, January 11–15, 2027. Choose the one session that fits your day.
        </p>
        <p className={`${cormorant.className} mt-5 text-3xl text-[#001B3A]`}>{WORKSHOP.priceLabel} <span className="text-lg text-[#5A5F70]">per person</span></p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {WHAT.map((w) => (
            <article key={w.title} className="rounded-2xl border border-[#EADFC8] p-5">
              <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F6F1E6]">
                <BrandIcon name={w.icon} size={24} />
              </span>
              <h2 className="mt-3 font-semibold text-[#001B3A]">{w.title}</h2>
              <p className="mt-1 text-[15px] leading-relaxed">{w.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-[#CC9C48] p-5 sm:p-8">
          <WorkshopRegister days={[...byDay.values()]} priceLabel={WORKSHOP.priceLabel} terms={WORKSHOP.terms} />
        </div>

        <div className="mt-10 grid gap-4 text-[15px] leading-relaxed sm:grid-cols-2">
          <div className="rounded-2xl bg-[#F6F1E6] p-5">
            <p className="font-semibold text-[#001B3A]">After you register</p>
            <p className="mt-1">
              Your confirmation email has your Zoom link and a calendar invite. You will get a reminder the morning of your
              session.
            </p>
          </div>
          <div className="rounded-2xl bg-[#F6F1E6] p-5">
            <p className="font-semibold text-[#001B3A]">Can&rsquo;t make it live?</p>
            <p className="mt-1">Everyone registered for a session receives its replay by email afterwards. Registration is non-refundable.</p>
          </div>
        </div>
      </section>
    </main>
  )
}

import { notFound } from 'next/navigation'
import { WorkshopReplayForm } from '@/components/liap/WorkshopReplayForm'
import { isEnabled } from '@/lib/flags'
import { WORKSHOP, WORKSHOP_SESSIONS, sessionLabel } from '@/lib/liap/workshop'
import { ownerKeyValid, savedReplays } from '@/lib/liap/workshop-service'

// Owner's private page: paste each session's replay link. Opened only with
// ?key=<WORKSHOP_ADMIN_KEY>; anyone else gets the ordinary not-found page.

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false }, title: 'Workshop replays' }

export default async function WorkshopReplays({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  if (!isEnabled('LIAP')) notFound()
  const { key } = await searchParams
  if (!ownerKeyValid(key)) notFound()
  const saved = await savedReplays()
  const now = Date.now()
  const rows = WORKSHOP_SESSIONS.map((s) => ({
    key: s.key,
    label: sessionLabel(s),
    ended: new Date(s.endsAt).getTime() <= now,
    saved: saved[s.key] ?? '',
  }))
  return (
    <main className="mx-auto max-w-3xl bg-white px-4 py-10 text-[#1E2F55] sm:px-6">
      <h1 className="text-2xl font-semibold text-[#001B3A]">{WORKSHOP.name}: replay links</h1>
      <p className="mt-2 text-sm">After each session, paste the Zoom recording&rsquo;s share link and press Save. Everyone registered for that session gets the replay and a three-question survey.</p>
      <div className="mt-8">
        <WorkshopReplayForm ownerKey={key as string} rows={rows} />
      </div>
    </main>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isEnabled } from '@/lib/flags'
import { decidePlayEntry, PLAY_SOFT_LANDING } from '@/lib/game/play-entry'

export const metadata = {
  title: 'Living Life as a Project Manager',
  robots: { index: false, follow: false },
  // Cleared for the same reason as every other LIAP route: metadata merges
  // field by field, and the PMP keyword list and Open Graph image belong to a
  // different program. The title is bare — the root layout's template brands it.
  keywords: [],
  openGraph: { images: [] },
}

// Read per request. The flags decide what this route does, and a statically
// generated page would bake in whatever they said at build time — so shipping
// the game would not change where a printed code lands until the next deploy.
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// /liap/play — the durable QR destination.
//
// Owner-approved, and the only URL for this experience intended to go on
// paper. Deliberately thin: it reads the flags, asks lib/game/play-entry what
// to do, and does it. This file is the seam that must keep resolving for as
// long as printed codes exist, so the less it contains the less there is to go
// wrong in five years.
//
// It does NOT 404 when nothing is live. Every other gated route here does, and
// that is right while nothing points at them. This one is different because
// something will point at it — see lib/game/play-entry.ts.
// ---------------------------------------------------------------------------

export default function PlayEntryPage() {
  const entry = decidePlayEntry({
    gameEnabled: isEnabled('LIAP_GAME'),
    previewEnabled: isEnabled('LIAP_GAME_PREVIEW'),
  })

  if (entry.action === 'play') redirect(entry.href)

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-5 py-14 sm:py-20">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
        {PLAY_SOFT_LANDING.eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl">
        {PLAY_SOFT_LANDING.heading}
      </h1>
      <p className="mt-3 text-lg font-semibold text-brand-blue">
        {PLAY_SOFT_LANDING.comingSoon}
      </p>
      <p className="mt-4 leading-relaxed text-gray-700">{PLAY_SOFT_LANDING.body}</p>
      <p className="mt-5 font-semibold leading-relaxed text-navy">
        {PLAY_SOFT_LANDING.promise}
      </p>
      <p className="mt-6 border-l-4 border-gold pl-4 text-lg font-bold leading-snug text-navy">
        {PLAY_SOFT_LANDING.signature}
      </p>
      <p className="mt-8 text-sm leading-relaxed text-gray-500">
        Think this is a mistake?{' '}
        <Link href="/contact" className="font-semibold text-gold underline underline-offset-4">
          Get in touch
        </Link>
        .
      </p>
    </main>
  )
}

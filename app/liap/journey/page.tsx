import { notFound } from 'next/navigation'
import { isEnabled } from '@/lib/flags'
import { JourneyMap } from '@/components/liap/journey/JourneyMap'

export const metadata = {
  // Bare. The root layout's title template appends the brand.
  title: 'The Journey',
  robots: { index: false, follow: false },
  keywords: [],
  openGraph: { images: [] },
}

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// /liap/journey — the Participant Display. Projected, or screen-shared.
//
// ── WHY THE BARE ROUTE IS THIS ONE ─────────────────────────────────────────
//
// /liap/journey is the most guessable path in this tree, so it resolves to the
// screen that holds nothing private. Somebody who wanders in sees a map
// waiting for a facilitator. The console — private notes, the real clock, the
// debrief — sits one segment deeper at /liap/journey/facilitator.
//
// ── WHAT THIS PAGE CAN REACH ───────────────────────────────────────────────
//
// JourneyMap imports the channel and a type. It does not import the event
// library, the prompt library, the timing constants, the dependency register,
// the facilitator's stored session, or lib/journey/debrief.ts — so the Sponsor
// / Higher Power question and the autobiographical reveal are not in the
// bundle this window loads. tests/liap-journey.test.ts walks this route's
// import graph and asserts it.
//
// ── WHY notFound() AND NOT assertEnabledOrNotFound() ───────────────────────
//
// The shared helper hand-sets a NEXT_NOT_FOUND digest, which Next 16 no longer
// treats as a 404 — it surfaces as a 500. It has no callers; reported rather
// than changed, since fixing shared code was out of scope on the pass that
// found it.
// ---------------------------------------------------------------------------

export default function JourneyDisplayPage() {
  if (!isEnabled('LIAP_JOURNEY')) notFound()
  return <JourneyMap />
}

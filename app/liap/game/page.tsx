import { notFound } from 'next/navigation'
import { isEnabled } from '@/lib/flags'
import { GameClient } from '@/components/liap/game/GameClient'
import { GAME_NAME } from '@/lib/game/naming'

export const metadata = {
  // Bare. The root layout's title template appends the brand; adding one here
  // would render it twice. See lib/game/naming.ts.
  title: GAME_NAME,
  robots: { index: false, follow: false },
  // Cleared for the same reason as every other LIAP route: metadata merges
  // field by field, and the PMP keyword list and Open Graph image belong to a
  // different program.
  keywords: [],
  openGraph: { images: [] },
}

// The flag is read per request, so a statically generated page would bake in
// whatever it said at build time.
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// /liap/game — Living Life as a Project Manager, Version 1.
//
// ── OFF ────────────────────────────────────────────────────────────────────
//
// FEATURE_LIAP_GAME is off in every environment and this route 404s. Version 1
// is built and tested; it is not authorised for customers. A 404 rather than a
// 403 for the same reason as every other gated route here: an unreleased
// experience should not be discoverable by probing.
//
// ── WHY IT LIVES UNDER /liap ───────────────────────────────────────────────
//
// So it inherits the LIAP shell. A participant here must not be shown the exam
// simulator, the $49/month practice subscription or a first-attempt pass-rate
// disclaimer — see lib/shell.ts, which already claims the /liap prefix.
//
// ── WHY notFound() AND NOT assertEnabledOrNotFound() ───────────────────────
//
// `lib/flags.ts` exports assertEnabledOrNotFound(), which throws an Error
// carrying `digest: 'NEXT_NOT_FOUND'`. It does not work on Next 16: the
// handler no longer recognises a hand-set digest and the route returns a 500
// with a stack trace instead of a 404. Verified against a production build —
// see the delivery notes.
//
// It has no other callers; every real gate in this repo, including the LIAP
// layout, already uses notFound() from next/navigation. This route does the
// same. The broken helper is reported rather than changed: it is shared code
// and repairing it is not part of this authorisation.
//
// ── WHY IT IS A SERVER COMPONENT WRAPPING A CLIENT ONE ─────────────────────
//
// The gate is a server decision and the game is entirely client-side. Nothing
// crosses that boundary but the decision to render: no props, no session, no
// participant data. There is no API route for this feature and there is not
// meant to be one.
// ---------------------------------------------------------------------------

export default function GamePage() {
  if (!isEnabled('LIAP_GAME')) notFound()
  return <GameClient />
}

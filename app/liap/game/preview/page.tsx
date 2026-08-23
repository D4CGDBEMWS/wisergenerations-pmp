import { notFound } from 'next/navigation'
import { isEnabled } from '@/lib/flags'
import { PreviewClient } from '@/components/liap/game/PreviewClient'
import { PREVIEW_TITLE } from '@/lib/game/preview'

export const metadata = {
  // Bare, so the root layout's template supplies the brand exactly once.
  title: PREVIEW_TITLE,
  robots: { index: false, follow: false },
  // Cleared for the same reason as every other LIAP route: metadata merges
  // field by field, and the PMP keyword list and Open Graph image belong to a
  // different program.
  keywords: [],
  openGraph: { images: [] },
}

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// /liap/game/preview — Living Life as a Project Manager, one-scenario teaser.
//
// ── ITS OWN FLAG ───────────────────────────────────────────────────────────
//
// FEATURE_LIAP_GAME_PREVIEW, not FEATURE_LIAP_GAME. That separation is the
// point: the teaser is a pre-launch asset and the twelve-scenario day is not,
// so "do not expose the full game through the preview" is enforced by the
// deployment rather than trusted to a link. Both are off in every environment.
//
// A 404 when disabled, like every other gated route here — an unreleased
// experience should not be discoverable by probing.
//
// ── UNDER /liap ────────────────────────────────────────────────────────────
//
// So it inherits the LIAP shell. Someone meeting this from a pre-launch email
// must not be shown the exam simulator, the $49/month subscription or a
// pass-rate disclaimer.
// ---------------------------------------------------------------------------

export default function GamePreviewPage() {
  if (!isEnabled('LIAP_GAME_PREVIEW')) notFound()
  return <PreviewClient />
}

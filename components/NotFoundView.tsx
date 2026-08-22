'use client'

import { usePathname } from 'next/navigation'
import { shellForPath } from '@/lib/shell'
import { DefaultNotFound } from '@/components/DefaultNotFound'
import { LiapNotFound } from '@/components/liap/LiapNotFound'

// ---------------------------------------------------------------------------
// Which 404 a visitor sees.
//
// Split across the server/client boundary because the answer needs two things
// that live on opposite sides of it: the requested path, which only a client
// component can read, and whether the LIAP section is live, which only the
// server knows. The server reads the flag and passes it down.
//
// ── WHY THE FLAG MATTERS HERE ──────────────────────────────────────────────
//
// Every LIAP route 404s while FEATURE_LIAP is off, and that is deliberate: an
// unannounced product should be indistinguishable from a route that was never
// built. A 404 headed "Return to LIAP" would undo exactly that — somebody
// probing /living-is-a-project would be told, by the 404 itself, that LIAP
// exists.
//
// It would also be a broken promise. With the flag off, the hub that button
// points at 404s too, so the recovery route does not recover.
//
// So the LIAP 404 appears only once LIAP is live. Before then a mistyped LIAP
// URL gets the ordinary Wiser Generations 404, which reveals nothing.
// ---------------------------------------------------------------------------

export function NotFoundView({ liapEnabled }: { liapEnabled: boolean }) {
  const shell = shellForPath(usePathname())

  if (shell.key === 'liap' && liapEnabled) {
    return <LiapNotFound />
  }
  return <DefaultNotFound />
}

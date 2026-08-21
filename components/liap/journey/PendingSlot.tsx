import type { CSSProperties } from 'react'
import type { Copy } from '@/lib/liap/journey/content'

// ---------------------------------------------------------------------------
// A slot awaiting approved content.
//
// The single most important line in this file is the first one in the
// component: in production it returns null. Not a placeholder, not "coming
// soon", not grey sample text — nothing.
//
// That is what makes the content contract's guarantee mechanical rather than
// procedural. Copy nobody approved has no path to a live page, even with
// every feature flag on, because the only component that renders a pending
// slot refuses to do so outside development.
//
// In development it is loud on purpose: a dashed amber box naming what is
// missing, so the layout can be built and reviewed while it is obvious at a
// glance that these are holes rather than content.
// ---------------------------------------------------------------------------

interface Props {
  /** Which slot this is, for the developer. Never shown to a visitor. */
  label: string
  copy: Copy
  style?: CSSProperties
}

export function PendingSlot({ label, copy, style }: Props) {
  if (process.env.NODE_ENV === 'production') return null
  if (copy.state === 'approved') return null

  return (
    <div
      role="presentation"
      data-pending-slot={label}
      style={style}
      className="flex flex-col justify-center gap-1 rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 p-4"
    >
      <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-amber-700">
        Awaiting approved content · {label}
      </span>
      <span className="text-sm text-amber-900">{copy.note}</span>
    </div>
  )
}

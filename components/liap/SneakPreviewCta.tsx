import Link from 'next/link'
import { isEnabled } from '@/lib/flags'
import {
  SNEAK_PREVIEW_LABEL,
  SNEAK_PREVIEW_TAGLINE,
  SNEAK_PREVIEW_PATH,
} from '@/lib/liap/preview'

// ---------------------------------------------------------------------------
// "SNEAK PREVIEW / Get a Look Inside".
//
// A server component that renders nothing at all when FEATURE_LIAP_BOOK_PREVIEW
// is off. Not hidden with CSS, not disabled, not rendered-then-guarded: absent
// from the HTML. A link to a route that 404s is worse than no link, and a
// disabled-looking button invites people to ask why.
//
// It is a plain <Link>, not a button, for three reasons that all matter here:
// the destination is a real URL a reader can share and a crawler can follow;
// middle-click and open-in-new-tab work the way people expect of something
// called "look inside"; and it needs no JavaScript, so a reader whose scripts
// fail still gets the preview.
//
// That last point is also why KeepReferral can carry a partner code through
// this link without any code here: it rewrites same-origin LIAP anchors on the
// page, and /liap/ is already in its prefix list. No parallel attribution.
// ---------------------------------------------------------------------------

export function SneakPreviewCta({ className = '' }: { className?: string }) {
  if (!isEnabled('LIAP_BOOK_PREVIEW')) return null

  return (
    <Link
      href={SNEAK_PREVIEW_PATH}
      className={`inline-flex min-h-[52px] flex-col items-center justify-center rounded-xl border-2 border-navy px-8 py-2 text-navy transition-colors hover:bg-navy hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${className}`}
    >
      <span className="text-sm font-bold uppercase tracking-[0.12em]">
        {SNEAK_PREVIEW_LABEL}
      </span>
      <span className="text-sm font-medium">{SNEAK_PREVIEW_TAGLINE}</span>
    </Link>
  )
}

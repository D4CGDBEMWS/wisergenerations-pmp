import Link from 'next/link'
import type { ReactNode } from 'react'
import { readLiapAccess } from '@/lib/liap/entitlements'
import { assessmentOpen } from '@/lib/liap/assessment-availability'

// ---------------------------------------------------------------------------
// Pre-buy buttons that recognise a buyer. Owner report, 2026-11-04: a signed-in
// pre-buyer was shown "Preorder the book" again. Wrap a pre-buy button in this:
// a signed-in buyer sees a link to their assessment instead; everyone else sees
// the button unchanged. Never fails closed onto the buyer: if the check errors,
// the original button shows, which is what the page did before.
// ---------------------------------------------------------------------------

export async function BuyerAware({
  children,
  className = 'inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gold px-7 text-center text-base font-bold text-navy transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy',
}: {
  children: ReactNode
  className?: string
}) {
  let entitled = false
  try {
    entitled = (await readLiapAccess())?.entitled === true
  } catch {
    entitled = false
  }
  if (!entitled) return <>{children}</>

  return (
    <div>
      <Link href="/living-is-a-project/assessment" className={className}>
        {assessmentOpen() ? 'You’ve pre-ordered — go to my assessment' : 'You’ve pre-ordered — thank you'}
      </Link>
    </div>
  )
}

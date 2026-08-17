'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/components/Analytics'

/**
 * Fires `giveaway_viewed` once per page view so the funnel has a denominator
 * for the entry conversion rate. Kept in its own client component so the
 * giveaway page itself stays a server component.
 */
export default function GiveawayViewTracker({ active }: { active: boolean }) {
  useEffect(() => {
    trackEvent('giveaway_viewed', { active })
  }, [active])

  return null
}

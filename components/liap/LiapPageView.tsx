'use client'

import { useEffect, useRef } from 'react'
import { trackLiap, type LiapEvent, type LiapEventProps } from '@/lib/liap/analytics'

// ---------------------------------------------------------------------------
// Fires one funnel event when a page is viewed.
//
// A component rather than an inline effect so that the analytics allow-list in
// lib/liap/analytics.ts is the only path a LIAP event can take, and so that
// server components — which every LIAP page is — can emit one without becoming
// client components themselves.
//
// The ref guards React's development double-invoke and any re-render: a view
// is one event, and a funnel with doubled numbers is worse than no funnel.
// ---------------------------------------------------------------------------

export function LiapPageView({
  event,
  props,
}: {
  event: LiapEvent
  props?: LiapEventProps
}) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    trackLiap(event, props)
  }, [event, props])

  return null
}

'use client'

import { useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// useBottomChromeOffset — how many pixels up from the bottom of the viewport
// are already occupied by other fixed UI.
//
// The chat widget must never sit on top of the cookie banner or the homepage
// sticky CTA bar (Part 13: do not cover navigation, checkout buttons, or
// accessibility controls). Rather than hard-coding knowledge of those
// components, each one is tagged with `data-wg-bottom-chrome` and this hook
// measures whatever is actually on screen.
//
// Elements translated off-screen (the sticky bar uses `translate-y-full` when
// hidden) report a `top` at or below the viewport height and contribute 0, so
// the offset follows their show/hide animation for free.
// ---------------------------------------------------------------------------

export function useBottomChromeOffset(): number {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    let frame = 0

    const measure = () => {
      const viewportHeight = window.innerHeight
      let next = 0

      document.querySelectorAll<HTMLElement>('[data-wg-bottom-chrome]').forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.height === 0 || rect.width === 0) return
        const occupied = viewportHeight - rect.top
        if (occupied > next) next = occupied
      })

      setOffset(Math.max(0, Math.min(next, viewportHeight * 0.5)))
    }

    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }

    measure()

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('transitionend', schedule, true)

    // Catches the cookie banner mounting/unmounting and the sticky bar's class
    // flipping without needing either component to notify us.
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('transitionend', schedule, true)
      observer.disconnect()
    }
  }, [])

  return offset
}

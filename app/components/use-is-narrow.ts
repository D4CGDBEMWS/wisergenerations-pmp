'use client'
import { useState, useEffect } from 'react'

// Shared by the homepage router and the instructor section, both of which
// collapse content below Tailwind's `md` breakpoint and leave desktop alone.
//
// It reports false until it has mounted on purpose. The server renders the
// expanded state, so the HTML a crawler sees and the page a visitor gets with
// no JavaScript are both the whole thing — the collapse is an enhancement, not
// a precondition for reading the page.
export function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return narrow
}

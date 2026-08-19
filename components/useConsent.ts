'use client'

import { useSyncExternalStore } from 'react'
import { CONSENT_EVENT, CONSENT_KEY, CONSENT_VERSION, type ConsentState } from '@/lib/consent'

// ---------------------------------------------------------------------------
// useConsent — subscribes React to the stored consent decision.
//
// useSyncExternalStore rather than useEffect + setState because localStorage
// IS an external store, and this is the API React provides for exactly that.
// It also avoids the cascading-render pattern the react-hooks lint rule flags,
// and gives a correct server snapshot so SSR renders the un-consented state
// rather than hydrating into a mismatch.
//
// getSnapshot must return a stable value across calls with unchanged state,
// so it returns the raw string from localStorage — parsing it into a fresh
// object each time would make React see a new value on every render.
// ---------------------------------------------------------------------------

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, onChange)
  // Keeps tabs in step when the visitor decides in another one.
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(CONSENT_KEY)
  } catch {
    return null
  }
}

/** Server render always assumes no decision — nothing non-essential loads. */
function getServerSnapshot(): string | null {
  return null
}

export function useConsent(): ConsentState | null {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as ConsentState
    return parsed?.version === CONSENT_VERSION ? parsed : null
  } catch {
    return null
  }
}

export function useAnalyticsConsent(): boolean {
  return useConsent()?.analytics === true
}

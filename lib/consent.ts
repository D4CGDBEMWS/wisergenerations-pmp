// ---------------------------------------------------------------------------
// consent — the client-side source of truth for what may load.
//
// The Phase 0 audit found the cookie banner wrote a value that nothing read,
// so GA4 ran regardless of the visitor's choice. This module is the value that
// is actually read, and Analytics subscribes to it.
//
// Versioned deliberately: if the policy changes materially, bumping
// CONSENT_VERSION re-asks rather than silently inheriting an old answer.
// ---------------------------------------------------------------------------

export const CONSENT_VERSION = '2026-08-1'
export const CONSENT_KEY = 'wg-consent'
export const CONSENT_EVENT = 'wg-consent-change'

export type ConsentDecision = 'accepted' | 'essential'

export interface ConsentState {
  version: string
  analytics: boolean
  marketing: boolean
  decidedAt: string
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readConsent(): ConsentState | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentState
    // A decision recorded against an older policy version is not a decision
    // about this one.
    if (parsed?.version !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function hasAnalyticsConsent(): boolean {
  return readConsent()?.analytics === true
}

export function writeConsent(decision: ConsentDecision): ConsentState {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    analytics: decision === 'accepted',
    marketing: decision === 'accepted',
    decidedAt: new Date().toISOString(),
  }
  if (isBrowser()) {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(state))
    // Analytics listens for this rather than waiting for a reload, so
    // accepting takes effect on the current page view.
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }))
  }
  return state
}

/** Lets a visitor change their mind — required for a revocable choice. */
export function clearConsent(): void {
  if (!isBrowser()) return
  window.localStorage.removeItem(CONSENT_KEY)
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }))
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// useTurnstile — renders a Cloudflare Turnstile widget into a container ref and
// exposes the resulting token.
//
// Mirrors the behaviour already used by NewsletterSignup: when
// NEXT_PUBLIC_TURNSTILE_SITE_KEY is absent (local dev), the hook reports
// `required: false` and the form submits without a token.
// ---------------------------------------------------------------------------

// NewsletterSignup already augments the global Window with `turnstile`, so we
// deliberately do NOT redeclare it here (that produces a TS2717 conflict).
// Instead we narrow through a local type at the point of use.
type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string
      callback: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
      theme?: 'light' | 'dark' | 'auto'
      size?: 'normal' | 'compact' | 'flexible'
    }
  ) => string
  remove: (id: string) => void
  reset: (id: string) => void
}

function getTurnstile(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

export function useTurnstile(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: { theme?: 'light' | 'dark' | 'auto' } = {}
) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
  const theme = options.theme ?? 'auto'
  const [token, setToken] = useState<string | null>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!siteKey) return

    let cancelled = false

    const renderWidget = () => {
      const turnstile = getTurnstile()
      if (cancelled || !turnstile || !containerRef.current) return
      if (widgetIdRef.current) return
      widgetIdRef.current = turnstile.render(containerRef.current, {
        sitekey: siteKey,
        size: 'flexible',
        theme,
        callback: (t: string) => setToken(t),
        'expired-callback': () => setToken(null),
        'error-callback': () => setToken(null),
      })
    }

    if (getTurnstile()) {
      renderWidget()
    } else {
      const existing = document.querySelector(`script[src*="turnstile"]`)
      if (existing) {
        existing.addEventListener('load', renderWidget)
      } else {
        const script = document.createElement('script')
        script.src = SCRIPT_SRC
        script.async = true
        script.defer = true
        script.addEventListener('load', renderWidget)
        document.head.appendChild(script)
      }
    }

    return () => {
      cancelled = true
      const turnstile = getTurnstile()
      if (turnstile && widgetIdRef.current) {
        turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey, theme, containerRef])

  const reset = useCallback(() => {
    const turnstile = getTurnstile()
    if (turnstile && widgetIdRef.current) {
      turnstile.reset(widgetIdRef.current)
    }
    setToken(null)
  }, [])

  return { token, reset, required: Boolean(siteKey) }
}

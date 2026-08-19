'use client'

import Script from 'next/script'
import { useAnalyticsConsent } from '@/components/useConsent'

const GA_ID = 'G-8PW23ZF5EQ'

// ---------------------------------------------------------------------------
// GA4, gated on consent.
//
// Previously these <Script> tags rendered unconditionally, so analytics ran
// before the banner was answered and regardless of the answer. Now nothing is
// injected until hasAnalyticsConsent() is true, and the component re-checks on
// the consent event so accepting takes effect immediately rather than on the
// next navigation.
//
// trackEvent() is a no-op without gtag, so callers do not need to know about
// any of this.
// ---------------------------------------------------------------------------

export default function Analytics() {
  const allowed = useAnalyticsConsent()
  if (!allowed) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: true });
        `}
      </Script>
    </>
  )
}

type WindowWithGtag = Window & { gtag?: (...args: unknown[]) => void }

/**
 * Fires a conversion event, if and only if analytics loaded — which only
 * happens with consent. Never pass free-text or anything describing a person's
 * circumstances; this goes to a third party.
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  const w = window as WindowWithGtag
  if (typeof w.gtag !== 'function') return
  w.gtag('event', eventName, params ?? {})
}

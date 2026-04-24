'use client'

import Script from 'next/script'

const GA_ID = 'G-8PW23ZF5EQ'

// ─── GA4 loader ──────────────────────────────────────────────────────────────
export default function Analytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
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

// ─── Conversion event helper ─────────────────────────────────────────────────
// Usage: import { trackEvent } from '@/components/Analytics'
//        trackEvent('checkout_start')
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === 'undefined') return
  if (typeof (window as Window & { gtag?: Function }).gtag !== 'function') return
  ;(window as Window & { gtag: Function }).gtag('event', eventName, params ?? {})
}

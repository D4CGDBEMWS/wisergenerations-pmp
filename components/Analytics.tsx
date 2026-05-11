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
                </Script>Script>
          </>>
        )
}

// ─── Conversion event helper ─────────────────────────────────────────────────
type WindowWithGtag = Window & { gtag?: (...args: unknown[]) => void }
  
export function trackEvent(
    eventName: string,
    params?: Record<string, string | number | boolean>
  ) {
    if (typeof window === 'undefined') return
        const w = window as WindowWithGtag
            if (typeof w.gtag !== 'function') return
                w.gtag('event', eventName, params ?? {})
}</>

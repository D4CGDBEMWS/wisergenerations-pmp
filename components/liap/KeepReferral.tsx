'use client'

import { useEffect } from 'react'

// ---------------------------------------------------------------------------
// Keeps a partner's referral code attached while a visitor moves around LIAP.
//
// ── THE GAP THIS CLOSES ────────────────────────────────────────────────────
//
// A scan of /liap/go/{code} lands on the partner's destination with ?p={code}
// on the URL. If that destination is the book page, the preorder button reads
// the code and the sale is credited. If it is the hub — which is the default
// for any partner whose key is not set — the visitor then clicks "Preorder the
// book", the query string is dropped, and the shop that sent them gets nothing.
//
// That is the whole attribution chain broken by one ordinary internal link.
//
// ── WHY A COMPONENT AND NOT A REWRITTEN HREF ───────────────────────────────
//
// The alternative is threading a search param through every LIAP link, which
// means touching approved customer-facing pages and getting it right in every
// place forever, including links added later. This attaches the code to the
// LIAP links already on the page and stops.
//
// ── WHAT IT DOES NOT DO ────────────────────────────────────────────────────
//
// No cookie, no storage, no network call, no identifier of any kind. The code
// travels in the URL where the visitor can see it, exactly as it arrived, and
// disappears when they leave. It is a public string printed on a postcard.
//
// Same-origin LIAP paths only: it will not add the parameter to an outbound
// link, so a partner code cannot be forwarded to a third party.
// ---------------------------------------------------------------------------

const LIAP_PREFIXES = ['/living-is-a-project', '/liap/']

export function KeepReferral() {
  useEffect(() => {
    let code: string | null = null
    try {
      code = new URLSearchParams(window.location.search).get('p')
    } catch {
      return
    }
    if (!code) return

    for (const anchor of Array.from(document.querySelectorAll('a[href]'))) {
      const href = anchor.getAttribute('href')
      if (!href || !LIAP_PREFIXES.some((prefix) => href.startsWith(prefix))) continue
      if (href.includes('p=')) continue
      anchor.setAttribute('href', `${href}${href.includes('?') ? '&' : '?'}p=${encodeURIComponent(code)}`)
    }
  }, [])

  return null
}

// ---------------------------------------------------------------------------
// Buyer watermark for the paid PMP studio.
//
// Owner ruling 2026-10-30 (copy-protection review). Every page of the studio
// carries the buyer's email, faint and tiled, so a screenshot or saved copy
// that leaks names the account it came from. People rarely share content that
// has their own name on it.
//
// The overlay ignores the mouse (pointer-events: none), so it never blocks a
// click, and it prints. It is added per request, after the shared cached copy
// of the studio is read, so one buyer's email never lands in another's page.
// ---------------------------------------------------------------------------

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!
  )
}

export function watermarkText(email: string): string {
  return `Licensed to ${email} · Wiser Generations Int'l`
}

export function withBuyerWatermark(html: string, email: string): string {
  const text = escapeXml(watermarkText(email))
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="220">` +
    `<text x="230" y="110" text-anchor="middle" transform="rotate(-24 230 110)" ` +
    `font-family="Arial, sans-serif" font-size="13" fill="#1E2F55" fill-opacity="0.09">${text}</text></svg>`
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  const overlay =
    `<div id="wg-buyer-watermark" aria-hidden="true" style="position:fixed;inset:0;` +
    `z-index:2147483647;pointer-events:none;background-image:url('${url}');` +
    `background-repeat:repeat;-webkit-print-color-adjust:exact;print-color-adjust:exact"></div>`
  return html.includes('</body>') ? html.replace('</body>', `${overlay}</body>`) : `${html}${overlay}`
}

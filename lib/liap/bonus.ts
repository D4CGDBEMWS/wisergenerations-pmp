// ---------------------------------------------------------------------------
// The pre-buy bonus. Owner ruling 2026-10-29: the WISER Pivots™ one-sheet is
// given to every pre-buyer straight away, so a buyer has something in hand
// while the Assessment is still opening soon. One home for the name and path,
// so the offer, the thank-you page and the results page cannot drift apart.
//
// Owner ruling 2026-10-30 (copy-protection review): the one-sheet is a reward
// for buying, so it is no longer a public file. It lives in content/liap and is
// served only by /api/liap/bonus, which checks that the person asking bought.
// Each link carries the proof that page already holds: the thank-you page has
// the Stripe checkout session, the results page has the result token.
// ---------------------------------------------------------------------------

export const BONUS_ROUTE = '/api/liap/bonus'

export const PREBUY_BONUS = {
  name: 'WISER Pivots™ one-sheet',
  /** Server-side location. Never under public/. */
  file: 'content/liap/wiser-pivots-one-sheet.pdf',
  downloadName: 'WISER-Pivots-One-Sheet.pdf',
  offer: 'Pre-buy now and download the WISER Pivots™ one-sheet today.',
} as const

/** The download link for a buyer, carrying whichever proof the page has. */
export function bonusHref(proof: { sessionId?: string | null; token?: string | null }): string {
  const params = new URLSearchParams()
  if (proof.sessionId) params.set('session_id', proof.sessionId)
  if (proof.token) params.set('token', proof.token)
  const qs = params.toString()
  return qs ? `${BONUS_ROUTE}?${qs}` : BONUS_ROUTE
}

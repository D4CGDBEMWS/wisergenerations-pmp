import { createHash, createHmac } from 'crypto'

// ---------------------------------------------------------------------------
// The kit's download link.
//
// The token is derived, not random: HMAC(secret, checkout session id). That
// lets the webhook (which emails the link) and the thank-you page (which shows
// it) arrive at the same link independently, in either order, without the
// link ever being stored. The database keeps only its SHA-256.
//
// The secret is LEGACY_KIT_LINK_SECRET. Rotating it invalidates every link
// already sent, so rotate only on a leak, then re-send live links with
// `npm run kit:resend`.
//
// Plain .mjs so the re-send script can use it without a TypeScript build.
// ---------------------------------------------------------------------------

export function linkSecret() {
  const secret = process.env.LEGACY_KIT_LINK_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('LEGACY_KIT_LINK_SECRET must be set to at least 32 random characters.')
  }
  return secret
}

/** The token in the buyer's link. URL-safe, 43 characters. */
export function downloadToken(checkoutSessionId, secret = linkSecret()) {
  return createHmac('sha256', secret).update(`legacy-kit:v1:${checkoutSessionId}`).digest('base64url')
}

/** What the database stores instead of the token. */
export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex')
}

/** A shape check before any database lookup. */
export function isWellFormedToken(token) {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token)
}

export function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wisergenerations.com').replace(/\/$/, '')
}

/** The page the email links to. Opening it uses no downloads. */
export function downloadPageUrl(token) {
  return `${siteOrigin()}/legacy-kit/download?t=${encodeURIComponent(token)}`
}

// ---------------------------------------------------------------------------
// The Wiser Generations International Legacy Kit — product facts in one place.
//
// The name carries ™, never ®, until the federal registration is granted.
// The amount is in cents and is the only place the price exists: the page
// displays it and the checkout charges it, so the two cannot disagree.
// ---------------------------------------------------------------------------

export const LEGACY_KIT_NAME = 'Wiser Generations International Legacy Kit'
export const LEGACY_KIT_NAME_TM = `${LEGACY_KIT_NAME}™`

/** Cents. $30, set by the owner in the launch plan. */
export const LEGACY_KIT_AMOUNT = 3000
export const LEGACY_KIT_CURRENCY = 'usd'
export const LEGACY_KIT_PRICE_DISPLAY = `$${LEGACY_KIT_AMOUNT / 100}`

/**
 * Stripe metadata marker the webhook and thank-you page match on. Set in one
 * place, app/api/legacy-kit/checkout, and used by no other product.
 */
export const LEGACY_KIT_METADATA_KEY = 'wgi-legacy-kit'

/**
 * Whether the Buy button is live on the page.
 *
 * True now that checkout, delivery and the draft Terms of Sale exist. The page
 * itself is still behind FEATURE_LEGACY_KIT, and the checkout route refuses a
 * live Stripe key unless LEGACY_KIT_LIVE=true, so this opens test purchases
 * only.
 */
export const LEGACY_KIT_CHECKOUT_OPEN = true

/** The two boxes a buyer must tick. Wording is the owner's, verbatim. */
export const LEGACY_KIT_CONSENTS = {
  notices:
    'I have read the Important Notices and Terms of Sale. I understand this kit is educational and not legal, tax or financial advice.',
  waiver:
    'I agree that my download starts immediately and I understand I lose my 14-day right to cancel once the download begins.',
} as const

/**
 * Which wording of the boxes a buyer agreed to. Stored with every purchase so
 * "what exactly did they agree to?" is answerable later.
 *
 * Change the wording above → bump this. A test pins the wording to this
 * version, so the two cannot drift apart unnoticed.
 */
export const LEGACY_KIT_CONSENT_VERSION = 'kit-consent-2026-10-04'

/** The download link: how long it lasts and how many times it works. */
export const LEGACY_KIT_LINK_HOURS = 72
export const LEGACY_KIT_DOWNLOAD_LIMIT = 5

// ---------------------------------------------------------------------------
// The Wiser Generations International Legacy Kit — product facts in one place.
//
// The name carries ™, never ®, until the federal registration is granted.
// ---------------------------------------------------------------------------

export const LEGACY_KIT_NAME = 'Wiser Generations International Legacy Kit'
export const LEGACY_KIT_NAME_TM = `${LEGACY_KIT_NAME}™`

/** Display price. The charged amount lives on the Stripe Price, not here. */
export const LEGACY_KIT_PRICE_DISPLAY = '$30'

/**
 * Whether the Buy button is live.
 *
 * False until checkout, delivery and the Terms of Sale exist. The page shows
 * the consent boxes and an inert "Checkout opens soon" button meanwhile, so the
 * layout is reviewable without anyone being able to pay for something that
 * cannot yet be delivered.
 */
export const LEGACY_KIT_CHECKOUT_OPEN = false

/** The two boxes a buyer must tick. Wording is the owner's, verbatim. */
export const LEGACY_KIT_CONSENTS = {
  notices:
    'I have read the Important Notices and Terms of Sale. I understand this kit is educational and not legal, tax or financial advice.',
  waiver:
    'I agree that my download starts immediately and I understand I lose my 14-day right to cancel once the download begins.',
} as const

import { LEGACY_KIT_CONSENT_VERSION } from './product'

// The server-side check behind the two boxes on the kit page. Kept out of the
// route file so it can be tested directly (Next.js route files may only export
// route handlers).

export interface KitCheckoutBody {
  notices?: unknown
  waiver?: unknown
  consentVersion?: unknown
}

/** The server-side consent check, separate so it can be tested on its own. */
export function consentProblem(body: KitCheckoutBody | null): string | null {
  if (!body || body.notices !== true || body.waiver !== true) {
    return 'Please tick both boxes before you buy.'
  }
  if (body.consentVersion !== LEGACY_KIT_CONSENT_VERSION) {
    return 'This page has been updated. Please reload it, read the boxes again and tick them.'
  }
  return null
}

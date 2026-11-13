import { normalizeZip, isInPilotArea } from './geography'

// ---------------------------------------------------------------------------
// Listing validation and discovery.
//
// ── WHAT THIS REFUSES TO ACCEPT ────────────────────────────────────────────
//
// A listing is the one public surface a member writes, so it is where a
// private detail most easily escapes — a phone number in the description, an
// address "so they can find me". The database has no column for those, but
// nothing stops someone typing one into the body, so this layer looks.
//
// It warns rather than blocks: a refusal a person cannot understand gets
// worked around ("3 zero 4..."), and the goal is that they choose not to
// publish it, having been told why.
// ---------------------------------------------------------------------------

export type ListingKind = 'service' | 'item'
export type OfferType = 'paid' | 'barter' | 'combined'

export interface ListingInput {
  readonly title: unknown
  readonly body: unknown
  readonly kind: unknown
  readonly offerType: unknown
  readonly zip: unknown
  readonly categorySlug: unknown
}

export interface ValidListing {
  readonly title: string
  readonly body: string
  readonly kind: ListingKind
  readonly offerType: OfferType
  readonly zip: string
  readonly categorySlug: string
}

export type ListingError =
  | 'title_required' | 'title_too_short' | 'title_too_long'
  | 'body_required' | 'body_too_short' | 'body_too_long'
  | 'kind_invalid' | 'offer_type_invalid'
  | 'zip_required' | 'zip_invalid' | 'zip_outside_pilot_area'
  | 'category_required'

export type ListingWarning = 'contains_phone_number' | 'contains_email' | 'contains_street_address'

export type ListingValidation =
  | { readonly ok: true; readonly value: ValidListing; readonly warnings: readonly ListingWarning[] }
  | { readonly ok: false; readonly errors: readonly ListingError[]; readonly warnings: readonly ListingWarning[] }

const KINDS: readonly string[] = ['service', 'item']
const OFFERS: readonly string[] = ['paid', 'barter', 'combined']

// Deliberately broad. A false positive costs a dismissible warning; a missed
// phone number costs somebody their privacy.
const PHONE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]{2,}/
const STREET = /\b\d{1,6}\s+[A-Za-z][A-Za-z.' -]{2,}\s+(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court|way|pkwy|parkway|cir|circle|ter|terrace|pl|place)\b\.?/i

export function detectPrivateDetails(text: string): ListingWarning[] {
  const out: ListingWarning[] = []
  if (PHONE.test(text)) out.push('contains_phone_number')
  if (EMAIL.test(text)) out.push('contains_email')
  if (STREET.test(text)) out.push('contains_street_address')
  return out
}

export function validateListing(input: ListingInput): ListingValidation {
  const errors: ListingError[] = []

  const title = typeof input.title === 'string' ? input.title.trim() : ''
  if (!title) errors.push('title_required')
  else if (title.length < 4) errors.push('title_too_short')
  else if (title.length > 120) errors.push('title_too_long')

  const body = typeof input.body === 'string' ? input.body.trim() : ''
  if (!body) errors.push('body_required')
  else if (body.length < 10) errors.push('body_too_short')
  else if (body.length > 4000) errors.push('body_too_long')

  const kind = String(input.kind ?? '')
  if (!KINDS.includes(kind)) errors.push('kind_invalid')

  const offerType = String(input.offerType ?? '')
  if (!OFFERS.includes(offerType)) errors.push('offer_type_invalid')

  const rawZip = typeof input.zip === 'string' ? input.zip.trim() : ''
  const zip = normalizeZip(rawZip)
  if (!rawZip) errors.push('zip_required')
  else if (!zip) errors.push('zip_invalid')
  else if (!isInPilotArea(zip)) errors.push('zip_outside_pilot_area')

  const categorySlug = typeof input.categorySlug === 'string' ? input.categorySlug.trim() : ''
  if (!categorySlug) errors.push('category_required')

  const warnings = detectPrivateDetails(`${title}\n${body}`)

  if (errors.length > 0) return { ok: false, errors, warnings }
  return {
    ok: true,
    warnings,
    value: {
      title, body,
      kind: kind as ListingKind,
      offerType: offerType as OfferType,
      zip: zip!,
      categorySlug,
    },
  }
}

export const LISTING_WARNING_MESSAGES: Readonly<Record<ListingWarning, string>> = {
  contains_phone_number:
    'This looks like a phone number. Listings are public — share contact details in a message instead.',
  contains_email:
    'This looks like an email address. Listings are public — share contact details in a message instead.',
  contains_street_address:
    'This looks like a street address. Listings are public — agree a location privately once a booking is confirmed.',
}

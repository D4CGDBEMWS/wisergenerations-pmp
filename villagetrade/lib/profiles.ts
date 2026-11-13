import { normalizeZip, isInPilotArea } from './geography'

// ---------------------------------------------------------------------------
// Profile creation and editing — validation, not persistence.
//
// Kept pure so every rule is testable without a database, and so the rules
// are visible in one place rather than scattered through form handlers.
// Persistence enforces the same things again (constraints + RLS); this layer
// exists to give a person a useful message instead of a constraint violation.
// ---------------------------------------------------------------------------

export interface ProfileInput {
  readonly displayName: unknown
  readonly zip: unknown
}

export interface ValidProfile {
  readonly displayName: string
  readonly zip: string
}

export type ValidationError =
  | 'display_name_required'
  | 'display_name_too_short'
  | 'display_name_too_long'
  | 'zip_required'
  | 'zip_invalid'
  | 'zip_outside_pilot_area'

export type Validated<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly ValidationError[] }

export function validateProfile(input: ProfileInput): Validated<ValidProfile> {
  const errors: ValidationError[] = []

  const name = typeof input.displayName === 'string' ? input.displayName.trim() : ''
  if (!name) errors.push('display_name_required')
  else if (name.length < 2) errors.push('display_name_too_short')
  else if (name.length > 60) errors.push('display_name_too_long')

  const rawZip = typeof input.zip === 'string' ? input.zip.trim() : ''
  const zip = normalizeZip(rawZip)
  if (!rawZip) errors.push('zip_required')
  else if (!zip) errors.push('zip_invalid')
  else if (!isInPilotArea(zip)) errors.push('zip_outside_pilot_area')

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, value: { displayName: name, zip: zip! } }
}

export const VALIDATION_MESSAGES: Readonly<Record<ValidationError, string>> = {
  display_name_required: 'Please enter a name.',
  display_name_too_short: 'That name is too short.',
  display_name_too_long: 'That name is too long.',
  zip_required: 'Please enter your ZIP code.',
  zip_invalid: 'That does not look like a ZIP code.',
  // Honest about the boundary rather than vague. Somebody outside Cobb County
  // is not doing anything wrong; the pilot simply has not reached them.
  zip_outside_pilot_area:
    'VillageTrade is currently open in Cobb County, Georgia only.',
}

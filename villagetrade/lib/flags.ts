// ---------------------------------------------------------------------------
// Feature flags. Every one default OFF.
//
// Same construction as the Wiser Generations site, for the same reason: a
// flag read from the environment at request time, compared against the exact
// string 'true', so an unset, misspelt or truthy-looking value ("1", "yes",
// "TRUE") leaves the feature closed. Failing open is not an option anywhere
// in this application.
// ---------------------------------------------------------------------------

export const FEATURE_FLAGS = [
  'VT_AUTH',
  'VT_LISTINGS',
  'VT_MESSAGING',
  'VT_BOOKINGS',
  'VT_HOLIDAY',
  // Disabled pending additional privacy and financial safeguards.
  // Founder ruling: stays off, and there is no route behind it.
  'VT_BLESS_A_NEIGHBOR',
  // The master safety interlock. No real in-person booking may be confirmed
  // until identity verification is operational AND tested. Turning this on is
  // a founder decision, not a deploy-time detail.
  'VT_LIVE_BOOKINGS',
] as const

export type FeatureFlag = (typeof FEATURE_FLAGS)[number]

export function isEnabled(flag: FeatureFlag): boolean {
  return process.env[`FEATURE_${flag}`] === 'true'
}

/** True while the app is serving clearly-labelled fictional data. */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_VT_DEMO === 'true'
}

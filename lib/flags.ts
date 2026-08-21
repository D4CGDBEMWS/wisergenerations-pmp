// ---------------------------------------------------------------------------
// Feature flags.
//
// Deliberately environment variables rather than a flag SaaS: Phase 0.5 needs
// exactly one capability — keep unfinished routes off until approved — and a
// third-party service would add a network dependency and a vendor to the
// authorization path for no gain at this size.
//
// Flags are read at request time, not module load, so toggling one in Vercel
// takes effect on redeploy without a code change.
// ---------------------------------------------------------------------------

export type FeatureFlag =
  | 'LIAP'
  // Phase II-A. Two flags rather than one, because the community channel and
  // the retreat funnel have different launch dates: partner QR codes have to
  // work the day the signs go up, which may be well before a retreat date is
  // announced. Both are independent of LIAP, so switching either off leaves
  // the book and the assessment untouched.
  | 'LIAP_PARTNERS'
  | 'LIAP_RETREAT'
  // Phase II-B. Gates the entire admin surface, including the staff sign-in
  // page. Separate from every other flag because this is the one that, when
  // on, means privileged accounts can authenticate — and it should be
  // possible to shut that off without touching anything customers see.
  | 'LIAP_ADMIN'
  | 'CAPM_PATHWAY'

/** Off unless explicitly enabled. An unset or misspelled variable stays off. */
export function isEnabled(flag: FeatureFlag): boolean {
  return process.env[`FEATURE_${flag}`] === 'true'
}

/**
 * Route guard for gated sections. Returns a 404 rather than a 403 so a
 * disabled route is indistinguishable from one that does not exist — an
 * unreleased product should not be discoverable by probing.
 */
export function assertEnabledOrNotFound(flag: FeatureFlag): void {
  if (!isEnabled(flag)) {
    const err = new Error(`Feature ${flag} is disabled`) as Error & { digest?: string }
    err.digest = 'NEXT_NOT_FOUND'
    throw err
  }
}

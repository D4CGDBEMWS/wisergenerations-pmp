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

export type FeatureFlag = 'LIAP' | 'CAPM_PATHWAY'

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

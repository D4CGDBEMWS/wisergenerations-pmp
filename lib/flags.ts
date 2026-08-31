import { notFound } from 'next/navigation'

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
  // Book activation, Unit 1. Its own flag rather than riding on LIAP, because
  // the QR has to work the day books ship and that date matches nothing else.
  //
  // THE FACT THAT MATTERS MOST ABOUT THIS FLAG: once a QR code is printed it
  // can never be turned off again without stranding a reader holding the book.
  // It protects the pre-print period and nothing after it.
  | 'LIAP_BOOK_ACTIVATION'
  // Living Life as a Project Manager, Version 1. Its own flag rather
  // than riding on LIAP, because the game is an experience associated with the
  // Virtual Workshop and can be turned on for a workshop date without turning
  // on the assessment, the book activation route or anything else in LIAP.
  //
  // Default off, and off in every environment: Version 1 is built and tested
  // but not authorised for customers.
  | 'LIAP_GAME'
  // The one-scenario teaser, "Living Life as a Project Manager — Game Preview".
  //
  // Its own flag, separate from LIAP_GAME, because the whole point is that the
  // teaser can go out during pre-launch while the full twelve-scenario day
  // stays closed. Two flags is what makes "do not expose the full game through
  // the preview CTA" a property of the deployment rather than a promise.
  //
  // Default off. Version 1 of both is built and tested, neither is authorised.
  | 'LIAP_GAME_PREVIEW'
  // The LIAP Journey Game — the facilitated team experience run at an
  // Intensive: a private facilitator console, a projected participant map, and
  // MY PROJECT on each participant's own device.
  //
  // DELIBERATELY STANDALONE. It does not ride on LIAP and it is not coupled to
  // LIAP_GAME. Turning the Journey Game on for one Intensive date must not
  // turn on the assessment, the book QR, or Living Life as a Project Manager —
  // and turning any of those on must never expose the Journey Game. Coupling
  // these would make a release decision about one product silently a release
  // decision about another.
  //
  // Default off, and off in every environment.
  | 'LIAP_JOURNEY'
  | 'CAPM_PATHWAY'

/** Off unless explicitly enabled. An unset or misspelled variable stays off. */
export function isEnabled(flag: FeatureFlag): boolean {
  return process.env[`FEATURE_${flag}`] === 'true'
}

/**
 * Route guard for gated sections. Produces a 404 rather than a 403, so a
 * disabled route is indistinguishable from one that does not exist — an
 * unreleased product should not be discoverable by probing.
 *
 * ── WHY THIS DELEGATES RATHER THAN CONSTRUCTING ITS OWN ERROR ──────────────
 *
 * This used to build a plain Error and hand-set `digest = 'NEXT_NOT_FOUND'`,
 * which was how Next signalled a 404 at the time it was written. Next 16 no
 * longer recognises a hand-set digest, so the throw fell through to the error
 * boundary and the route answered 500 — with a stack trace — instead of 404.
 *
 * That is worse than a cosmetic bug on a gated route. A 500 is a DIFFERENT
 * answer from a 404, and a different answer is information: probing a disabled
 * feature returned something a non-existent path never would, which is exactly
 * the enumeration signal the 404 was chosen to avoid.
 *
 * So the shape of the error is no longer this module's business. `notFound()`
 * throws whatever the installed Next considers a 404, and it will keep doing
 * so across upgrades — the failure above was caused by encoding that detail
 * here in the first place.
 */
export function assertEnabledOrNotFound(flag: FeatureFlag): void {
  if (!isEnabled(flag)) notFound()
}

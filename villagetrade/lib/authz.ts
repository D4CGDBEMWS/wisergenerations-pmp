// ---------------------------------------------------------------------------
// Authorization. Server-side, explicit, fails closed.
//
// ── WHAT THIS IS AND IS NOT ────────────────────────────────────────────────
//
// This module answers "may this actor do this thing", as pure functions over
// facts the caller has already read from the database. It is deliberately
// free of I/O so every branch is testable without a server.
//
// It is NOT the only layer. Supabase row-level security sits underneath
// (0005), and the database triggers in 0004 sit underneath that. Three
// layers, because the one that fails is always the one somebody forgot to
// call. RLS catches the query nobody guarded; the triggers catch the write
// that reached the table anyway.
//
// Every function returns a Decision rather than a boolean, so a refusal
// carries a reason the caller can log and the UI can translate -- and so
// "false" can never be mistaken for "allowed" by a stray `!`.
// ---------------------------------------------------------------------------

export type Decision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: DenyReason }

export type DenyReason =
  | 'not_signed_in'
  | 'suspended'
  | 'not_owner'
  | 'not_a_party'
  | 'blocked'
  | 'identity_not_verified'
  | 'conduct_not_acknowledged'
  | 'booking_not_completed'
  | 'already_reviewed'
  | 'outside_pilot_area'
  | 'feature_disabled'
  | 'live_bookings_disabled'

const ALLOW: Decision = { allowed: true }
const deny = (reason: DenyReason): Decision => ({ allowed: false, reason })

export interface Actor {
  readonly profileId: string
  readonly suspended: boolean
  readonly identityVerified: boolean
}

export interface BookingFacts {
  readonly requesterId: string
  readonly providerId: string
  readonly status: 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'disputed'
  readonly confirmedAt: string | null
  readonly acknowledgedBy: readonly string[]
  readonly partiesBlocked: boolean
}

/** Signed in, not suspended. The precondition for everything below. */
export function canAct(actor: Actor | null): Decision {
  if (!actor) return deny('not_signed_in')
  if (actor.suspended) return deny('suspended')
  return ALLOW
}

export function canEditListing(actor: Actor | null, listingOwnerId: string): Decision {
  const base = canAct(actor)
  if (!base.allowed) return base
  if (actor!.profileId !== listingOwnerId) return deny('not_owner')
  return ALLOW
}

/** Publishing requires a ZIP inside the approved pilot area. */
export function canPublishListing(
  actor: Actor | null,
  listingOwnerId: string,
  zipInPilotArea: boolean
): Decision {
  const base = canEditListing(actor, listingOwnerId)
  if (!base.allowed) return base
  if (!zipInPilotArea) return deny('outside_pilot_area')
  return ALLOW
}

export function isParty(actor: Actor, b: BookingFacts): boolean {
  return actor.profileId === b.requesterId || actor.profileId === b.providerId
}

/** Only the two parties may read a booking or its conversation. */
export function canViewBooking(actor: Actor | null, b: BookingFacts): Decision {
  const base = canAct(actor)
  if (!base.allowed) return base
  if (!isParty(actor!, b)) return deny('not_a_party')
  return ALLOW
}

/**
 * Confirming a booking — the gate that matters most.
 *
 * Mirrors the database trigger in 0004 exactly. Duplication is intentional:
 * the application refuses early with a reason a person can act on, and the
 * database refuses regardless of which code path got there. A test asserts
 * both layers agree.
 */
export function canConfirmBooking(
  actor: Actor | null,
  b: BookingFacts,
  opts: { readonly liveBookingsEnabled: boolean; readonly counterparty: Actor }
): Decision {
  const base = canViewBooking(actor, b)
  if (!base.allowed) return base
  if (b.partiesBlocked) return deny('blocked')

  const bothAcknowledged =
    b.acknowledgedBy.includes(b.requesterId) && b.acknowledgedBy.includes(b.providerId)
  if (!bothAcknowledged) return deny('conduct_not_acknowledged')

  if (opts.counterparty.suspended) return deny('suspended')

  // No real in-person booking until verification is operational AND tested.
  if (!opts.liveBookingsEnabled) return deny('live_bookings_disabled')
  if (!actor!.identityVerified || !opts.counterparty.identityVerified) {
    return deny('identity_not_verified')
  }
  return ALLOW
}

/** A review requires a completed booking, by a party, not written twice. */
export function canReviewBooking(
  actor: Actor | null,
  b: BookingFacts,
  alreadyReviewedBy: readonly string[]
): Decision {
  const base = canViewBooking(actor, b)
  if (!base.allowed) return base
  if (b.status !== 'completed') return deny('booking_not_completed')
  if (alreadyReviewedBy.includes(actor!.profileId)) return deny('already_reviewed')
  return ALLOW
}

/**
 * Whether a precise meeting location may be disclosed to this actor.
 *
 * Confirmed booking, and a party to it. Nothing else reveals an address.
 */
export function canSeeLocationDetail(actor: Actor | null, b: BookingFacts): Decision {
  const base = canViewBooking(actor, b)
  if (!base.allowed) return base
  if (b.status !== 'confirmed' && b.status !== 'completed') return deny('not_a_party')
  return ALLOW
}

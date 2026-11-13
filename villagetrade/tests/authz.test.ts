import { describe, it, expect } from 'vitest'
import {
  canAct, canEditListing, canPublishListing, canViewBooking,
  canConfirmBooking, canReviewBooking, canSeeLocationDetail,
  type Actor, type BookingFacts,
} from '@/lib/authz'

// ---------------------------------------------------------------------------
// Authorization, exercised from the refusal side.
//
// Tests that only prove the happy path are how authorization bugs ship. Each
// block below asserts the DENIAL and its reason first.
// ---------------------------------------------------------------------------

const actor = (over: Partial<Actor> = {}): Actor => ({
  profileId: 'u-requester', suspended: false, identityVerified: true, ...over,
})

const booking = (over: Partial<BookingFacts> = {}): BookingFacts => ({
  requesterId: 'u-requester',
  providerId: 'u-provider',
  status: 'requested',
  confirmedAt: null,
  acknowledgedBy: ['u-requester', 'u-provider'],
  partiesBlocked: false,
  ...over,
})

const counterparty = actor({ profileId: 'u-provider' })

describe('the base gate', () => {
  it('refuses a signed-out actor', () => {
    expect(canAct(null)).toEqual({ allowed: false, reason: 'not_signed_in' })
  })
  it('refuses a suspended actor', () => {
    expect(canAct(actor({ suspended: true }))).toEqual({ allowed: false, reason: 'suspended' })
  })
  it('allows an ordinary actor', () => {
    expect(canAct(actor()).allowed).toBe(true)
  })
})

describe('listings', () => {
  it('refuses editing somebody else’s listing', () => {
    expect(canEditListing(actor(), 'someone-else')).toEqual({ allowed: false, reason: 'not_owner' })
  })
  it('refuses publishing outside the pilot area', () => {
    expect(canPublishListing(actor(), 'u-requester', false))
      .toEqual({ allowed: false, reason: 'outside_pilot_area' })
  })
  it('allows the owner to publish inside the pilot area', () => {
    expect(canPublishListing(actor(), 'u-requester', true).allowed).toBe(true)
  })
})

describe('bookings are private to their two parties', () => {
  it('refuses a stranger', () => {
    expect(canViewBooking(actor({ profileId: 'u-stranger' }), booking()))
      .toEqual({ allowed: false, reason: 'not_a_party' })
  })
  it('allows either party', () => {
    expect(canViewBooking(actor(), booking()).allowed).toBe(true)
    expect(canViewBooking(counterparty, booking()).allowed).toBe(true)
  })
})

describe('confirming a booking mirrors the database gate', () => {
  const opts = (over = {}) => ({ liveBookingsEnabled: true, counterparty, ...over })

  it('refuses when live bookings are disabled — the default', () => {
    expect(canConfirmBooking(actor(), booking(), opts({ liveBookingsEnabled: false })))
      .toEqual({ allowed: false, reason: 'live_bookings_disabled' })
  })
  it('refuses when conduct is not acknowledged by both', () => {
    expect(canConfirmBooking(actor(), booking({ acknowledgedBy: ['u-requester'] }), opts()))
      .toEqual({ allowed: false, reason: 'conduct_not_acknowledged' })
  })
  it('refuses a blocked pair', () => {
    expect(canConfirmBooking(actor(), booking({ partiesBlocked: true }), opts()))
      .toEqual({ allowed: false, reason: 'blocked' })
  })
  it('refuses when the counterparty is suspended', () => {
    expect(canConfirmBooking(actor(), booking(), opts({ counterparty: actor({ profileId: 'u-provider', suspended: true }) })))
      .toEqual({ allowed: false, reason: 'suspended' })
  })
  it('refuses when either party is unverified', () => {
    expect(canConfirmBooking(actor({ identityVerified: false }), booking(), opts()))
      .toEqual({ allowed: false, reason: 'identity_not_verified' })
    expect(canConfirmBooking(actor(), booking(), opts({ counterparty: actor({ profileId: 'u-provider', identityVerified: false }) })))
      .toEqual({ allowed: false, reason: 'identity_not_verified' })
  })
  it('allows only when every condition holds at once', () => {
    expect(canConfirmBooking(actor(), booking(), opts()).allowed).toBe(true)
  })
})

describe('reviews', () => {
  it('refuses before completion', () => {
    expect(canReviewBooking(actor(), booking({ status: 'confirmed' }), []))
      .toEqual({ allowed: false, reason: 'booking_not_completed' })
  })
  it('refuses a second review from the same author', () => {
    expect(canReviewBooking(actor(), booking({ status: 'completed' }), ['u-requester']))
      .toEqual({ allowed: false, reason: 'already_reviewed' })
  })
  it('allows one review per party after completion', () => {
    expect(canReviewBooking(actor(), booking({ status: 'completed' }), []).allowed).toBe(true)
  })
})

describe('a precise location is disclosed only after confirmation', () => {
  it('refuses before the booking is confirmed', () => {
    expect(canSeeLocationDetail(actor(), booking({ status: 'requested' })).allowed).toBe(false)
  })
  it('refuses a stranger outright', () => {
    expect(canSeeLocationDetail(actor({ profileId: 'u-stranger' }), booking({ status: 'confirmed' })))
      .toEqual({ allowed: false, reason: 'not_a_party' })
  })
  it('allows a party once confirmed or completed', () => {
    expect(canSeeLocationDetail(actor(), booking({ status: 'confirmed' })).allowed).toBe(true)
    expect(canSeeLocationDetail(actor(), booking({ status: 'completed' })).allowed).toBe(true)
  })
})

-- ===========================================================================
-- 0003 — Exchange proposals, bookings and agreements.
--
-- ── NO MONEY MOVES THROUGH THIS PLATFORM ───────────────────────────────────
--
-- Founder ruling: the MVP records what two people AGREED. It does not
-- collect, hold or transfer funds. The column is therefore named
-- `agreed_amount_cents` rather than `price` or `total`, and a comment is not
-- the only thing saying so -- there is no payment table, no payout table, no
-- balance, and no Stripe reference anywhere in this schema. Adding one is a
-- separately approved architecture, not an afternoon's work.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS exchange_proposals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  -- Who wants the thing done.
  requester_id    uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  -- Who would do it. Denormalised from the listing so a later listing edit
  -- cannot silently re-point an agreed proposal at a different person.
  provider_id     uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  offer_type      text NOT NULL,
  agreed_amount_cents integer,
  barter_description  text,
  status          text NOT NULL DEFAULT 'proposed',
  created_at      timestamptz NOT NULL DEFAULT now(),
  responded_at    timestamptz,
  CONSTRAINT proposal_offer_known CHECK (offer_type IN ('paid', 'barter', 'combined')),
  CONSTRAINT proposal_status_known
    CHECK (status IN ('proposed', 'accepted', 'declined', 'withdrawn', 'expired')),
  CONSTRAINT proposal_not_self CHECK (requester_id <> provider_id),
  CONSTRAINT proposal_amount_sane
    CHECK (agreed_amount_cents IS NULL OR (agreed_amount_cents > 0 AND agreed_amount_cents <= 10000000)),
  -- The three shapes, each requiring exactly what it claims to be.
  CONSTRAINT proposal_shape_matches_type CHECK (
    (offer_type = 'paid'     AND agreed_amount_cents IS NOT NULL AND barter_description IS NULL)
 OR (offer_type = 'barter'   AND agreed_amount_cents IS NULL     AND barter_description IS NOT NULL)
 OR (offer_type = 'combined' AND agreed_amount_cents IS NOT NULL AND barter_description IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS proposals_provider_idx ON exchange_proposals (provider_id, status);
CREATE INDEX IF NOT EXISTS proposals_requester_idx ON exchange_proposals (requester_id, status);

-- ---------------------------------------------------------------------------
-- bookings — the scheduled work.
--
-- Duration is an enum, not free minutes: the founder specified individual,
-- half-day (up to 4h) and full-day (up to 8h), and an enum cannot drift into
-- a 14-hour booking nobody approved.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id    uuid NOT NULL UNIQUE REFERENCES exchange_proposals (id) ON DELETE CASCADE,
  requester_id   uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  provider_id    uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  duration_kind  text NOT NULL,
  scheduled_for  timestamptz,
  status         text NOT NULL DEFAULT 'requested',
  created_at     timestamptz NOT NULL DEFAULT now(),
  confirmed_at   timestamptz,
  completed_at   timestamptz,
  cancelled_at   timestamptz,
  cancelled_by   uuid REFERENCES profiles (id) ON DELETE SET NULL,
  cancel_reason  text,
  CONSTRAINT booking_duration_known
    CHECK (duration_kind IN ('individual', 'half_day_4h', 'full_day_8h')),
  CONSTRAINT booking_status_known
    CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled', 'disputed')),
  CONSTRAINT booking_not_self CHECK (requester_id <> provider_id),
  CONSTRAINT booking_confirm_paired CHECK ((status = 'confirmed') <= (confirmed_at IS NOT NULL)),
  CONSTRAINT booking_complete_paired CHECK ((status = 'completed') = (completed_at IS NOT NULL)),
  CONSTRAINT booking_cancel_paired CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS bookings_provider_idx ON bookings (provider_id, status);
CREATE INDEX IF NOT EXISTS bookings_requester_idx ON bookings (requester_id, status);

-- ---------------------------------------------------------------------------
-- booking_agreements — the ONE place a precise location may exist, and only
-- after both sides have agreed to meet.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_agreements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE CASCADE,
  meeting_notes   text,
  -- Disclosed to the counterparty only, only once the booking is confirmed,
  -- and never rendered on any public surface.
  location_detail text,
  agreed_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agreement_notes_len CHECK (meeting_notes IS NULL OR char_length(meeting_notes) <= 2000)
);

-- ---------------------------------------------------------------------------
-- conduct_acknowledgments — per booking, not per account.
--
-- The founder requires an explicit professional-conduct acknowledgment before
-- a booking is confirmed. Per-booking is the stricter and more honest shape:
-- a box ticked once at signup in March is not consent to the standard in
-- November, and both parties must have ticked it for THIS job.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conduct_acknowledgments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   uuid NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  profile_id   uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  -- The exact text the person was shown, stored verbatim. If the standard is
  -- ever reworded, old acknowledgments still say what was actually agreed.
  conduct_text text NOT NULL,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, profile_id)
);

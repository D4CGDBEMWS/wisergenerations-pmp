-- ===========================================================================
-- 0004 — Safety: moderation, blocking, reviews, and the gates.
--
-- ── WHY TRIGGERS AND NOT CHECK CONSTRAINTS ─────────────────────────────────
--
-- Founder correction, and a correct one. A CHECK constraint sees one row of
-- one table. Every rule that actually protects a person here spans tables:
--
--   "a review requires a COMPLETED booking"        -- reviews -> bookings
--   "confirmation requires BOTH parties to have
--    acknowledged the conduct standard"            -- bookings -> conduct_ack
--   "a blocked pair cannot transact"               -- bookings -> blocks
--   "live bookings require identity verification"  -- bookings -> verifications
--
-- None of those is expressible as a CHECK. They are triggers, which run
-- inside the same transaction as the write and abort it on violation, so
-- there is no window in which a half-valid booking exists.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS blocks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id   uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  blocked_id   uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CONSTRAINT block_not_self CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  -- Exactly one subject. A report about nothing, or about two things, is a
  -- bug in the reporting UI and should not reach the moderation queue.
  subject_profile_id uuid REFERENCES profiles (id) ON DELETE CASCADE,
  subject_listing_id uuid REFERENCES listings (id) ON DELETE CASCADE,
  subject_booking_id uuid REFERENCES bookings (id) ON DELETE CASCADE,
  reason          text NOT NULL,
  detail          text,
  status          text NOT NULL DEFAULT 'open',
  created_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz,
  CONSTRAINT report_reason_known CHECK (reason IN (
    'safety_concern', 'conduct_violation', 'scam_or_fraud',
    'inappropriate_content', 'spam', 'other'
  )),
  CONSTRAINT report_status_known CHECK (status IN ('open', 'reviewing', 'actioned', 'dismissed')),
  CONSTRAINT report_exactly_one_subject CHECK (
    (subject_profile_id IS NOT NULL)::int
  + (subject_listing_id IS NOT NULL)::int
  + (subject_booking_id IS NOT NULL)::int = 1
  ),
  CONSTRAINT report_resolution_paired
    CHECK ((status IN ('actioned', 'dismissed')) = (resolved_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS reports_queue_idx ON reports (status, created_at) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS moderation_actions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id    uuid REFERENCES reports (id) ON DELETE SET NULL,
  actor_id     uuid REFERENCES profiles (id) ON DELETE SET NULL,
  action       text NOT NULL,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT moderation_action_known CHECK (action IN (
    'listing_removed', 'profile_suspended', 'profile_reinstated',
    'report_dismissed', 'warning_issued'
  ))
);

-- ---------------------------------------------------------------------------
-- reviews — only after a booking actually completed.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   uuid NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  author_id    uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  subject_id   uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  rating       smallint NOT NULL,
  body         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, author_id),
  CONSTRAINT review_rating_range CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT review_not_self CHECK (author_id <> subject_id),
  CONSTRAINT review_body_len CHECK (body IS NULL OR char_length(body) <= 2000)
);

-- ===========================================================================
-- THE GATES
-- ===========================================================================

-- GATE 1 ---------------------------------------------------------------------
-- A review requires a completed booking, and may only be written by one of
-- its two parties, about the other.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION review_requires_completed_booking()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE b record;
BEGIN
  SELECT * INTO b FROM bookings WHERE id = NEW.booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'review_booking_missing' USING ERRCODE = 'check_violation';
  END IF;
  IF b.status <> 'completed' THEN
    RAISE EXCEPTION 'review_requires_completed_booking (status=%)', b.status
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.author_id NOT IN (b.requester_id, b.provider_id)
     OR NEW.subject_id NOT IN (b.requester_id, b.provider_id) THEN
    RAISE EXCEPTION 'review_party_mismatch' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_require_completed_booking ON reviews;
CREATE TRIGGER reviews_require_completed_booking
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION review_requires_completed_booking();

-- GATE 2 ---------------------------------------------------------------------
-- A booking cannot be CONFIRMED until:
--   (a) both parties have acknowledged the conduct standard for THIS booking,
--   (b) neither party has blocked the other,
--   (c) if live in-person bookings are enabled, both are identity-verified.
--
-- (c) is governed by a runtime setting rather than a constant, so the gate is
-- testable in both positions and the founder's "no live bookings until
-- verification is operational" is a switch with a default of CLOSED.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION booking_confirm_gate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  acks int;
  live_enabled boolean;
BEGIN
  IF NEW.status <> 'confirmed' OR (TG_OP = 'UPDATE' AND OLD.status = 'confirmed') THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO acks
    FROM conduct_acknowledgments
   WHERE booking_id = NEW.id
     AND profile_id IN (NEW.requester_id, NEW.provider_id);

  IF acks < 2 THEN
    RAISE EXCEPTION 'booking_requires_conduct_acknowledgment (have %, need 2)', acks
      USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (
    SELECT 1 FROM blocks
     WHERE (blocker_id = NEW.requester_id AND blocked_id = NEW.provider_id)
        OR (blocker_id = NEW.provider_id  AND blocked_id = NEW.requester_id)
  ) THEN
    RAISE EXCEPTION 'booking_blocked_pair' USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (
    SELECT 1 FROM profiles
     WHERE id IN (NEW.requester_id, NEW.provider_id) AND suspended_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'booking_party_suspended' USING ERRCODE = 'check_violation';
  END IF;

  -- Default CLOSED: absent setting means live bookings are not enabled.
  live_enabled := coalesce(current_setting('villagetrade.live_bookings', true), 'off') = 'on';
  IF live_enabled THEN
    IF NOT (is_identity_verified(NEW.requester_id) AND is_identity_verified(NEW.provider_id)) THEN
      RAISE EXCEPTION 'booking_requires_identity_verification'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_confirm_gate ON bookings;
CREATE TRIGGER bookings_confirm_gate
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION booking_confirm_gate();

-- GATE 3 ---------------------------------------------------------------------
-- Completion requires a prior confirmation. Without this a booking could jump
-- straight to 'completed' and unlock a review for work never scheduled.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION booking_complete_gate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.confirmed_at IS NULL THEN
    RAISE EXCEPTION 'booking_completed_without_confirmation'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_complete_gate ON bookings;
CREATE TRIGGER bookings_complete_gate
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION booking_complete_gate();

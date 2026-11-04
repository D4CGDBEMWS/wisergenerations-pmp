-- ===========================================================================
-- 0009 — Be Ready to Make the Turn Workshop registrations.
--
-- Owner ruling 2026-11-04. One row per paid registration (keyed on the Stripe
-- checkout session, so a replayed webhook cannot register twice), the replay
-- link per session once the owner has it, and the post-workshop survey.
-- Only CREATE ... IF NOT EXISTS: safe to re-run.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS workshop_registrations (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                 uuid NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
  session_key                 text NOT NULL,
  stripe_checkout_session_id  text NOT NULL UNIQUE,
  amount                      integer,
  -- Random, hashed at rest: the survey link in the replay email.
  survey_token_hash           text NOT NULL UNIQUE,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  confirmation_sent_at        timestamptz,
  reminder_sent_at            timestamptz,
  replay_sent_at              timestamptz,
  refunded_at                 timestamptz
);
CREATE INDEX IF NOT EXISTS workshop_registrations_session_idx ON workshop_registrations (session_key);

CREATE TABLE IF NOT EXISTS workshop_replays (
  session_key  text PRIMARY KEY,
  replay_url   text NOT NULL,
  added_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workshop_survey_responses (
  registration_id  uuid PRIMARY KEY REFERENCES workshop_registrations (id) ON DELETE CASCADE,
  rating           smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  most_helpful     text,
  next_step        text,
  submitted_at     timestamptz NOT NULL DEFAULT now()
);

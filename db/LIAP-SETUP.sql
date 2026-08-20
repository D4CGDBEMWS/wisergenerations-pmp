-- ===========================================================================
-- Life Is a Project™ — database setup, in one paste.
--
-- This is migrations 0003 and 0004 joined together so they can be run in the
-- Neon SQL Editor in a single go, the same way db/SETUP.sql was.
--
-- Safe to run more than once. Everything below is CREATE ... IF NOT EXISTS or
-- an ON CONFLICT DO NOTHING insert, so a second run changes nothing and
-- reports success.
--
-- Requires db/SETUP.sql to have been run first — these tables reference
-- customers, orders and products.
--
-- Generated from db/migrations/. If those files change, regenerate rather
-- than editing this by hand:
--   cat db/migrations/0003_liap_phase_1.sql db/migrations/0004_seed_liap_product.sql
-- ===========================================================================

-- ===========================================================================
-- Phase I — Life Is a Project™ MVP
--
-- Everything here belongs to the LIAP product family. It sits on the Phase 0.5
-- foundation — customers, products, orders, entitlements, sessions, consent,
-- audit — and adds nothing PMP-specific and nothing PMP depends on.
--
-- Three separations carry the design:
--
--   1. Free text is isolated. assessment_narratives holds every open-ended
--      answer and NOTHING else, so the 90-day purge is a DELETE from one
--      table. Scores, classifications, position and plan live elsewhere and
--      survive, which is what lets the report still exist after the raw
--      narrative is gone.
--
--   2. Definitions are versioned and never rewritten. A completed assessment
--      records which version scored it. Changing the questions later means a
--      new row, not an edit — otherwise last year's results silently start
--      meaning something different.
--
--   3. Results are addressed by an unguessable token, never by row id. The
--      URL a customer receives is the capability; a sequential id would let
--      anyone walk the table.
--
-- Additive only. No destructive changes.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- assessment_versions — the immutable definition record.
--
-- definition_hash is a SHA-256 of the question set and scoring rules as they
-- exist in code. A test compares the two, so editing a published version in
-- place fails the build rather than quietly rescoring history.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_key     text NOT NULL UNIQUE,          -- e.g. 'LIAP_READY_V1'
  product_family  text NOT NULL DEFAULT 'LIAP',
  definition_hash text NOT NULL,
  question_count  integer NOT NULL,
  published_at    timestamptz NOT NULL DEFAULT now(),
  retired_at      timestamptz
);

-- ---------------------------------------------------------------------------
-- assessments — one attempt by one customer.
--
-- result_token is what appears in the URL: 256 bits of CSPRNG, stored hashed
-- exactly as sessions and magic links are, so a database read cannot be
-- replayed as access to somebody's report.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       uuid NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  version_id        uuid NOT NULL REFERENCES assessment_versions (id) ON DELETE RESTRICT,
  -- 'in_progress' | 'completed'
  status            text NOT NULL DEFAULT 'in_progress',
  current_step      integer NOT NULL DEFAULT 1,
  result_token_hash text UNIQUE,
  started_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz,
  -- When the free text becomes due for deletion. Set on completion.
  narrative_purge_after timestamptz
);

CREATE INDEX IF NOT EXISTS assessments_customer_idx
  ON assessments (customer_id, started_at DESC);
-- The hot path: one in-progress attempt per customer to resume.
CREATE INDEX IF NOT EXISTS assessments_resume_idx
  ON assessments (customer_id) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS assessments_purge_idx
  ON assessments (narrative_purge_after) WHERE narrative_purge_after IS NOT NULL;

-- ---------------------------------------------------------------------------
-- assessment_responses — the scored answers. Integers 1–5, nothing else.
--
-- Not sensitive in the way the narratives are: a number against a question key
-- carries no story. These are retained, because deleting them would destroy
-- the ability to explain a score the customer still holds.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_responses (
  assessment_id uuid NOT NULL REFERENCES assessments (id) ON DELETE CASCADE,
  question_key  text NOT NULL,
  dimension_key text NOT NULL,
  value         smallint NOT NULL CHECK (value BETWEEN 1 AND 5),
  answered_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (assessment_id, question_key)
);

-- ---------------------------------------------------------------------------
-- assessment_narratives — FREE TEXT. Purged at 90 days.
--
-- Deliberately its own table with its own lifecycle. This is where someone
-- writes that they have lost a job, left a marriage, or buried a parent. It
-- never reaches analytics, never reaches the CRM, and is deleted on a clock
-- while the derived result persists.
--
-- Also why the structured intake answers live in assessment_intake below
-- rather than here: a purge that took the change type with the narrative
-- would make an old report unexplainable.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_narratives (
  assessment_id uuid NOT NULL REFERENCES assessments (id) ON DELETE CASCADE,
  question_key  text NOT NULL,
  value         text NOT NULL,
  recorded_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (assessment_id, question_key)
);

-- ---------------------------------------------------------------------------
-- assessment_intake — the structured, non-narrative half of the intake.
--
-- Change type, affected area and urgency drive S.T.E.A.D.Y. routing and the
-- plan, so they have to outlive the 90-day purge or a report read at day 100
-- could not explain why it recommended stabilising first.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_intake (
  assessment_id uuid PRIMARY KEY REFERENCES assessments (id) ON DELETE CASCADE,
  -- 'expected' | 'unexpected' | 'opportunity' | 'preparing'
  change_type   text,
  -- 'career' | 'business' | 'money' | 'relationship' | 'relocation' |
  -- 'education' | 'retirement' | 'caregiving' | 'loss' | 'purpose' | 'other'
  area_affected text,
  urgency       smallint CHECK (urgency BETWEEN 1 AND 5)
);

-- ---------------------------------------------------------------------------
-- assessment_scores — one row per dimension, per assessment.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_scores (
  assessment_id  uuid NOT NULL REFERENCES assessments (id) ON DELETE CASCADE,
  dimension_key  text NOT NULL,
  score          smallint NOT NULL CHECK (score BETWEEN 5 AND 25),
  -- 'strength' | 'build' | 'priority' | 'immediate'
  classification text NOT NULL,
  PRIMARY KEY (assessment_id, dimension_key)
);

-- ---------------------------------------------------------------------------
-- assessment_results — the report as it was given.
--
-- Stored rather than recomputed on read. The recommendations draw on the
-- narrative answers, and those are deleted at 90 days: recomputing later would
-- silently produce a different, poorer report than the one the customer was
-- sent. What someone was told is a fact about the past.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_results (
  assessment_id   uuid PRIMARY KEY REFERENCES assessments (id) ON DELETE CASCADE,
  total_score     smallint NOT NULL CHECK (total_score BETWEEN 40 AND 200),
  -- 'move' | 'plan' | 'rebuild' | 'stabilize'
  position_key    text NOT NULL,
  steady_routed   boolean NOT NULL DEFAULT false,
  -- The rendered Protect / Resolve / Move and the 30/60/90 plan.
  next_best_three jsonb NOT NULL,
  plan            jsonb NOT NULL,
  next_review_on  date,
  generated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- preorder_verifications — retailer preorders claimed by the customer.
--
-- No order number is trusted on submission. Status starts pending and an
-- entitlement is granted only on approval, which is a human decision in
-- Phase I.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preorder_verifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   uuid REFERENCES customers (id) ON DELETE SET NULL,
  email         text NOT NULL,
  name          text,
  retailer      text NOT NULL,
  order_ref     text NOT NULL,
  -- 'pending' | 'approved' | 'rejected' | 'needs_review'
  status        text NOT NULL DEFAULT 'pending',
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  reviewed_at   timestamptz,
  reviewer_note text
);

CREATE INDEX IF NOT EXISTS preorder_verifications_status_idx
  ON preorder_verifications (status, submitted_at);
-- One claim per retailer order. Re-submitting the same receipt cannot produce
-- a second entitlement.
CREATE UNIQUE INDEX IF NOT EXISTS preorder_verifications_claim_key
  ON preorder_verifications (lower(retailer), lower(order_ref));

-- ---------------------------------------------------------------------------
-- liap_interest — the priority list for offers that do not exist yet.
--
-- Its own table rather than a CRM tag alone: the CRM is a marketing system and
-- this is a record of a request, which the business should still hold if the
-- CRM is ever changed.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS liap_interest (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL,
  -- 'workshop' | 'starter_kit'
  interest_key text NOT NULL,
  customer_id  uuid REFERENCES customers (id) ON DELETE SET NULL,
  recorded_at  timestamptz NOT NULL DEFAULT now()
);

-- Expression, so it cannot be a table-level UNIQUE constraint. Case-insensitive
-- for the same reason customers are: Alice@ and alice@ are one person, and
-- two rows would mean two emails when the offer opens.
CREATE UNIQUE INDEX IF NOT EXISTS liap_interest_email_key
  ON liap_interest (lower(email), interest_key);


-- ===========================================================================
-- The Life Is a Project™ book preorder, and what it unlocks.
--
-- A distinct product in its own family. It deliberately reuses no PMP product
-- id, no PMP entitlement key and no PMP business rule: the two share
-- infrastructure and nothing else, so a change to Study Access pricing or
-- access rules can never reach a LIAP customer.
--
-- The product→entitlement mapping is data, exactly as STUDY_ACCESS is. Adding
-- the Starter Kit or the workshop later is an INSERT, not a deploy.
--
-- Idempotent: re-running changes nothing.
-- ===========================================================================

INSERT INTO products (product_key, name, product_family) VALUES
  ('LIAP_BOOK_PREORDER', 'Life Is a Project… Be Ready. — Preorder', 'LIAP')
ON CONFLICT (product_key) DO NOTHING;

-- Preordering the book grants the assessment. duration_days NULL: it does not
-- lapse. The assessment is a bonus attached to a purchase, not a subscription,
-- so there is no renewal for it to expire against.
INSERT INTO product_entitlements (product_id, entitlement_key, duration_days)
SELECT id, 'LIAP_ASSESSMENT_ACCESS', NULL
  FROM products WHERE product_key = 'LIAP_BOOK_PREORDER'
ON CONFLICT (product_id, entitlement_key) DO NOTHING;


-- Record both as applied, so `npm run migrate` does not re-run them.
CREATE TABLE IF NOT EXISTS _migrations (
  name       text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO _migrations (name) VALUES
  ('0003_liap_phase_1.sql'),
  ('0004_seed_liap_product.sql')
ON CONFLICT (name) DO NOTHING;

-- ===========================================================================
-- Phase 0.5 — Secure Foundation
--
-- Platform-wide schema for Wiser Generations. Deliberately NOT a Life Is a
-- Project schema: PMP, CAPM, Veterans, Corporate and LIAP are all product
-- families inside the same customer, product, order and entitlement model.
--
-- Two separations carry most of the design weight:
--
--   1. Payment is not access. `orders` records what was paid for;
--      `entitlements` records what someone may do. An entitlement can come
--      from a purchase, a sponsorship, a scholarship, a cohort or an admin
--      grant, so `entitlements.source_type` is not limited to 'order'.
--
--   2. Payer is not participant. `orders.customer_id` is who paid.
--      `program_enrollments.customer_id` is who is enrolled. A guardian can
--      buy a seat for a 17-year-old and an employer can fund a cohort
--      without either relationship being modelled as "the buyer is the
--      learner".
--
-- Additive only. No destructive changes.
-- ===========================================================================

-- gen_random_uuid() is in PostgreSQL core from v13, so no pgcrypto extension
-- is required. Neon runs 15+ and PGlite (used by the test suite) runs 18;
-- requesting the extension would fail on PGlite for no benefit.

-- ---------------------------------------------------------------------------
-- customers — identity is the UUID, never the email address.
-- Email is an attribute that can change; joins go through customer_id.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL,
  name                text,
  stripe_customer_id  text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness: Stripe and Mailchimp both treat email as
-- case-insensitive, so storing Alice@ and alice@ as two customers would split
-- one person's entitlements across two records.
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_lower_key
  ON customers (lower(email));
CREATE INDEX IF NOT EXISTS customers_stripe_customer_id_idx
  ON customers (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- products — data, not hardcoded access logic.
-- product_family lets LIAP and PMP coexist without sharing business rules.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key     text NOT NULL UNIQUE,
  name            text NOT NULL,
  product_family  text NOT NULL,
  active          boolean NOT NULL DEFAULT true,
  stripe_price_id text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_family_idx ON products (product_family) WHERE active;

-- ---------------------------------------------------------------------------
-- product_entitlements — the product→access map, as DATA.
--
-- This is what stops route components asking "did they buy the book?".
-- Adding LIAP_BOOK_BUNDLE → {assessment, starter kit} later is an INSERT,
-- not a deploy.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_entitlements (
  product_id       uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  entitlement_key  text NOT NULL,
  -- NULL = does not expire on its own. Set for subscription-derived access.
  duration_days    integer,
  PRIMARY KEY (product_id, entitlement_key)
);

-- ---------------------------------------------------------------------------
-- orders / order_items — the payment record. Never consulted for access.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                 uuid NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
  stripe_checkout_session_id  text,
  stripe_payment_intent_id    text,
  stripe_subscription_id      text,
  status                      text NOT NULL,
  amount                      integer,
  currency                    text NOT NULL DEFAULT 'usd',
  created_at                  timestamptz NOT NULL DEFAULT now(),
  refunded_at                 timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_session_key
  ON orders (stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_subscription_key
  ON orders (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders (customer_id);

CREATE TABLE IF NOT EXISTS order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  quantity    integer NOT NULL DEFAULT 1,
  unit_amount integer
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

-- ---------------------------------------------------------------------------
-- entitlements — the single source of truth for authorization.
--
-- source_type is intentionally open: 'order', 'subscription', 'sponsorship',
-- 'scholarship', 'cohort', 'admin_grant', 'promotion', 'migration'.
-- Nothing here assumes money changed hands.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entitlements (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      uuid NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  entitlement_key  text NOT NULL,
  source_type      text NOT NULL,
  source_id        text,
  granted_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz,
  revoked_at       timestamptz,
  -- The duplicate-webhook defence. A repeated Stripe event carries the same
  -- key, so the second INSERT conflicts instead of granting twice.
  idempotency_key  text NOT NULL UNIQUE
);

-- The hot path: "is this customer entitled to X, right now?"
CREATE INDEX IF NOT EXISTS entitlements_lookup_idx
  ON entitlements (customer_id, entitlement_key)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS entitlements_source_idx ON entitlements (source_type, source_id);

-- ---------------------------------------------------------------------------
-- sessions — opaque server-side sessions.
--
-- The cookie carries a random id and nothing else. It is not signed data, it
-- is a pointer: forging it requires guessing 256 bits, and the row can be
-- revoked, expired or rotated without touching the client.
-- token_hash is stored, never the token itself.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  token_hash   text NOT NULL UNIQUE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz,
  user_agent   text,
  ip_hash      text
);

CREATE INDEX IF NOT EXISTS sessions_customer_idx ON sessions (customer_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions (expires_at) WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------------
-- login_tokens — magic links, replacing the in-memory Map.
--
-- Hashed at rest so a database read cannot be replayed as a login. Single-use
-- via consumed_at. redirect_to is stored server-side rather than passed
-- through the URL, which removes the open-redirect surface entirely.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  token_hash  text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  redirect_to text
);

CREATE INDEX IF NOT EXISTS login_tokens_email_idx ON login_tokens (lower(email), created_at DESC);

-- ---------------------------------------------------------------------------
-- payment_events — webhook idempotency ledger.
-- Stripe's event id is the natural key; a duplicate delivery conflicts.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        text NOT NULL DEFAULT 'stripe',
  event_id        text NOT NULL,
  event_type      text NOT NULL,
  received_at     timestamptz NOT NULL DEFAULT now(),
  processed_at    timestamptz,
  status          text NOT NULL DEFAULT 'received',
  error_message   text,
  UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS payment_events_status_idx ON payment_events (status, received_at DESC);

-- ---------------------------------------------------------------------------
-- programs / program_enrollments — cohort-based learning.
--
-- Deliberately separate from orders. `customer_id` here is the PARTICIPANT.
-- `funding_source_type` records who paid and how, which is what lets a
-- guardian, an employer or a scholarship fund a seat for someone else.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS programs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_key    text NOT NULL UNIQUE,
  name           text NOT NULL,
  product_family text NOT NULL,
  active         boolean NOT NULL DEFAULT true,
  starts_on      date,
  ends_on        date,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_enrollments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id          uuid NOT NULL REFERENCES programs (id) ON DELETE RESTRICT,
  -- the participant, who may not be the payer
  customer_id         uuid NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
  -- 'self_purchase' | 'guardian' | 'organization' | 'scholarship' | 'admin'
  funding_source_type text NOT NULL,
  funding_source_id   text,
  -- the payer, when someone else paid. NULL for self-purchase.
  payer_customer_id   uuid REFERENCES customers (id) ON DELETE SET NULL,
  status              text NOT NULL DEFAULT 'enrolled',
  enrolled_at         timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz,
  UNIQUE (program_id, customer_id)
);

CREATE INDEX IF NOT EXISTS program_enrollments_customer_idx ON program_enrollments (customer_id);
CREATE INDEX IF NOT EXISTS program_enrollments_payer_idx ON program_enrollments (payer_customer_id)
  WHERE payer_customer_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- consents — versioned, so "what did they agree to, and to which version?"
-- is answerable later. Supports analytics, marketing, policy acceptance and
-- (future) guardian consent without a schema change.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid REFERENCES customers (id) ON DELETE CASCADE,
  -- 'analytics' | 'marketing' | 'privacy_policy' | 'terms'
  -- reserved, not yet used: 'guardian' | 'ai_personalization'
  consent_type text NOT NULL,
  version      text NOT NULL,
  granted      boolean NOT NULL,
  recorded_at  timestamptz NOT NULL DEFAULT now(),
  source       text
);

CREATE INDEX IF NOT EXISTS consents_customer_idx ON consents (customer_id, consent_type, recorded_at DESC);

-- ---------------------------------------------------------------------------
-- audit_events — durable record of security-relevant actions.
--
-- `metadata` must never carry tokens, payment details, or (later) free-text
-- assessment answers. lib/audit.ts enforces a key allow-list.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_events (
  id          bigserial PRIMARY KEY,
  event_type  text NOT NULL,
  customer_id uuid REFERENCES customers (id) ON DELETE SET NULL,
  actor       text,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_type_idx ON audit_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_customer_idx ON audit_events (customer_id, created_at DESC)
  WHERE customer_id IS NOT NULL;

-- ===========================================================================
-- RESERVED — documented, deliberately NOT created.
--
-- Phase 0.5 does not create tables it does not use. These are the intended
-- shapes so the foundation above is known to accommodate them:
--
--   assessments          id, customer_id, version_id, status, result_token,
--                        started_at, completed_at
--   assessment_answers   assessment_id, question_key, value   -- FREE TEXT.
--                        Isolated table so a 90-day purge can DELETE from
--                        here alone while scores and results persist.
--   assessment_scores    assessment_id, dimension_key, score, total, position
--   assessment_versions  id, version, scoring_rules, published_at
--   organizations        id, name, billing_customer_id
--   cohorts              id, program_id, organization_id, starts_on
--   cohort_memberships   cohort_id, customer_id, role
--   sponsored_seats      id, organization_id, program_id, seats, consumed
--
-- The split that matters: assessment_answers is a separate table from
-- assessment_scores precisely so raw narrative can be deleted on a shorter
-- clock than the derived result.
-- ===========================================================================

-- ===========================================================================
-- Wiser Generations - Phase 0.5 Secure Foundation
-- COMPLETE SETUP. Paste this whole file into the Neon SQL Editor and Run.
--
-- Safe to run more than once. Every statement is CREATE ... IF NOT EXISTS or
-- ON CONFLICT DO NOTHING, so a second run changes nothing and errors nothing.
-- Nothing is dropped. Nothing is altered. Nothing existing is touched.
-- ===========================================================================

-- ---------- 1 of 3: tables ----------
CREATE TABLE IF NOT EXISTS customers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL,
  name                text,
  stripe_customer_id  text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_lower_key
  ON customers (lower(email));
CREATE INDEX IF NOT EXISTS customers_stripe_customer_id_idx
  ON customers (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
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
CREATE TABLE IF NOT EXISTS product_entitlements (
  product_id       uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  entitlement_key  text NOT NULL,
  duration_days    integer,
  PRIMARY KEY (product_id, entitlement_key)
);
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
CREATE TABLE IF NOT EXISTS entitlements (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      uuid NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  entitlement_key  text NOT NULL,
  source_type      text NOT NULL,
  source_id        text,
  granted_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz,
  revoked_at       timestamptz,
  idempotency_key  text NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS entitlements_lookup_idx
  ON entitlements (customer_id, entitlement_key)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS entitlements_source_idx ON entitlements (source_type, source_id);
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
  customer_id         uuid NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
  funding_source_type text NOT NULL,
  funding_source_id   text,
  payer_customer_id   uuid REFERENCES customers (id) ON DELETE SET NULL,
  status              text NOT NULL DEFAULT 'enrolled',
  enrolled_at         timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz,
  UNIQUE (program_id, customer_id)
);
CREATE INDEX IF NOT EXISTS program_enrollments_customer_idx ON program_enrollments (customer_id);
CREATE INDEX IF NOT EXISTS program_enrollments_payer_idx ON program_enrollments (payer_customer_id)
  WHERE payer_customer_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS consents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid REFERENCES customers (id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  version      text NOT NULL,
  granted      boolean NOT NULL,
  recorded_at  timestamptz NOT NULL DEFAULT now(),
  source       text
);
CREATE INDEX IF NOT EXISTS consents_customer_idx ON consents (customer_id, consent_type, recorded_at DESC);
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

-- ---------- 2 of 3: product catalogue ----------
INSERT INTO products (product_key, name, product_family) VALUES
  ('STUDY_ACCESS_SUBSCRIPTION', 'Wiser Generations Study Access', 'STUDY'),
  ('PMP_ESSENTIALS',           'PMP® Essentials',                'PMP'),
  ('PMP_PROFESSIONAL',         'PMP® Professional',              'PMP'),
  ('PMP_EXECUTIVE',            'PMP® Executive',                 'PMP'),
  ('CAPM_ESSENTIALS',          'CAPM® Essentials',               'CAPM'),
  ('CAPM_PROFESSIONAL',        'CAPM® Professional',             'CAPM'),
  ('VETERANS_PATHWAY',         'Veterans PM Pathway',            'VETERANS')
ON CONFLICT (product_key) DO NOTHING;
INSERT INTO product_entitlements (product_id, entitlement_key, duration_days)
SELECT id, 'STUDY_ACCESS', NULL FROM products WHERE product_key = 'STUDY_ACCESS_SUBSCRIPTION'
ON CONFLICT (product_id, entitlement_key) DO NOTHING;

-- ---------- 3 of 3: record that both migrations ran ----------
CREATE TABLE IF NOT EXISTS _migrations (
  name       text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO _migrations (name) VALUES
  ('0001_foundation.sql'), ('0002_seed_products.sql')
ON CONFLICT (name) DO NOTHING;

-- ---------- confirmation ----------
SELECT table_name AS "Tables created"
  FROM information_schema.tables
 WHERE table_schema = 'public'
   AND table_name IN ('customers','products','product_entitlements','orders',
                      'order_items','entitlements','sessions','login_tokens',
                      'payment_events','programs','program_enrollments',
                      'consents','audit_events')
 ORDER BY table_name;

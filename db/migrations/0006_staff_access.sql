-- ===========================================================================
-- Phase II-B — staff access.
--
-- The first privileged user this system has ever had.
--
-- Until now every session in this database belonged to a customer, and the
-- only question authorization ever asked was "may this person see what they
-- paid for?". Phase II-C asks a different one: "may this person approve a
-- $1,499.99 registration on behalf of the business?" — and that question has
-- no answer today, because there is nobody the software recognises as the
-- business.
--
-- That is why II-C cannot start before this exists, and why this migration is
-- written more carefully than the ones before it. Getting a staff model wrong
-- does not leak a practice question; it lets somebody approve money.
--
-- ── FOUR DECISIONS, AND WHY ────────────────────────────────────────────────
--
-- 1. Staff are their OWN records, not a flag on customers.
--
--    A boolean column on `customers` would be one bad UPDATE away from
--    privilege escalation, and it would make "can this session approve?" a
--    question about data rather than about identity. It also muddles the
--    retention story: customers get purged, staff must not.
--
--    The owner may well also be a customer — she can buy her own book. Those
--    are two different records describing two different relationships, and
--    conflating them is how a customer-facing bug becomes an admin bug.
--
-- 2. Staff sessions are their own table, with their own cookie.
--
--    Sharing `sessions` would mean one bug in customer session handling
--    reaches the admin surface. Separate tables, separate cookie name,
--    shorter lifetime, and no code path that upgrades one into the other.
--
-- 3. Two factors, because one is not enough for approving money.
--
--    The first factor is the magic link already proven in production. The
--    second is a TOTP code from an authenticator app, chosen by the business
--    owner on 21 August 2026 over emailed codes (which share the weakness of
--    the magic link they would be doubling) and passkeys (stronger, less
--    familiar, and this is a login used every day by two or three people).
--
--    A magic link alone is a bearer token sitting in an inbox. Fine for a
--    study subscription. Not fine for financial approval.
--
-- 4. Roles are data, and the check is always "may this role do this thing?"
--
-- Additive only. Nothing existing is altered.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- staff_users — who may act on behalf of the business.
--
-- `status` is checked on every request rather than only at sign-in, so
-- suspending somebody takes effect immediately rather than whenever their
-- session happens to expire.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL,
  name            text,
  -- 'owner' | 'event_staff' | 'read_only'
  role            text NOT NULL DEFAULT 'read_only',
  -- 'invited' | 'active' | 'suspended'
  --
  -- 'invited' means the account exists but has not yet enrolled a second
  -- factor. Such an account can complete enrolment and nothing else.
  status          text NOT NULL DEFAULT 'invited',
  -- Base32 TOTP secret. NULL until enrolment completes.
  --
  -- Stored rather than hashed because TOTP verification needs the secret
  -- itself — there is no one-way form that still allows checking a code.
  -- The mitigation is that possessing it is not sufficient to sign in: the
  -- first factor is a link sent to the staff member's mailbox.
  totp_secret     text,
  totp_enrolled_at timestamptz,
  -- The last TOTP counter this account successfully used.
  --
  -- Without it, a code stays valid for its whole 30-second step and for the
  -- skew window either side, so anyone who observes it — over a shoulder, in
  -- a screen share, in a phishing relay — can replay it. Recording the
  -- counter and refusing anything at or below it makes each code genuinely
  -- single-use. Small hardening, but this is the factor standing between a
  -- stolen mailbox and financial approval.
  totp_last_counter bigint,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS staff_users_email_key ON staff_users (lower(email));
CREATE INDEX IF NOT EXISTS staff_users_status_idx ON staff_users (status);

-- ---------------------------------------------------------------------------
-- staff_login_tokens — the first factor.
--
-- Deliberately a separate table from `login_tokens` rather than a column on
-- it. Same reasoning as the sessions split: a bug in the customer magic-link
-- flow must not be reachable from the admin one, and a token issued for a
-- customer must never be redeemable as a staff token.
--
-- Hashed at rest, single-use, short-lived. Ten minutes rather than the
-- customer flow's longer window, because a staff member requesting a login is
-- sitting at the screen.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_login_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id uuid NOT NULL REFERENCES staff_users (id) ON DELETE CASCADE,
  token_hash    text NOT NULL UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  consumed_at   timestamptz
);

CREATE INDEX IF NOT EXISTS staff_login_tokens_user_idx
  ON staff_login_tokens (staff_user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- staff_sessions — established only after BOTH factors.
--
-- `second_factor_at` is the load-bearing column. A session row exists between
-- the magic link being consumed and the TOTP code being accepted, and during
-- that window it authorises NOTHING: the guard requires second_factor_at to
-- be set. Modelling the half-authenticated state explicitly is safer than
-- keeping it in a cookie or in memory, because it can be inspected, expired
-- and revoked like anything else.
--
-- Eight hours rather than the customer session's longer life. An admin
-- session left open on a laptop is a different risk from a study login.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id    uuid NOT NULL REFERENCES staff_users (id) ON DELETE CASCADE,
  token_hash       text NOT NULL UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at     timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL,
  revoked_at       timestamptz,
  -- NULL = first factor only. Authorises nothing until set.
  second_factor_at timestamptz,
  user_agent       text,
  ip_hash          text
);

CREATE INDEX IF NOT EXISTS staff_sessions_user_idx
  ON staff_sessions (staff_user_id) WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------------
-- staff_actions — what a named person did, and when.
--
-- Separate from audit_events on purpose. audit_events records what happened
-- to a customer; this records what a member of staff DID, which is a
-- different question with a different retention need and a different reader.
-- When somebody asks in eighteen months who approved a particular
-- registration, this is the table that answers.
--
-- Append-only by convention and by absence: nothing in the application
-- updates or deletes from here.
--
-- `detail` is bounded to scalars by lib/staff/audit.ts, which applies the
-- same allow-list discipline as lib/audit.ts. A staff note about why an
-- applicant was declined is an opinion about a person and does not belong in
-- an audit row.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_actions (
  id            bigserial PRIMARY KEY,
  staff_user_id uuid REFERENCES staff_users (id) ON DELETE SET NULL,
  -- Kept alongside the id so the record still names somebody after the
  -- account is deleted. An audit trail that says "removed user approved this"
  -- has failed at the one job it has.
  actor_email   text NOT NULL,
  action        text NOT NULL,
  -- What was acted on: 'retreat_lead', 'partner', 'campaign_goal', …
  subject_type  text,
  subject_id    text,
  detail        jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_actions_actor_idx ON staff_actions (staff_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS staff_actions_subject_idx ON staff_actions (subject_type, subject_id, occurred_at DESC);

-- ===========================================================================
-- NOT CREATED HERE:
--
--   No seed row. There is deliberately no default administrator account and
--   no bootstrap password in this file. The first staff user is created by an
--   explicit, owner-run script against a known database — a migration that
--   silently grants somebody admin access is exactly the kind of thing that
--   gets copied into a test environment and forgotten.
--
--   No payment, entitlement, retreat or registration tables. II-B builds the
--   capability to approve; II-C and II-D build the things worth approving.
-- ===========================================================================

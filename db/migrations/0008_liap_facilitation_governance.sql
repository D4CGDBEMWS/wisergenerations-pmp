-- ===========================================================================
-- 0008 — LIAP facilitation governance.
--
-- PREPARED, NOT APPLIED. Behind the Pre-Launch Database Gate with 0005, 0006
-- and 0007. Nothing in this file runs against production until the migration
-- set is reviewed and explicitly authorized.
--
-- ── WHAT THIS IS FOR ───────────────────────────────────────────────────────
--
-- The application currently has exactly one authorization primitive: an
-- entitlement key granted to a customer. That is the right shape for "did
-- this person buy the thing". It is the wrong shape for "may this person
-- steward a Retreat", which is not a purchase, is not permanent, is specific
-- to one Retreat, and can be withdrawn.
--
-- So facilitation authority lives in its own tables rather than as more
-- entitlement keys. Overloading entitlements would make revoking a
-- facilitator look identical to refunding a book.
--
-- ── THE ONE RULE THE SHAPE ENFORCES ────────────────────────────────────────
--
-- Trainer authority is NOT derivable from facilitator state. They are
-- different tables, granted by different actions, revoked independently. A
-- certified facilitator who reads their own row finds nothing that says
-- "trainer", because there is nothing there to find — the authority to train
-- is a separate grant in liap_authorities, and only an admin can make it.
--
-- Clearance to facilitate a specific Retreat is deliberately NOT a column.
-- See lib/liap/facilitation.ts: it is computed at check time from current
-- facts, so a suspension takes effect on the next request rather than when
-- somebody remembers to flip a boolean.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- retreats — the events themselves.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS retreats (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  starts_on    date,
  ends_on      date,
  -- 'planned' | 'active' | 'completed' | 'cancelled'
  status       text NOT NULL DEFAULT 'planned',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS retreats_status_idx ON retreats (status, starts_on DESC);


-- ---------------------------------------------------------------------------
-- retreat_participants — attendance, and separately, completion.
--
-- Attendance is not completion. A row here means somebody was enrolled; only
-- `completed_at` plus `confirmed_by` means they finished, and only an
-- authorized person can set those. That distinction is the whole point of the
-- experience-before-facilitation rule: loading a page is not attending, and
-- attending is not completing.
--
-- `confirmed_by` is NOT NULL-able by accident: a completion with no confirming
-- authority is a self-attestation wearing a database row, which is exactly
-- what the owner ruled out. The CHECK makes the pair inseparable.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS retreat_participants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retreat_id    uuid NOT NULL REFERENCES retreats (id) ON DELETE CASCADE,
  customer_id   uuid NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  enrolled_at   timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  -- The authorized person who confirmed completion. Never the participant.
  confirmed_by  uuid REFERENCES customers (id) ON DELETE SET NULL,
  CONSTRAINT retreat_participants_completion_needs_confirmer
    CHECK ((completed_at IS NULL) = (confirmed_by IS NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS retreat_participants_unique
  ON retreat_participants (retreat_id, customer_id);
CREATE INDEX IF NOT EXISTS retreat_participants_completed_idx
  ON retreat_participants (customer_id) WHERE completed_at IS NOT NULL;


-- ---------------------------------------------------------------------------
-- facilitator_profiles — the certification lifecycle, one row per person.
--
-- `state` is explicit and never inferred. Completing training moves somebody
-- to training_completed; it does not make them certified. Certification is a
-- separate deliberate act by an authorized actor.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facilitator_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   uuid NOT NULL UNIQUE REFERENCES customers (id) ON DELETE CASCADE,
  state         text NOT NULL DEFAULT 'not_eligible',
  -- Set when state becomes 'certified'. Kept when suspended, so history
  -- survives a suspension rather than being erased by it.
  certified_at  timestamptz,
  certified_by  uuid REFERENCES customers (id) ON DELETE SET NULL,
  -- Optional. NULL means the certification does not expire.
  expires_at    timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT facilitator_profiles_state_known CHECK (state IN (
    'not_eligible',
    'eligible',
    'in_training',
    'training_completed',
    'observation_pending',
    'certified',
    'suspended',
    'expired'
  )),
  -- A certification nobody granted is not a certification.
  CONSTRAINT facilitator_profiles_certification_needs_granter
    CHECK (state <> 'certified' OR (certified_at IS NOT NULL AND certified_by IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS facilitator_profiles_state_idx ON facilitator_profiles (state);


-- ---------------------------------------------------------------------------
-- liap_authorities — Trainer/Certifier and Admin, as explicit grants.
--
-- SEPARATE FROM facilitator_profiles ON PURPOSE. There is no column on a
-- facilitator's row that could make them a trainer, so no update to that row
-- can promote them. The only way to hold trainer authority is a row here that
-- somebody with admin authority created.
--
-- Revocation is a timestamp rather than a delete: withdrawing authority must
-- not erase the record that it was once held, or by whom it was granted.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS liap_authorities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  -- 'trainer' | 'admin'
  authority    text NOT NULL,
  granted_by   uuid REFERENCES customers (id) ON DELETE SET NULL,
  granted_at   timestamptz NOT NULL DEFAULT now(),
  revoked_at   timestamptz,
  CONSTRAINT liap_authorities_known CHECK (authority IN ('trainer', 'admin'))
);

-- One LIVE grant per person per authority. A revoked grant stays as history
-- and does not block a later re-grant, which is why the index is partial.
CREATE UNIQUE INDEX IF NOT EXISTS liap_authorities_live_unique
  ON liap_authorities (customer_id, authority) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS liap_authorities_lookup_idx
  ON liap_authorities (customer_id, authority) WHERE revoked_at IS NULL;


-- ---------------------------------------------------------------------------
-- retreat_assignments — certified is not the same as certified HERE.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS retreat_assignments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retreat_id     uuid NOT NULL REFERENCES retreats (id) ON DELETE CASCADE,
  facilitator_id uuid NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  assigned_by    uuid REFERENCES customers (id) ON DELETE SET NULL,
  assigned_at    timestamptz NOT NULL DEFAULT now(),
  unassigned_at  timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS retreat_assignments_live_unique
  ON retreat_assignments (retreat_id, facilitator_id) WHERE unassigned_at IS NULL;


-- ---------------------------------------------------------------------------
-- retreat_preparation_confirmations — the readiness gate, per Retreat.
--
-- ── WHAT THIS DELIBERATELY DOES NOT HOLD ───────────────────────────────────
--
-- There is no text column here, and that is the design. The owner's rule is
-- that this records readiness and nothing else: not what was fasted, not for
-- how long, not what was prayed, not a reflection, not a journal. A free-text
-- column would be filled eventually, and a devotional record is not something
-- this system should be holding.
--
-- Four columns: who, which Retreat, that they confirmed, and when.
-- Self-confirmed by the facilitator, per the owner's decision.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS retreat_preparation_confirmations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retreat_id     uuid NOT NULL REFERENCES retreats (id) ON DELETE CASCADE,
  facilitator_id uuid NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  confirmed      boolean NOT NULL DEFAULT true,
  confirmed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS retreat_preparation_unique
  ON retreat_preparation_confirmations (retreat_id, facilitator_id);


-- ---------------------------------------------------------------------------
-- Governance events reuse the existing audit_events table. No new audit
-- infrastructure: see lib/audit.ts for the added event types and the
-- allow-listed metadata keys.
-- ---------------------------------------------------------------------------

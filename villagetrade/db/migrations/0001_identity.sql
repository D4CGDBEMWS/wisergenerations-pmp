-- ===========================================================================
-- 0001 — Identity, profiles and the trust ladder.
--
-- NOT APPLIED ANYWHERE. Phase 2A is local-only, against PGlite in the test
-- suite. No Supabase project exists and no cloud resource has been created.
--
-- ── THE TRUST LADDER ───────────────────────────────────────────────────────
--
-- Three states, deliberately not collapsed into one boolean:
--
--   registered           -- may browse
--   identity_verified    -- may transact
--   conduct_acknowledged -- may confirm a booking (per booking, not per user)
--
-- Collapsing these is how an unverified stranger ends up at somebody's door.
-- The separation is enforced by triggers in 0004, not by hope.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id             uuid PRIMARY KEY,           -- mirrors the auth provider's user id
  display_name   text NOT NULL,
  -- ZIP is the ONLY location a profile carries. There is no street address
  -- column anywhere on a public-facing table, which is what makes "never
  -- expose a private address" structural rather than remembered.
  zip            text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  -- Suspension is a timestamp, not a delete: moderation history must survive.
  suspended_at   timestamptz,
  suspended_reason text,
  CONSTRAINT profiles_zip_shape CHECK (zip ~ '^[0-9]{5}$'),
  CONSTRAINT profiles_display_name_len CHECK (char_length(display_name) BETWEEN 2 AND 60)
);

CREATE INDEX IF NOT EXISTS profiles_zip_idx ON profiles (zip) WHERE suspended_at IS NULL;

-- ---------------------------------------------------------------------------
-- provider_profiles — being a provider is a separate, revocable state.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid NOT NULL UNIQUE REFERENCES profiles (id) ON DELETE CASCADE,
  headline     text,
  bio          text,
  active       boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT provider_bio_len CHECK (bio IS NULL OR char_length(bio) <= 2000)
);

-- ---------------------------------------------------------------------------
-- identity_verifications — STATUS ONLY. NO DOCUMENT, EVER.
--
-- Founder instruction, and the right call independently: we record that an
-- external provider reached a verdict and the opaque reference they gave us.
-- There is no column here that could hold an image, a document number, a date
-- of birth or an address, so a breach of this table discloses no identity
-- document — because none was ever stored.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS identity_verifications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  -- 'stripe_identity' | 'persona' | ... Chosen in Phase 5; none integrated.
  vendor         text NOT NULL,
  -- The vendor's own id for the check. Opaque to us.
  vendor_ref     text NOT NULL,
  status         text NOT NULL,
  checked_at     timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz,
  CONSTRAINT identity_status_known
    CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
  CONSTRAINT identity_vendor_ref_opaque
    CHECK (vendor_ref !~ '[0-9]{6,}')   -- refuse anything that looks like a document number
);

CREATE UNIQUE INDEX IF NOT EXISTS identity_live_verified
  ON identity_verifications (profile_id) WHERE status = 'verified';

-- ---------------------------------------------------------------------------
-- A person is verified only if a live, unexpired 'verified' row exists.
-- Computed, never stored — so a revoked or lapsed verification takes effect on
-- the next read rather than when somebody remembers to flip a flag.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_identity_verified(p_profile uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM identity_verifications
     WHERE profile_id = p_profile
       AND status = 'verified'
       AND (expires_at IS NULL OR expires_at > now())
  );
$$;

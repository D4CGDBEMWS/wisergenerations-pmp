-- ===========================================================================
-- 0005 — Row-level security.
--
-- ── WHAT RLS IS FOR HERE, AND WHAT IT IS NOT ───────────────────────────────
--
-- RLS is the layer that catches the query somebody forgot to guard. It is
-- NOT the permission system: lib/authz.ts decides, server-side, and the
-- triggers in 0004 refuse writes regardless of how they arrived. Three
-- layers, because the one that fails is always the one nobody remembered.
--
-- ── THE CURRENT-USER SEAM ──────────────────────────────────────────────────
--
-- Supabase exposes auth.uid(). This schema must also run under PGlite in the
-- test suite, where no auth schema exists. So every policy goes through
-- current_profile_id(), which prefers auth.uid() when present and otherwise
-- reads a session setting the tests set. One set of policies, exercised in
-- tests, deployed unchanged.
-- ===========================================================================

CREATE OR REPLACE FUNCTION current_profile_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE v text;
BEGIN
  -- Supabase in production.
  BEGIN
    EXECUTE 'SELECT auth.uid()::text' INTO v;
    IF v IS NOT NULL AND v <> '' THEN
      RETURN v::uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- No auth schema (PGlite). Fall through.
    NULL;
  END;

  v := current_setting('villagetrade.profile_id', true);
  IF v IS NULL OR v = '' THEN
    RETURN NULL;
  END IF;
  RETURN v::uuid;
END;
$$;

-- An administrator flag, read the same way. Absent means NOT an admin.
CREATE OR REPLACE FUNCTION current_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(current_setting('villagetrade.is_admin', true), 'off') = 'on';
$$;

-- ---------------------------------------------------------------------------
-- profiles — a person may read and edit only their own.
--
-- Public discovery does NOT read this table: a listing carries the display
-- name it needs. So there is no "everyone can read profiles" policy, and a
-- scraper cannot enumerate members.
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_self_read ON profiles;
CREATE POLICY profiles_self_read ON profiles
  FOR SELECT USING (id = current_profile_id() OR current_is_admin());

DROP POLICY IF EXISTS profiles_self_write ON profiles;
CREATE POLICY profiles_self_write ON profiles
  FOR UPDATE USING (id = current_profile_id())
  WITH CHECK (id = current_profile_id());

DROP POLICY IF EXISTS profiles_self_insert ON profiles;
CREATE POLICY profiles_self_insert ON profiles
  FOR INSERT WITH CHECK (id = current_profile_id());

-- ---------------------------------------------------------------------------
-- provider_profiles — same ownership rule, via the owning profile.
-- ---------------------------------------------------------------------------
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS provider_self_all ON provider_profiles;
CREATE POLICY provider_self_all ON provider_profiles
  FOR ALL USING (profile_id = current_profile_id() OR current_is_admin())
  WITH CHECK (profile_id = current_profile_id());

-- ---------------------------------------------------------------------------
-- identity_verifications — readable by the subject, writable by NOBODY.
--
-- Verification rows are written by a server-side webhook running with the
-- service role, which bypasses RLS. No policy grants INSERT or UPDATE, so a
-- signed-in user cannot mark themselves verified. That is the entire point.
-- ---------------------------------------------------------------------------
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS identity_subject_read ON identity_verifications;
CREATE POLICY identity_subject_read ON identity_verifications
  FOR SELECT USING (profile_id = current_profile_id() OR current_is_admin());

-- ---------------------------------------------------------------------------
-- listings — active ones are public; drafts belong to their owner.
-- ---------------------------------------------------------------------------
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listings_public_read ON listings;
CREATE POLICY listings_public_read ON listings
  FOR SELECT USING (
    status = 'active'
    OR profile_id = current_profile_id()
    OR current_is_admin()
  );

DROP POLICY IF EXISTS listings_owner_insert ON listings;
CREATE POLICY listings_owner_insert ON listings
  FOR INSERT WITH CHECK (profile_id = current_profile_id());

DROP POLICY IF EXISTS listings_owner_update ON listings;
CREATE POLICY listings_owner_update ON listings
  FOR UPDATE USING (profile_id = current_profile_id() OR current_is_admin())
  WITH CHECK (profile_id = current_profile_id() OR current_is_admin());

DROP POLICY IF EXISTS listings_owner_delete ON listings;
CREATE POLICY listings_owner_delete ON listings
  FOR DELETE USING (profile_id = current_profile_id() OR current_is_admin());

-- ---------------------------------------------------------------------------
-- Reference data — readable by anyone, written by nobody through the API.
-- ---------------------------------------------------------------------------
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS categories_read ON service_categories;
CREATE POLICY categories_read ON service_categories FOR SELECT USING (true);

ALTER TABLE zip_areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS zips_read ON zip_areas;
CREATE POLICY zips_read ON zip_areas FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- Private between the two parties. Never public, never enumerable.
-- ---------------------------------------------------------------------------
ALTER TABLE exchange_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS proposals_party_read ON exchange_proposals;
CREATE POLICY proposals_party_read ON exchange_proposals
  FOR SELECT USING (
    requester_id = current_profile_id()
    OR provider_id = current_profile_id()
    OR current_is_admin()
  );

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bookings_party_read ON bookings;
CREATE POLICY bookings_party_read ON bookings
  FOR SELECT USING (
    requester_id = current_profile_id()
    OR provider_id = current_profile_id()
    OR current_is_admin()
  );

-- booking_agreements carries the only precise location in the schema, so its
-- policy is the strictest: parties to the booking, nobody else, not even by
-- joining from somewhere they can see.
ALTER TABLE booking_agreements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agreements_party_read ON booking_agreements;
CREATE POLICY agreements_party_read ON booking_agreements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
       WHERE b.id = booking_agreements.booking_id
         AND (b.requester_id = current_profile_id() OR b.provider_id = current_profile_id())
    )
    OR current_is_admin()
  );

ALTER TABLE conduct_acknowledgments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conduct_self ON conduct_acknowledgments;
CREATE POLICY conduct_self ON conduct_acknowledgments
  FOR ALL USING (profile_id = current_profile_id() OR current_is_admin())
  WITH CHECK (profile_id = current_profile_id());

-- ---------------------------------------------------------------------------
-- Safety tables.
--
-- A reporter may file and may see their own report. They may NOT see the
-- moderation outcome, and the subject of a report may not see it at all --
-- a reporting system that tells the accused who accused them is a reporting
-- system nobody uses twice.
-- ---------------------------------------------------------------------------
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reports_own_read ON reports;
CREATE POLICY reports_own_read ON reports
  FOR SELECT USING (reporter_id = current_profile_id() OR current_is_admin());
DROP POLICY IF EXISTS reports_insert ON reports;
CREATE POLICY reports_insert ON reports
  FOR INSERT WITH CHECK (reporter_id = current_profile_id());

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS blocks_own ON blocks;
CREATE POLICY blocks_own ON blocks
  FOR ALL USING (blocker_id = current_profile_id() OR current_is_admin())
  WITH CHECK (blocker_id = current_profile_id());

-- Moderation actions are staff-only. No policy for ordinary users at all.
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS moderation_admin_only ON moderation_actions;
CREATE POLICY moderation_admin_only ON moderation_actions
  FOR ALL USING (current_is_admin()) WITH CHECK (current_is_admin());

-- Reviews are public once written -- that is what a review is for.
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reviews_public_read ON reviews;
CREATE POLICY reviews_public_read ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS reviews_author_insert ON reviews;
CREATE POLICY reviews_author_insert ON reviews
  FOR INSERT WITH CHECK (author_id = current_profile_id());

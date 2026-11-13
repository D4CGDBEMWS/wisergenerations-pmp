-- ===========================================================================
-- 0002 — Service categories, geography and listings.
--
-- ── THE EXCLUSION IS DATA, NOT DOCUMENTATION ───────────────────────────────
--
-- Childcare and eldercare are excluded by founder ruling. A policy written in
-- a README is one refactor from being gone, so the exclusion lives in the
-- database: a CHECK refuses the slugs outright, which is sufficient here
-- because the rule is about a single row's own column and needs no other
-- table to evaluate.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS service_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  kind        text NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  CONSTRAINT category_kind_known CHECK (kind IN ('service', 'item')),
  -- Excluded by founder ruling. Not a filter in the UI -- a refusal in the
  -- database, so no admin screen, import or seed script can introduce them.
  CONSTRAINT category_excluded_domains CHECK (
    slug NOT IN ('childcare', 'child-care', 'babysitting', 'nanny',
                 'eldercare', 'elder-care', 'senior-care', 'caregiving')
  )
);

-- ---------------------------------------------------------------------------
-- zip_areas — the pilot boundary, as data.
--
-- Cobb County only. Discovery joins against this table, so widening the pilot
-- is an INSERT and never a code change.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zip_areas (
  zip         text PRIMARY KEY,
  city        text NOT NULL,
  county      text NOT NULL,
  state       text NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  CONSTRAINT zip_shape CHECK (zip ~ '^[0-9]{5}$')
);

-- ---------------------------------------------------------------------------
-- listings — public by nature, so it carries nothing private.
--
-- There is no street address, no phone, no email column. Not "we don't
-- select them" -- they do not exist. A precise location is agreed inside a
-- booking (0003) and never published.
--
-- `offer_type` is the three-way the founder specified: money, barter, or both.
-- Note what it does NOT imply: no money moves through this platform. See
-- booking_agreements in 0003.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  category_id    uuid NOT NULL REFERENCES service_categories (id),
  title          text NOT NULL,
  body           text NOT NULL,
  listing_kind   text NOT NULL,
  offer_type     text NOT NULL,
  -- Where it is OFFERED, to the ZIP and no finer.
  zip            text NOT NULL REFERENCES zip_areas (zip),
  status         text NOT NULL DEFAULT 'draft',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  removed_at     timestamptz,
  removed_reason text,
  CONSTRAINT listing_kind_known CHECK (listing_kind IN ('service', 'item')),
  CONSTRAINT listing_offer_known CHECK (offer_type IN ('paid', 'barter', 'combined')),
  CONSTRAINT listing_status_known CHECK (status IN ('draft', 'active', 'paused', 'removed')),
  CONSTRAINT listing_title_len CHECK (char_length(title) BETWEEN 4 AND 120),
  CONSTRAINT listing_body_len CHECK (char_length(body) BETWEEN 10 AND 4000),
  -- A removed listing must say why, and a live one must not pretend it was.
  CONSTRAINT listing_removal_paired
    CHECK ((status = 'removed') = (removed_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS listings_discovery_idx
  ON listings (zip, status, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS listings_owner_idx ON listings (profile_id);

-- ---------------------------------------------------------------------------
-- A listing may only go live in a ZIP inside the active pilot, and only from
-- a profile that is not suspended. Both facts live in OTHER tables, so a
-- CHECK cannot see them -- this is a trigger.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION listing_publish_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM zip_areas z WHERE z.zip = NEW.zip AND z.active) THEN
    RAISE EXCEPTION 'listing_outside_pilot_area: %', NEW.zip
      USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (SELECT 1 FROM profiles p WHERE p.id = NEW.profile_id AND p.suspended_at IS NOT NULL) THEN
    RAISE EXCEPTION 'listing_owner_suspended'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM service_categories c WHERE c.id = NEW.category_id AND c.active) THEN
    RAISE EXCEPTION 'listing_category_inactive'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_publish_guard ON listings;
CREATE TRIGGER listings_publish_guard
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION listing_publish_guard();

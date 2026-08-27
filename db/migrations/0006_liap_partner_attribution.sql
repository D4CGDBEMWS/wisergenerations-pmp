-- ===========================================================================
-- 0006 — community partners and referral attribution.
--
-- The partner-attribution slice of the Phase II-A design, and only that
-- slice. Retreat leads, campaign goals, in-kind contributions and the orders
-- transaction_category column were part of the same original migration and
-- are deliberately NOT here: they serve the Retreat and campaign features,
-- which are not authorised, and a migration should not quietly create the
-- schema for a product nobody approved.
--
-- ── WHY 0006 AND NOT 0005 ──────────────────────────────────────────────────
--
-- The original carried the number 0005, which main had meanwhile given to
-- 0005_results_email_delivery.sql. Two different migrations with the same
-- number is the kind of thing that is merely confusing in a repository and
-- genuinely dangerous in a deployment: whichever ran first would make the
-- other look already applied. 0005 is preserved untouched; this is 0006.
--
-- Three properties this migration is built to guarantee:
--
--   1. Attribution never becomes authorization. Nothing in these tables is
--      readable by the entitlement path, and no column here can widen what
--      anyone may do. A referral code is printed on a postcard in a
--      barbershop window — it is a public string and it carries no authority.
--
--   2. A scan is not a person. attribution_events rows usually have no
--      customer_id and no visitor_key at all; counting how many people used a
--      sign is a different question from recording who they were.
--
--   3. Credit is derived and stored separately from the log, so the credit
--      rule can change without losing history.
--
-- Additive only. Every statement is CREATE ... IF NOT EXISTS, so rolling back
-- the application leaves this schema in place and harmless.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- organizations — sponsors, venue partners, employers, group buyers.
--
-- Named in the Phase 0.5 reserved block and created here rather than in the
-- retreat phase because a community partner and a sponsor are frequently the
-- same business. A coffee shop that later underwrites a seat should not
-- become two unrelated records.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  -- 'sponsor' | 'venue' | 'employer' | 'community' | 'other'
  org_type            text NOT NULL DEFAULT 'community',
  contact_email       text,
  contact_name        text,
  -- The billing contact, when this organisation pays for others.
  billing_customer_id uuid REFERENCES customers (id) ON DELETE SET NULL,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organizations_type_idx ON organizations (org_type);

-- ---------------------------------------------------------------------------
-- partners — an approved community referral source.
--
-- referral_code is the public identifier: it goes on tabletop signs,
-- postcards, church bulletins and salon displays. It is deliberately NOT
-- derived from `id`, because the owner's instruction is that internal
-- database identifiers never appear in public URLs, and because a code a
-- human chose ("GRACE-CHURCH") survives being read aloud in a way a UUID
-- does not.
--
-- destination_key is a KEY INTO AN ALLOW-LIST, never a URL. Every redirect in
-- this codebase before now went to a hardcoded internal path; /liap/go is the
-- first route that redirects based on stored data, which is exactly how
-- phishing links get laundered through a trusted domain. Storing a key means
-- a mistyped field cannot produce an off-site redirect — the worst case is a
-- code that resolves to the default landing page.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partners (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code   text NOT NULL,
  partner_name    text NOT NULL,
  -- 'founding_circle' | 'church' | 'coffee_shop' | 'barbershop' | 'salon' |
  -- 'restaurant' | 'realtor' | 'local_business' | 'veteran_org' |
  -- 'professional_network' | 'civic_org' | 'corporate_sponsor' | 'venue' |
  -- 'other'
  partner_type    text NOT NULL,
  -- Which canonical LIAP page the code lands on. Resolved through
  -- lib/liap/partners.ts, which refuses anything not on its allow-list.
  destination_key text NOT NULL DEFAULT 'hub',
  -- Attribution triple, owner-set. Never derived from the request.
  campaign        text,
  utm_source      text,
  utm_medium      text,
  -- 'draft' | 'active' | 'paused' | 'ended'
  --
  -- Status governs REPORTING and asset issuance, not resolution. A retired
  -- code still resolves: printed material outlives a campaign, and a 404
  -- served to someone holding the business's own postcard makes the business
  -- look broken.
  status          text NOT NULL DEFAULT 'draft',
  organization_id uuid REFERENCES organizations (id) ON DELETE SET NULL,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive, because the code will be typed off a sign by hand as
-- often as it is scanned.
CREATE UNIQUE INDEX IF NOT EXISTS partners_referral_code_key
  ON partners (lower(referral_code));
CREATE INDEX IF NOT EXISTS partners_type_idx ON partners (partner_type);
CREATE INDEX IF NOT EXISTS partners_status_idx ON partners (status);

-- ---------------------------------------------------------------------------
-- attribution_events — append-only touch log.
--
-- An event log rather than a `referred_by` column on the customer, because a
-- single column answers "who gets credit" and destroys everything else. It
-- cannot express somebody who scanned at a barbershop in March, returned via
-- a church postcard in May, and bought in June — and "which coffee shop is
-- actually producing results" is unanswerable without that.
--
-- visitor_key is a first-party random identifier, never an IP address and
-- never a fingerprint. It exists to stitch a scan to a later purchase and
-- nothing else.
--
-- customer_id is filled in only once the person identifies themselves. Most
-- rows never get one, which is correct: a scan is not a person.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attribution_events (
  id           bigserial PRIMARY KEY,
  partner_id   uuid REFERENCES partners (id) ON DELETE SET NULL,
  -- 'scan' | 'landing_view' | 'lead' | 'book_preorder' |
  -- 'assessment_activated' | 'assessment_completed' | 'workshop_registered' |
  -- 'retreat_interest' | 'retreat_registered' | 'sponsor_inquiry'
  event_type   text NOT NULL,
  visitor_key  text,
  customer_id  uuid REFERENCES customers (id) ON DELETE SET NULL,
  -- Copied from the partner at write time so a later edit to the partner's
  -- campaign fields does not silently rewrite history.
  campaign     text,
  utm_source   text,
  utm_medium   text,
  occurred_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attribution_events_partner_idx
  ON attribution_events (partner_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS attribution_events_visitor_idx
  ON attribution_events (visitor_key, occurred_at) WHERE visitor_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS attribution_events_customer_idx
  ON attribution_events (customer_id, occurred_at) WHERE customer_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- attribution_credits — the derived answer, kept separately.
--
-- Separate from the event log so the credit rule can change without losing
-- history and without recomputation being destructive. `basis` records WHICH
-- rule produced this row, so a report can say "first touch" or "last touch"
-- rather than presenting one number as the truth.
--
-- Both may exist for one outcome. Where a church introduced someone and a
-- coffee shop card converted them, both partners touched the sale, and
-- telling either one they "got" it alone would be false.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attribution_credits (
  id           bigserial PRIMARY KEY,
  partner_id   uuid NOT NULL REFERENCES partners (id) ON DELETE CASCADE,
  -- 'first_touch' | 'last_touch'
  basis        text NOT NULL,
  -- What was achieved: mirrors attribution_events.event_type
  outcome_type text NOT NULL,
  customer_id  uuid REFERENCES customers (id) ON DELETE SET NULL,
  -- The order, lead or registration this credit is for. Text rather than a
  -- foreign key because the referent differs by outcome type.
  outcome_ref  text,
  credited_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, basis, outcome_type, outcome_ref)
);

CREATE INDEX IF NOT EXISTS attribution_credits_partner_idx
  ON attribution_credits (partner_id, outcome_type);

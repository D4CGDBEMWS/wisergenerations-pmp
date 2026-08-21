-- ===========================================================================
-- Phase II-A — community partners, attribution, and retreat interest capture.
--
-- Scope is deliberately the cheapest, most reversible slice of Phase II:
-- capture who is interested and where they came from. Nothing here takes
-- money, grants access, or approves anybody.
--
-- Three properties this migration is built to guarantee:
--
--   1. Attribution never becomes authorization. Nothing in these tables is
--      readable by the entitlement path, and no column here can widen what
--      anyone may do. A referral code is printed on a postcard in a
--      barbershop window — it is a public string and it carries no authority.
--
--   2. Goals never become logic. campaign_goals stores business planning
--      assumptions so they can be edited without a deploy. No code branches
--      on whether a goal is met.
--
--   3. Targets and results are stored differently. A goal is a number
--      somebody typed. "Received" and "generated" are derived from orders and
--      attribution, and there is deliberately nowhere to type them — a figure
--      that can disagree with the Stripe ledger is worse than no figure.
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

-- ---------------------------------------------------------------------------
-- retreat_leads — the interest list, and the start of the managed funnel.
--
-- This is where "JOIN THE RETREAT INTEREST LIST" lands. It grants nothing,
-- confirms nothing and promises nothing: `status` starts at 'new' and only a
-- human moves it, which is the whole point of a managed premium conversion.
--
-- Group inquiries and sponsor inquiries share this table via inquiry_type
-- rather than getting their own, because they are the same object at this
-- stage — an unqualified expression of interest awaiting review. They diverge
-- after approval, which is Phase II-C and II-D.
--
-- Deliberately NOT liap_interest: that table is a "tell me when it opens"
-- list keyed on email alone. This carries qualification detail a person
-- volunteered about their circumstances, which is a different kind of record
-- with a different retention question attached.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS retreat_leads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  name          text,
  phone         text,
  -- 'individual' | 'group' | 'sponsor'
  inquiry_type  text NOT NULL DEFAULT 'individual',
  -- Stated group size for a group inquiry. Display and triage only: it never
  -- computes a price, and no discount formula exists anywhere in this system.
  group_size    integer,
  organization  text,
  -- What the person told us, in their own words.
  message       text,
  -- 'new' | 'reviewing' | 'qualified' | 'approved' | 'declined' | 'withdrawn'
  --
  -- Only a human moves this. No scheduled job and no webhook may write it.
  status        text NOT NULL DEFAULT 'new',
  partner_id    uuid REFERENCES partners (id) ON DELETE SET NULL,
  customer_id   uuid REFERENCES customers (id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- One open enquiry per person per type. A second submission updates rather
-- than stacking, so review does not become a duplicate-hunting exercise.
CREATE UNIQUE INDEX IF NOT EXISTS retreat_leads_email_type_key
  ON retreat_leads (lower(email), inquiry_type);
CREATE INDEX IF NOT EXISTS retreat_leads_status_idx ON retreat_leads (status, created_at DESC);
CREATE INDEX IF NOT EXISTS retreat_leads_partner_idx
  ON retreat_leads (partner_id) WHERE partner_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- campaign_goals — business planning assumptions, as editable data.
--
-- The owner's instruction, recorded verbatim in the audit: fundraising goals
-- are planning assumptions and must never be hard-coded or used as
-- application logic. Nothing in this system branches on whether a goal is
-- met — no campaign closes, no offer appears or disappears, no contribution
-- is refused, no email fires. These rows are read by reporting and by
-- nothing else.
--
-- Only the THREE TARGETS live here. Cash received, in-kind received and leads
-- generated are derived from orders, in_kind_contributions and
-- attribution_events respectively, and there is deliberately nowhere to type
-- them: a figure that can disagree with the Stripe ledger is worse than no
-- figure, because nobody can tell which one is wrong.
--
-- Effective-dated rather than overwritten. Raising a target mid-campaign
-- should not rewrite what was being aimed at last month, or every
-- retrospective becomes unreadable.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaign_goals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The campaign this targets, e.g. 'LIAP_FOUNDING_CIRCLE'. NULL together
  -- with a partner_id means a goal for that partner across all campaigns.
  campaign          text,
  -- NULL = a campaign-wide goal. Set = this partner's own target.
  partner_id        uuid REFERENCES partners (id) ON DELETE CASCADE,
  -- Cents, for the same reason every other amount in this system is cents.
  cash_goal         integer,
  in_kind_goal      integer,
  lead_goal         integer,
  effective_from    date NOT NULL DEFAULT CURRENT_DATE,
  -- NULL = still current. Superseding a goal sets this rather than deleting.
  effective_until   date,
  note              text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_goals_current_idx
  ON campaign_goals (campaign, partner_id, effective_from DESC)
  WHERE effective_until IS NULL;

-- ---------------------------------------------------------------------------
-- in_kind_contributions — donated goods and services.
--
-- In-kind has no Stripe transaction behind it, so a human number is
-- unavoidable. What is avoidable is a single typed total: this stores each
-- contribution separately with the value the owner approved, when, and who
-- approved it, so "what makes up that $8,000?" is answerable a year later for
-- an accountant or a sponsor conversation.
--
-- The system never estimates a value. approved_value is what a human
-- recorded, and a row with no approved value is a contribution awaiting
-- valuation rather than a zero.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS in_kind_contributions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations (id) ON DELETE SET NULL,
  partner_id      uuid REFERENCES partners (id) ON DELETE SET NULL,
  campaign        text,
  description     text NOT NULL,
  -- Cents. NULL means "not yet valued", never zero.
  approved_value  integer,
  approved_by     text,
  approved_on     date,
  received_on     date,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS in_kind_campaign_idx ON in_kind_contributions (campaign);
CREATE INDEX IF NOT EXISTS in_kind_partner_idx
  ON in_kind_contributions (partner_id) WHERE partner_id IS NOT NULL;

-- ===========================================================================
-- NOT CREATED HERE, and deliberately so:
--
--   staff_users, staff_roles   Phase II-B. Every approval implied by
--                              retreat_leads.status needs an authenticated
--                              actor, and inventing one badly is the most
--                              damaging thing this project could do.
--   retreats, retreat_venues,  Phase II-C/D. No event exists to register for
--   retreat_registrations      until approval exists.
--   sponsorships               Phase II-D.
--
-- Removed from scope entirely by owner decision, 21 August 2026: the free
-- prize drawing and every table that would have supported it — promotions,
-- promotion entries, eligibility and winner selection. Nothing was built
-- toward it and nothing here anticipates it. Recorded so a later reader does
-- not mistake its absence for an oversight.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- orders.transaction_category — added now, used later.
--
-- Stripe will process a $24.99 book and a founding-circle contribution
-- through the same account, so the separation the owner requires — never
-- combine sponsorship or crowdfunding with ordinary book sales in reporting —
-- has to be recorded by us rather than inferred from Stripe.
--
-- Added in Phase II-A rather than in the crowdfunding phase for one practical
-- reason: every order written from today forward gets a category, so when
-- contributions do start there is no historical backfill to guess at. A
-- default of 'purchase' is correct for everything that exists today.
--
-- Set server-side from the product. Never from the request.
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS transaction_category text NOT NULL DEFAULT 'purchase';

-- 'purchase' | 'contribution' | 'sponsorship'
-- (in-kind is not an order: it has no payment, and lives in
--  in_kind_contributions with an owner-approved value)
CREATE INDEX IF NOT EXISTS orders_category_idx ON orders (transaction_category);

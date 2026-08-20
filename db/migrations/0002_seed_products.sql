-- ===========================================================================
-- Seed the product catalogue with what is already sold today.
--
-- These rows describe the CURRENT business only. No Life Is a Project product
-- is created here — Phase 0.5 explicitly does not create LIAP Stripe products
-- or routes. The LIAP rows will be inserts against this same table when
-- Phase I is approved, which is the point of making products data.
--
-- Idempotent: re-running changes nothing.
-- ===========================================================================

INSERT INTO products (product_key, name, product_family) VALUES
  ('STUDY_ACCESS_SUBSCRIPTION', 'Wiser Generations Study Access', 'STUDY'),
  ('PMP_ESSENTIALS',           'PMP® Essentials',                'PMP'),
  ('PMP_PROFESSIONAL',         'PMP® Professional',              'PMP'),
  ('PMP_EXECUTIVE',            'PMP® Executive',                 'PMP'),
  ('CAPM_ESSENTIALS',          'CAPM® Essentials',               'CAPM'),
  ('CAPM_PROFESSIONAL',        'CAPM® Professional',             'CAPM'),
  ('VETERANS_PATHWAY',         'Veterans PM Pathway',            'VETERANS')
ON CONFLICT (product_key) DO NOTHING;

-- The product→access map. Today only Study Access gates anything; the
-- certification programs are delivered as cohorts rather than as gated
-- content, so they grant no entitlement yet.
--
-- duration_days NULL: access lasts until revoked. Subscription cancellation
-- revokes it via the webhook rather than by lapsing, so a customer who cancels
-- mid-period keeps access only until Stripe reports the cancellation — which
-- is the correct behaviour and matches what they paid for.
INSERT INTO product_entitlements (product_id, entitlement_key, duration_days)
SELECT id, 'STUDY_ACCESS', NULL FROM products WHERE product_key = 'STUDY_ACCESS_SUBSCRIPTION'
ON CONFLICT (product_id, entitlement_key) DO NOTHING;

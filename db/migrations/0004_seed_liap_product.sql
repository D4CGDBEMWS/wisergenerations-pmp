-- ===========================================================================
-- The Life Is a Project™ book preorder, and what it unlocks.
--
-- A distinct product in its own family. It deliberately reuses no PMP product
-- id, no PMP entitlement key and no PMP business rule: the two share
-- infrastructure and nothing else, so a change to Study Access pricing or
-- access rules can never reach a LIAP customer.
--
-- The product→entitlement mapping is data, exactly as STUDY_ACCESS is. Adding
-- the Starter Kit or the workshop later is an INSERT, not a deploy.
--
-- Idempotent: re-running changes nothing.
-- ===========================================================================

INSERT INTO products (product_key, name, product_family) VALUES
  ('LIAP_BOOK_PREORDER', 'Life Is a Project… Be Ready. — Preorder', 'LIAP')
ON CONFLICT (product_key) DO NOTHING;

-- Preordering the book grants the assessment. duration_days NULL: it does not
-- lapse. The assessment is a bonus attached to a purchase, not a subscription,
-- so there is no renewal for it to expire against.
INSERT INTO product_entitlements (product_id, entitlement_key, duration_days)
SELECT id, 'LIAP_ASSESSMENT_ACCESS', NULL
  FROM products WHERE product_key = 'LIAP_BOOK_PREORDER'
ON CONFLICT (product_id, entitlement_key) DO NOTHING;

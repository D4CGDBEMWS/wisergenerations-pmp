-- ===========================================================================
-- 0007 — the standalone Life Project-Ready™ Assessment product.
--
-- WHAT THIS IS FOR
--
-- A paid standalone assessment already grants its entitlement without this
-- row: fulfilStandaloneAssessment logs the missing product and grants anyway,
-- because refusing access to somebody who has paid, over an absent seed row,
-- would be the wrong failure. What it CANNOT do without this row is write the
-- order and order_item — so the purchase leaves an entitlement and no
-- transaction trail, and "what did this person actually buy, and for how
-- much" stops being answerable from the database.
--
-- This row closes that gap. It creates no Stripe object and changes no price:
-- the amount charged comes from lib/liap/product.ts at request time, exactly
-- as the book's does.
--
-- WHY THE ENTITLEMENT ROW IS THE SAME ONE THE BOOK GRANTS
--
-- Because it is the same assessment. Two products, two prices, two order
-- records, one entitlement — which is what makes "do not charge an entitled
-- book purchaser $29" enforceable: the check is for the entitlement, and it
-- does not care which door granted it.
--
-- Idempotent: re-running changes nothing.
-- ===========================================================================

INSERT INTO products (product_key, name, product_family) VALUES
  ('LIAP_ASSESSMENT_STANDALONE', 'Life Project-Ready™ Assessment', 'LIAP')
ON CONFLICT (product_key) DO NOTHING;

-- duration_days NULL: it does not lapse. The assessment is a one-time purchase
-- of a fixed instrument, not a subscription, so there is no renewal for it to
-- expire against — the same reasoning as the book's grant in 0004.
INSERT INTO product_entitlements (product_id, entitlement_key, duration_days)
SELECT id, 'LIAP_ASSESSMENT_ACCESS', NULL
  FROM products WHERE product_key = 'LIAP_ASSESSMENT_STANDALONE'
ON CONFLICT (product_id, entitlement_key) DO NOTHING;

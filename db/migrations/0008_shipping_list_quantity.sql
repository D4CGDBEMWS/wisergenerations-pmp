-- ===========================================================================
-- 0008 — the shipping list shows how many copies each order needs.
--
-- Owner ruling 2026-10-30: bundles (lib/liap/bundles.ts) put several copies
-- of the book in one order. The view gains a `copies` column, appended at the
-- end as CREATE OR REPLACE VIEW requires. No table is created, altered or
-- dropped; re-running it is harmless.
-- ===========================================================================

CREATE OR REPLACE VIEW book_shipping_list AS
SELECT o.created_at::date      AS ordered_on,
       s.ship_name             AS name,
       s.line1, s.line2, s.city, s.state, s.postal_code, s.country,
       c.email,
       s.shipped_at, s.tracking,
       o.id                    AS order_id,
       COALESCE((SELECT sum(i.quantity) FROM order_items i WHERE i.order_id = o.id), 1)::int AS copies
  FROM book_shipments s
  JOIN orders o    ON o.id = s.order_id
  JOIN customers c ON c.id = o.customer_id
 WHERE o.refunded_at IS NULL
 ORDER BY o.created_at;

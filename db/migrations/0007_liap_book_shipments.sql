-- ===========================================================================
-- 0007 — where each pre-ordered hardcover is mailed.
--
-- Owner ruling 2026-10-30: checkout now collects a US shipping address and a
-- flat $4.99 shipping fee; the author mails the books after publication.
--
-- One row per book order. The address is copied from the Stripe checkout by
-- the webhook. shipped_at / tracking are filled in when the book is mailed.
-- Only CREATE ... IF NOT EXISTS: safe to re-run, nothing dropped or altered.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS book_shipments (
  order_id     uuid PRIMARY KEY REFERENCES orders (id) ON DELETE CASCADE,
  ship_name    text NOT NULL,
  line1        text NOT NULL,
  line2        text,
  city         text NOT NULL,
  state        text NOT NULL,
  postal_code  text NOT NULL,
  country      text NOT NULL DEFAULT 'US',
  created_at   timestamptz NOT NULL DEFAULT now(),
  shipped_at   timestamptz,
  tracking     text
);

CREATE INDEX IF NOT EXISTS book_shipments_unshipped_idx
  ON book_shipments (created_at) WHERE shipped_at IS NULL;

-- The mailing list, oldest order first. Refunded orders are left out.
CREATE OR REPLACE VIEW book_shipping_list AS
SELECT o.created_at::date      AS ordered_on,
       s.ship_name             AS name,
       s.line1, s.line2, s.city, s.state, s.postal_code, s.country,
       c.email,
       s.shipped_at, s.tracking,
       o.id                    AS order_id
  FROM book_shipments s
  JOIN orders o    ON o.id = s.order_id
  JOIN customers c ON c.id = o.customer_id
 WHERE o.refunded_at IS NULL
 ORDER BY o.created_at;

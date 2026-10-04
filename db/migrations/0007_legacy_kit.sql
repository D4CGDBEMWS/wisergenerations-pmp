-- ---------------------------------------------------------------------------
-- The Wiser Generations International Legacy Kit: purchases and download links.
--
-- One row per paid checkout. Deliberately minimal (owner's brief): the
-- checkout session, the buyer's email to deliver to, when they bought, which
-- wording of the two consent boxes they ticked and when, and the state of
-- their download link. No name, no address, no answers from the kit — the
-- kit is filled in on the family's own device and never comes back here.
--
-- Separate from orders/entitlements on purpose. The kit grants no access to
-- anything on the site; it is a file and a link. Program boundary: a kit
-- purchase must not be able to look like a PMP or LIAP purchase.
--
-- The download link is never stored, only its SHA-256. Anyone with read access
-- to this table cannot rebuild a working link from it.
-- ---------------------------------------------------------------------------

INSERT INTO products (product_key, name, product_family)
VALUES ('LEGACY_KIT', 'Wiser Generations International Legacy Kit', 'legacy')
ON CONFLICT (product_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS legacy_kit_purchases (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id  text NOT NULL UNIQUE,
  -- The join a refund event needs: charge.refunded carries the payment
  -- intent, not the checkout session.
  payment_intent_id    text,
  email                text NOT NULL,
  purchased_at         timestamptz NOT NULL DEFAULT now(),
  -- What they agreed to, and when. Required for the EU/UK download waiver.
  consent_version      text NOT NULL,
  consent_at           timestamptz NOT NULL,
  download_token_hash  text NOT NULL UNIQUE,
  downloads_used       integer NOT NULL DEFAULT 0 CHECK (downloads_used >= 0),
  download_limit       integer NOT NULL DEFAULT 5 CHECK (download_limit > 0),
  expires_at           timestamptz NOT NULL,
  -- Set by a refund. A revoked link never works again.
  revoked_at           timestamptz,
  -- The delivery email went out. Claimed before sending, so a replayed
  -- webhook cannot email a buyer twice.
  email_sent_at        timestamptz
);

CREATE INDEX IF NOT EXISTS legacy_kit_purchases_payment_intent_idx
  ON legacy_kit_purchases (payment_intent_id) WHERE payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS legacy_kit_purchases_email_idx
  ON legacy_kit_purchases (lower(email));

-- ===========================================================================
-- Phase II — Book access codes and the two-assessment model
--
-- Owner-approved rule, 4 September 2026:
--
--   One eligible new book = one unique access code = one registered reader
--   = two Assessment completions.
--
-- Two structures carry that sentence, and both are database invariants rather
-- than application conventions. The application also checks, but the checks
-- are the second line: an invariant that lives only in TypeScript is one
-- forgotten branch away from a reader getting a third assessment or a code
-- being claimed twice.
--
--   1. book_access_codes — the code is a property of a printed copy, not of a
--      transaction. That is what makes the promise printed in the book true
--      for a gift recipient: the code travels inside the book, and whoever
--      first registers it becomes its reader. Paying for the book does not
--      claim it.
--
--   2. assessments.attempt_number — a small integer with a range check and a
--      uniqueness constraint, which together make a third attempt
--      unrepresentable rather than merely refused.
--
-- Additive only. No destructive changes, and nothing here alters an existing
-- row's meaning.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- book_access_codes — one row per printed code.
--
-- ── WHY ONLY THE HASH ──────────────────────────────────────────────────────
--
-- code_hash is SHA-256 of the normalised code, exactly as sessions, magic
-- links and assessment result tokens are stored. The usable code exists in
-- two places only: on the card inside the book, and in the operator's hands
-- for the minutes between generating a batch and sending it to the printer.
-- A database read — a backup, a replica, a support query — cannot be replayed
-- as a claim.
--
-- ── WHY claimed_by_customer_id IS RESTRICT AND NOT SET NULL ────────────────
--
-- SET NULL would silently return a claimed code to the unclaimed pool the
-- moment a customer record was deleted, which is precisely the outcome the
-- owner's rule forbids: the entitlement must not become claimable again once
-- a reader has registered it. RESTRICT instead forces an erasure request to
-- pass through the support tool, which voids the code and writes an audit
-- row. Deleting a reader is then a deliberate, recorded act rather than a
-- side effect that quietly reopens their book.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS book_access_codes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- SHA-256 of the normalised code. Never the code itself.
  code_hash     text NOT NULL UNIQUE,
  -- Which print run or issue this belongs to, so a bad batch can be found.
  batch_key     text NOT NULL,
  -- 'print_run' | 'replacement' | 'event' | 'gift_fulfilment'
  source_type   text NOT NULL DEFAULT 'print_run',
  -- Set when a code is minted for a specific order rather than a print run.
  order_id      uuid REFERENCES orders (id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  printed_at    timestamptz,

  -- Claim state. Both columns move together or neither does; see the CHECK.
  claimed_by_customer_id uuid REFERENCES customers (id) ON DELETE RESTRICT,
  claimed_at             timestamptz,

  -- Void state. A voided code can never be claimed, claimed or not.
  voided_at     timestamptz,
  void_reason   text,
  -- The code issued to replace this one, for a damaged or misprinted card.
  replaced_by_id uuid REFERENCES book_access_codes (id) ON DELETE SET NULL,

  -- A claim is a customer AND a timestamp. Half a claim is a bug, and a row
  -- with claimed_at set but no customer would read as "claimed by nobody" —
  -- unclaimable by the claim query and invisible to support.
  CONSTRAINT book_access_codes_claim_pairing
    CHECK ((claimed_by_customer_id IS NULL) = (claimed_at IS NULL))
);

-- Support's first question is always "what happened to this reader's code?".
CREATE INDEX IF NOT EXISTS book_access_codes_claimed_idx
  ON book_access_codes (claimed_by_customer_id)
  WHERE claimed_by_customer_id IS NOT NULL;

-- Batch reporting: how many of a print run have been claimed.
CREATE INDEX IF NOT EXISTS book_access_codes_batch_idx
  ON book_access_codes (batch_key, created_at);

-- The unclaimed pool, for "how many codes are still available in this batch".
CREATE INDEX IF NOT EXISTS book_access_codes_unclaimed_idx
  ON book_access_codes (batch_key)
  WHERE claimed_by_customer_id IS NULL AND voided_at IS NULL;

-- ---------------------------------------------------------------------------
-- assessments.attempt_number — first assessment (1) and reassessment (2).
--
-- Backfilled by start order so existing rows keep their history, then
-- constrained. The range CHECK is added NOT VALID deliberately: it must bind
-- every future row without retroactively invalidating a legacy customer who
-- accumulated more than two attempts under the previous unlimited behaviour.
-- Refusing to migrate because of history is how a correct constraint never
-- ships.
--
-- The unique index is the real enforcement. With attempt_number restricted to
-- 1 or 2 for new rows, "one row per (customer, attempt)" means a third
-- assessment has no number left to take.
-- ---------------------------------------------------------------------------
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS attempt_number smallint;

-- Number existing attempts in the order they were started. Idempotent: only
-- rows that have not been numbered yet are touched, so re-running the
-- migration cannot renumber a reader's history.
WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY customer_id ORDER BY started_at, id) AS n
    FROM assessments
   WHERE attempt_number IS NULL
)
UPDATE assessments a
   SET attempt_number = ordered.n
  FROM ordered
 WHERE a.id = ordered.id;

ALTER TABLE assessments ALTER COLUMN attempt_number SET DEFAULT 1;
UPDATE assessments SET attempt_number = 1 WHERE attempt_number IS NULL;
ALTER TABLE assessments ALTER COLUMN attempt_number SET NOT NULL;

-- ADD CONSTRAINT has no IF NOT EXISTS, and this file must be re-runnable.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assessments_attempt_range'
  ) THEN
    ALTER TABLE assessments
      ADD CONSTRAINT assessments_attempt_range
      CHECK (attempt_number BETWEEN 1 AND 2) NOT VALID;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS assessments_customer_attempt_key
  ON assessments (customer_id, attempt_number);

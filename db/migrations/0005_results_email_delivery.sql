-- ---------------------------------------------------------------------------
-- Automatic results delivery.
--
-- Owner ruling: the results email is sent on submission rather than waiting
-- for the participant to find a button. That makes idempotency a requirement
-- rather than a nicety — a retried submit, a replayed request or a second tab
-- must not put a second copy of somebody's plan in their inbox.
--
-- One nullable timestamp on the assessment. It is the assessment that is
-- delivered once, so the marker belongs on the assessment; a separate table
-- would be a second thing to keep in step with the first.
--
-- `results_email_sent_at` records the INITIAL automatic delivery only. A
-- manual resend deliberately does not clear or reset it: the question this
-- column answers is "has this participant already been sent their plan
-- automatically", and a resend does not change that answer.
-- ---------------------------------------------------------------------------

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS results_email_sent_at timestamptz;

-- Throttles the manual resend. Separate from the column above because it
-- answers a different question — "when did we last send anything at all" —
-- and conflating the two would let a resend suppress the automatic send or
-- vice versa.
ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS results_email_last_sent_at timestamptz;

-- ===========================================================================
-- LIAP scheduler and Workshop privacy architecture.
--
-- Two approvals from the Master Handoff, 22 August 2026:
--
--   §9  One dispatcher for scheduled LIAP workflows, with the email platform
--       handling delivery where practical.
--   §10 Workshop Reflection Artifact free text uses isolated storage
--       comparable to the Assessment narrative privacy pattern.
--
-- NUMBERED 0007, NOT 0006, ON PURPOSE. Phase II-B's staff access migration
-- claims 0006 on its own branch. Leaving the number free means the two can be
-- merged in either order without a renumber, and the runner applies files in
-- filename order regardless of which lands first.
--
-- Additive only. Not run against any database — which is why the priority
-- column below is edited into this file rather than added by an 0008: nothing
-- has ever applied 0007, so there is no deployed shape to migrate away from.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- scheduled_tasks — one table behind one dispatcher.
--
-- The handoff asks for a single dispatcher covering Workshop day 0, 5, 10 and
-- 15, replay delivery, participant follow-up and the twelve-week reader
-- series. Building four schedulers would mean four things to monitor and four
-- ways to silently stop working; building one means a single question —
-- "what is due?" — answered in a single place.
--
-- It also removes a hard ceiling. Vercel's Hobby plan permits two cron jobs
-- and both are already spent on the signup and narrative purges, neither of
-- which can be given up because they keep published privacy commitments. A
-- dispatcher needs one slot no matter how many workflows it carries.
--
-- ── WHY THE ROWS ARE CLAIMED, NOT JUST SELECTED ────────────────────────────
--
-- `claimed_at` and the atomic UPDATE that sets it are what stop two
-- overlapping runs sending the same reminder twice. A scheduler that
-- occasionally double-sends is worse than one that occasionally runs late:
-- late is invisible, twice is an apology.
--
-- ── WHAT THIS TABLE MUST NEVER HOLD ────────────────────────────────────────
--
-- `payload` carries identifiers and nothing else — which customer, which
-- session, which week of the series. Never email bodies, never a
-- participant's reflection, never anything a person wrote. The content of a
-- send is owner-approved and lives in the email platform or in a reviewed
-- content file; this table only says that a send is due.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Which registered handler runs. See lib/liap/scheduler.ts.
  task_type     text NOT NULL,
  run_after     timestamptz NOT NULL,
  -- Identifiers only. Never content, never free text.
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- 'pending' | 'claimed' | 'done' | 'failed' | 'cancelled'
  status        text NOT NULL DEFAULT 'pending',
  claimed_at    timestamptz,
  completed_at  timestamptz,
  attempts      integer NOT NULL DEFAULT 0,
  last_error    text,
  -- Lower runs first. Exists so a long queue of reminder email cannot starve
  -- a privacy purge: the dispatcher claims a bounded batch each run, and
  -- without an ordering rule five hundred due reader emails would push a
  -- retention deletion past the day it was promised for. Retention sits at 0;
  -- everything else takes the default.
  priority      smallint NOT NULL DEFAULT 100,
  -- Stops the same task being enqueued twice for the same subject — a
  -- day-5 reminder for one registration, week 3 for one reader.
  idempotency_key text NOT NULL UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- The dispatcher's only hot query: what is due and unclaimed, most important
-- first? The index carries the same ordering the claim uses.
CREATE INDEX IF NOT EXISTS scheduled_tasks_due_idx
  ON scheduled_tasks (priority, run_after)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS scheduled_tasks_type_idx
  ON scheduled_tasks (task_type, status);

-- ---------------------------------------------------------------------------
-- workshop_sessions — a scheduled Virtual Workshop.
--
-- No price column. The Workshop price is on HOLD and its checkout is not
-- authorised, so there is deliberately nowhere here to record one: a column
-- invites a value, and a value invites a charge.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workshop_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  held_on       timestamptz,
  -- Set when the recording is available. Publishing it is what makes replay
  -- delivery due for every registrant — see the dispatcher.
  replay_ready_at timestamptz,
  -- The Day 15 boundary. After it, late artifacts still update individual
  -- completion but must not rewrite the session report.
  reporting_closed_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- workshop_registrations — who signed up, and what happened afterwards.
--
-- THE DISTINCTION THIS TABLE EXISTS TO KEEP:
--
--   Registration is not completion.
--   Replay sent is not completion.
--   A submitted Reflection Artifact is completion.
--
-- That matters beyond bookkeeping: Retreat eligibility depends on it, so
-- "completed the workshop" is an authorization-adjacent fact. It is therefore
-- derived from the artifact table below and never from `attended_live` or
-- `replay_sent_at`, neither of which anyone had to do anything to earn.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workshop_registrations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     uuid NOT NULL REFERENCES workshop_sessions (id) ON DELETE RESTRICT,
  customer_id    uuid NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
  registered_at  timestamptz NOT NULL DEFAULT now(),
  attended_live  boolean NOT NULL DEFAULT false,
  replay_sent_at timestamptz,
  -- Non-refundable, per the owner's approved policy. Recorded rather than
  -- enforced in code: a refund is a human decision and an exception to a
  -- published policy should leave a trace.
  refunded_at    timestamptz,
  refund_note    text,
  UNIQUE (session_id, customer_id)
);

CREATE INDEX IF NOT EXISTS workshop_registrations_customer_idx
  ON workshop_registrations (customer_id);

-- ---------------------------------------------------------------------------
-- workshop_artifacts — that the reflection was submitted, and when.
--
-- Deliberately holds NO answer text. Completion, timestamps and eligibility
-- all live here; the words the participant wrote live in the table below and
-- nowhere else.
--
-- Same split as assessments and assessment_narratives, and for the same
-- reason: it lets the free text be deleted on a short clock while the fact of
-- completion — which the Retreat depends on — survives.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workshop_artifacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL UNIQUE REFERENCES workshop_registrations (id) ON DELETE CASCADE,
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  -- When the free text becomes due for deletion. Set on submission.
  narrative_purge_after timestamptz,
  -- Survey scalars. Aggregatable, and identifying nobody.
  usefulness      integer,
  -- 'yes' | 'somewhat' | 'not_yet'
  preparedness    text
);

CREATE INDEX IF NOT EXISTS workshop_artifacts_purge_idx
  ON workshop_artifacts (narrative_purge_after) WHERE narrative_purge_after IS NOT NULL;

-- ---------------------------------------------------------------------------
-- workshop_artifact_answers — the participant's own words. Nothing else.
--
-- The five reflection prompts and the two free-text survey questions. Four
-- columns and no more, so the retention purge is a single DELETE that cannot
-- take completion, scores or eligibility with it.
--
-- ── THE RULES THAT GOVERN THIS TABLE ───────────────────────────────────────
--
--   Never to analytics. Never to the CRM. Owner reporting aggregates
--   themes and counts; it does not quote.
--
--   Never rewritten. The handoff is explicit that AI must not rewrite a
--   participant's responses, and nothing in this system does — the value is
--   stored as submitted and read as stored.
--
--   Never a testimonial. Converting any of this into marketing needs
--   separate explicit permission from the person who wrote it, which is a
--   conversation, not a database flag.
--
-- Someone describing the project they are living, the risk they are avoiding
-- and the step they are afraid to take has told you something closer to a
-- diary entry than a survey response. It is treated accordingly.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workshop_artifact_answers (
  artifact_id  uuid NOT NULL REFERENCES workshop_artifacts (id) ON DELETE CASCADE,
  question_key text NOT NULL,
  value        text NOT NULL,
  recorded_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (artifact_id, question_key)
);

-- ---------------------------------------------------------------------------
-- workshop_reports — the Day 15 snapshot.
--
-- Stored rather than recomputed, because the handoff says late submissions
-- must not rewrite the original session report. A report generated on demand
-- would silently change every time somebody submitted late, and a number that
-- moves after you have read it is worse than one that is slightly out of
-- date.
--
-- The live cumulative view is a query against the tables above. This is the
-- thing that was true on the day the window closed.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workshop_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES workshop_sessions (id) ON DELETE CASCADE,
  generated_at timestamptz NOT NULL DEFAULT now(),
  -- Counts, rates and aggregated themes. No identifiable free text — the
  -- report is written by aggregation, and a theme is not a quotation.
  summary      jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (session_id, generated_at)
);

-- ===========================================================================
-- NOT CREATED HERE:
--
--   No workshop price, product row or Stripe reference. The price is on HOLD
--   and checkout is not authorised.
--
--   No reader-series content table. The twelve manuscript quotes must be
--   owner-approved verbatim text, and storage for content that does not exist
--   yet would be a guess at its shape. The dispatcher can already schedule
--   the twelve sends; what it sends is a separate approval.
-- ===========================================================================

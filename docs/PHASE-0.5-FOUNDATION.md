# Phase 0.5 — Secure Foundation

Implementation report. Nothing customer-facing for Life Is a Project™ or the
CAPM 17–24 pathway was built; this is the platform underneath them.

---

## 1. Executive summary

The critical finding from the Phase 0 audit is closed: a forged cookie no
longer unlocks paid content. Authorization is now a database lookup against a
durable entitlement record, reached through an opaque server-side session, and
proved by 35 automated tests running against real PostgreSQL.

Four other audit findings are closed with it — magic-link tokens no longer live
in process memory, the account-wide Stripe session scan is gone from the login
path, duplicate webhook deliveries can no longer double-grant, and the cookie
banner now gates analytics instead of writing a value nothing read.

Two things need a human before this can ship: **the database has to be
provisioned and migrated**, and **the existing Study Access customer backfill
has to be run and reconciled**. Both are scripted and both are dry-run-first.
Neither could be executed from the build environment, which has no Neon
credentials and no Stripe key.

## 2. Files changed

**New**

| Path | Purpose |
|---|---|
| `db/migrations/0001_foundation.sql` | Platform schema |
| `db/migrations/0002_seed_products.sql` | Product catalogue for what is sold today |
| `lib/db/client.ts` | Postgres interface, injectable for tests |
| `lib/customers.ts` | Customer identity |
| `lib/entitlements.ts` | Authorization authority |
| `lib/auth/crypto.ts` | Token generation and hashing |
| `lib/auth/session.ts` | Opaque server-side sessions |
| `lib/auth/login-token.ts` | Single-use magic links |
| `lib/auth/guard.ts` | `requireEntitlement()` |
| `lib/payments/events.ts` | Webhook idempotency ledger |
| `lib/audit.ts` | Audit log with allow-listed metadata |
| `lib/consent.ts`, `components/useConsent.ts` | Consent state |
| `lib/flags.ts` | Feature flags |
| `components/ui/index.tsx` | Accessible primitives |
| `app/exam-simulator/layout.tsx`, `app/flashcards/layout.tsx` | Route guards |
| `scripts/migrate.mjs` | Migration runner |
| `scripts/backfill-study-access.mjs` | Existing-customer migration |
| `eslint.config.mjs`, `vitest.config.ts` | Tooling |
| `tests/*` | 35 tests |

**Modified** — `middleware.ts`, `app/api/access/login/route.ts`,
`app/access/success/page.tsx`, `app/api/stripe/webhook/route.ts`,
`components/Analytics.tsx`, `components/CookieBanner.tsx`,
`components/layout/Navbar.tsx`, `app/components/HomeClient.tsx`,
`package.json`, `.env.example`.

## 3. New dependencies

| Package | Why |
|---|---|
| `@neondatabase/serverless` | Postgres over HTTP. A TCP pool per lambda exhausts connections on Vercel long before it exhausts traffic |
| `vitest` (dev) | Test runner; TypeScript-native, no separate transpile step |
| `@electric-sql/pglite` (dev) | Real PostgreSQL in WASM, so tests run against genuine Postgres with no server |

No ORM. Queries are parameterised SQL through a ~40-line typed interface, per
the instruction not to add a heavy ORM for convenience.

`eslint` was **downgraded** from ^10 to ^9 — see §15.

## 4. Database provider

**Neon PostgreSQL, as preferred.** No reason to deviate was found: it is
serverless-native, has a first-party Vercel integration, its HTTP driver suits
per-request lambdas, and branching gives preview deployments their own database.

## 5. Schema implemented

`customers`, `products`, `product_entitlements`, `orders`, `order_items`,
`entitlements`, `sessions`, `login_tokens`, `payment_events`, `programs`,
`program_enrollments`, `consents`, `audit_events`.

Two separations carry the design:

**Payment is not access.** `orders` records what was paid. `entitlements`
records what someone may do. `entitlements.source_type` accepts `order`,
`subscription`, `sponsorship`, `scholarship`, `cohort`, `admin_grant`,
`promotion` and `migration` — nothing assumes money changed hands.

**Payer is not participant.** `program_enrollments.customer_id` is the
participant; `funding_source_type` and `payer_customer_id` record who paid. A
guardian buying a seat for a 17-year-old, an employer funding a cohort, and a
scholarship are all representable without modelling the buyer as the learner.
This is what §19 asks for, and it exists now rather than later.

Reserved and documented but **not created**, per the instruction not to build
unused tables: `assessments`, `assessment_answers`, `assessment_scores`,
`assessment_versions`, `organizations`, `cohorts`, `cohort_memberships`,
`sponsored_seats`. The shapes are recorded at the end of `0001_foundation.sql`.

## 6. Migration files

`0001_foundation.sql` and `0002_seed_products.sql`. Both additive —
`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`,
`INSERT ... ON CONFLICT DO NOTHING`. Nothing is dropped or altered.

```
DATABASE_URL=... npm run migrate -- --dry-run
DATABASE_URL=... npm run migrate
```

## 7. Study Access migration report

`scripts/backfill-study-access.mjs`, **dry run by default**.

It walks active Stripe subscriptions and paid one-time sessions tagged
`study-access` / `pmp-practice-studio`, creates customer records and grants
`STUDY_ACCESS`.

It **never revokes**. Anyone holding access in the database without a matching
Stripe source is listed for a human. Silently removing a paying customer's
access is worse than briefly over-granting, and the brief forbids doing either
quietly.

Reconciliation asserts `final count == pre-existing + granted` and exits
non-zero on a mismatch.

**Expected customer count: not yet known.** It requires live Stripe access,
which the build environment does not have. Run the dry run first and compare
its total against the Stripe dashboard before applying.

There is also a safety net independent of the script: on login, a customer with
no entitlement triggers a **bounded** Stripe lookup — their own customer
records, their own subscriptions and sessions, never an account-wide scan — and
is granted an entitlement if one is owed. So a customer missed by the backfill
self-heals on first login rather than being locked out.

## 8. Authentication / session architecture

Magic link → single-use token → opaque session.

The cookie holds 256 bits of CSPRNG output and nothing else: no email, no
customer id, no claim. There is nothing in it to forge into a truth.
Authorization is a lookup on its SHA-256 hash. Only the hash is stored, so a
database backup cannot be replayed as a session.

Sessions expire at 30 days, renew on use past the halfway point, and can be
revoked individually or for a whole customer.

**The cookie name changed** from `wg_study_access` to `wg_session`. This is
deliberate: legacy values are forgeable by construction, so a browser still
carrying one must fail rather than be honoured. Every login response also
clears the old cookie.

**Customer impact:** anyone currently signed in is signed out once and
re-authenticates by requesting a magic link to the address they purchased with.
Nobody is permanently locked out. **Recommend emailing Study Access customers
before deploying** so a forced re-login is expected rather than alarming.

## 9. Entitlement architecture

`hasEntitlement(customerId, key)` is the only authorization question anyone
asks. Live means granted, not revoked, not expired — expiry evaluated in
Postgres, not in JavaScript, so a wrong clock on one lambda cannot hand out
access the row does not carry.

Grants are idempotent on `idempotency_key`. Product→entitlement mapping lives
in `product_entitlements` as data, so `LIAP_BOOK_BUNDLE → {assessment, starter
kit}` will be an INSERT rather than a deploy, and no route component ever asks
"did they buy the book?".

## 10. Stripe webhook changes

Signature verification is unchanged. Added:

- **Idempotency ledger.** `payment_events` claims each event id atomically. A
  duplicate returns 200 immediately so Stripe stops retrying.
- **Failure clears the claim**, so a retry is processed rather than dismissed
  as a duplicate — otherwise the ledger would turn a transient error into
  permanent data loss.
- **Entitlement grants** on `checkout.session.completed`.
- **`charge.refunded` → revoke.** Without this a refunded customer keeps the
  product, because an entitlement outlives the payment that created it.
- **`customer.subscription.deleted` → revoke, plus session revocation**, so
  cancellation takes effect on the next request rather than whenever the
  cookie happens to expire.

## 11. Consent implementation

GA4 no longer renders until `analytics` consent is true. The banner writes the
value the analytics component actually reads, subscribed via
`useSyncExternalStore`, so accepting takes effect on the current page rather
than the next navigation. Consent is versioned — bumping `CONSENT_VERSION`
re-asks rather than inheriting an answer to a different policy. Session cookies
are unaffected, being strictly necessary.

The `consents` table exists for server-side records once there is a customer to
attach them to. It supports analytics, marketing, policy and terms versions,
and reserves guardian and AI-personalisation types. **No guardian workflow was
built**, per the instruction.

## 12. Accessible UI primitives

`Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `FormField`,
`ErrorMessage`, `Card`, `ProgressIndicator`, `Alert`.

Visible focus rings on everything, 44px minimum targets, errors tied to inputs
via `aria-describedby` + `aria-invalid`, `RadioGroup` in a real
`fieldset`/`legend`, progress stated as text as well as a bar, and every
`Alert` tone carries an icon and a screen-reader word so status is never colour
alone.

No Storybook. It would be new tooling for eleven components with no consumers
yet; the brief says not to add unnecessary tooling.

## 13–14. Test framework and tests

Vitest with PGlite. **35 tests, all passing.**

All nine required cases are covered: forged cookie rejected · entitled customer
accepted · non-entitled rejected · expired session rejected · revoked session
rejected · duplicate Stripe event does not duplicate · magic link works across
separate instances · expired link rejected · reused link rejected.

Plus: concurrent duplicate delivery, concurrent magic-link use, open-redirect
resistance, token unpredictability, email-case identity collision, audit
redaction, and an `AUDIENCE_MAP` regression test asserting every mapped id
resolves to a real program.

Tests run against real PostgreSQL rather than a mock deliberately — the
guarantees depend on `ON CONFLICT`, partial indexes and server-side `now()`,
and a fake could pass while production fails.

## 15. Lint configuration

`npm run lint` performs real linting for the first time.

It was running `next lint`, which **Next 16 removed** — it read "lint" as a
directory argument and errored. The script now calls `eslint` directly with a
flat config.

ESLint was **downgraded from ^10 to ^9**: `eslint-config-next@16.2.2` bundles
`eslint-plugin-react@7.37.5`, which declares peer `eslint ^9.7` and crashes on
ESLint 10's rule-context API. The `>=9.0.0` peer range in `eslint-config-next`
is looser than its own transitive dependency supports.

Result: **0 errors, 30 warnings.** `react/no-unescaped-entities` (16
pre-existing typographic apostrophes in page copy) and
`react-hooks/set-state-in-effect` (one legacy effect in
`app/checkout/success`) are set to `warn` so lint can gate CI today. Clearing
them is content work that does not belong in a security commit.

## 16. Security tests and results

Verified against a production build of this branch:

| Request | Before | After |
|---|---|---|
| `Cookie: wg_study_access=x` → `/exam-simulator` | **200, paid content** | **307 to /access, no content** |
| `Cookie: wg_study_access=login:attacker@…` | **200, paid content** | **307, no content** |
| `Cookie: wg_study_access=x` → `/flashcards` | **200, paid content** | **307, no content** |
| No cookie | 307 | 307 |

A forged **new-format** cookie against a build with no `DATABASE_URL` returns
500 rather than 307 — the guard throws instead of falling back to a weaker
check. That is fail-closed. The error page carries only the route's public
metadata; no questions, answers or explanations appear in it.

## 17. Preview / staging workflow

| Environment | Database | Secrets |
|---|---|---|
| Development | Local Neon branch or a throwaway project | `.env.local`, never committed |
| Preview | **A Neon branch per preview**, not production | Preview-scoped Vercel vars; Stripe **test** keys |
| Production | Neon primary | Production-scoped vars only |

Two rules worth stating explicitly: previews must never point `DATABASE_URL` at
the production database, and previews should use Stripe test keys so a webhook
replay cannot grant real entitlements.

## 18. Environment variables

Added: `DATABASE_URL`, `SESSION_SECRET`, `MANDRILL_API_KEY`, `FEATURE_LIAP`,
`FEATURE_CAPM_PATHWAY`. Names and purposes are in `.env.example`; no values
appear anywhere in the repository.

## 19. Known limitations

1. **Not run against a real database.** The build environment has no Neon
   credentials. Schema and services are proved against PGlite (PostgreSQL 18),
   which is real Postgres but not Neon — connection behaviour and pooling are
   unproven until someone runs the migration.
2. **The backfill has never executed.** Expected customer count unknown.
3. **Mandrill authentication is still unverified.** The login route now prefers
   `MANDRILL_API_KEY` and falls back to `MAILCHIMP_API_KEY`. Mandrill issues
   its own keys, so the fallback may not authenticate — if magic-link emails
   are not arriving in production, this is the first thing to check.
4. **ConvertKit was NOT removed, and my Phase 0 audit was wrong to call it
   vestigial.** It is an *active* integration in `/api/free-guide`. Worse: if
   its env vars are unset, that route logs a warning, returns `{ok:true}` and
   **silently discards the lead**. Whether it is configured in production needs
   checking — this may be losing free-guide signups right now.
5. Session revocation is immediate, but a signed-out customer's browser keeps
   an inert cookie until it expires. Harmless; the row is what decides.
6. No admin UI for granting or revoking entitlements — SQL only for now.

## 20. Manual actions required

1. Create the Neon project; add `DATABASE_URL` to Vercel (all three scopes,
   pointing at different branches).
2. Add `SESSION_SECRET` — 32+ random characters.
3. Run `npm run migrate -- --dry-run`, then `npm run migrate`.
4. Run `node scripts/backfill-study-access.mjs` (dry run), compare the total
   against the Stripe dashboard, then re-run with `--apply`.
5. Add `charge.refunded` to the Stripe webhook's enabled events.
6. Verify Mandrill authentication; add `MANDRILL_API_KEY` if needed.
7. Check whether ConvertKit is configured in production (see §19.4).
8. **Email Study Access customers** about the one-time re-login.
9. Begin the legal review — privacy policy, terms, minors handling, AI
   disclosure. This is the longest-lead item and nothing about it is technical.

## 21. Rollback procedure

Vercel keeps immutable deployments; instant revert is the primary rollback.

The migrations are additive only, so reverting the application code leaves the
schema in place and harmless — no data is orphaned and no down-migration is
needed.

The one asymmetry: reverting to the previous deployment restores the
**vulnerable** cookie check. If a rollback is ever needed after launch, treat
it as reopening a critical vulnerability, not as a neutral undo.

## 22. Current production security status

**Unchanged — this branch is not deployed.** The paywall bypass described in
the Phase 0 audit is still live in production until this merges and the manual
steps in §20 are completed.

## 23. Outstanding legal and privacy items

- Privacy policy: name the database as a processor; state retention.
- Privacy policy: it currently says *"designed for adults"* and *"we do not
  knowingly collect personal information from anyone under the age of 16"* —
  incompatible with a 17–24 pathway.
- Terms: no minors or guardian clause exists.
- Assessment data: the 90-day raw free-text retention is designed for but not
  implemented, because no assessment storage was built.
- AI: Anthropic is not named as a subprocessor. Not urgent — AI personalisation
  is Phase II and the assistant is switched off.

## 24. Readiness for LIAP Phase I

**Ready.** Customers, products, orders, entitlements, sessions, consent, audit
and feature flags all exist and are tested. LIAP work becomes: insert products
and their entitlement mappings, build the assessment tables, build the
assessment UI on the primitives, and add routes behind `FEATURE_LIAP`.

The domain-portability requirement is satisfied by keeping LIAP business logic
in its own module and importing only shared infrastructure — the foundation
imposes nothing PMP-specific.

## 25. Readiness for CAPM 17–24

**Technically ready; legally blocked.**

The schema already separates payer from participant, so guardian purchase,
organisational sponsorship, scholarships and cohorts are representable today
without a migration.

What blocks it is not code: a 17-year-old is a minor in every US state and
generally cannot form a binding contract, the privacy policy explicitly
excludes this audience, and the Terms have no guardian clause. That review must
finish before any enrolment path is built.

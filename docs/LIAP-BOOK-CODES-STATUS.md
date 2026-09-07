# LIAP book access codes — review status

## Commit `1915265` — OWNER REVIEWED / ACCEPTED ON BRANCH

Recorded 4 September 2026, on the owner's instruction.

Full SHA: `19152656732c683db413be9e988a80499006b2b7`
Branch: `claude/crystal-headshot-replacement-myr99m`

The owner has reviewed the LIAP book access code and two-assessment
workstream up to and including this commit, and accepts it **as a branch-level
milestone**.

### What this acceptance is NOT

It is explicitly **not**:

- production approval;
- authorization to merge;
- authorization to deploy;
- authorization to run a production migration;
- authorization to generate production book codes;
- authorization to enable any production feature flag;
- approval to print the registration card.

Each of those remains a separate owner decision. Nothing in this record moves
any of them.

### Status still standing at the time of this record

| Item | Status |
|---|---|
| Registration card **copy** | OWNER APPROVED |
| Registration card **production** | **HOLD** — do not print |
| Locked book statement | **NOT YET SUPPORTED END-TO-END** |
| Migration `0007` | Written; applied only in the in-process test database |
| `FEATURE_LIAP`, `FEATURE_LIAP_BOOK_ACTIVATION` | Off in every environment file |
| Production book codes | None generated |

### What the locked book statement still needs

The statement printed in the book is not supported end-to-end until the reader
journey has been exercised in an approved **non-production** environment:

    code/card → registration → entitlement
              → first Assessment → Reassessment → third attempt refused

with the gift/new-book behaviour confirmed and no unnecessary
`preorder_verifications` record created for a valid code registration.

Passing unit and integration tests are not a substitute for that journey, and
this record does not claim otherwise.

### Scope of the accepted work

Commits `c9507b8` → `1915265` on this branch:

- migration `0007` — `book_access_codes`, and `assessments.attempt_number`
  with its range check and per-customer uniqueness;
- code generation, normalisation, hash-only storage, and the atomic
  single-reader claim;
- the claim endpoint and registration surface, with the printed QR route
  landing on registration directly;
- the two-assessment ceiling, enforced at the service layer and independently
  by the database;
- retirement of the automatic checkout-email entitlement (D1), and the gift
  rule that follows from it;
- the audited, CLI-only administrative remedies, including the atomic
  revoke-and-retire operation (D5);
- the owner-approved customer-facing copy corrections (D6) and the
  publication-date source-of-truth change.

### Note on the git tag

An annotated tag `owner-reviewed/liap-book-codes-1915265` was created locally
against the accepted commit, but the remote refused the tag push with HTTP
403: the session credentials permit branch pushes and not tag creation. This
file is therefore the durable record. Anyone with tag permission can recreate
the tag from this commit if a git-level marker is wanted.

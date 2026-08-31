# Migration convergence note — Journey Game branch

**Status: NOTE ONLY. Nothing renumbered, nothing applied.**

Owner decision, following the JG-1 review: leave this unchanged for now.

---

## The situation

`claude/liap-journey-game` carries a gap in its migration sequence:

| Migration | `claude/liap-assessment-content-master` | `claude/liap-journey-game` |
|---|---|---|
| 0001–0004 | present | present |
| 0005 results email delivery | present | present |
| 0006 partner attribution | present | **absent** |
| 0007 standalone assessment product | present | **absent** |
| 0008 facilitation governance | present | present *(transferred for JG-1)* |

0008 arrived on the Journey Game branch as part of closing JG-1, because the
authorization guard needs its tables. 0006 and 0007 belong to work that branch
never carried.

## Why this is safe today

0008 references only `customers`, created in 0001. It has no dependency on 0006
or 0007, so applying it after 0005 works: the gap is in the *numbering*, not in
the *dependency graph*.

Both branches are unmerged, undeployed, and behind the Pre-Launch Database Gate.
No environment has applied any of 0005–0008.

## What must be reviewed at convergence

When the branches are reconciled, before any migration is applied:

1. **Confirm 0008 is byte-identical on both branches.** It was copied, not
   merged. If either copy has drifted, resolve that *before* deciding order —
   two different 0008s applied to different environments is the failure this
   note exists to prevent.

2. **Apply in numeric order: 0005 → 0006 → 0007 → 0008.** Verify 0008 still
   applies cleanly after 0006 and 0007, which it has never run alongside.

3. **Do not renumber.** 0008 is referenced by name in commit messages, in
   `docs/LIAP-FIRST-ADMIN-BOOTSTRAP.md`, and in tests on both branches.
   Renumbering to close the gap would break those references to fix something
   that is not broken.

4. **Check for a duplicate `0008_` prefix.** If other work has since created a
   different 0008 elsewhere, one must be renamed — and the facilitation
   migration is the one with external references, so it should keep its number.

5. **Re-run the full suite on the merged tree.** `createTestDb` applies every
   `.sql` file in filename order, so the merged sequence is exercised the first
   time the suite runs after convergence. That run is the real check.

## What not to do

- Do not renumber independently on either branch.
- Do not add 0006 or 0007 to the Journey Game branch to "close the gap" — that
  brings partner attribution and the standalone assessment product onto a branch
  that has no use for either.
- Do not apply anything to production before the Gate is opened deliberately and
  the set is reviewed together.

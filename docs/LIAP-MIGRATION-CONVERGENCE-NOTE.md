# Migration convergence note — Journey Game branch

**Status: CONVERGED. Renumbered once, on this branch. Nothing applied.**

Supersedes the pre-convergence version of this note. That version anticipated
the duplicate-prefix collision described below and guessed wrong about how to
resolve it; the correction and the reason for it are recorded here rather than
quietly dropped.

---

## What happened

`main` was merged into `claude/liap-journey-game` after the branch had fallen
62 commits behind. The gap this note was written about is closed:

| Migration | before the merge | now |
|---|---|---|
| 0001–0005 | present | present |
| 0006 partner attribution | **absent** | present (from main) |
| 0007 book shipments | **absent** | present (from main) |
| 0008 shipping list quantity | absent | present (from main) |
| 0009 workshop | absent | present (from main) |
| 0010 facilitation governance | was 0008 | **renumbered** |

## The collision, and why the earlier guidance was reversed

The merge produced two files numbered `0008_`: this branch's facilitation
governance, and main's shipping-list quantity. `tests/liap-partner-release.ts`
fails on exactly that, and its comment states the hazard precisely:

> One migration per number. Two files sharing a prefix is how one silently
> marks the other as already applied.

The previous version of this note said the facilitation migration should keep
its number, "because it is referenced by name in commit messages, in
`docs/LIAP-FIRST-ADMIN-BOOTSTRAP.md`, and in tests on both branches."

**That premise was checked and is false.** A repository-wide search for the
filename returns no hit in any `.ts`, `.tsx` or `.mjs` file: not in the runner,
not in `tests/helpers/db.ts` (which globs the directory), not anywhere. The
only references are prose — this note, the bootstrap procedure and the JG-2
proposal — and prose is editable. Both prose references have been updated.

The decisive fact is the other one:

- **Main's 0008 may already be applied.** It has been on `main` since October
  and the runner tracks applied migrations by full filename. Renaming an
  applied migration makes it run a second time.
- **This branch's migration provably is not applied.** It is behind the
  Pre-Launch Database Gate, on an unmerged branch, and the standing freeze has
  held since it was written.

Renaming the one that cannot have run is the move with no failure mode.
Renaming the one that may have run risks a double apply on production to
preserve a number that nothing reads. So facilitation governance became
**0010**, which also puts it last — correct, since it is the newest work.

## What still must be reviewed before anything is applied

1. **Apply in numeric order: 0006 → 0007 → 0008 → 0009 → 0010.** 0010 has now
   run after 0006–0009 for the first time, in the test suite, on the merged
   tree. That is new evidence, not a guarantee about production.
2. **0010 depends only on `customers`**, created in 0001. It has no dependency
   on anything main added, which is why the renumber is a rename and nothing
   more — the file's contents are untouched.
3. **Confirm 0010 is byte-identical to the copy on
   `claude/liap-assessment-content-master`**, where it is still numbered 0008.
   It was copied between branches, not merged. If the two have drifted, resolve
   that before deciding order.
4. **The assessment branch still numbers it 0008 and does not collide**, because
   main's 0008 is not on that branch. Whichever branch merges to `main` second
   inherits this same renumber. Do it there the same way, and for the same
   reason: move the file that has not been applied.
5. **Re-run the full suite on the merged tree.** `createTestDb` applies every
   `.sql` file in filename order, so the merged sequence is exercised on every
   run. That run is the real check.

## What not to do

- Do not renumber main's migrations. Any of them may have been applied.
- Do not apply anything to production before the Gate is opened deliberately
  and the whole set is reviewed together.
- Do not close a numbering gap by adding migrations a branch has no use for.

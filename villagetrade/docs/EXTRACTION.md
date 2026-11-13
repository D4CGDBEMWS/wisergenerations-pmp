# Extraction and repository independence

## Status

**Extraction is proven, not yet performed on GitHub.**

I attempted to create the repository programmatically and was refused:

```
POST https://api.github.com/user/repos
403 Resource not accessible by integration
```

This session's GitHub credential is scoped to `D4CGDBEMWS/wisergenerations-pmp`
and cannot create repositories. Creating it is a founder action.

## What was verified

The extraction was carried out in full in a scratch directory and the result
tested. In the standalone copy:

| Check | Result |
|---|---|
| Wiser Generations middleware in the build | **None.** `"middleware": {}`, no edge chunks emitted |
| `exam-simulator`, `flashcards`, `wg_session`, `/access` anywhere | **None** |
| References to `wisergenerations`, `LIAP`, `STRIPE`, `MAILCHIMP`, `RESEND`, `CONVERTKIT`, `UPSTASH`, `DATABASE_URL` | **None** |
| Imports from the parent project | **None** — every import is `@/…` or a package |
| Test suite | **66 / 66 passing** |
| Typecheck · build | Clean |

The middleware shim was **deleted** before those checks, and the build still
emitted no middleware. That is the permanent resolution: the inheritance was
caused by cohabitation, and extraction removes the cause rather than masking
it.

## To perform it

```bash
bash scripts/extract.sh ~/villagetrade
```

Then create an empty **private** repository and:

```bash
cd ~/villagetrade
git remote add origin git@github.com:<owner>/villagetrade.git
git push -u origin main
```

`scripts/extract.sh` deletes `middleware.ts` and itself as part of the move.

## The two parent configuration changes

Both exist solely to keep the Wiser Generations toolchain from seeing this
application while it is nested. Neither changes WG behaviour.

| File | Change | Revert after extraction? |
|---|---|---|
| `tsconfig.json` | `"exclude": ["node_modules", "villagetrade"]` | **Yes — revert.** Once the directory is gone the entry is dead. Harmless if left, but it is noise. |
| `eslint.config.mjs` | `ignores: [… 'villagetrade/**']` | **Yes — revert.** Same reasoning. |

Reverting is one line each and requires no other change. Until the directory
is removed from the branch, both must stay: without them, `tsc --noEmit` and
`eslint .` on Wiser Generations pull VillageTrade into their scope and the
WG checks report failures that are not WG's.

**Order matters:** delete `villagetrade/` from the WG branch first, then
revert the two config entries, then re-run the WG checks.

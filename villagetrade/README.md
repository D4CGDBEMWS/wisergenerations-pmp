# VillageTrade

**Helping neighbors survive and thrive.**

A local service, work and barter exchange for neighbours. Pilot area: Cobb County, Georgia.

---

## Status — read this first

**This application is in development. It is not operating, has no members, and
accepts no bookings.** Nothing here is deployed; no cloud resource exists; no
credential is configured.

The intended legal entity is **VillageTrade LLC**, subject to Georgia name
availability and registration. **It is not formed.** No surface in this
application renders an entity name, and a test enforces that.

## Local preview

This application currently lives in a subdirectory of the Wiser Generations
repository and borrows its installed packages. It is written to be lifted into
its own repository unchanged — nothing here imports from the parent.

```bash
cd villagetrade
npx next dev          # http://localhost:3000
```

Demo mode is on by default (`NEXT_PUBLIC_VT_DEMO=true` in `.env.example`) and
serves clearly-labelled fictional listings behind a permanent banner. Set it to
anything else and the app shows empty states instead.

```bash
npx vitest run        # the test suite (real Postgres, in-process)
npx tsc --noEmit      # typecheck
npx next build        # production build
```

No command above contacts a network service or creates a paid resource.

## What exists

| Area | State |
|---|---|
| Design system, navigation, page shells | Built |
| Database migrations (5 tables + gates) | Designed, applied only to the in-memory test database |
| Authorization module | Built and tested |
| Safety standard + conduct agreement | Built and tested |
| Pilot-area restriction | Built and tested |
| Feature flags | Built, all default OFF |
| Authentication provider | **Not wired.** Architecture only |
| Messaging, bookings UI, holiday wishlist | **Not built** |
| Identity verification | **Not integrated** |
| Payments | **Deliberately absent** — see below |

## Money

VillageTrade records what two neighbours **agree**. It does not collect, hold
or transfer funds. There is no payments table, no payout table, no balance and
no Stripe reference anywhere in this schema, and a test asserts their absence.
Adding any of them is a separately approved architecture.

## Safety

The conduct standard lives in `lib/safety.ts` and is rendered from there by
every surface, and stored verbatim with each acknowledgment. The founder
wording is exact and a test compares it character for character.

Four database gates, all enforced by triggers rather than CHECK constraints
because each spans more than one table:

1. A booking cannot be confirmed until **both** parties acknowledge the conduct standard
2. A blocked pair cannot transact
3. A suspended party cannot transact
4. A review requires a **completed** booking, written by a party, once

A fifth gate — identity verification before a live in-person booking — is
present and defaults **closed**.

## Layout

```
app/         routes and page shells
components/  design system, navigation, safety surfaces
lib/         brand, geography, flags, safety, programs, authorization
db/          migrations
tests/       66 tests
```

# VillageTrade — Implementation Roadmap

Reflects the founder's decisions of 2026-11-13: separate LLC (intended,
unformed), local Cobb County marketplace, separate repository and Vercel
project.

## Phase 2A — Local foundation ✅ COMPLETE (this handoff)

Repository structure, design system, navigation and page shells, migrations
for profiles / listings / categories / ZIP discovery, authorization
architecture, test fixtures and 66 automated tests, local preview with
labelled demonstration data.

No cloud resource, no credential, no deployment.

## Phase 2B — Authentication and real data *(needs approval)*

Supabase project creation (**first paid/cloud resource — requires explicit
approval**), auth wiring, RLS policies written and tested against the live
schema, profile and listing CRUD, ZIP discovery against real rows.

**Gate:** founder authorises creating a Supabase project.

## Phase 3 — Transactions and bookings

Exchange proposals (paid / barter / combined), in-app messaging, scheduling,
booking agreements, status tracking, cancellation with recorded reason.

Still no money moves.

## Phase 4 — Signature and seasonal programs

A Good Man for the Day™ and A Good Woman for the Day™ with the three booking
durations; Holiday Helping Hands™; Holiday Help Wishlist™ with multi-task
requests and bundled provider proposals.

**Gate:** founder supplies customer-facing descriptions for the holiday
programs. The code will not invent them.

## Phase 5 — Safety and beta readiness

Identity verification integration, the conduct gate in the UI, reporting,
blocking, moderation console, retention controls, accessibility audit, full
browser testing.

**Gate:** R1–R6 in the risk register are closed. No real in-person booking is
enabled until verification is operational **and tested**.

## Phase 6 — Founder acceptance

Working preview, test results, unresolved risks, operating instructions.

## Extraction

When the founder authorises a dedicated repository, `villagetrade/` lifts out
whole: nothing in it imports from the parent. The local `middleware.ts` shim
and the parent's `tsconfig`/`eslint` exclusions are the only artefacts of
cohabitation, and all three can then be removed.

# VillageTrade — Risk Register

Updated 2026-11-13, following the founder's decision to establish a separate
legal entity.

**Nothing in this register is resolved by code.** Every item marked LAUNCH
BLOCKER must be closed by the founder before a real person uses this platform.

---

## Launch blockers — open

| # | Risk | Status | Owner |
|---|---|---|---|
| R1 | **Legal entity not formed.** Intended name VillageTrade LLC, subject to Georgia name availability. Until formed, there is no entity to contract with members, hold insurance, or bear liability. | **OPEN** — decided, not registered | Founder |
| R2 | **No marketplace Terms of Service.** The Wiser Generations terms describe a certification training company and do not cover a stranger-introduction marketplace. They must not be reused. | **OPEN** | Founder + counsel |
| R3 | **No privacy policy for this entity.** Separate data controller, separate database, separate retention rules. | **OPEN** | Founder + counsel |
| R4 | **No insurance review.** A platform arranging in-person work at private homes carries risk unlike anything the sibling company insures against. | **OPEN** | Founder + broker |
| R5 | **No identity verification provider.** Candidates: Stripe Identity, Persona. Not selected, not contracted, not integrated. | **OPEN** | Founder |
| R6 | **No incident response or moderation procedure.** Tables and gates exist; the human process does not. Who reviews a safety report, within what time, with what authority? | **OPEN** | Founder |
| R7 | **Payment compliance undecided.** The MVP moves no money, which avoids this. Any future Stripe Connect design raises KYC, 1099 and money-transmission questions. | **OPEN** (deferred by design) | Founder |

## Product and content risks

| # | Risk | Mitigation in code |
|---|---|---|
| R8 | Someone publishes a testimonial, member count or savings figure before any exists | Test scans every surface for dollar figures, population counts and the word "testimonial" |
| R9 | Marketing copy implies verification makes people safe | Ten forbidden phrases, scanned on every surface; the acknowledgment states the opposite explicitly |
| R10 | "International" or "nationwide" leaks over from the sibling brand | Forbidden-term test across all surfaces |
| R11 | An entity name is rendered before the LLC exists | Test forbids "LLC" on any surface while `ENTITY.registered` is false |
| R12 | The pilot area expands silently | ZIP allow-list, plus a database trigger refusing publication outside it; no radius anywhere |
| R13 | Childcare or eldercare appears as a category | Database CHECK refuses the slugs; no admin screen or seed can introduce them |
| R14 | Holiday programs ship with invented marketing copy | Descriptions are empty strings; a test asserts they stay empty until the founder supplies wording |

## Technical risks

| # | Risk | Status |
|---|---|---|
| R15 | **Nested-directory leakage.** A build run from `villagetrade/` walked up and compiled the Wiser Generations middleware into VillageTrade's edge bundle — observed, not theorised. Shadowed by a local `middleware.ts`; the real fix is extraction. | **Mitigated, not eliminated** |
| R16 | Supabase RLS treated as the whole permission system | Three layers by design: server check, RLS, database trigger. Documented in `lib/authz.ts` |
| R17 | Demo data mistaken for real activity in a screenshot | Every demo name prefixed "Demo"; permanent non-dismissible banner |
| R18 | The ZIP list is a draft | `lib/geography.ts` is marked DRAFT; border ZIPs shared with Cherokee/Fulton/Paulding need a founder ruling |

## Explicitly out of scope

- Payment collection, holding or transfer
- Storage of identity documents of any kind
- Bless a Neighbor (flag present, default off, no route, no schema)
- Any geography beyond the approved Cobb County ZIPs

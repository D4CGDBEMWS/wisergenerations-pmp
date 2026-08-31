# JG-2 — Minimizing authorized facilitator exposure

**Status: DESIGN PROPOSAL. Nothing implemented. Owner approval required.**

The JG-2 **authorization boundary is closed** (JG-1). An unauthorized client
receives nothing. This proposal concerns the remaining question: how much a
*legitimately authorized* facilitator's browser receives.

---

## A. What is eagerly delivered today

`components/liap/journey/FacilitatorConsole.tsx` is a `'use client'` component,
so everything it imports is compiled into a client chunk and downloaded whole
the moment the console loads.

| Module | Lines | What it is | Needed at that moment? |
|---|---|---|---|
| `lib/journey/events.ts` | 226 | **Entire Road-Event library** + recalculation prompts | Only the event being revealed |
| `lib/journey/scenarios.ts` | 58 | All scenarios | Only the current one |
| `lib/journey/prompts.ts` | 160 | All progress prompts | Only the current stage's |
| `lib/journey/timing.ts` | 66 | Facilitator clock **including the private contingency** | Yes — the clock runs locally |
| `lib/journey/impact.ts` | 63 | Impact choices | Yes — used on every decision |
| `lib/journey/projection.ts` | 87 | Participant-view projection | Yes — runs per tick |
| `lib/journey/debrief.ts` | 261 | Debrief, via `DebriefPanel` | Only after the game ends |

**≈921 lines of protected methodology, delivered before the first Road Event is
revealed.** A cleared facilitator for *one* Retreat holds the complete deck for
*every* Retreat.

For contrast, the participant display imports only `channel`, `display-copy` and
a type — the boundary that already works, and the model this proposal follows.

## B. What can safely remain client-side

- `timing.ts` — the clock must tick without a network round trip; a paused
  session on a hotel wifi drop is worse than the exposure.
- `impact.ts` — small, needed on every interaction.
- `projection.ts` — pure function, must run per tick to drive the projected map.
- `channel.ts` — the transport itself.

These are **facilitator-operational mechanics**, not the protected content
library. Keeping them local is what preserves the single-device model.

## C. What should move behind a server boundary

- `events.ts` — the Road-Event library. **Highest value, lowest cost to move.**
- `scenarios.ts` — all but the current scenario.
- `prompts.ts` — all but the current stage's prompts.
- `debrief.ts` — fetched when the debrief begins, not at console load.

## D. How the server would decide

No new mechanism. The guard built for JG-1 already answers this:

```
mayReceiveFacilitatorContent(session.customerId, retreatId)
  = certified and in force
  + assigned to THIS Retreat
  + preparation confirmed for THIS Retreat
```

- **Identity** — `validateSession(cookie)`, as the console route already does.
- **Assignment / clearance** — the same call, recomputed per request.
- **Current event/state** — see E. This is the only genuinely new question.

## E. Returning only what is required now

A single server action, called when the facilitator reveals an event:

```
revealRoadEvent(retreatId, eventId)
  → re-check mayReceiveFacilitatorContent
  → return ONE event's content
```

**The important design decision: the server does not track game position.** It
authorizes a *request* for a named event; it does not hold a cursor.

Holding a cursor would mean the server needs to know where the room is, which
means writing game state on every advance — persistence invented purely to serve
this proposal, and a new source of truth that can disagree with the facilitator's
own console. The facilitator already decides what is revealed and when; that
decision stays local, and the server's job is only "may this person have this
event for this Retreat".

The cost is honest: a cleared facilitator could request events in any order, or
request them all. That is a **rate/telemetry** concern, not an authorization one
— and it is a large reduction from "receives everything automatically". Bulk
requests are visible in `audit_events` if we choose to log them; today, bulk
delivery is invisible because it happens once at page load.

## F. Staged disclosure

**Strengthened, not weakened.** Today staging is a UI convention over a fully
loaded deck — the browser holds every future event and shows one. Afterwards,
an unrevealed event is not in the browser at all.

The participant display is unaffected: it already receives only projected state.

## G. Single-device usability

The approved model is one facilitator laptop, projected. That is the risk to
manage: a network hiccup mid-Retreat must not stall the room.

Mitigations, in order of preference:

1. **Prefetch the next event only** once the current one is revealed. One event
   ahead, never the library.
2. **Cache in memory** for the session, so re-revealing never re-fetches.
3. **Explicit degraded mode** — if a fetch fails, the console says so plainly
   rather than appearing frozen.

Even at worst, this fails no harder than the existing `BroadcastChannel`, which
already assumes a working browser.

## H. Trainer-only and unrelated-Retreat content

Both are excluded by construction, not by filtering:

- The action takes a `retreatId` and re-checks assignment, so another Retreat's
  content is unreachable.
- Trainer/certification material is gated by `mayReceiveTrainerContent`, a
  **separate** check on a **separate** authority. A facilitator action cannot
  return it because it never reads that authority.

## I. Is new database state required?

**No.**

- Identity — `sessions` (exists)
- Clearance — `facilitator_profiles`, `retreat_assignments`,
  `retreat_preparation_confirmations` (0008, prepared)
- Content — TypeScript modules, server-side (exists)
- Game position — **deliberately not persisted**, per E

The only optional addition is an audit event for reveal requests, which reuses
`audit_events` and needs no schema change.

---

## Estimated scope

| Change | Size |
|---|---|
| Server action + re-check | small |
| Console fetches one event instead of importing the library | moderate — the one real change |
| Debrief loads on demand | small |
| Tests + negative controls | moderate |

**No game mechanics change.** No Road Event, Journey Map, reveal, MY PROJECT
transfer, timing rule or methodology is touched. The console's behaviour is
identical; only where its content comes from changes.

## Recommendation

Do `events.ts` first and alone. It is the highest-value protected asset, the
clearest seam, and it can be validated in isolation before deciding whether
scenarios, prompts and debrief are worth the same treatment.

**Not started. Awaiting owner decision.**

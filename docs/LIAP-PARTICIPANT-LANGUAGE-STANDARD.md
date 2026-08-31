# LIAP Participant Language Standard

Owner-approved, 31 August 2026. Canonical for all participant-facing Living Is
a Project™ / Life Project-Ready™ Assessment language.

This document governs how the application speaks to a participant. It does not
govern internal identifiers, database values, code comments, or engineering
vocabulary.

---

## The standard

LIAP approaches each participant as the invention of Divinity, created with
purpose, value, capacity, gifts, and possibilities.

Participant-facing language should help people:

- recognize what is working;
- discover what they already have;
- give attention where useful;
- strengthen what can grow;
- gain clarity;
- move forward with purpose and hope.

## What this rules out

Do not characterize the **person** as:

- failing
- broken
- deficient
- a problem
- a bad score
- a judgment

Do not introduce a negative self-perception merely to reassure the participant
against it. "You are not a failure" puts the word in front of somebody who had
not been thinking it. The standard is not a list of banned words followed by
reassurance — it is a decision not to frame the person as a deficit in the
first place.

## What this does NOT rule out

Ordinary, accurate project terms remain available and are not softened:

- risk
- issue
- obstacle
- constraint
- problem
- corrective action
- the technical use of `resolve`

These describe **situations and work**, not people. A constraint on a plan is a
fact; a person is not a constraint.

---

## Applied vocabulary

### Action labels — participant-facing

| Stored key | Participant label | Intent |
|---|---|---|
| `protect` | **PROTECT** | Keep building on what's working. |
| `resolve` | **GIVE ATTENTION** | Take a closer look. |
| `move` | **STRENGTHEN** | Give this area focused care and attention. |

The stored keys are persisted inside `assessment_results.next_best_three` and
**must never be renamed** — renaming one orphans every report ever scored.
Labels are presentation and may change; keys are data and may not.

The single source is `lib/liap/display-labels.ts`. Every participant-facing
surface — results page, results email, Snapshot PDF — reads from it. No surface
may print a raw stored key.

### Classification

| Key | Participant label |
|---|---|
| `strength` | Strength |
| `build` | Build |
| `priority` | Priority |
| `immediate` | **Priority to Strengthen** |

`immediate` previously displayed as "Immediate attention". The scoring
threshold is unchanged; only the label moved.

### Headings and sentences

| Was | Is |
|---|---|
| Needs attention first | **Start Here** |
| …this is where your answers show the least room right now. | …this is where your answers show the **greatest opportunity for growth** right now. |
| …it is the next area that will limit progress. | …it is the next area **where focused attention may create meaningful progress**. |

Where a dimension is not already obvious from context, `Your First Area to
Strengthen` is the approved longer heading. Prefer `Start Here`.

---

## Retired vocabulary

**S.T.E.A.D.Y.** is retired from customer-facing LIAP. It must not be restored,
rewritten, regenerated, or exposed as a current customer-facing model.

Internal identifiers (`needsSteady`, `STEADY_STEPS`, the `steady_routed`
column) are retained where compatibility requires it. The routing flag still
exists and still tempers the STRENGTHEN step; only the display is gone.

**Wiser Pivots™** is the canonical LIAP adaptive-change concept:

| | | |
|---|---|---|
| W | WAIT | Resist reaction. |
| I | INSPECT | See what is true now. |
| S | SELECT | Choose what matters now. |
| E | EMBRACE | Accept the need to adapt. |
| — | PIVOT | The personal, intentional make-the-turn moment. |
| R | REVIEW | Learn and loop back. |

The model must not be rewritten or expanded. It is **not** a replacement name
for The LIAP Way™.

Where a retired S.T.E.A.D.Y. surface needs replacement and no approved Wiser
Pivots™ copy exists for that exact surface, the surface is removed and the gap
is reported. Replacement prose is not generated.

---

## Copy governance

Approved participant-facing copy is controlled content. It may be formatted,
placed into approved layouts, and supplied with verified links, approved dates
and merge fields.

It may not be silently improved, shortened, modernized, rewritten, optimized or
substituted. Where a gap is found and no approved copy exists, the gap is
flagged rather than filled.

# Supabase and identity verification — recommendations

**Nothing here is purchased, created or connected.** Each requires your
approval.

## Supabase

**Recommended: yes, and it is the right fit.** Postgres with row-level
security, auth, and file storage in one managed service. The RLS policies in
`0005_rls.sql` are already written against it and tested.

| Plan | Cost | When |
|---|---|---|
| Free | $0 | Development. **Pauses after 7 days idle** and has no backups — fine now, not for a beta |
| Pro | $25/mo | From the first real member. Daily backups, no pausing, 8 GB |

**Recommendation: Free now, Pro before the first real member.** The pausing
alone disqualifies Free for a beta.

**One caution.** Supabase encourages calling the database directly from the
browser with RLS as the only guard. **Do not adopt that pattern here.** Our
writes go through server-side code that checks `lib/authz.ts` first, with RLS
and the triggers beneath. Three layers, as built. The convenience of direct
client writes is not worth making RLS a single point of failure on a platform
that sends people to each other's homes.

## Identity verification

| | Stripe Identity | Persona |
|---|---|---|
| Cost | ~$1.50/verification | ~$1–3, volume pricing |
| Document storage | Stripe holds it; we never receive it | Persona holds it |
| Integration | Simplest | More configurable |
| Caveat | Pulls you into Stripe's account model | More setup |

**Recommendation: Stripe Identity**, for one reason above cost — **we never
receive the document.** The verification table has no column that could store
one and a test enforces that; Stripe Identity matches that design exactly.
It also leaves the door open if payments are ever approved, without
committing to it now.

**Rough cost:** 200 verified members ≈ $300 one-off, plus re-verification if
you set an expiry.

**Two things to decide with it:**

1. **Who must verify?** Providers only, or both sides? Providers-only is
   cheaper and commoner. Both-sides is safer and is what the booking gate
   currently assumes — `booking_confirm_gate` requires *both* parties
   verified when live bookings are enabled.
2. **Does verification expire?** The schema supports it (`expires_at`).
   Leaving it null means verified once, verified forever.

## Running cost at pilot scale

| | Monthly |
|---|---|
| Vercel (Hobby for dev, Pro at beta) | $0–20 |
| Supabase | $0 now → $25 at beta |
| Domain | ~$1.25 |
| **Fixed** | **~$1 now → ~$46 at beta** |
| Verification | ~$1.50 per member, one-off |

## Order of approvals

1. GitHub repository *(blocked — the integration cannot create one; see `EXTRACTION.md`)*
2. Supabase Free project — unblocks the rest of Phase 2B
3. Stripe Identity account — Phase 5, not before
4. Supabase Pro + Vercel Pro — before the first real member

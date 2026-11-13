# Cobb County ZIP coverage — for founder review

**Status: DRAFT. Requires founder sign-off before any listing is published.**

## How to read this, and a caution about my confidence

ZIP codes are USPS mail-delivery routes. They were never drawn to follow
county lines and frequently do not. A ZIP "in Cobb County" can deliver to
addresses in Cherokee, Fulton, Paulding or Douglas.

**I have not verified this table against an authoritative source.** There is
no county GIS or USPS dataset in this environment, and I did not fetch one.
The county assignments below are from general knowledge and should be treated
as a starting point for verification, not as fact. The boundary notes flag
where I am least confident.

Authoritative sources to check against:

- Cobb County GIS parcel/boundary data
- USPS ZIP Code Lookup by city
- Georgia Department of Revenue ZIP-to-county tables

## The draft list — 18 ZIPs

| ZIP | City | County coverage | Confidence | Note |
|---|---|---|---|---|
| 30008 | Marietta | Cobb | High | |
| 30060 | Marietta | Cobb | High | |
| 30062 | Marietta | Cobb | High | |
| 30064 | Marietta | Cobb | High | |
| 30066 | Marietta | Cobb | Medium | North-east edge; verify against Cherokee |
| 30067 | Marietta | Cobb | High | |
| 30068 | Marietta | Cobb | High | |
| 30080 | Smyrna | Cobb | High | |
| 30082 | Smyrna | Cobb | High | |
| 30101 | Acworth | **Cobb + Paulding + Bartow** | **Low** | Known to straddle. Needs a ruling |
| 30102 | Acworth | **Cobb + Cherokee** | **Low** | Known to straddle. Needs a ruling |
| 30106 | Austell | **Cobb + Douglas** | **Low** | Needs a ruling |
| 30126 | Mableton | Cobb | Medium | Verify southern edge against Douglas |
| 30127 | Powder Springs | **Cobb + Paulding** | **Low** | Needs a ruling |
| 30144 | Kennesaw | Cobb | Medium | Verify northern edge against Cherokee |
| 30152 | Kennesaw | Cobb | Medium | |
| 30168 | Austell | **Cobb + Douglas** | **Low** | Needs a ruling |
| 30339 | Vinings / Atlanta | **Cobb + Fulton** | **Low** | Vinings is Cobb; the 30339 ZIP reaches into Fulton |

## ZIPs deliberately NOT included

Not an oversight — each needs a decision:

| ZIP | Why excluded |
|---|---|
| 30006, 30007, 30061, 30063, 30065, 30090 | Marietta PO Box / non-delivery ZIPs. No residents to serve |
| 30156, 30160 | Kennesaw PO Box ZIPs |
| 30188, 30189 | Woodstock — primarily **Cherokee**, not Cobb |
| 30339 adjacent Atlanta ZIPs (30305, 30327) | Fulton |

## The decision you need to make

**Six ZIPs straddle a county line** (30101, 30102, 30106, 30127, 30168,
30339). Three options:

1. **Include them whole.** Simplest; means some members are not in Cobb County.
2. **Exclude them.** Strictly Cobb; excludes real Cobb residents in those ZIPs.
3. **Include, with an address check at verification.** Most accurate, most work, and needs a geocoding service.

I recommend **(1) for the pilot**, documented plainly, with the boundary
revisited before any expansion. A neighbour one street over the Paulding line
is still a neighbour, and the alternative turns away Cobb residents.

**This is your call, not mine** — it determines who the service is for.

## How the boundary is enforced

Not by a radius, which drifts. By an explicit allow-list in
`lib/geography.ts`, mirrored into `zip_areas`, with a database trigger
(`listing_publish_guard`) refusing to publish a listing into any ZIP that is
absent or inactive. Tested: `tests/pilot-area.test.ts`.

Adding a ZIP is a visible diff and a founder decision. It cannot happen by
accident.

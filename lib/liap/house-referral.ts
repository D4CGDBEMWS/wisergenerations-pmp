import type { PartnerDestination } from './partners'

// ---------------------------------------------------------------------------
// The first-party house referral code.
//
// ── WHAT THIS FILE IS, AND IS NOT ──────────────────────────────────────────
//
// It is the owner-approved SPECIFICATION for the grassroots code: the exact
// values that go in the partners row when somebody decides to create it.
//
// It is NOT the row. Nothing here inserts anything, no migration seeds it, and
// scanning /liap/go/grassroots today resolves to no partner — which is the
// safe outcome by design: the visitor still reaches a real LIAP page and the
// scan is recorded as unattributed.
//
// Creating the row is a deliberate act, taken when the owner decides the
// channel is live. Seeding it in a migration would mean the code springs into
// existence on a deploy, which is the wrong way round for something that ends
// up printed on paper.
//
// ── WHY A HOUSE CODE AT ALL ────────────────────────────────────────────────
//
// Crystal's grassroots leave-behind flyer has no partner behind it. Without a
// code it would land unattributed and be indistinguishable in the report from
// a mistyped postcard or a stale sign. With one, "how is the flyer doing" has
// an answer, and it sits beside the partner numbers rather than under them.
//
// partner_type is 'first-party' precisely so a report can separate the
// business's own outreach from a community partner's. Averaging the two would
// flatter the partners or flatter the flyer, and neither is useful.
// ---------------------------------------------------------------------------

export interface HouseReferralSpec {
  readonly referralCode: string
  readonly partnerName: string
  readonly partnerType: string
  readonly destinationKey: PartnerDestination
  readonly campaign: string
  readonly status: 'draft'
}

/**
 * OWNER-APPROVED. Code, type and destination are the owner's ruling; the row
 * is not created by this file or by any migration.
 */
export const HOUSE_REFERRAL: HouseReferralSpec = {
  referralCode: 'grassroots',
  partnerName: 'Wiser Generations — grassroots outreach',
  partnerType: 'first-party',
  // Straight to the book. A grassroots flyer is a book flyer, and sending
  // somebody to the hub to find the preorder button costs a click for nothing.
  destinationKey: 'book',
  campaign: 'book-launch',
  // Draft until the owner activates the channel. Status governs reporting and
  // asset issuance, never whether the link resolves.
  status: 'draft',
}

/**
 * The SQL that would create it, kept beside the specification so the values
 * cannot drift apart — and deliberately not executed by anything.
 *
 * Run by hand when the owner authorises the grassroots channel.
 */
export function houseReferralInsertSql(): string {
  return `INSERT INTO partners
  (referral_code, partner_name, partner_type, destination_key, campaign, status)
VALUES
  ('${HOUSE_REFERRAL.referralCode}',
   '${HOUSE_REFERRAL.partnerName.replace(/'/g, "''")}',
   '${HOUSE_REFERRAL.partnerType}',
   '${HOUSE_REFERRAL.destinationKey}',
   '${HOUSE_REFERRAL.campaign}',
   '${HOUSE_REFERRAL.status}')
ON CONFLICT DO NOTHING;`
}

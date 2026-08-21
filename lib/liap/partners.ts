import { getDb } from '@/lib/db/client'

// ---------------------------------------------------------------------------
// Community partners.
//
// A partner is a church, coffee shop, barbershop, salon, realtor, veteran
// organisation or local business that agreed to display a QR code. The code
// on that sign is the only thing this module resolves, and resolving it does
// exactly one thing: it says which canonical LIAP page to show and which
// partner to credit.
//
// THE PROPERTY THAT MATTERS, stated plainly because it is the reason this
// module exists as its own file:
//
//   A referral code is printed on a postcard in a shop window. It is a public
//   string that anyone can read, photograph or guess. It therefore carries no
//   authority whatsoever — it cannot grant an entitlement, unlock a page,
//   change a price, or bypass any check.
//
// This module imports nothing from lib/entitlements or lib/auth, and it never
// will. tests/liap-attribution.test.ts asserts that dependency direction, so a
// future change that violates it fails the build rather than being caught in
// review — or not caught at all.
// ---------------------------------------------------------------------------

/**
 * Where a partner code may send someone.
 *
 * A KEY into this table, never a stored URL. Every redirect in this codebase
 * before Phase II-A went to a hardcoded internal path; /liap/go is the first
 * that redirects based on data somebody typed into a database, and an
 * arbitrary stored URL is precisely how phishing links get laundered through
 * a domain people trust.
 *
 * With an allow-list the worst outcome of a mistyped field is a code that
 * lands on the hub. Without one, the worst outcome is the business's own QR
 * code pointing at somebody else's site.
 */
export const PARTNER_DESTINATIONS = {
  hub: '/life-is-a-project',
  book: '/life-is-a-project/book',
  assessment: '/life-is-a-project/assessment',
  retreat: '/life-is-a-project/retreat',
  group: '/life-is-a-project/retreat/group',
  sponsor: '/life-is-a-project/sponsor',
} as const

export type PartnerDestination = keyof typeof PARTNER_DESTINATIONS

/** Where an unknown, retired or malformed code goes. Never a 404. */
export const DEFAULT_DESTINATION: PartnerDestination = 'hub'

/**
 * Resolves a destination key to a path, refusing anything unrecognised.
 *
 * Total: every input returns a real internal path. A caller cannot end up
 * with `undefined` and improvise something.
 */
export function destinationPath(key: string | null | undefined): string {
  if (key && key in PARTNER_DESTINATIONS) {
    return PARTNER_DESTINATIONS[key as PartnerDestination]
  }
  return PARTNER_DESTINATIONS[DEFAULT_DESTINATION]
}

export interface Partner {
  id: string
  referral_code: string
  partner_name: string
  partner_type: string
  destination_key: string
  campaign: string | null
  utm_source: string | null
  utm_medium: string | null
  status: string
}

/**
 * The shape of a referral code, enforced before it reaches the database.
 *
 * Letters, digits and hyphens, 2–48 characters. Narrow enough that a code
 * cannot smuggle a path, a scheme or a control character into anything that
 * later concatenates it.
 */
const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9-]{0,46}[A-Za-z0-9]$/

export function isWellFormedCode(code: string): boolean {
  return CODE_RE.test(code)
}

/**
 * Finds a partner by the code on their sign.
 *
 * Case-insensitive, because the code is as likely to be typed off a postcard
 * as scanned. Returns null for anything unknown — callers must treat that as
 * "no attribution" and carry on, never as an error worth showing anybody.
 *
 * Note what this does NOT filter on: status. A paused or ended partner still
 * resolves. Printed material outlives a campaign, and someone holding a
 * church bulletin from last spring should reach the page, not a dead end.
 * Status governs reporting and asset issuance, which is a separate question
 * from whether the link works.
 */
export async function findPartnerByCode(code: string): Promise<Partner | null> {
  if (!isWellFormedCode(code)) return null

  const rows = await getDb().query<Partner>(
    `SELECT id, referral_code, partner_name, partner_type, destination_key,
            campaign, utm_source, utm_medium, status
       FROM partners
      WHERE lower(referral_code) = lower($1)
      LIMIT 1`,
    [code]
  )
  return rows[0] ?? null
}

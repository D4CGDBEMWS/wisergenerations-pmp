import { createHash } from 'crypto'
import { Redis } from '@upstash/redis'

// ---------------------------------------------------------------------------
// giveaway-store — duplicate prevention and a timestamped entry log.
//
// Backed by Upstash Redis, which the project already depends on for rate
// limiting. Two keys per giveaway campaign:
//
//   wg:giveaway:<campaign>:emails   SET  of hashed emails, for O(1) dedupe
//   wg:giveaway:<campaign>:entries  LIST of entry records, for the drawing
//
// Email addresses are stored as SHA-256 hashes in the dedupe set so the set
// alone cannot be dumped into a mailing list. The entry log holds the real
// address because the winner has to be contactable.
//
// Degradation: when Upstash is not configured, entries still reach Mailchimp
// (which upserts by email, so the audience never gains duplicates) but we
// cannot tell a repeat entrant that they are already in, and there is no
// independent entry log to draw from. `isDurable()` reports which mode is
// active so the UI and the owner documentation can be honest about it.
// ---------------------------------------------------------------------------

export type GiveawayEntry = {
  firstName: string
  lastName: string
  email: string
  marketingConsent: boolean
  enteredAt: string
  sourcePage: string
}

const configured =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN)

const redis = configured ? Redis.fromEnv() : null

export function isDurable(): boolean {
  return redis !== null
}

function hashEmail(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

/**
 * Campaign key derived from the entry deadline, so that starting a new
 * giveaway (a new deadline in giveaway.json) automatically starts a fresh
 * entry set rather than inheriting last campaign's entrants.
 */
export function campaignKey(entryDeadline: string): string {
  const slug = entryDeadline.replace(/[^0-9a-z]/gi, '').slice(0, 20) || 'default'
  return slug
}

export async function hasEntered(campaign: string, email: string): Promise<boolean> {
  if (!redis) return false
  try {
    const result = await redis.sismember(
      `wg:giveaway:${campaign}:emails`,
      hashEmail(email)
    )
    return result === 1
  } catch (err) {
    // A dedupe lookup failure must not block a legitimate entry. The worst
    // case is a duplicate row in the log, which the drawing can collapse.
    console.error('[giveaway-store] dedupe check failed:', err)
    return false
  }
}

/**
 * Records the entry. Returns false when the address was already present,
 * which is the authoritative duplicate signal — `SADD` returning 0 means the
 * member existed, so this is race-free in a way a check-then-write is not.
 */
export async function recordEntry(
  campaign: string,
  entry: GiveawayEntry
): Promise<{ recorded: boolean; duplicate: boolean }> {
  if (!redis) return { recorded: false, duplicate: false }

  try {
    const added = await redis.sadd(`wg:giveaway:${campaign}:emails`, hashEmail(entry.email))

    if (added === 0) return { recorded: false, duplicate: true }

    await redis.rpush(`wg:giveaway:${campaign}:entries`, JSON.stringify(entry))
    return { recorded: true, duplicate: false }
  } catch (err) {
    console.error('[giveaway-store] failed to record entry:', err)
    return { recorded: false, duplicate: false }
  }
}

/** Total entries recorded for a campaign. Used by the owner's export script. */
export async function entryCount(campaign: string): Promise<number> {
  if (!redis) return 0
  try {
    return await redis.llen(`wg:giveaway:${campaign}:entries`)
  } catch (err) {
    console.error('[giveaway-store] count failed:', err)
    return 0
  }
}

/** Full entry list, oldest first. Used by the owner's export script. */
export async function listEntries(campaign: string): Promise<GiveawayEntry[]> {
  if (!redis) return []
  try {
    const raw = await redis.lrange<string | GiveawayEntry>(
      `wg:giveaway:${campaign}:entries`,
      0,
      -1
    )
    return raw
      .map((item) => {
        if (typeof item !== 'string') return item as GiveawayEntry
        try {
          return JSON.parse(item) as GiveawayEntry
        } catch {
          return null
        }
      })
      .filter((entry): entry is GiveawayEntry => entry !== null)
  } catch (err) {
    console.error('[giveaway-store] list failed:', err)
    return []
  }
}

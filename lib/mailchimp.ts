import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// mailchimp — the ONE server-side Mailchimp client.
//
// ── WHY THERE IS ONLY ONE ──────────────────────────────────────────────────
//
// There were two: this module, and a second implementation inlined in the
// Stripe webhook. They had drifted apart in the two ways that matter most.
// One returned a result and let the caller continue; the other threw, which
// meant a Mailchimp outage returned 500 from the webhook, Stripe retried, and
// a marketing outage became a fulfilment problem. And one enrolled new
// contacts as `pending` (double opt-in) while the other enrolled them as
// `subscribed` (no confirmation at all).
//
// Both behaviours are still reachable, because both are legitimate for the
// caller that used them — but they are now explicit parameters on one client
// rather than two implementations that happen to differ.
//
// Required env vars:
//   MAILCHIMP_API_KEY      -- format <key>-<datacenter>, e.g. abc123-us21
//   MAILCHIMP_AUDIENCE_ID  -- Mailchimp -> Audience -> Settings
//   MAILCHIMP_DC           -- OPTIONAL. Derived from the API key suffix when
//                             not set.
//
// ── ONE AUDIENCE ───────────────────────────────────────────────────────────
//
// Every caller writes to MAILCHIMP_AUDIENCE_ID and segments with tags. There
// is deliberately no per-product audience id: a second audience would split
// one person into two contacts the moment they bought a second thing, and
// nothing in Mailchimp would tell you it had happened.
// ---------------------------------------------------------------------------

export type MailchimpResult =
  | { ok: true; skipped: boolean }
  | { ok: false; status: number; message: string }

/**
 * Status applied to a contact that does not exist yet.
 *
 * `pending` triggers Mailchimp's double opt-in: the contact receives a
 * confirmation email and is not marketable until they click it. This is the
 * default, and it is the only correct value for marketing enrolment.
 *
 * `subscribed` skips confirmation. It exists because the PMP purchase path
 * has always used it, and quietly switching those buyers to `pending` would
 * stop their mail until they re-confirmed — a regression, not a fix. New
 * callers should not use it.
 *
 * Neither value can change an EXISTING contact's status: Mailchimp rejects a
 * forced `status` on a member already in a compliance state, which is why
 * this is `status_if_new` and not `status`.
 */
export type StatusIfNew = 'pending' | 'subscribed'

/**
 * Mailchimp's ADDRESS merge field expects this exact shape. When the audience
 * has an ADDRESS field — even unmarked as required — Mailchimp validates any
 * update to mean the address must be complete: addr1, city, state, zip and
 * country all non-empty. Partial addresses are rejected with HTTP 400.
 *
 * NOT part of the LIAP marketing profile. A postal address is not needed to
 * segment a book launch, and `assertNoAddress` below keeps it out of that path.
 */
export type MailchimpAddress = {
  addr1: string
  addr2: string
  city: string
  state: string
  zip: string
  country: string
}

/** Mailchimp tags must be stable and lowercase to segment reliably. */
export function normalizeTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function resolveDataCenter(apiKey: string): string | null {
  // Explicit override wins; otherwise take the suffix of the API key, which is
  // how Mailchimp encodes the datacenter (…-us21).
  const explicit = process.env.MAILCHIMP_DC
  if (explicit) return explicit
  const suffix = apiKey.split('-')[1]
  return suffix || null
}

interface Endpoint {
  memberUrl: string
  headers: Record<string, string>
}

function endpointFor(email: string): Endpoint | null {
  const apiKey = process.env.MAILCHIMP_API_KEY
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID
  if (!apiKey || !audienceId) return null

  const dc = resolveDataCenter(apiKey)
  if (!dc) return null

  const subscriberHash = createHash('md5').update(email).digest('hex')
  return {
    memberUrl: `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`,
    headers: {
      Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  }
}

export interface UpsertSubscriberInput {
  email: string
  firstName?: string
  lastName?: string
  tags: string[]
  /** Defaults to `pending`, i.e. double opt-in. */
  statusIfNew?: StatusIfNew
  /**
   * Postal address, for the PMP purchase path only. LIAP marketing
   * synchronisation must never set this — see `lib/liap/crm.ts`.
   */
  address?: MailchimpAddress | null
}

/**
 * Creates or updates a Mailchimp contact and applies tags.
 *
 * NEVER THROWS. Every failure comes back as `{ok: false}` so a caller in a
 * payment or fulfilment path can record it and carry on. A marketing system
 * being down is not a reason for somebody's purchase to fail.
 */
export async function upsertSubscriber(input: UpsertSubscriberInput): Promise<MailchimpResult> {
  const email = input.email.trim().toLowerCase()
  const endpoint = endpointFor(email)

  if (!endpoint) {
    if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_AUDIENCE_ID) {
      console.warn('[mailchimp] env vars not set — contact not delivered')
      return { ok: true, skipped: true }
    }
    console.error('[mailchimp] could not resolve datacenter from MAILCHIMP_API_KEY')
    return { ok: false, status: 500, message: 'Mailchimp is misconfigured.' }
  }

  const mergeFields: Record<string, string | MailchimpAddress> = {
    FNAME: input.firstName?.trim() || '',
    LNAME: input.lastName?.trim() || '',
  }
  // Only ever sent when a complete address is supplied. Mailchimp rejects a
  // partial ADDRESS even when the field is optional in audience settings.
  if (input.address) {
    mergeFields.ADDRESS = input.address
  }

  try {
    const memberResponse = await fetch(endpoint.memberUrl, {
      method: 'PUT',
      headers: endpoint.headers,
      body: JSON.stringify({
        email_address: email,
        status_if_new: input.statusIfNew ?? 'pending',
        merge_fields: mergeFields,
      }),
    })

    if (!memberResponse.ok) {
      // Mailchimp echoes the submitted email back in error bodies, so log only
      // structural information to keep PII out of Vercel function logs.
      const data = (await memberResponse.json().catch(() => null)) as { title?: string } | null
      console.error('[mailchimp] member upsert failed:', {
        status: memberResponse.status,
        title: typeof data?.title === 'string' ? data.title : null,
      })
      return {
        ok: false,
        status: 502,
        message: 'Could not save your details. Please try again.',
      }
    }

    const tags = Array.from(new Set(input.tags.map(normalizeTag).filter(Boolean)))
    if (tags.length > 0) {
      const tagResponse = await fetch(`${endpoint.memberUrl}/tags`, {
        method: 'POST',
        headers: endpoint.headers,
        body: JSON.stringify({ tags: tags.map((name) => ({ name, status: 'active' })) }),
      })

      if (!tagResponse.ok) {
        // The contact was saved; only segmentation failed. Reported rather
        // than thrown — losing a tag is better than losing the lead, and the
        // caller decides whether the tag is worth recording for retry.
        console.error('[mailchimp] tag sync failed:', tagResponse.status)
        return { ok: false, status: 502, message: 'Could not apply segmentation tags.' }
      }
    }

    return { ok: true, skipped: false }
  } catch (err) {
    console.error('[mailchimp] unexpected error:', err)
    return { ok: false, status: 500, message: 'Could not save your details. Please try again.' }
  }
}

/**
 * Deactivates tags on an existing contact.
 *
 * Used when a Study Access subscription is cancelled: the customer stays on
 * the list, but the tags that drive the drip stop applying. A 404 here is
 * ordinary — the contact may have been deleted in Mailchimp — so this reports
 * rather than throws, exactly like the upsert.
 */
export async function deactivateTags(input: {
  email: string
  tags: string[]
}): Promise<MailchimpResult> {
  const email = input.email.trim().toLowerCase()
  const endpoint = endpointFor(email)
  if (!endpoint) {
    console.warn('[mailchimp] env vars not set — tags not deactivated')
    return { ok: true, skipped: true }
  }

  const tags = Array.from(new Set(input.tags.map(normalizeTag).filter(Boolean)))
  if (tags.length === 0) return { ok: true, skipped: true }

  try {
    const response = await fetch(`${endpoint.memberUrl}/tags`, {
      method: 'POST',
      headers: endpoint.headers,
      body: JSON.stringify({ tags: tags.map((name) => ({ name, status: 'inactive' })) }),
    })
    if (!response.ok) {
      console.warn('[mailchimp] tag deactivation soft-failed:', response.status)
      return { ok: false, status: 502, message: 'Could not deactivate tags.' }
    }
    return { ok: true, skipped: false }
  } catch (err) {
    console.error('[mailchimp] unexpected error deactivating tags:', err)
    return { ok: false, status: 500, message: 'Could not deactivate tags.' }
  }
}

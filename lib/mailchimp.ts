import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// mailchimp — shared subscriber upsert used by the AI Guide's lead capture.
//
// Required env vars:
//   MAILCHIMP_API_KEY      -- format <key>-<datacenter>, e.g. abc123-us21
//   MAILCHIMP_AUDIENCE_ID  -- Mailchimp -> Audience -> Settings
//   MAILCHIMP_DC           -- OPTIONAL. Derived from the API key suffix when
//                             not set, which is why this helper works even
//                             though MAILCHIMP_DC is absent from .env.example.
// ---------------------------------------------------------------------------

export type MailchimpResult =
  | { ok: true; skipped: boolean }
  | { ok: false; status: number; message: string }

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

/**
 * Creates or updates a Mailchimp subscriber and applies tags.
 *
 * Uses `status_if_new` rather than forcing `status`, because forcing a status
 * on an existing member returns HTTP 400 "Member In Compliance State".
 * New subscribers are set to `pending` so Mailchimp sends its own
 * double-opt-in confirmation — this keeps consent defensible.
 */
export async function upsertSubscriber(input: {
  email: string
  firstName?: string
  lastName?: string
  tags: string[]
}): Promise<MailchimpResult> {
  const apiKey = process.env.MAILCHIMP_API_KEY
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID

  if (!apiKey || !audienceId) {
    console.warn('[mailchimp] env vars not set — lead not delivered')
    return { ok: true, skipped: true }
  }

  const dc = resolveDataCenter(apiKey)
  if (!dc) {
    console.error('[mailchimp] could not resolve datacenter from MAILCHIMP_API_KEY')
    return { ok: false, status: 500, message: 'Mailchimp is misconfigured.' }
  }

  const email = input.email.trim().toLowerCase()
  const subscriberHash = createHash('md5').update(email).digest('hex')
  const memberUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`
  const headers = {
    Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
    'Content-Type': 'application/json',
  }

  try {
    const memberResponse = await fetch(memberUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        email_address: email,
        status_if_new: 'pending',
        merge_fields: {
          FNAME: input.firstName?.trim() || '',
          LNAME: input.lastName?.trim() || '',
        },
      }),
    })

    if (!memberResponse.ok) {
      // Mailchimp echoes the submitted email back in error bodies, so log only
      // structural information to keep PII out of Vercel function logs.
      const data = (await memberResponse.json().catch(() => null)) as
        | { title?: string }
        | null
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
      const tagResponse = await fetch(`${memberUrl}/tags`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tags: tags.map((name) => ({ name, status: 'active' })),
        }),
      })

      if (!tagResponse.ok) {
        // The subscriber was saved; only segmentation failed. Log it, but do
        // not fail the request — losing a tag is better than losing the lead.
        console.error('[mailchimp] tag sync failed:', tagResponse.status)
      }
    }

    return { ok: true, skipped: false }
  } catch (err) {
    console.error('[mailchimp] unexpected error:', err)
    return {
      ok: false,
      status: 500,
      message: 'Could not save your details. Please try again.',
    }
  }
}

import type Stripe from 'stripe'
import { getDb, queryOne } from '@/lib/db/client'
import { downloadPageUrl, downloadToken, hashToken, isWellFormedToken } from './link.mjs'
import { kitEmailConfigured, sendKitEmail } from './email.mjs'
import {
  LEGACY_KIT_DOWNLOAD_LIMIT,
  LEGACY_KIT_LINK_HOURS,
  LEGACY_KIT_METADATA_KEY,
} from './product'

// ---------------------------------------------------------------------------
// What a paid Legacy Kit checkout does: record the purchase, issue the
// download link, email it once.
//
// Two doors lead here and either may arrive first: the Stripe webhook and the
// thank-you page the buyer lands on. Both call recordPurchase(), which is
// keyed on the checkout session, so whichever is second changes nothing — in
// particular it does not restart the 72-hour clock.
//
// Only the webhook emails. The thank-you page shows the same link on screen.
// ---------------------------------------------------------------------------

export interface KitPurchase {
  id: string
  email: string
  expiresAt: Date
  downloadsUsed: number
  downloadLimit: number
  revoked: boolean
  emailSent: boolean
}

/** True when a Stripe checkout session is a paid Legacy Kit purchase. */
export function isPaidKitSession(session: Stripe.Checkout.Session): boolean {
  return session.metadata?.product === LEGACY_KIT_METADATA_KEY && session.payment_status === 'paid'
}

export function isKitMetadata(metadata: Stripe.Metadata | null | undefined): boolean {
  return metadata?.product === LEGACY_KIT_METADATA_KEY
}

function buyerEmail(session: Stripe.Checkout.Session): string {
  return (session.customer_details?.email || session.customer_email || '').trim()
}

/**
 * Records a paid kit purchase. Idempotent on the checkout session.
 * Returns the purchase and the link to show or send.
 */
export async function recordPurchase(
  session: Stripe.Checkout.Session
): Promise<{ purchase: KitPurchase; link: string }> {
  if (!isPaidKitSession(session)) throw new Error('Not a paid Legacy Kit checkout session.')
  const email = buyerEmail(session)
  if (!email) throw new Error(`Legacy Kit session ${session.id} has no buyer email.`)

  // Consent travels from the page to here in the session's metadata, written
  // by our own checkout route after it checked both boxes were ticked.
  const consentVersion = session.metadata?.consent_version || 'unrecorded'
  const consentAtRaw = session.metadata?.consent_at
  const consentAt =
    consentAtRaw && !Number.isNaN(Date.parse(consentAtRaw))
      ? new Date(consentAtRaw)
      : new Date(session.created * 1000)
  if (consentVersion === 'unrecorded') {
    console.error(`[legacy-kit] session ${session.id} carries no consent record`)
  }

  const token = downloadToken(session.id)
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null

  await getDb().query(
    `INSERT INTO legacy_kit_purchases
       (checkout_session_id, payment_intent_id, email, consent_version, consent_at,
        download_token_hash, download_limit, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now() + ($8 || ' hours')::interval)
     ON CONFLICT (checkout_session_id) DO UPDATE
       SET payment_intent_id =
             COALESCE(legacy_kit_purchases.payment_intent_id, EXCLUDED.payment_intent_id)`,
    [
      session.id,
      paymentIntentId,
      email,
      consentVersion,
      consentAt.toISOString(),
      hashToken(token),
      LEGACY_KIT_DOWNLOAD_LIMIT,
      String(LEGACY_KIT_LINK_HOURS),
    ]
  )

  const purchase = await purchaseBySession(session.id)
  if (!purchase) throw new Error(`Legacy Kit purchase for ${session.id} was not recorded.`)
  return { purchase, link: downloadPageUrl(token) }
}

interface Row {
  id: string
  email: string
  expires_at: string | Date
  downloads_used: number
  download_limit: number
  revoked_at: string | Date | null
  email_sent_at: string | Date | null
}

function toPurchase(row: Row): KitPurchase {
  return {
    id: row.id,
    email: row.email,
    expiresAt: new Date(row.expires_at),
    downloadsUsed: row.downloads_used,
    downloadLimit: row.download_limit,
    revoked: row.revoked_at !== null,
    emailSent: row.email_sent_at !== null,
  }
}

const COLUMNS = `id, email, expires_at, downloads_used, download_limit, revoked_at, email_sent_at`

export async function purchaseBySession(sessionId: string): Promise<KitPurchase | null> {
  const row = await queryOne<Row>(
    `SELECT ${COLUMNS} FROM legacy_kit_purchases WHERE checkout_session_id = $1`,
    [sessionId]
  )
  return row ? toPurchase(row) : null
}

export async function purchaseByToken(token: string): Promise<KitPurchase | null> {
  if (!isWellFormedToken(token)) return null
  const row = await queryOne<Row>(
    `SELECT ${COLUMNS} FROM legacy_kit_purchases WHERE download_token_hash = $1`,
    [hashToken(token)]
  )
  return row ? toPurchase(row) : null
}

export type LinkState = 'ok' | 'not-found' | 'revoked' | 'expired' | 'used-up'

export function linkState(purchase: KitPurchase | null, now = new Date()): LinkState {
  if (!purchase) return 'not-found'
  if (purchase.revoked) return 'revoked'
  if (purchase.expiresAt.getTime() <= now.getTime()) return 'expired'
  if (purchase.downloadsUsed >= purchase.downloadLimit) return 'used-up'
  return 'ok'
}

/**
 * Uses one download, atomically. The conditions are checked by Postgres in
 * the same statement as the increment, so two clicks at once cannot both get
 * the fifth download.
 */
export async function consumeDownload(
  token: string
): Promise<{ ok: true; remaining: number } | { ok: false; state: LinkState }> {
  if (!isWellFormedToken(token)) return { ok: false, state: 'not-found' }
  const rows = await getDb().query<{ downloads_used: number; download_limit: number }>(
    `UPDATE legacy_kit_purchases
        SET downloads_used = downloads_used + 1
      WHERE download_token_hash = $1
        AND revoked_at IS NULL
        AND expires_at > now()
        AND downloads_used < download_limit
      RETURNING downloads_used, download_limit`,
    [hashToken(token)]
  )
  if (rows[0]) return { ok: true, remaining: rows[0].download_limit - rows[0].downloads_used }
  return { ok: false, state: linkState(await purchaseByToken(token)) }
}

/**
 * Emails the link, once per purchase.
 *
 * The send is claimed before it is attempted, so a replayed webhook cannot
 * email twice; a failed send releases the claim and throws, so Stripe's retry
 * gets another go. When Mailchimp Transactional is not configured (local
 * testing) nothing is sent and nothing is claimed.
 */
export async function emailLinkOnce(sessionId: string, link: string): Promise<'sent' | 'already' | 'not-configured'> {
  if (!kitEmailConfigured()) {
    console.warn('[legacy-kit] Mailchimp Transactional is not configured; delivery email not sent')
    return 'not-configured'
  }
  const claimed = await getDb().query<{ email: string }>(
    `UPDATE legacy_kit_purchases SET email_sent_at = now()
      WHERE checkout_session_id = $1 AND email_sent_at IS NULL
      RETURNING email`,
    [sessionId]
  )
  if (!claimed[0]) return 'already'
  try {
    await sendKitEmail({
      to: claimed[0].email,
      link,
      hours: LEGACY_KIT_LINK_HOURS,
      limit: LEGACY_KIT_DOWNLOAD_LIMIT,
    })
    return 'sent'
  } catch (err) {
    await getDb().query(
      `UPDATE legacy_kit_purchases SET email_sent_at = NULL WHERE checkout_session_id = $1`,
      [sessionId]
    )
    throw err
  }
}

/** A refund cancels the link for good. Returns how many purchases it touched. */
export async function revokeForRefund(paymentIntentId: string | null): Promise<number> {
  if (!paymentIntentId) return 0
  const rows = await getDb().query<{ id: string }>(
    `UPDATE legacy_kit_purchases SET revoked_at = now()
      WHERE payment_intent_id = $1 AND revoked_at IS NULL
      RETURNING id`,
    [paymentIntentId]
  )
  return rows.length
}

import { getDb, queryOne } from '@/lib/db/client'
import { recordAuditEvent } from '@/lib/audit'

// ---------------------------------------------------------------------------
// entitlements — the single authority for "may this customer do this?".
//
// Nothing outside this module should ask Stripe, read a cookie's contents, or
// infer access from a payment record. Route guards call hasEntitlement().
//
// The keys are strings rather than an enum on purpose: adding
// LIAP_ASSESSMENT_ACCESS later must not require changing a type union that
// PMP code also depends on.
// ---------------------------------------------------------------------------

/** Access to the $49/month Study Access product (exam simulator + flashcards). */
export const STUDY_ACCESS = 'STUDY_ACCESS'

export type EntitlementSource =
  | 'order'
  | 'subscription'
  | 'sponsorship'
  | 'scholarship'
  | 'cohort'
  | 'admin_grant'
  | 'promotion'
  | 'migration'

export interface Entitlement {
  id: string
  customer_id: string
  entitlement_key: string
  source_type: string
  source_id: string | null
  granted_at: string
  expires_at: string | null
  revoked_at: string | null
}

/**
 * The authorization check. Live means: granted, not revoked, not expired.
 *
 * Expiry is evaluated in the database rather than in JS so a wrong server
 * clock on one lambda cannot hand out access the row does not carry.
 */
export async function hasEntitlement(
  customerId: string,
  entitlementKey: string
): Promise<boolean> {
  const row = await queryOne<{ ok: boolean }>(
    `SELECT true AS ok
       FROM entitlements
      WHERE customer_id = $1
        AND entitlement_key = $2
        AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > now())
      LIMIT 1`,
    [customerId, entitlementKey]
  )
  return row?.ok === true
}

export async function listEntitlements(customerId: string): Promise<Entitlement[]> {
  return getDb().query<Entitlement>(
    `SELECT id, customer_id, entitlement_key, source_type, source_id,
            granted_at, expires_at, revoked_at
       FROM entitlements
      WHERE customer_id = $1
        AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > now())
      ORDER BY granted_at DESC`,
    [customerId]
  )
}

/**
 * Grants an entitlement exactly once.
 *
 * `idempotencyKey` is the whole defence against duplicate Stripe deliveries.
 * Stripe retries on any non-2xx and can deliver the same event more than once
 * even on success, so the caller derives a stable key from the event —
 * typically `${eventId}:${entitlementKey}` — and a repeat INSERT conflicts
 * instead of granting twice.
 *
 * Returns the existing row on a repeat, so callers cannot tell the difference
 * and do not need to.
 */
export async function grantEntitlement(input: {
  customerId: string
  entitlementKey: string
  sourceType: EntitlementSource
  sourceId?: string | null
  expiresAt?: Date | null
  idempotencyKey: string
}): Promise<{ entitlement: Entitlement; created: boolean }> {
  const rows = await getDb().query<Entitlement>(
    `INSERT INTO entitlements
       (customer_id, entitlement_key, source_type, source_id, expires_at, idempotency_key)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING id, customer_id, entitlement_key, source_type, source_id,
               granted_at, expires_at, revoked_at`,
    [
      input.customerId,
      input.entitlementKey,
      input.sourceType,
      input.sourceId ?? null,
      input.expiresAt ?? null,
      input.idempotencyKey,
    ]
  )

  if (rows[0]) {
    await recordAuditEvent({
      eventType: 'entitlement.granted',
      customerId: input.customerId,
      metadata: {
        entitlement_key: input.entitlementKey,
        source_type: input.sourceType,
      },
    })
    return { entitlement: rows[0], created: true }
  }

  // DO NOTHING fired: this exact grant already happened.
  const existing = await queryOne<Entitlement>(
    `SELECT id, customer_id, entitlement_key, source_type, source_id,
            granted_at, expires_at, revoked_at
       FROM entitlements WHERE idempotency_key = $1`,
    [input.idempotencyKey]
  )
  if (!existing) {
    throw new Error('grantEntitlement: conflict reported but no existing row found')
  }
  return { entitlement: existing, created: false }
}

/**
 * Revokes every live grant of a key for a customer.
 *
 * Used on refund and on subscription cancellation. Revocation is a timestamp
 * rather than a delete so the audit trail survives — "why did they lose
 * access?" must remain answerable.
 */
export async function revokeEntitlement(input: {
  customerId: string
  entitlementKey: string
  reason: string
}): Promise<number> {
  const rows = await getDb().query<{ id: string }>(
    `UPDATE entitlements
        SET revoked_at = now()
      WHERE customer_id = $1
        AND entitlement_key = $2
        AND revoked_at IS NULL
      RETURNING id`,
    [input.customerId, input.entitlementKey]
  )

  if (rows.length > 0) {
    await recordAuditEvent({
      eventType: 'entitlement.revoked',
      customerId: input.customerId,
      metadata: { entitlement_key: input.entitlementKey, reason: input.reason },
    })
  }
  return rows.length
}

/** Revokes by the source that granted it — e.g. every grant from one order. */
export async function revokeEntitlementsBySource(input: {
  sourceType: EntitlementSource
  sourceId: string
  reason: string
}): Promise<number> {
  const rows = await getDb().query<{ id: string; customer_id: string; entitlement_key: string }>(
    `UPDATE entitlements
        SET revoked_at = now()
      WHERE source_type = $1 AND source_id = $2 AND revoked_at IS NULL
      RETURNING id, customer_id, entitlement_key`,
    [input.sourceType, input.sourceId]
  )

  for (const row of rows) {
    await recordAuditEvent({
      eventType: 'entitlement.revoked',
      customerId: row.customer_id,
      metadata: { entitlement_key: row.entitlement_key, reason: input.reason },
    })
  }
  return rows.length
}

/**
 * Looks up what a product grants. Data-driven by design: adding
 * LIAP_BOOK_BUNDLE → {assessment, starter kit} is an INSERT, not a deploy,
 * and no route component ever asks "did they buy the book?".
 */
export async function entitlementsForProduct(
  productKey: string
): Promise<{ entitlement_key: string; duration_days: number | null }[]> {
  return getDb().query(
    `SELECT pe.entitlement_key, pe.duration_days
       FROM product_entitlements pe
       JOIN products p ON p.id = pe.product_id
      WHERE p.product_key = $1 AND p.active`,
    [productKey]
  )
}

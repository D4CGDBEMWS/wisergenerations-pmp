import { randomBytes } from 'crypto'
import { getDb, queryOne } from '@/lib/db/client'
import { hashToken } from '@/lib/auth/crypto'
import { grantEntitlement, hasEntitlement } from '@/lib/entitlements'
import { recordAuditEvent } from '@/lib/audit'
import { upsertCustomer } from '@/lib/customers'
import { LIAP_ENTITLEMENT } from './product'

// ---------------------------------------------------------------------------
// Book access codes.
//
// Owner-approved rule, 4 September 2026: one eligible new book = one unique
// access code = one registered reader = two Assessment completions.
//
// ── WHY THE CODE BELONGS TO THE COPY AND NOT THE TRANSACTION ───────────────
//
// The promise printed in the book is "whether you purchased this book or
// received a new copy as a gift, your book registration includes a unique
// access code". A code minted against a Stripe payment cannot keep that
// promise, because the person holding the gift never made a payment. So the
// code is a property of the printed copy: it travels inside the book, and
// whoever first registers it becomes its reader. Paying does not claim it.
//
// That single decision is what makes the gift case work without Wiser
// Generations ever learning who the recipient is at checkout.
//
// ── WHY CROCKFORD BASE32 ───────────────────────────────────────────────────
//
// A reader types this off a card, possibly on a phone, possibly having
// photographed it. The alphabet therefore excludes I, L, O and U — the first
// three because they are indistinguishable from 1 and 0 in most print faces,
// U because excluding it is what keeps a random code from spelling something
// unfortunate on the inside cover of a book about faith and purpose.
//
// Decoding maps the confusions the reader will actually make: a typed I or L
// becomes 1, a typed O becomes 0. Sixteen characters at five bits each is 80
// bits of entropy, which is far past guessable and still short enough to read
// aloud down a phone line to support.
// ---------------------------------------------------------------------------

/** Crockford Base32. 32 symbols, no I, L, O or U. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** Characters in the payload. 16 × 5 bits = 80 bits. */
const CODE_LENGTH = 16

/** Printed and displayed in front of the payload. Never part of the hash. */
const DISPLAY_PREFIX = 'LIAP'

/**
 * A new code, in display form: LIAP-XXXX-XXXX-XXXX-XXXX.
 *
 * Ten bytes of CSPRNG consumed five bits at a time, which divides exactly:
 * every symbol is drawn uniformly and there is no modulo bias to reason
 * about. Rejection sampling would be the alternative and is not needed.
 */
export function generateBookCode(): string {
  const bytes = randomBytes((CODE_LENGTH * 5) / 8)
  let bits = 0
  let acc = 0
  let out = ''

  for (const byte of bytes) {
    acc = (acc << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      out += ALPHABET[(acc >> bits) & 31]
    }
  }

  return formatBookCode(out)
}

/**
 * The canonical form of whatever the reader typed, or null if it cannot be one.
 *
 * Accepts the code with or without the prefix, with any separators, in any
 * case. Returning null rather than throwing keeps the caller's error handling
 * uniform: an unreadable code and an unknown one must be indistinguishable to
 * the person submitting, so both end at the same branch.
 */
export function normalizeBookCode(input: string): string | null {
  if (typeof input !== 'string') return null

  let text = input.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (text.startsWith(DISPLAY_PREFIX)) text = text.slice(DISPLAY_PREFIX.length)

  // The substitutions a reader actually makes, per Crockford.
  text = text.replace(/[IL]/g, '1').replace(/O/g, '0')

  if (text.length !== CODE_LENGTH) return null
  for (const ch of text) {
    if (!ALPHABET.includes(ch)) return null
  }
  return text
}

/** Display form for print and for reading back to a reader. */
export function formatBookCode(payload: string): string {
  const groups = payload.match(/.{1,4}/g) ?? [payload]
  return [DISPLAY_PREFIX, ...groups].join('-')
}

/**
 * The stored form. SHA-256 of the canonical payload, per lib/auth/crypto.
 *
 * A password hash would be the wrong tool: this is 80 bits of uniform
 * randomness, so there is no dictionary for a slow hash to defend against,
 * and the lookup sits on a request a reader is waiting on.
 */
export function hashBookCode(payload: string): string {
  return hashToken(payload)
}

export interface MintedCode {
  id: string
  /** Display form. Returned ONCE, at generation, and never stored. */
  code: string
}

/**
 * Mints codes for a print run.
 *
 * The plaintext is returned to the caller and never written anywhere by this
 * function — not to the row, not to an audit entry, not to a log line. What
 * the operator does with it next (a CSV for the printer) is the one place it
 * legitimately exists outside the book.
 */
export async function mintBookCodes(input: {
  batchKey: string
  count: number
  sourceType?: string
  orderId?: string | null
}): Promise<MintedCode[]> {
  const db = getDb()
  const minted: MintedCode[] = []

  for (let i = 0; i < input.count; i++) {
    const code = generateBookCode()
    const payload = normalizeBookCode(code)!
    const rows = await db.query<{ id: string }>(
      `INSERT INTO book_access_codes (code_hash, batch_key, source_type, order_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code_hash) DO NOTHING
       RETURNING id`,
      [hashBookCode(payload), input.batchKey, input.sourceType ?? 'print_run', input.orderId ?? null]
    )

    // A collision at 80 bits will not happen; if it somehow does, the row is
    // skipped rather than overwriting a code someone already holds.
    if (rows[0]) minted.push({ id: rows[0].id, code })
  }

  await recordAuditEvent({
    eventType: 'liap.book_codes_generated',
    metadata: { batch_key: input.batchKey, count: minted.length },
  })

  return minted
}

export type ClaimOutcome =
  /** The code was valid, unclaimed, and now belongs to this reader. */
  | { status: 'claimed'; codeId: string; customerId: string }
  /**
   * This reader already holds assessment access, so no code was consumed.
   *
   * Deliberately not an error and deliberately not a claim: a reader who
   * already has access and types a code from a second copy should not burn
   * that copy's code to be told something they already had.
   */
  | { status: 'already_entitled'; customerId: string }
  /**
   * Unknown, already claimed, or voided.
   *
   * One outcome for three causes, on purpose. Distinguishing them would turn
   * the endpoint into an oracle: an attacker could confirm which codes exist
   * by reading which failure they got back.
   */
  | { status: 'unavailable' }

/**
 * Claims a code for an email address.
 *
 * ── WHY THIS IS ONE CONDITIONAL UPDATE ─────────────────────────────────────
 *
 * The whole race is decided by the WHERE clause. Two readers submitting the
 * same code at the same moment both run this statement; exactly one finds a
 * row with claimed_by_customer_id still NULL, and the loser updates nothing
 * and is told the code is unavailable. There is no read-then-write window to
 * lose, and no transaction to hold open across a network call.
 *
 * ── WHY CLAIMING IS NOT THE SAME AS ACCESS ─────────────────────────────────
 *
 * The claim binds the code to an email address. Actually using the assessment
 * still requires signing in, which requires receiving a magic link at that
 * address. So a code typed against somebody else's email — maliciously or by
 * typo — yields the typist nothing, and support can release it against an
 * audit row. Binding on submission is what makes the gift case work at all;
 * requiring the inbox afterwards is what keeps it safe.
 */
export async function claimBookCode(input: {
  code: string
  email: string
  name?: string | null
}): Promise<ClaimOutcome> {
  const payload = normalizeBookCode(input.code)
  if (!payload) return { status: 'unavailable' }

  const customer = await upsertCustomer({ email: input.email, name: input.name ?? null })

  if (await hasEntitlement(customer.id, LIAP_ENTITLEMENT)) {
    return { status: 'already_entitled', customerId: customer.id }
  }

  const claimed = await getDb().query<{ id: string }>(
    `UPDATE book_access_codes
        SET claimed_by_customer_id = $1, claimed_at = now()
      WHERE code_hash = $2
        AND claimed_by_customer_id IS NULL
        AND voided_at IS NULL
      RETURNING id`,
    [customer.id, hashBookCode(payload)]
  )

  const codeId = claimed[0]?.id
  if (!codeId) {
    await recordAuditEvent({
      eventType: 'liap.book_code_claim_refused',
      customerId: customer.id,
      metadata: { reason: 'unavailable' },
    })
    return { status: 'unavailable' }
  }

  // Keyed on the code row, so a retried request cannot produce two grants —
  // and so the entitlement records which code opened it, which is what a
  // support question about a disputed claim actually needs.
  await grantEntitlement({
    customerId: customer.id,
    entitlementKey: LIAP_ENTITLEMENT,
    sourceType: 'book_code',
    sourceId: codeId,
    idempotencyKey: `book_code:${codeId}`,
  })

  await recordAuditEvent({
    eventType: 'liap.book_code_claimed',
    customerId: customer.id,
    metadata: { code_id: codeId, source_type: 'book_code' },
  })

  return { status: 'claimed', codeId, customerId: customer.id }
}

export interface CodeStatus {
  id: string
  batch_key: string
  claimed_by_customer_id: string | null
  claimed_at: string | null
  voided_at: string | null
}

/** Support lookup by code. Never logs or returns the code itself. */
export async function findCodeStatus(code: string): Promise<CodeStatus | null> {
  const payload = normalizeBookCode(code)
  if (!payload) return null
  return queryOne<CodeStatus>(
    `SELECT id, batch_key, claimed_by_customer_id, claimed_at, voided_at
       FROM book_access_codes WHERE code_hash = $1`,
    [hashBookCode(payload)]
  )
}

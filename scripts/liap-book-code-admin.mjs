#!/usr/bin/env node
/**
 * Book access code support controls.
 *
 * The legitimate situations, and nothing beyond them: a card that arrived
 * damaged, a claim made against the wrong address by a verified support
 * error, a batch that must be withdrawn, and an attempt that has to be
 * corrected because something went wrong at our end.
 *
 *   DATABASE_URL=... node scripts/liap-book-code-admin.mjs --status LIAP-XXXX-XXXX-XXXX-XXXX
 *   DATABASE_URL=... node scripts/liap-book-code-admin.mjs --void <code-id> --reason "damaged card"
 *   DATABASE_URL=... node scripts/liap-book-code-admin.mjs --replace <code-id> --reason "damaged card"
 *   DATABASE_URL=... node scripts/liap-book-code-admin.mjs --release <code-id> --reason "claimed to a typo, verified"
 *   DATABASE_URL=... node scripts/liap-book-code-admin.mjs --reset-attempt <assessment-id> --reason "scoring incident"
 *
 * ── WHY THIS IS A COMMAND AND NOT A BUTTON ─────────────────────────────────
 *
 * A claimed entitlement is not ordinarily transferable. Every operation here
 * writes an audit row naming the operator, and none of it is reachable from
 * the website: making transfer a self-service feature would hand the internet
 * exactly the mechanism this whole design exists to prevent — a way to move
 * an assessment off the reader who registered it.
 *
 * --release is the sharpest tool here. It returns a code to the unclaimed
 * pool AND revokes the entitlement it granted, so it must only follow a
 * verified support conversation, never a request in an email.
 */

import { neon } from '@neondatabase/serverless'
import { createHash, randomBytes } from 'crypto'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is required. Find it in Vercel -> Settings -> Environment Variables.')
  process.exit(1)
}

const sql = neon(url)
const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : null
}

const operator = process.env.SUPPORT_OPERATOR ?? process.env.USER ?? 'unknown'
const reason = flag('--reason')

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const CODE_LENGTH = 16
const DISPLAY_PREFIX = 'LIAP'

function normalize(input) {
  let text = String(input).toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (text.startsWith(DISPLAY_PREFIX)) text = text.slice(DISPLAY_PREFIX.length)
  text = text.replace(/[IL]/g, '1').replace(/O/g, '0')
  if (text.length !== CODE_LENGTH) return null
  for (const ch of text) if (!ALPHABET.includes(ch)) return null
  return text
}

function generate() {
  const bytes = randomBytes((CODE_LENGTH * 5) / 8)
  let bits = 0
  let acc = 0
  let payload = ''
  for (const byte of bytes) {
    acc = (acc << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      payload += ALPHABET[(acc >> bits) & 31]
    }
  }
  return { payload, display: [DISPLAY_PREFIX, ...payload.match(/.{1,4}/g)].join('-') }
}

const hash = (payload) => createHash('sha256').update(payload).digest('hex')

const audit = (eventType, customerId, metadata) =>
  sql`INSERT INTO audit_events (event_type, customer_id, actor, metadata)
      VALUES (${eventType}, ${customerId}, ${operator}, ${JSON.stringify(metadata)})`

const requireReason = () => {
  if (!reason) {
    console.error('--reason is required. Every override has to say why it happened.')
    process.exit(1)
  }
}

// ── status ────────────────────────────────────────────────────────────────
const statusCode = flag('--status')
if (statusCode) {
  const payload = normalize(statusCode)
  if (!payload) {
    console.error('That is not a well-formed access code.')
    process.exit(1)
  }
  const rows = await sql`
    SELECT c.id, c.batch_key, c.source_type, c.created_at, c.claimed_at, c.voided_at,
           c.void_reason, cu.email
      FROM book_access_codes c
      LEFT JOIN customers cu ON cu.id = c.claimed_by_customer_id
     WHERE c.code_hash = ${hash(payload)}`
  if (!rows[0]) {
    console.log('\nNo such code.\n')
    process.exit(0)
  }
  const r = rows[0]
  console.log(`\n  id         ${r.id}`)
  console.log(`  batch      ${r.batch_key} (${r.source_type})`)
  console.log(`  created    ${r.created_at}`)
  console.log(`  claimed    ${r.claimed_at ? `${r.claimed_at} by ${r.email}` : 'not claimed'}`)
  console.log(`  voided     ${r.voided_at ? `${r.voided_at} — ${r.void_reason}` : 'no'}\n`)
  process.exit(0)
}

// ── void ──────────────────────────────────────────────────────────────────
const voidId = flag('--void')
if (voidId) {
  requireReason()
  const rows = await sql`
    UPDATE book_access_codes
       SET voided_at = now(), void_reason = ${reason}
     WHERE id = ${voidId} AND voided_at IS NULL
     RETURNING id, claimed_by_customer_id`
  if (!rows[0]) {
    console.error('No such code, or it is already voided.')
    process.exit(1)
  }
  await audit('liap.book_code_voided', rows[0].claimed_by_customer_id, {
    code_id: rows[0].id,
    reason,
  })
  console.log(`\nVoided ${rows[0].id}. It can never be claimed.\n`)
  process.exit(0)
}

// ── replace ───────────────────────────────────────────────────────────────
const replaceId = flag('--replace')
if (replaceId) {
  requireReason()
  const original = await sql`
    SELECT id, batch_key, claimed_by_customer_id FROM book_access_codes WHERE id = ${replaceId}`
  if (!original[0]) {
    console.error('No such code.')
    process.exit(1)
  }
  if (original[0].claimed_by_customer_id) {
    console.error(
      'That code is already claimed. A claimed code is not replaced — the reader already has\n' +
        'their access. Use --release first if the claim itself was the error.'
    )
    process.exit(1)
  }

  const { payload, display } = generate()
  const fresh = await sql`
    INSERT INTO book_access_codes (code_hash, batch_key, source_type)
    VALUES (${hash(payload)}, ${original[0].batch_key}, 'replacement')
    RETURNING id`
  await sql`
    UPDATE book_access_codes
       SET voided_at = now(), void_reason = ${reason}, replaced_by_id = ${fresh[0].id}
     WHERE id = ${replaceId}`
  await audit('liap.book_code_voided', null, { code_id: replaceId, reason })
  await audit('liap.book_codes_generated', null, {
    code_id: fresh[0].id,
    batch_key: original[0].batch_key,
    count: 1,
  })

  console.log(`\nReplacement issued. Give the reader:\n\n    ${display}\n`)
  console.log('This is the only time it will be shown.\n')
  process.exit(0)
}

// ── release ───────────────────────────────────────────────────────────────
const releaseId = flag('--release')
if (releaseId) {
  requireReason()
  // Read the holder before the update: afterwards the column is NULL and the
  // audit row would name nobody.
  const before = await sql`
    SELECT claimed_by_customer_id FROM book_access_codes WHERE id = ${releaseId}`
  const heldBy = before[0]?.claimed_by_customer_id ?? null

  const rows = await sql`
    UPDATE book_access_codes
       SET claimed_by_customer_id = NULL, claimed_at = NULL
     WHERE id = ${releaseId} AND claimed_by_customer_id IS NOT NULL
     RETURNING id`
  if (!rows[0]) {
    console.error('No such code, or it was not claimed.')
    process.exit(1)
  }

  // The entitlement the claim granted goes with it. Leaving it behind would
  // release the code while the wrong reader kept the access, which is the
  // half-finished correction that creates a second support ticket.
  const revoked = await sql`
    UPDATE entitlements
       SET revoked_at = now()
     WHERE source_type = 'book_code' AND source_id = ${releaseId} AND revoked_at IS NULL
     RETURNING customer_id`

  for (const row of revoked) {
    await audit('entitlement.revoked', row.customer_id, {
      entitlement_key: 'LIAP_ASSESSMENT_ACCESS',
      source_type: 'book_code',
      reason,
    })
  }
  await audit('liap.book_code_claim_released', heldBy, { code_id: releaseId, reason })

  console.log(`\nReleased ${releaseId}. The code can be claimed again and the entitlement is revoked.\n`)
  process.exit(0)
}

// ── reset an assessment attempt ───────────────────────────────────────────
const resetId = flag('--reset-attempt')
if (resetId) {
  requireReason()
  // Removes one attempt so the reader can take it again.
  //
  // A DELETE rather than a status flag, and the reason is the constraint that
  // makes the whole rule work: attempt_number is unique per customer, so while
  // the row exists its number is occupied and no replacement can be issued.
  // Flagging it would leave the reader exactly as stuck as before, having been
  // told they were helped.
  //
  // Only ever for an attempt that is worthless — a scoring incident, a
  // duplicate opened by a fault at our end. The audit row is what survives.
  const found = await sql`
    SELECT id, customer_id, attempt_number, status FROM assessments WHERE id = ${resetId}`
  if (!found[0]) {
    console.error('No such assessment.')
    process.exit(1)
  }
  await audit('liap.assessment_attempt_refused', found[0].customer_id, {
    attempt_number: found[0].attempt_number,
    reason,
  })
  await sql`DELETE FROM assessments WHERE id = ${resetId}`
  console.log(
    `\nAttempt ${found[0].attempt_number} removed for customer ${found[0].customer_id}.\n` +
      'They can now take that attempt again. The audit row records why.\n'
  )
  process.exit(0)
}

console.error(
  'Nothing to do. One of:\n' +
    '  --status <code>            look a code up\n' +
    '  --void <code-id>           make a code permanently unclaimable\n' +
    '  --replace <code-id>        void an unclaimed code and issue a fresh one\n' +
    '  --release <code-id>        undo a claim and revoke its entitlement\n' +
    '  --reset-attempt <id>       void one bad assessment record\n' +
    'All except --status require --reason.'
)
process.exit(1)

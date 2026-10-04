#!/usr/bin/env node
/**
 * Re-send a Legacy Kit buyer's download link.
 *
 *   npm run kit:resend -- --email buyer@example.com
 *   npm run kit:resend -- --session cs_test_123
 *   add --print to show the link without emailing it
 *
 * Gives the buyer a fresh window: the link works for another 72 hours and the
 * download count goes back to zero. The link itself is the same one they were
 * sent before. A refunded purchase is refused.
 *
 * Needs DATABASE_URL and LEGACY_KIT_LINK_SECRET; to email, also
 * MAILCHIMP_TRANSACTIONAL_API_KEY and LEGACY_KIT_FROM_EMAIL. Find them in
 * Vercel → Project Settings → Environment Variables.
 */

import { neon } from '@neondatabase/serverless'
import { downloadPageUrl, downloadToken, hashToken } from '../lib/legacy-kit/link.mjs'
import { kitEmailConfigured, sendKitEmail } from '../lib/legacy-kit/email.mjs'

const HOURS = 72
const LIMIT = 5

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? null : args[i + 1] ?? null
}
const email = flag('--email')
const session = flag('--session')
const printOnly = args.includes('--print')

if (!email && !session) {
  console.error('Give --email <address> or --session <cs_...>.')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const rows = session
  ? await sql.query(`SELECT * FROM legacy_kit_purchases WHERE checkout_session_id = $1`, [session])
  : await sql.query(
      `SELECT * FROM legacy_kit_purchases WHERE lower(email) = lower($1) ORDER BY purchased_at DESC`,
      [email]
    )

if (rows.length === 0) {
  console.error('No Legacy Kit purchase found.')
  process.exit(1)
}
if (rows.length > 1) {
  console.log(`${rows.length} purchases for that email; using the most recent. Use --session to pick another:`)
  for (const r of rows) console.log(`  ${r.checkout_session_id}  ${new Date(r.purchased_at).toISOString()}`)
}

const purchase = rows[0]
if (purchase.revoked_at) {
  console.error('That purchase was refunded; its link stays cancelled.')
  process.exit(1)
}

const token = downloadToken(purchase.checkout_session_id)
if (hashToken(token) !== purchase.download_token_hash) {
  console.error('LEGACY_KIT_LINK_SECRET does not match the one this link was made with.')
  process.exit(1)
}

await sql.query(
  `UPDATE legacy_kit_purchases
      SET expires_at = now() + ($2 || ' hours')::interval, downloads_used = 0
    WHERE id = $1`,
  [purchase.id, String(HOURS)]
)
const link = downloadPageUrl(token)
console.log(`Link renewed for ${HOURS} hours and ${LIMIT} downloads: ${link}`)

if (printOnly) process.exit(0)
if (!kitEmailConfigured()) {
  console.log('Mailchimp Transactional is not configured here, so no email was sent. Send the link above yourself.')
  process.exit(0)
}
await sendKitEmail({ to: purchase.email, link, hours: HOURS, limit: LIMIT })
console.log(`Emailed to ${purchase.email}.`)

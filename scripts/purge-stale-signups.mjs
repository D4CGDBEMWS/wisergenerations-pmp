#!/usr/bin/env node
/**
 * Data retention, from the command line.
 *
 * The scheduled job at /api/cron/purge-signups is what actually keeps the
 * promise in section 5 of the privacy policy. This exists so a person can look
 * at the list first, and so the same question can be answered on demand
 * without waiting for 4am.
 *
 *   DATABASE_URL=postgres://... node scripts/purge-stale-signups.mjs
 *   DATABASE_URL=postgres://... node scripts/purge-stale-signups.mjs --apply
 *
 * Dry run by default. Deleting customer records is not something to do by
 * forgetting a flag.
 */

import { neon } from '@neondatabase/serverless'

const RETENTION_DAYS = 180
const apply = process.argv.includes('--apply')

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is required.')
  console.error('Find it in Vercel -> Project Settings -> Environment Variables.')
  process.exit(1)
}

const sql = neon(url)

// Kept in step with lib/retention.ts. Every clause excludes someone the plain
// reading of "never purchased" would otherwise sweep up — a comped grant, an
// employer-funded cohort seat, or the guardian who paid for someone else.
const IN_SCOPE = `
  FROM customers c
 WHERE c.created_at < now() - ($1 || ' days')::interval
   AND NOT EXISTS (SELECT 1 FROM orders o              WHERE o.customer_id       = c.id)
   AND NOT EXISTS (SELECT 1 FROM entitlements e        WHERE e.customer_id       = c.id)
   AND NOT EXISTS (SELECT 1 FROM program_enrollments p WHERE p.customer_id       = c.id)
   AND NOT EXISTS (SELECT 1 FROM program_enrollments p WHERE p.payer_customer_id = c.id)
`

const candidates = await sql.query(
  `SELECT c.email, c.created_at, EXTRACT(DAY FROM now() - c.created_at)::int AS age_days
     ${IN_SCOPE} ORDER BY c.created_at`,
  [String(RETENTION_DAYS)]
)

console.log(`\nRetention: ${RETENTION_DAYS} days for signups who never purchased.`)
console.log(`Found ${candidates.length} record(s) past that.\n`)

for (const row of candidates) {
  console.log(`  ${String(row.age_days).padStart(5)}d   ${row.email}`)
}

if (candidates.length === 0) {
  console.log('  (none)\n')
  process.exit(0)
}

if (!apply) {
  console.log('\nDry run. Nothing was deleted. Re-run with --apply to delete these.\n')
  process.exit(0)
}

const deleted = await sql.query(
  `DELETE FROM customers WHERE id IN (SELECT c.id ${IN_SCOPE}) RETURNING email`,
  [String(RETENTION_DAYS)]
)
await sql.query(`DELETE FROM login_tokens WHERE lower(email) = ANY($1::text[])`, [
  deleted.map((r) => r.email.toLowerCase()),
])
// A count, never the addresses.
await sql.query(
  `INSERT INTO audit_events (event_type, metadata)
   VALUES ('retention.purged', $1::jsonb)`,
  [JSON.stringify({ reason: 'signup_retention_expired', count: deleted.length })]
)

console.log(`\nDeleted ${deleted.length} record(s).\n`)

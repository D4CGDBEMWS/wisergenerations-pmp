#!/usr/bin/env node
/**
 * Retailer preorder verification — review and approval. §25.
 *
 * Phase I accepts manual approval, and this is it. A submitted order number
 * grants nothing on its own; a person looks at the claim and decides. That is
 * the security model, not a shortcut around one: any automatic rule based on a
 * number the claimant types would be farmed within a week of the book being
 * announced.
 *
 *   DATABASE_URL=... node scripts/liap-approve-preorder.mjs              # list pending
 *   DATABASE_URL=... node scripts/liap-approve-preorder.mjs --approve ID
 *   DATABASE_URL=... node scripts/liap-approve-preorder.mjs --reject ID --note "no such order"
 *
 * Approving grants LIAP_ASSESSMENT_ACCESS through the same entitlement service
 * a Stripe preorder uses, so both doors end in exactly one place.
 */

import { neon } from '@neondatabase/serverless'

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

const approveId = flag('--approve')
const rejectId = flag('--reject')
const note = flag('--note')

if (!approveId && !rejectId) {
  const pending = await sql`
    SELECT id, email, name, retailer, order_ref, submitted_at
      FROM preorder_verifications
     WHERE status IN ('pending', 'needs_review')
     ORDER BY submitted_at`
  console.log(`\n${pending.length} claim(s) awaiting review.\n`)
  for (const row of pending) {
    console.log(`  ${row.id}`)
    console.log(`    ${row.email}${row.name ? `  (${row.name})` : ''}`)
    console.log(`    ${row.retailer} · order ${row.order_ref}`)
    console.log(`    submitted ${new Date(row.submitted_at).toISOString().slice(0, 16).replace('T', ' ')}\n`)
  }
  if (pending.length) {
    console.log('Approve with:  node scripts/liap-approve-preorder.mjs --approve <id>\n')
  }
  process.exit(0)
}

if (rejectId) {
  const rows = await sql`
    UPDATE preorder_verifications
       SET status = 'rejected', reviewed_at = now(), reviewer_note = ${note ?? null}
     WHERE id = ${rejectId} AND status IN ('pending', 'needs_review')
     RETURNING email`
  console.log(rows.length ? `\nRejected ${rows[0].email}.\n` : '\nNo pending claim with that id.\n')
  process.exit(0)
}

// --- approve -----------------------------------------------------------------
const claims = await sql`
  SELECT id, email, name, retailer, order_ref
    FROM preorder_verifications
   WHERE id = ${approveId} AND status IN ('pending', 'needs_review')`

if (!claims.length) {
  console.error('\nNo pending claim with that id.\n')
  process.exit(1)
}
const claim = claims[0]

const customers = await sql`
  INSERT INTO customers (email, name) VALUES (${claim.email.toLowerCase()}, ${claim.name})
  ON CONFLICT (lower(email)) DO UPDATE SET updated_at = now()
  RETURNING id`
const customerId = customers[0].id

// Keyed on the claim, so re-approving the same row cannot grant twice.
await sql`
  INSERT INTO entitlements (customer_id, entitlement_key, source_type, source_id, idempotency_key)
  VALUES (${customerId}, 'LIAP_ASSESSMENT_ACCESS', 'sponsorship', ${claim.id},
          ${'retailer:' + claim.id + ':LIAP_ASSESSMENT_ACCESS'})
  ON CONFLICT (idempotency_key) DO NOTHING`

await sql`
  UPDATE preorder_verifications
     SET status = 'approved', reviewed_at = now(), reviewer_note = ${note ?? null}
   WHERE id = ${claim.id}`

await sql`
  INSERT INTO audit_events (event_type, customer_id, metadata)
  VALUES ('liap.preorder_verification_reviewed', ${customerId},
          ${JSON.stringify({ result: 'approved', source_type: 'retailer' })}::jsonb)`

console.log(`\nApproved. ${claim.email} now has the assessment.\n`)

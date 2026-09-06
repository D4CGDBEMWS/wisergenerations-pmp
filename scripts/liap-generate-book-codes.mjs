#!/usr/bin/env node
/**
 * Book access code generation, for a print run.
 *
 * Owner-approved rule, 4 September 2026: one eligible new book = one unique
 * access code = one registered reader = two Assessment completions.
 *
 *   DATABASE_URL=... node scripts/liap-generate-book-codes.mjs --batch first-print --count 2000
 *   DATABASE_URL=... node scripts/liap-generate-book-codes.mjs --batch first-print --count 2000 --out codes.csv
 *
 * ── THE ONE THING TO UNDERSTAND BEFORE RUNNING THIS ────────────────────────
 *
 * The usable codes exist ONLY in this command's output. The database stores
 * their SHA-256 hashes and nothing else, which is what stops a database read
 * from becoming a stack of free assessments — and it also means a lost output
 * file cannot be recovered. Write it to a file with --out, hand that file to
 * the printer, and delete it once the cards are printed.
 *
 * Codes are not echoed to the terminal unless you ask for it, so that a
 * routine run cannot leave several thousand live codes sitting in a shell
 * scrollback buffer or a CI log.
 */

import { neon } from '@neondatabase/serverless'
import { randomBytes, createHash } from 'crypto'
import { writeFileSync } from 'fs'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is required. Find it in Vercel -> Settings -> Environment Variables.')
  process.exit(1)
}

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : null
}

const batch = flag('--batch')
const count = Number(flag('--count') ?? '0')
const out = flag('--out')
const echo = args.includes('--print-to-terminal')

if (!batch || !Number.isInteger(count) || count < 1 || count > 100_000) {
  console.error(
    'Usage: liap-generate-book-codes.mjs --batch <key> --count <1-100000> --out codes.csv\n' +
      '       Add --print-to-terminal instead of --out only if you accept live codes in your scrollback.'
  )
  process.exit(1)
}

// Refused before anything is minted. Without a destination the codes would be
// created in the database and their plaintext discarded at exit — several
// thousand rows that can never be printed, claimed or recovered.
if (!out && !echo) {
  console.error(
    'Refusing to mint codes with nowhere to put them.\n' +
      'Pass --out <file> (recommended) or --print-to-terminal. The plaintext exists only in\n' +
      'this command\'s output; the database keeps hashes and cannot give it back.'
  )
  process.exit(1)
}

// Mirrors lib/liap/book-codes.ts exactly. Duplicated rather than imported
// because this is a plain node script and that module is TypeScript compiled
// for the app; a test asserts the two agree, so a change to one that is not
// made to the other fails the suite rather than silently minting codes the
// site cannot read.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const CODE_LENGTH = 16
const DISPLAY_PREFIX = 'LIAP'

function generateBookCode() {
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
  const display = [DISPLAY_PREFIX, ...payload.match(/.{1,4}/g)].join('-')
  return { payload, display }
}

const hash = (payload) => createHash('sha256').update(payload).digest('hex')

const sql = neon(url)
const rows = []

for (let i = 0; i < count; i++) {
  const { payload, display } = generateBookCode()
  const inserted = await sql`
    INSERT INTO book_access_codes (code_hash, batch_key, source_type)
    VALUES (${hash(payload)}, ${batch}, 'print_run')
    ON CONFLICT (code_hash) DO NOTHING
    RETURNING id`
  if (inserted[0]) rows.push({ id: inserted[0].id, code: display })
}

await sql`
  INSERT INTO audit_events (event_type, metadata)
  VALUES ('liap.book_codes_generated', ${JSON.stringify({ batch_key: batch, count: rows.length })})`

if (out) {
  writeFileSync(out, 'code_id,code\n' + rows.map((r) => `${r.id},${r.code}`).join('\n') + '\n', {
    mode: 0o600,
  })
  console.log(`\n${rows.length} code(s) written to ${out} (mode 600).`)
  console.log('Hand this file to the printer, then delete it. It cannot be regenerated.\n')
} else {
  console.log()
  for (const r of rows) console.log(r.code)
  console.log(`\n${rows.length} code(s) in batch "${batch}". They are not recoverable once lost.\n`)
}

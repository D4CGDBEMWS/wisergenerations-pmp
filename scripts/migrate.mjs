#!/usr/bin/env node
/**
 * Migration runner.
 *
 * Applies every .sql file in db/migrations in filename order, once, tracking
 * what has run in a _migrations table. Deliberately tiny — a dependency-free
 * runner is easier to reason about than a framework, and Phase 0.5 is
 * additive-only so there is no down-migration machinery to get wrong.
 *
 *   DATABASE_URL=postgres://... node scripts/migrate.mjs
 *   DATABASE_URL=postgres://... node scripts/migrate.mjs --dry-run
 *
 * Rollback: these migrations only CREATE ... IF NOT EXISTS. Nothing is dropped
 * or altered, so rolling back the application code leaves the schema in place
 * and harmless. See docs/PHASE-0.5-FOUNDATION.md.
 */

import { readdirSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { neon } from '@neondatabase/serverless'

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations')
const dryRun = process.argv.includes('--dry-run')

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is required.')
  console.error('Find it in Vercel -> Project Settings -> Environment Variables.')
  process.exit(1)
}

const sql = neon(url)
const files = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort()

await sql.query(`
  CREATE TABLE IF NOT EXISTS _migrations (
    name       text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`)

const applied = new Set(
  (await sql.query('SELECT name FROM _migrations')).map((r) => r.name)
)

let ran = 0
for (const file of files) {
  if (applied.has(file)) {
    console.log(`  skip    ${file} (already applied)`)
    continue
  }
  if (dryRun) {
    console.log(`  WOULD APPLY  ${file}`)
    ran++
    continue
  }

  const body = readFileSync(join(DIR, file), 'utf8')
  process.stdout.write(`  apply   ${file} ... `)
  try {
    // The Neon HTTP driver sends one statement per call, so the file is split
    // on semicolons at line ends. Adequate for DDL; this runner is not
    // intended for statements containing literal semicolons in strings.
    for (const stmt of body.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean)) {
      await sql.query(stmt)
    }
    await sql.query('INSERT INTO _migrations (name) VALUES ($1)', [file])
    console.log('ok')
    ran++
  } catch (err) {
    console.log('FAILED')
    console.error(`\n  ${file} failed: ${err.message}\n`)
    console.error('  No further migrations were attempted. The database is unchanged')
    console.error('  beyond any statements that had already succeeded in this file.')
    process.exit(1)
  }
}

console.log(`\n${dryRun ? 'Dry run: ' : ''}${ran} migration(s) ${dryRun ? 'pending' : 'applied'}, ${files.length} total.`)

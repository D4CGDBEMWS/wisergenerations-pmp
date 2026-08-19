import { PGlite } from '@electric-sql/pglite'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Db } from '@/lib/db/client'

// ---------------------------------------------------------------------------
// Test database.
//
// PGlite is real PostgreSQL compiled to WASM, running in-process. That matters
// here: the authorization guarantees this suite proves depend on genuine
// Postgres behaviour — ON CONFLICT, partial indexes, `expires_at > now()`
// evaluated server-side — none of which a hand-rolled fake would reproduce.
// A mock could pass while production fails.
// ---------------------------------------------------------------------------

const MIGRATIONS = join(process.cwd(), 'db', 'migrations')

export async function createTestDb(): Promise<{ db: Db; close: () => Promise<void> }> {
  const pg = new PGlite()

  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    await pg.exec(readFileSync(join(MIGRATIONS, file), 'utf8'))
  }

  const db: Db = {
    async query<T>(text: string, params: unknown[] = []): Promise<T[]> {
      const res = await pg.query(text, params as never[])
      return res.rows as T[]
    },
  }

  return { db, close: () => pg.close() }
}

/** Convenience: a customer with a live STUDY_ACCESS entitlement. */
export async function seedEntitledCustomer(
  db: Db,
  email = 'paying.customer@example.com'
): Promise<string> {
  const rows = await db.query<{ id: string }>(
    `INSERT INTO customers (email) VALUES ($1) RETURNING id`,
    [email]
  )
  const customerId = rows[0]!.id
  await db.query(
    `INSERT INTO entitlements (customer_id, entitlement_key, source_type, idempotency_key)
     VALUES ($1, 'STUDY_ACCESS', 'migration', $2)`,
    [customerId, `seed:${customerId}`]
  )
  return customerId
}

export async function seedCustomer(db: Db, email: string): Promise<string> {
  const rows = await db.query<{ id: string }>(
    `INSERT INTO customers (email) VALUES ($1) RETURNING id`,
    [email]
  )
  return rows[0]!.id
}

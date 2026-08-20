import { neon } from '@neondatabase/serverless'

// ---------------------------------------------------------------------------
// db/client — one narrow interface over Postgres.
//
// Production uses Neon's HTTP driver rather than a TCP pool. On Vercel every
// request may be a fresh lambda, and a TCP pool per lambda exhausts Postgres
// connections long before it exhausts traffic. The HTTP driver has no pool to
// exhaust.
//
// Tests inject PGlite — real PostgreSQL compiled to WASM — through the same
// interface, so authorization tests run against genuine Postgres semantics
// (constraints, ON CONFLICT, partial indexes) with no server to provision.
//
// Every query here is parameterised. There is no string interpolation of user
// input anywhere in this file or its callers.
// ---------------------------------------------------------------------------

export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>
}

let injected: Db | null = null
let cached: Db | null = null

/** Test seam. Pass null to restore the real client. */
export function setDbForTesting(db: Db | null): void {
  injected = db
  cached = null
}

export function getDb(): Db {
  if (injected) return injected
  if (cached) return cached

  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Authorization requires the database; ' +
        'it deliberately does not fall back to a weaker check.'
    )
  }

  const sql = neon(url)
  cached = {
    async query<T>(text: string, params: unknown[] = []): Promise<T[]> {
      const rows = await sql.query(text, params)
      return rows as T[]
    },
  }
  return cached
}

/** True when a database is configured. Used by health checks, never by auth. */
export function isDbConfigured(): boolean {
  return Boolean(injected || process.env.DATABASE_URL)
}

/** Convenience for single-row reads. */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await getDb().query<T>(text, params)
  return rows[0] ?? null
}

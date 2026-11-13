import { PGlite } from '@electric-sql/pglite'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// ---------------------------------------------------------------------------
// PGlite — real PostgreSQL compiled to WASM, in-process.
//
// It matters that this is real Postgres and not a mock: every safety rule in
// this schema is a trigger written in plpgsql, and a mock would happily
// "pass" tests for guards that do not execute. No cloud resource is created
// and no credential is used.
// ---------------------------------------------------------------------------

const MIGRATIONS = join(process.cwd(), 'db', 'migrations')

export interface TestDb {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>
  exec(sql: string): Promise<void>
  close(): Promise<void>
}

export async function createTestDb(): Promise<TestDb> {
  const pg = new PGlite()
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    await pg.exec(readFileSync(join(MIGRATIONS, file), 'utf8'))
  }
  return {
    async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      const res = await pg.query(sql, params as never[])
      return res.rows as T[]
    },
    async exec(sql: string) {
      await pg.exec(sql)
    },
    close: () => pg.close(),
  }
}

/** Seeds the pilot ZIPs and a couple of categories. */
export async function seedPilot(db: TestDb): Promise<void> {
  const { COBB_COUNTY_ZIPS, COUNTY, STATE } = await import('@/lib/geography')
  for (const z of COBB_COUNTY_ZIPS) {
    await db.query(
      `INSERT INTO zip_areas (zip, city, county, state) VALUES ($1,$2,$3,$4)
       ON CONFLICT (zip) DO NOTHING`,
      [z.zip, z.city, COUNTY, STATE]
    )
  }
  await db.query(
    `INSERT INTO service_categories (slug, name, kind) VALUES
       ('handyman','Handyman & Home Repair','service'),
       ('furniture','Furniture','item')
     ON CONFLICT (slug) DO NOTHING`
  )
}

export async function seedProfile(db: TestDb, name: string, zip = '30080'): Promise<string> {
  const rows = await db.query<{ id: string }>(
    `INSERT INTO profiles (id, display_name, zip)
     VALUES (gen_random_uuid(), $1, $2) RETURNING id`,
    [name, zip]
  )
  return rows[0]!.id
}

export async function verifyIdentity(db: TestDb, profileId: string): Promise<void> {
  await db.query(
    `INSERT INTO identity_verifications (profile_id, vendor, vendor_ref, status)
     VALUES ($1, 'test_vendor', 'ref-abc', 'verified')`,
    [profileId]
  )
}

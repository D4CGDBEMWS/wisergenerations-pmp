import { describe, it, expect } from 'vitest'
import { createTestDb } from './helpers/db'

describe('test harness', () => {
  it('applies migrations against real Postgres', async () => {
    const { db, close } = await createTestDb()
    const tables = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name`
    )
    const names = tables.map((t) => t.table_name)
    expect(names).toContain('customers')
    expect(names).toContain('entitlements')
    expect(names).toContain('sessions')
    await close()
  })
})

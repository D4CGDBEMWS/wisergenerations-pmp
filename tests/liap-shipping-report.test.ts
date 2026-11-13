import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { shippingCsv, shippingEmailText, SHIPPING_LIST_RECIPIENTS } from '@/lib/liap/shipping-report'

// Owner ruling 2026-10-30: weekly shipping list, Monday mornings, both inboxes.

describe('weekly shipping list', () => {
  it('goes to both owner inboxes', () => {
    expect(SHIPPING_LIST_RECIPIENTS).toEqual(['info@wisergenerations.com', 'fus.pmp.ce@gmail.com'])
  })

  it('runs every Monday at 13:00 UTC and is cron-protected', () => {
    const v = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8'))
    expect(v.crons).toContainEqual({ path: '/api/cron/shipping-list', schedule: '0 13 * * 1' })
    const route = readFileSync(join(process.cwd(), 'app/api/cron/shipping-list/route.ts'), 'utf8')
    expect(route).toContain('CRON_SECRET')
  })

  it('builds a spreadsheet-safe CSV', () => {
    const csv = shippingCsv([
      { ordered_on: new Date('2026-11-02T10:00:00Z'), name: 'Pat "PJ" Reader', line1: '1 Main St, Apt 2', line2: null,
        city: 'Smyrna', state: 'GA', postal_code: '30080', country: 'US', email: 'pat@example.com', copies: 1 },
      { ordered_on: '2026-11-03', name: '=HYPERLINK("x")', line1: '2 Oak', line2: 'Unit B', city: 'Atlanta',
        state: 'GA', postal_code: '30301', country: 'US', email: 'x@example.com', copies: 3 },
    ])
    const lines = csv.trim().split('\r\n')
    expect(lines[0]).toBe('Order date,Copies,Name,Address line 1,Address line 2,City,State,ZIP,Country,Email')
    expect(lines[1]).toBe('2026-11-02,1,"Pat ""PJ"" Reader","1 Main St, Apt 2",,Smyrna,GA,30080,US,pat@example.com')
    expect(lines[2].startsWith(`2026-11-03,3,"'=HYPERLINK`)).toBe(true)
  })

  it('says so plainly when nothing is waiting', () => {
    expect(shippingEmailText(0, '2026-11-02')).toContain('No pre-orders are waiting to ship')
    expect(shippingEmailText(3, '2026-11-02', 5)).toContain('3 pre-orders waiting to ship (5 copies in all)')
  })
})

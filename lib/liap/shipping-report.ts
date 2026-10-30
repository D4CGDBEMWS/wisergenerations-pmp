import { getDb } from '@/lib/db/client'

// ---------------------------------------------------------------------------
// The weekly shipping list. Owner ruling 2026-10-30: every Monday morning the
// site emails every pre-order not yet shipped, as a CSV, to both owner inboxes.
//
// It is sent even when the list is empty, so a missing email means something
// is wrong rather than "no orders". Never throws.
// ---------------------------------------------------------------------------

export const SHIPPING_LIST_RECIPIENTS = ['info@wisergenerations.com', 'fus.pmp.ce@gmail.com'] as const

export interface ShippingRow {
  ordered_on: string | Date
  name: string
  line1: string
  line2: string | null
  city: string
  state: string
  postal_code: string
  country: string
  email: string
}

const HEADERS = ['Order date', 'Name', 'Address line 1', 'Address line 2', 'City', 'State', 'ZIP', 'Country', 'Email']

function cell(v: unknown): string {
  let s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? '')
  // Stop a spreadsheet from treating a value as a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function shippingCsv(rows: ShippingRow[]): string {
  const lines = [HEADERS.join(',')]
  for (const r of rows) {
    lines.push(
      [r.ordered_on, r.name, r.line1, r.line2, r.city, r.state, r.postal_code, r.country, r.email]
        .map(cell)
        .join(',')
    )
  }
  return lines.join('\r\n') + '\r\n'
}

export async function unshippedOrders(): Promise<ShippingRow[]> {
  return getDb().query<ShippingRow>(
    `SELECT ordered_on, name, line1, line2, city, state, postal_code, country, email
       FROM book_shipping_list
      WHERE shipped_at IS NULL
      ORDER BY ordered_on`
  )
}

export function shippingEmailText(count: number, today: string): string {
  return [
    count === 0
      ? `No pre-orders are waiting to ship this week (${today}).`
      : `${count} pre-order${count === 1 ? '' : 's'} waiting to ship, as of ${today}. The list is attached (CSV, opens in Excel or Google Sheets).`,
    '',
    'Books mail after publication on November 30, 2026, by USPS Media Mail.',
    'When you mail books, reply with the tracking numbers and they will be marked shipped.',
    '',
    'Sent automatically every Monday by wisergenerations.com.',
  ].join('\n')
}

export async function sendShippingList(now = new Date()): Promise<{ sent: boolean; count: number }> {
  const today = now.toISOString().slice(0, 10)
  let rows: ShippingRow[] = []
  try {
    rows = await unshippedOrders()
  } catch (err) {
    console.error('[liap/shipping-report] could not read the shipping list', err)
    return { sent: false, count: 0 }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[liap/shipping-report] RESEND_API_KEY not set; list not emailed')
    return { sent: false, count: rows.length }
  }
  const from =
    process.env.MAGIC_LINK_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'info@wisergenerations.com'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `Wiser Generations <${from}>`,
        to: [...SHIPPING_LIST_RECIPIENTS],
        subject: `Book shipping list: ${rows.length} to ship (${today})`,
        text: shippingEmailText(rows.length, today),
        ...(rows.length
          ? {
              attachments: [
                {
                  filename: `book-shipping-list-${today}.csv`,
                  content: Buffer.from(shippingCsv(rows), 'utf8').toString('base64'),
                },
              ],
            }
          : {}),
      }),
    })
    if (!res.ok) {
      console.error(`[liap/shipping-report] Resend rejected the send: HTTP ${res.status}`)
      return { sent: false, count: rows.length }
    }
    return { sent: true, count: rows.length }
  } catch (err) {
    console.error('[liap/shipping-report] send threw', err)
    return { sent: false, count: rows.length }
  }
}

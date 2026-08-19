import { getDb, queryOne } from '@/lib/db/client'

export interface Customer {
  id: string
  email: string
  name: string | null
  stripe_customer_id: string | null
}

/**
 * Finds or creates the customer for an email address.
 *
 * Matching is case-insensitive against the `customers_email_lower_key` index,
 * because Stripe and Mailchimp both treat email case-insensitively — storing
 * Alice@ and alice@ separately would split one person's entitlements across
 * two records and silently deny them access.
 *
 * Concurrency: two simultaneous webhooks for a new customer both attempt the
 * insert; one wins, the other hits the unique index and re-reads. Hence the
 * ON CONFLICT rather than a check-then-insert.
 */
export async function upsertCustomer(input: {
  email: string
  name?: string | null
  stripeCustomerId?: string | null
}): Promise<Customer> {
  const email = input.email.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    throw new Error('upsertCustomer requires a valid email address')
  }

  const rows = await getDb().query<Customer>(
    `INSERT INTO customers (email, name, stripe_customer_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (lower(email)) DO UPDATE
       SET name               = COALESCE(EXCLUDED.name, customers.name),
           stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, customers.stripe_customer_id),
           updated_at         = now()
     RETURNING id, email, name, stripe_customer_id`,
    [email, input.name ?? null, input.stripeCustomerId ?? null]
  )
  return rows[0]!
}

export async function findCustomerByEmail(email: string): Promise<Customer | null> {
  return queryOne<Customer>(
    `SELECT id, email, name, stripe_customer_id
       FROM customers WHERE lower(email) = lower($1)`,
    [email.trim()]
  )
}

export async function findCustomerById(id: string): Promise<Customer | null> {
  return queryOne<Customer>(
    `SELECT id, email, name, stripe_customer_id FROM customers WHERE id = $1`,
    [id]
  )
}

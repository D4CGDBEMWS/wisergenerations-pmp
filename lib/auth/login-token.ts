import { getDb, queryOne } from '@/lib/db/client'
import { generateToken, hashToken } from '@/lib/auth/crypto'
import { recordAuditEvent } from '@/lib/audit'

// ---------------------------------------------------------------------------
// login-token — magic links, replacing the in-memory Map.
//
// Why the database and not Redis: the token must be single-use, and "single
// use" is an atomic compare-and-set. Postgres gives that in one statement with
// UPDATE ... WHERE consumed_at IS NULL RETURNING, which either returns a row
// (this caller consumed it) or does not (someone else already did). Redis
// could do it with a Lua script, but the row is also the audit record — issued,
// consumed, expired — and Redis would need a second store for that anyway.
// Upstash stays where it is good: rate limiting.
//
// The open-redirect defence is structural rather than a validator:
// `redirect_to` is stored server-side against the token and never travels in
// the callback URL, so there is no attacker-controlled destination to smuggle.
//
// ── DESTINATIONS ARE SCOPED TO A PRODUCT ───────────────────────────────────
//
// Owner ruling, 22 August 2026. Until now this module held one flat list of
// two paths and sent anything it did not recognise to /exam-simulator. That
// was correct against an open redirect and wrong about everything else: a
// reader signing in to reach the Life Project-Ready™ Assessment would land in
// the PMP exam simulator, a product they may never have bought, with no error
// and nothing to explain it.
//
// The fix is not a longer list. A longer flat list would still let a LIAP
// sign-in resolve to a PMP page — it would just take a typo to get there. So
// destinations now belong to a product, resolution happens WITHIN a product,
// and there is no code path by which one product's sign-in reaches another
// product's page. Cross-product leakage is not defended against; it is
// unrepresentable.
//
// ── WHY NO NEW COLUMN ──────────────────────────────────────────────────────
//
// The product is not stored. It does not need to be: every allow-listed path
// belongs to exactly one product, so the product is a function of the stored
// destination — and a test asserts the two lists never overlap, which is what
// makes that function total. No migration, and nothing to keep in sync with a
// column somebody could edit.
// ---------------------------------------------------------------------------

const TOKEN_TTL_MINUTES = 15

/**
 * The products that issue magic links.
 *
 * `study` is PMP/CAPM Study Access, unchanged. `liap` is Living Is a
 * Project...Are You Ready?™ — the book, the assessment and the report.
 */
export const LOGIN_PRODUCTS = ['study', 'liap'] as const
export type LoginProduct = (typeof LOGIN_PRODUCTS)[number]

/** Preserves every existing caller's behaviour exactly. */
export const DEFAULT_PRODUCT: LoginProduct = 'study'

/**
 * Where a signed-in customer may be sent, per product.
 *
 * `home` is where an unrecognised destination for that product resolves. It is
 * always a page of the same product, so a bad value costs a reader one extra
 * click and never tells them about a product they did not buy.
 *
 * LIAP's home is the hub rather than the book-activation entry, deliberately:
 * that route does not exist yet, and a default that 404s is worse than one
 * that is merely general. It moves here, in one line, when the route ships.
 */
const DESTINATIONS: Record<LoginProduct, { allowed: readonly string[]; home: string }> = {
  study: {
    allowed: ['/exam-simulator', '/flashcards'],
    home: '/exam-simulator',
  },
  liap: {
    allowed: [
      '/living-is-a-project',
      '/living-is-a-project/assessment',
      '/living-is-a-project/book',
      '/living-is-a-project/access',
    ],
    home: '/living-is-a-project',
  },
}

/**
 * Where a destination goes when it belongs to no product at all.
 *
 * Reached only by a stored value that predates this allow-list or was written
 * by something other than issueLoginToken. The site's front door belongs to
 * no product, always exists, and is the one answer that cannot be the wrong
 * product's answer.
 */
export const NEUTRAL_DESTINATION = '/'

export function allowedDestinations(product: LoginProduct): readonly string[] {
  return DESTINATIONS[product].allowed
}

/**
 * Which product a destination belongs to, or null.
 *
 * Total because the allow-lists are disjoint — asserted in
 * tests/authorization.test.ts, so an overlap added later fails the build
 * rather than making this function quietly pick one.
 */
export function productForDestination(path: string | null | undefined): LoginProduct | null {
  if (!path) return null
  for (const product of LOGIN_PRODUCTS) {
    if (DESTINATIONS[product].allowed.includes(path)) return product
  }
  return null
}

/**
 * Resolves a requested destination within one product.
 *
 * Anything not on that product's list — an absolute URL, a protocol-relative
 * host, an admin path, or a perfectly valid page belonging to a DIFFERENT
 * product — resolves to this product's own home. `/exam-simulator` requested
 * under `liap` does not return `/exam-simulator`; that is the whole point.
 */
export function resolveRedirect(
  raw: string | null | undefined,
  product: LoginProduct = DEFAULT_PRODUCT
): string {
  const scope = DESTINATIONS[product] ?? DESTINATIONS[DEFAULT_PRODUCT]
  if (!raw) return scope.home
  return scope.allowed.includes(raw) ? raw : scope.home
}

/**
 * Resolves a destination read back out of the database.
 *
 * The product is derived from the value itself. A value belonging to no
 * product fails safe to the neutral destination rather than guessing — and
 * guessing is exactly what the old flat fallback did.
 */
export function resolveStoredRedirect(stored: string | null | undefined): string {
  const product = productForDestination(stored)
  if (!product) return NEUTRAL_DESTINATION
  return resolveRedirect(stored, product)
}

export async function issueLoginToken(input: {
  email: string
  /** Which product's sign-in this is. Omitted means Study Access, as before. */
  product?: LoginProduct
  redirectTo?: string | null
}): Promise<{ token: string; expiresAt: Date }> {
  const email = input.email.trim().toLowerCase()
  const product = input.product ?? DEFAULT_PRODUCT
  const token = generateToken()
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000)

  await getDb().query(
    `INSERT INTO login_tokens (email, token_hash, expires_at, redirect_to)
     VALUES ($1, $2, $3, $4)`,
    [email, hashToken(token), expiresAt.toISOString(), resolveRedirect(input.redirectTo, product)]
  )

  // The token itself is never logged, here or anywhere. The product is not
  // personal and is worth having when reading an audit trail.
  await recordAuditEvent({
    eventType: 'login.token_issued',
    metadata: { result: 'issued', reason: product },
  })

  return { token, expiresAt }
}

/**
 * Consumes a token, atomically.
 *
 * The UPDATE is the whole concurrency story: two simultaneous clicks on the
 * same link both run it, exactly one matches `consumed_at IS NULL`, and the
 * other gets no row. There is no read-then-write window to race.
 *
 * The returned destination is already resolved. Callers redirect to it as
 * given; resolving it a second time would be harmless but implies the value
 * is untrusted, and it is not — nothing but this module ever writes it.
 */
export async function consumeLoginToken(
  token: string
): Promise<{ email: string; redirectTo: string } | null> {
  if (!token) return null

  const row = await queryOne<{ email: string; redirect_to: string | null }>(
    `UPDATE login_tokens
        SET consumed_at = now()
      WHERE token_hash = $1
        AND consumed_at IS NULL
        AND expires_at > now()
      RETURNING email, redirect_to`,
    [hashToken(token)]
  )

  if (!row) return null
  return { email: row.email, redirectTo: resolveStoredRedirect(row.redirect_to) }
}

/** Housekeeping. Safe to run from a scheduled job later; not required for correctness. */
export async function purgeExpiredLoginTokens(): Promise<number> {
  const rows = await getDb().query<{ id: string }>(
    `DELETE FROM login_tokens
      WHERE expires_at < now() - interval '7 days'
      RETURNING id`
  )
  return rows.length
}

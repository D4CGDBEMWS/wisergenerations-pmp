import { readLiapAccess } from '@/lib/liap/entitlements'
import { isEnabled } from '@/lib/flags'
import { programLogin } from '@/lib/auth/program-login'

// ---------------------------------------------------------------------------
// The book's front door.
//
// Owner ruling, 22 August 2026 — Architecture A, One Door, Three Lanes.
// Book → /liap/book → verification when required → entitlement → secure
// access → Assessment → Readiness Report.
//
// ── WHY THE DECISION LIVES HERE AND NOT IN THE ROUTE ───────────────────────
//
// The route is the thing that goes on paper. It has to keep resolving for as
// long as printed copies exist, through redesigns, replatforming and whatever
// comes after this phase. So it holds as little as possible: it asks this
// module what to do and does it. Everything that might change — where the
// assessment lives, what the chooser says, which lanes exist — changes here,
// where changing it costs nothing.
//
// ── WHY /liap AND NOT /living-is-a-project ─────────────────────────────────
//
// The product tree was renamed this week: /life-is-a-project became
// /living-is-a-project, fourteen files, four redirects. The partner QR route
// /liap/go was not touched, because it never lived inside the product tree.
// Signs already hanging in shop windows kept working through a rename that
// rewrote everything around them.
//
// That is the whole argument for this namespace, and it is evidence rather
// than theory. The book's QR belongs in the same seam.
// ---------------------------------------------------------------------------

/** What the entry route should do with this visitor. */
export type BookEntry =
  /** Entitled and signed in. The question is never asked. */
  | { action: 'assessment'; href: string }
  /** Signed out, or signed in without access. Ask where the copy came from. */
  | { action: 'choose'; signedIn: boolean }
  /**
   * The flow is not available yet.
   *
   * NOT a 404, and that inverts the convention every other gated route here
   * follows. A 404 is right while nothing points at a route: an unreleased
   * product should not be discoverable by probing. The moment ink is on paper
   * that reasoning reverses — a reader holding the book must never meet a
   * dead end, and they cannot be told to come back later by a 404.
   */
  | { action: 'soft-landing' }

export interface BookEntryInput {
  /** Whether the LIAP section is live. */
  liapEnabled: boolean
  /** Whether the activation flow itself is live. */
  activationEnabled: boolean
  session: { entitled: boolean } | null
}

/**
 * Decides, without touching a request or a database.
 *
 * Pure, so every branch is testable without standing up a session — and so
 * the behaviour that will sit behind a printed QR code for years is defined
 * in one readable function rather than distributed through a route handler.
 */
export function decideBookEntry(input: BookEntryInput): BookEntry {
  if (!input.liapEnabled || !input.activationEnabled) {
    return { action: 'soft-landing' }
  }
  if (input.session?.entitled) {
    return { action: 'assessment', href: programLogin('liap').defaultDestination }
  }
  return { action: 'choose', signedIn: input.session !== null }
}

/** Reads the live state and decides. The route's entire job. */
export async function bookEntry(): Promise<BookEntry> {
  const access = await readLiapAccess()
  return decideBookEntry({
    liapEnabled: isEnabled('LIAP'),
    activationEnabled: isEnabled('LIAP_BOOK_ACTIVATION'),
    session: access ? { entitled: access.entitled } : null,
  })
}

import { initialJourney } from './engine'
import type { JourneyState } from './types'

// ---------------------------------------------------------------------------
// Facilitator console persistence. THE ONE STORAGE EXCEPTION IN THIS PRODUCT.
//
// ── WHY IT EXISTS ──────────────────────────────────────────────────────────
//
// An accidental refresh on the facilitator's laptop, mid-Intensive, would
// otherwise destroy a team's whole journey in front of the room. Owner ruling:
// operational resilience for the console, and nothing else.
//
// ── WHAT IT IS NOT ─────────────────────────────────────────────────────────
//
// Not Postgres. Not an API. Not a cookie. Not localStorage. Not analytics. Not
// a log. Not synchronised to any participant device. sessionStorage is scoped
// to the one tab: close it and the data is gone, and it never leaves the
// machine at any point.
//
// ── IT CANNOT HOLD MY PROJECT TEXT ─────────────────────────────────────────
//
// Not "must not" — cannot. The only function that writes takes a JourneyState,
// which has no field a participant's personal project could occupy. The MY
// PROJECT module does not import this file and its draft type is not
// assignable to anything here. That is a compiler guarantee rather than a
// convention somebody has to remember.
//
// ── IT NEVER RESUMES BY ITSELF ─────────────────────────────────────────────
//
// readStoredSession() returns what it found and applies nothing. The console
// asks the facilitator: resume this journey, or discard and start over. A
// silent resume would put a previous team's decisions on the wall in front of
// the next one.
//
// The display route and MY PROJECT do not import this module; a test asserts
// it, so the console's stored state is unreachable from either surface.
// ---------------------------------------------------------------------------

export const FACILITATOR_SESSION_KEY = 'liap-journey-facilitator'

/**
 * Bumped whenever JourneyState changes shape. A stored session from an older
 * shape is discarded rather than half-read — a console that boots into a
 * corrupted journey in front of a room is worse than one that starts clean.
 */
export const FACILITATOR_SESSION_VERSION = 1

export interface StoredSession {
  readonly version: number
  readonly savedAt: number
  readonly state: JourneyState
}

function storage(): Storage | null {
  // Private-browsing modes and blocked site data both throw on access rather
  // than returning null, so this has to be a try/catch and not a check.
  try {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return null
    return sessionStorage
  } catch {
    return null
  }
}

/**
 * Writes the console's live state. Takes JourneyState and nothing wider.
 *
 * Failures are swallowed on purpose: a facilitator mid-session must not get an
 * exception because the browser refused to store. They lose the safety net,
 * not the session.
 */
export function saveFacilitatorSession(state: JourneyState, savedAt: number): void {
  const store = storage()
  if (!store) return
  try {
    const payload: StoredSession = { version: FACILITATOR_SESSION_VERSION, savedAt, state }
    store.setItem(FACILITATOR_SESSION_KEY, JSON.stringify(payload))
  } catch {
    /* quota, private mode, blocked site data — the session continues in memory */
  }
}

/**
 * Reads a stored session WITHOUT applying it. The caller offers the choice.
 *
 * Returns null for: nothing stored, unreadable storage, malformed JSON, a
 * version mismatch, or a payload that does not look like a JourneyState.
 */
export function readStoredSession(): StoredSession | null {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(FACILITATOR_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredSession>
    if (parsed?.version !== FACILITATOR_SESSION_VERSION) return null
    if (!isJourneyState(parsed.state)) return null
    return { version: parsed.version, savedAt: parsed.savedAt ?? 0, state: parsed.state }
  } catch {
    return null
  }
}

/** The End Session control, and every reset path, land here. */
export function clearFacilitatorSession(): void {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(FACILITATOR_SESSION_KEY)
  } catch {
    /* nothing to do; the tab closing clears it regardless */
  }
}

/** True where a stored session represents a journey actually under way. */
export function isResumable(stored: StoredSession | null): boolean {
  if (!stored) return false
  const { state } = stored
  if (state.phase === 'complete') return true
  return state.startedAt !== null || state.decisions.length > 0 || state.events.length > 0
}

/**
 * Structural check against the shape we wrote, not a schema library.
 *
 * Deliberately conservative: anything unrecognised is treated as absent and
 * the console starts clean.
 */
function isJourneyState(value: unknown): value is JourneyState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  const template = initialJourney() as unknown as Record<string, unknown>
  for (const key of Object.keys(template)) {
    if (!(key in candidate)) return false
  }
  return (
    typeof candidate.pointIndex === 'number' &&
    Array.isArray(candidate.decisions) &&
    Array.isArray(candidate.events)
  )
}

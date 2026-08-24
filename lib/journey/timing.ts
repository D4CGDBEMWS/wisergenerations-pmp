// ---------------------------------------------------------------------------
// Two clocks, one session.
//
// The room is told it has 90 minutes and that is true — it is the task window,
// and it is what the projected map shows.
//
// The facilitator privately holds 120: the same 90 plus a 30-minute floating
// contingency buffer, spent a few minutes at a time when a team needs longer
// on a decision than the plan allowed.
//
// ── THE BUFFER IS NEVER SHOWN, AND CANNOT BE ───────────────────────────────
//
// A room that knows about a buffer has 120 minutes, not 90, and the pressure
// that makes the decisions real evaporates. So the buffer is not merely
// hidden: BUFFER_MINUTES and TOTAL_MINUTES are not fields on ProjectedJourney,
// and projectJourney() has no access to them. There is nothing to leak.
// ---------------------------------------------------------------------------

/** What the room is told, and what the projected map counts down. */
export const WINDOW_MINUTES = 90

/** Facilitator-private. Never projected. */
export const BUFFER_MINUTES = 30

/** Facilitator-private. WINDOW + BUFFER. */
export const TOTAL_MINUTES = WINDOW_MINUTES + BUFFER_MINUTES

export interface FacilitatorClock {
  readonly elapsedMinutes: number
  /** Against the 90 the room can see. Negative once the window is spent. */
  readonly windowRemaining: number
  /** Against the private 120. */
  readonly totalRemaining: number
  /** How much of the contingency has been consumed. */
  readonly bufferUsed: number
  readonly bufferRemaining: number
  /** True once the team is running on contingency rather than plan. */
  readonly onBuffer: boolean
}

export function facilitatorClock(startedAt: number | null, now: number): FacilitatorClock {
  const elapsedMinutes = startedAt === null ? 0 : Math.max(0, (now - startedAt) / 60_000)
  const windowRemaining = WINDOW_MINUTES - elapsedMinutes
  const bufferUsed = Math.min(BUFFER_MINUTES, Math.max(0, elapsedMinutes - WINDOW_MINUTES))
  return {
    elapsedMinutes,
    windowRemaining,
    totalRemaining: TOTAL_MINUTES - elapsedMinutes,
    bufferUsed,
    bufferRemaining: BUFFER_MINUTES - bufferUsed,
    onBuffer: elapsedMinutes > WINDOW_MINUTES,
  }
}

/**
 * What the room sees. The 90-minute window, floored at zero.
 *
 * Floored deliberately: a projected clock showing "-7 minutes" tells the room
 * the session is overrunning, which is the facilitator's information to hold
 * and act on, not the room's to worry about.
 */
export function projectedMinutesRemaining(startedAt: number | null, now: number): number | null {
  if (startedAt === null) return null
  const elapsed = (now - startedAt) / 60_000
  return Math.max(0, Math.ceil(WINDOW_MINUTES - elapsed))
}

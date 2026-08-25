import type { ProjectedJourney } from './types'

// ---------------------------------------------------------------------------
// How the wall hears from the console.
//
// One machine, two windows: the facilitator's private console and a projected
// display, screen-shared or on a second output. BroadcastChannel carries the
// projection between them.
//
// ── WHY NOT A SERVER ───────────────────────────────────────────────────────
//
// Nothing about a facilitated room needs one. A server would mean an account,
// a session id, a network dependency in a hotel conference room, and a place
// where a team's decisions come to rest. BroadcastChannel is same-origin,
// in-memory, and stores nothing — close both windows and the session is gone,
// which is the correct lifetime for a workshop exercise.
//
// It also means no new dependency and nothing to pay for.
//
// The trade-off, stated plainly: BroadcastChannel is same-origin AND same
// browser profile. Both windows must live on the facilitator's own laptop, and
// the display window is then projected or screen-shared. It will not reach a
// second device, which matches the Version 1 ruling but constrains room setup.
//
// ── THE LATE-JOIN PROBLEM ──────────────────────────────────────────────────
//
// A projected window opened after the session started would otherwise show an
// empty map. So it announces itself and the console replies with the current
// projection. One message each way, no polling.
// ---------------------------------------------------------------------------

export const JOURNEY_CHANNEL = 'liap-journey'

export type ChannelMessage =
  /** Console → display. The whole projection, on every change. */
  | { kind: 'state'; state: ProjectedJourney }
  /** Display → console. "I just opened; send me the current state." */
  | { kind: 'hello' }
  /**
   * Console → console. "Is anyone else driving?"
   *
   * Two consoles open in the same browser profile would both answer a display's
   * hello, and the wall would flicker between two journeys. V1 does not try to
   * merge them — it warns the facilitator, which is the honest fix for a
   * mistake made in ten seconds at the start of a session.
   */
  | { kind: 'console-hello' }
  | { kind: 'console-here' }

export interface Channel {
  post(message: ChannelMessage): void
  close(): void
}

/**
 * Opens the channel, or returns a no-op where BroadcastChannel is unavailable.
 *
 * Server rendering and older browsers both land in the fallback. A facilitator
 * console that throws on load in front of a room is a worse failure than one
 * that simply does not mirror, so this degrades rather than breaks.
 */
export function openChannel(onMessage: (m: ChannelMessage) => void): Channel {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return { post: () => {}, close: () => {} }
  }
  const channel = new BroadcastChannel(JOURNEY_CHANNEL)
  channel.onmessage = (event: MessageEvent<ChannelMessage>) => onMessage(event.data)
  return {
    post: (message) => channel.postMessage(message),
    close: () => channel.close(),
  }
}

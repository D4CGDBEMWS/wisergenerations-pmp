// ---------------------------------------------------------------------------
// Be Ready to Make the Turn Workshop. Owner rulings 2026-10-29 / 2026-11-04:
// live on Zoom, January 11–15, 2027, the same 90-minute workshop twice a day
// (12:00–1:30 pm and 7:00–8:30 pm Eastern); each person picks one session;
// $49, non-refundable; a replay goes to everyone registered for a session.
// No seat limit beyond the Zoom meeting's own capacity.
//
// The Zoom link is never on a page. It lives in server environment variables
// and reaches only paid registrants, in their emails.
//
// To add dates, add sessions to WORKSHOP_SESSIONS. Keys are permanent (they
// are stored with each registration); never rename one that has registrants.
// ---------------------------------------------------------------------------

export const WORKSHOP = {
  name: 'Be Ready to Make the Turn Workshop',
  priceCents: 4900,
  priceLabel: '$49',
  currency: 'usd',
  metadataKey: 'liap-workshop',
  durationMinutes: 90,
  terms:
    'Registration is non-refundable. If you cannot attend live, you will receive the replay of your session.',
} as const

export interface WorkshopSession {
  key: string
  /** Start, with the Eastern offset (EST in January). */
  startsAt: string
  endsAt: string
}

function day(date: string): WorkshopSession[] {
  return [
    { key: `${date}-noon`, startsAt: `${date}T12:00:00-05:00`, endsAt: `${date}T13:30:00-05:00` },
    { key: `${date}-evening`, startsAt: `${date}T19:00:00-05:00`, endsAt: `${date}T20:30:00-05:00` },
  ]
}

export const WORKSHOP_SESSIONS: readonly WorkshopSession[] = [
  ...day('2027-01-11'),
  ...day('2027-01-12'),
  ...day('2027-01-13'),
  ...day('2027-01-14'),
  ...day('2027-01-15'),
]

/** Registration for a session closes this long before it starts. */
export const REGISTRATION_CLOSES_MINUTES = 60

export function findSession(key: unknown): WorkshopSession | null {
  if (typeof key !== 'string') return null
  return WORKSHOP_SESSIONS.find((s) => s.key === key) ?? null
}

export function sessionOpen(s: WorkshopSession, now: Date = new Date()): boolean {
  return now.getTime() < new Date(s.startsAt).getTime() - REGISTRATION_CLOSES_MINUTES * 60_000
}

const TZ = 'America/New_York'

export function sessionDayLabel(s: WorkshopSession): string {
  return new Date(s.startsAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: TZ })
}

export function sessionTimeLabel(s: WorkshopSession): string {
  const f = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ })
  return `${f(s.startsAt)}–${f(s.endsAt)} Eastern`
}

/** "Monday, January 11, 2027 · 12:00 PM–1:30 PM Eastern" */
export function sessionLabel(s: WorkshopSession): string {
  return `${sessionDayLabel(s)} · ${sessionTimeLabel(s)}`
}

/** The calendar date of a session in Eastern time, YYYY-MM-DD. */
export function sessionEasternDate(s: WorkshopSession): string {
  return s.key.slice(0, 10)
}

export function isLiapWorkshop(metadata: Record<string, string> | null | undefined): boolean {
  return metadata?.product === WORKSHOP.metadataKey
}

export interface ZoomDetails {
  url: string
  meetingId: string
  passcode: string
}

/** Server-only. Null when the environment is not configured. */
export function zoomDetails(): ZoomDetails | null {
  const url = process.env.WORKSHOP_ZOOM_URL
  const meetingId = process.env.WORKSHOP_ZOOM_MEETING_ID
  const passcode = process.env.WORKSHOP_ZOOM_PASSCODE
  if (!url || !meetingId || !passcode) return null
  return { url, meetingId, passcode }
}

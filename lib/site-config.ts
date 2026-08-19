import linksJson from '@/content/config/links.json'
import chatJson from '@/content/config/chat.json'
import giveawayJson from '@/content/config/giveaway.json'
import cohortsJson from '@/content/config/cohorts.json'

// ---------------------------------------------------------------------------
// site-config — typed accessors for the owner-editable JSON in content/config.
//
// These files are imported (not read from disk), so they are bundled at build
// time and always ship with the deployment. Editing one and pushing to GitHub
// triggers a Vercel rebuild and the change goes live — no code required.
//
//   content/config/links.json     — every CTA / scheduling / enrollment URL
//   content/config/chat.json      — chat on-off switch, greeting, quick actions
//   content/config/giveaway.json  — giveaway dates, rules, eligibility
//   content/config/cohorts.json   — boot camp schedule
// ---------------------------------------------------------------------------

export type QuickAction = { label: string; message: string }

export const LINKS = linksJson

export const CHAT_CONFIG = {
  enabled: chatJson.enabled,
  assistantName: chatJson.assistantName,
  greeting: chatJson.greeting,
  quickActions: chatJson.quickActions as QuickAction[],
  disclaimer: chatJson.disclaimer,
  maxTurns: chatJson.maxTurns,
  maxMessageLength: chatJson.maxMessageLength,
}

export const GIVEAWAY = giveawayJson

/**
 * A giveaway only counts as live when the owner has explicitly enabled it AND
 * filled in the dates. This guards against the widget or the AI announcing a
 * giveaway that has placeholder values still in the config.
 */
export function isGiveawayActive(): boolean {
  return Boolean(
    GIVEAWAY.enabled &&
    GIVEAWAY.entryDeadline &&
    GIVEAWAY.winnerSelectionDate
  )
}

/**
 * Quick-action buttons shown in the chat launcher. The giveaway button is
 * filtered out entirely when no giveaway is running, so the assistant is never
 * asked to discuss something that does not exist.
 */
export function getQuickActions(): QuickAction[] {
  const active = isGiveawayActive()
  return CHAT_CONFIG.quickActions.filter(
    (action) => active || !/giveaway/i.test(action.label)
  )
}


// ---------------------------------------------------------------------------
// Cohorts
// ---------------------------------------------------------------------------

export type Cohort = {
  id: string
  start: string
  end: string
  note?: string
}

export type FormattedCohort = Cohort & {
  /** "Monday, September 21 – Thursday, September 24, 2026" */
  label: string
  /** True while the boot camp is running, so it is not offered as "upcoming". */
  inProgress: boolean
}

export const COHORTS = cohortsJson

/**
 * Dates in the config are plain YYYY-MM-DD with no timezone, which `new Date()`
 * reads as UTC midnight. Comparing that against a local clock silently shifts a
 * cohort by a day for anyone west of Greenwich, so every comparison here is done
 * in UTC and a cohort is only considered finished once the day AFTER its end
 * date has begun. Erring long means a cohort that is still running is never
 * hidden from someone asking about it.
 */
function dayStartUtc(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return NaN
  return Date.UTC(y, m - 1, d)
}

const DAY_MS = 24 * 60 * 60 * 1000

function formatRange(start: string, end: string): string {
  const s = new Date(dayStartUtc(start))
  const e = new Date(dayStartUtc(end))
  const opts = { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' } as const
  const fmt = new Intl.DateTimeFormat('en-US', opts)
  return `${fmt.format(s)} – ${fmt.format(e)}, ${e.getUTCFullYear()}`
}

/**
 * Cohorts that have not finished yet, soonest first. Past cohorts drop out on
 * their own, so the owner never has to prune the file to stop the assistant
 * offering a boot camp that already ran.
 */
export function getUpcomingCohorts(now: number = Date.now()): FormattedCohort[] {
  if (!COHORTS.enabled) return []

  return (COHORTS.cohorts as Cohort[])
    .filter((c) => {
      const start = dayStartUtc(c.start)
      const end = dayStartUtc(c.end)
      return Number.isFinite(start) && Number.isFinite(end) && now < end + DAY_MS
    })
    .sort((a, b) => dayStartUtc(a.start) - dayStartUtc(b.start))
    .map((c) => ({
      ...c,
      label: formatRange(c.start, c.end),
      inProgress: now >= dayStartUtc(c.start),
    }))
}

/**
 * True only when the owner has switched the schedule on AND at least one cohort
 * is still ahead. Mirrors isGiveawayActive(): the assistant must never announce
 * a schedule that has run out, so this is the single gate everything checks.
 */
export function hasCohortSchedule(now: number = Date.now()): boolean {
  return getUpcomingCohorts(now).length > 0
}

/** "9:00 AM – 5:00 PM ET" */
export function getCohortSessionTimes(): string {
  return `${COHORTS.sessionStartTime} – ${COHORTS.sessionEndTime} ${COHORTS.timezone}`
}

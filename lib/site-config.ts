import linksJson from '@/content/config/links.json'
import chatJson from '@/content/config/chat.json'
import giveawayJson from '@/content/config/giveaway.json'

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

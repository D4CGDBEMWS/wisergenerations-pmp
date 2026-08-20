import ChatWidget from './ChatWidget'
import { CHAT_CONFIG, LINKS, getQuickActions } from '@/lib/site-config'

// ---------------------------------------------------------------------------
// VirtualGuide — server component that reads the owner-editable config and
// hands only serializable values to the client widget.
//
// Turning the assistant off is a one-word edit in content/config/chat.json
// ("enabled": false); nothing is sent to the browser at all when it is off.
// ---------------------------------------------------------------------------

export default function VirtualGuide() {
  if (!CHAT_CONFIG.enabled) return null

  return (
    <ChatWidget
      assistantName={CHAT_CONFIG.assistantName}
      greeting={CHAT_CONFIG.greeting}
      disclaimer={CHAT_CONFIG.disclaimer}
      quickActions={getQuickActions()}
      maxTurns={CHAT_CONFIG.maxTurns}
      maxMessageLength={CHAT_CONFIG.maxMessageLength}
      schedulingUrl={LINKS.scheduling}
      contactUrl={LINKS.contact}
      privacyUrl={LINKS.privacyPolicy}
      supportEmail={LINKS.supportEmail}
    />
  )
}

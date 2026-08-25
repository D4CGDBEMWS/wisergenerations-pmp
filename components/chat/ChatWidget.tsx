'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { trackEvent } from '@/components/Analytics'
import ChatMessageText from './ChatMessageText'
import ChatLeadForm, { type LeadInterest } from './ChatLeadForm'
import { useBottomChromeOffset } from './useBottomChromeOffset'

// ---------------------------------------------------------------------------
// ChatWidget — the Wiser Generations Virtual Guide.
//
// Conversation history sent to the server is TEXT ONLY. Tool calls are turned
// into local UI state (a lead form, a contact card) and never replayed to the
// API, which keeps every request a valid, self-contained message list.
//
// Routes where the widget is suppressed: the timed study tools, where a
// floating bubble would be a distraction rather than a help — and the whole
// LIAP Journey Game.
//
// The Journey Game entry is not about distraction. Its two facilitated screens
// are projected or driven live in a room, and MY PROJECT is a page whose one
// guarantee is that what a participant types about their real life never
// leaves the browser. A chat bubble in the corner of that page is an
// invitation to paste the same text into something that DOES post to a server
// — the guarantee would be technically intact and practically broken.
// ---------------------------------------------------------------------------

const SUPPRESSED_PREFIXES = ['/exam-simulator', '/flashcards', '/liap/journey']

export type ChatWidgetProps = {
  assistantName: string
  greeting: string
  disclaimer: string
  quickActions: { label: string; message: string }[]
  maxTurns: number
  maxMessageLength: number
  schedulingUrl: string
  contactUrl: string
  privacyUrl: string
  supportEmail: string
}

type Message = { role: 'user' | 'assistant'; content: string }
type PendingForm = { interest: LeadInterest; reason: string }

export default function ChatWidget(props: ChatWidgetProps) {
  const pathname = usePathname()
  const bottomOffset = useBottomChromeOffset()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const [pendingForm, setPendingForm] = useState<PendingForm | null>(null)
  const [escalation, setEscalation] = useState<string | null>(null)
  const [leadDone, setLeadDone] = useState(false)

  const launcherRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const transcriptRef = useRef<HTMLDivElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const startedRef = useRef(false)

  const uid = useId()
  const panelId = `${uid}-panel`
  const titleId = `${uid}-title`

  const suppressed = SUPPRESSED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
  )

  // Keep the newest message in view as tokens stream in.
  useEffect(() => {
    const el = transcriptRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, pendingForm, escalation, streaming])

  // Focus the composer on open; hand focus back to the launcher on close.
  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 80)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [open])

  const closePanel = useCallback(() => {
    setOpen(false)
    launcherRef.current?.focus()
  }, [])

  const openPanel = useCallback(() => {
    setOpen(true)
    trackEvent('ai_chat_opened', { page: window.location.pathname })
  }, [])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closePanel()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, closePanel])

  useEffect(() => () => abortRef.current?.abort(), [])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || streaming) return

      if (trimmed.length > props.maxMessageLength) {
        setError(`Please keep messages under ${props.maxMessageLength} characters.`)
        return
      }

      if (messages.length >= props.maxTurns) {
        setError(
          'This conversation has gotten long. Please book a call or use the contact form so we can help properly.'
        )
        setEscalation('unanswered')
        return
      }

      if (!startedRef.current) {
        startedRef.current = true
        trackEvent('ai_chat_started', { page: window.location.pathname })
      }

      setError('')
      setPendingForm(null)
      setInput('')

      const history: Message[] = [...messages, { role: 'user', content: trimmed }]
      // Placeholder assistant turn that streamed tokens are appended into.
      setMessages([...history, { role: 'assistant', content: '' }])
      setStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      const appendToLast = (chunk: string) => {
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (last && last.role === 'assistant') {
            next[next.length - 1] = { role: 'assistant', content: last.content + chunk }
          }
          return next
        })
      }

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(
            data?.error ||
              'The assistant is unavailable right now. Please try the contact form.'
          )
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        // Newline-delimited JSON: text deltas plus control frames.
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.trim()) continue
            let frame: {
              type: string
              text?: string
              interest?: string
              reason?: string
              message?: string
            }
            try {
              frame = JSON.parse(line)
            } catch {
              continue
            }

            if (frame.type === 'text' && frame.text) {
              appendToLast(frame.text)
            } else if (frame.type === 'form') {
              setPendingForm({
                interest: (frame.interest as LeadInterest) ?? 'general',
                reason: frame.reason ?? '',
              })
            } else if (frame.type === 'escalate') {
              setEscalation(frame.reason ?? 'other')
              trackEvent('ai_chat_escalated', { reason: frame.reason ?? 'other' })
            } else if (frame.type === 'error') {
              setError(frame.message ?? 'Something went wrong.')
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again or use the contact form.'
        )
      } finally {
        setStreaming(false)
        abortRef.current = null
        // Drop the placeholder if the model produced no text at all.
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last && last.role === 'assistant' && last.content === '') {
            return prev.slice(0, -1)
          }
          return prev
        })
      }
    },
    [messages, streaming, props.maxTurns, props.maxMessageLength]
  )

  function handleLeadSuccess(timeframe: string) {
    setPendingForm(null)
    setLeadDone(true)
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content:
          "Got it — that's on its way to your inbox. Anything else I can help you with?",
      },
    ])
    if (timeframe === 'right_away' || timeframe === 'within_30_days') {
      setEscalation('high_intent')
    }
  }

  if (suppressed) return null

  const conversationStarted = messages.length > 0
  const visibleQuickActions = conversationStarted ? [] : props.quickActions

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Launcher                                                          */}
      {/* ---------------------------------------------------------------- */}
      {!open && (
        <button
          ref={launcherRef}
          type="button"
          onClick={openPanel}
          aria-expanded={false}
          aria-controls={panelId}
          className="fixed right-4 z-40 flex items-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:bg-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:px-5"
          style={{
            bottom: `calc(${bottomOffset + 16}px + env(safe-area-inset-bottom, 0px))`,
          }}
        >
          <ChatIcon className="h-5 w-5 text-gold" aria-hidden="true" />
          <span>Ask a question</span>
        </button>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Panel                                                             */}
      {/* ---------------------------------------------------------------- */}
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          className="fixed inset-x-3 z-40 flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[400px]"
          style={{
            bottom: `calc(${bottomOffset + 12}px + env(safe-area-inset-bottom, 0px))`,
            maxHeight: `calc(100dvh - ${bottomOffset + 96}px)`,
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 bg-navy px-4 py-3 text-white">
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-sm font-bold">
                {props.assistantName}
              </h2>
              <p className="mt-0.5 text-[11px] leading-tight text-gray-300">
                AI assistant · not a live person
              </p>
            </div>
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close chat"
              className="-mr-1 -mt-1 rounded-lg p-2 text-gray-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <CloseIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Transcript */}
          <div
            ref={transcriptRef}
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-paper px-4 py-4"
          >
            <div className="rounded-2xl rounded-tl-sm border border-line bg-white px-3 py-2.5 text-sm leading-relaxed text-navy">
              {props.greeting}
            </div>

            <div aria-live="polite" aria-atomic="false" className="space-y-3">
              {messages.map((message, index) =>
                message.role === 'user' ? (
                  <div key={index} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-blue px-3 py-2.5 text-sm leading-relaxed text-white">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div key={index} className="flex justify-start">
                    <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-line bg-white px-3 py-2.5 text-sm leading-relaxed text-navy">
                      {message.content ? (
                        <ChatMessageText text={message.content} />
                      ) : (
                        <TypingDots />
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            {pendingForm && !leadDone && (
              <ChatLeadForm
                interest={pendingForm.interest}
                reason={pendingForm.reason}
                privacyHref={props.privacyUrl}
                onSuccess={handleLeadSuccess}
                onDismiss={() => setPendingForm(null)}
              />
            )}

            {escalation && (
              <EscalationCard
                schedulingUrl={props.schedulingUrl}
                contactUrl={props.contactUrl}
                supportEmail={props.supportEmail}
                onDismiss={() => setEscalation(null)}
              />
            )}

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
              >
                {error}
              </p>
            )}
          </div>

          {/* Quick actions */}
          {visibleQuickActions.length > 0 && (
            <div className="border-t border-line bg-white px-3 pt-3">
              <ul className="flex flex-wrap gap-2">
                {visibleQuickActions.map((action) => (
                  <li key={action.label}>
                    <button
                      type="button"
                      onClick={() => send(action.message)}
                      className="rounded-full border border-brand-blue/30 bg-light-navy px-3 py-1.5 text-xs font-semibold text-brand-blue transition hover:border-brand-blue hover:bg-brand-blue hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                    >
                      {action.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={(event) => {
              event.preventDefault()
              send(input)
            }}
            className="border-t border-line bg-white px-3 py-3"
          >
            <div className="flex items-end gap-2">
              <label htmlFor={`${uid}-input`} className="sr-only">
                Type your question
              </label>
              <textarea
                id={`${uid}-input`}
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    send(input)
                  }
                }}
                placeholder="Type your question…"
                maxLength={props.maxMessageLength}
                className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-line px-3 py-2.5 text-sm text-navy outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-gold text-navy transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <SendIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-tight text-gray-500">{props.disclaimer}</p>
          </form>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EscalationCard({
  schedulingUrl,
  contactUrl,
  supportEmail,
  onDismiss,
}: {
  schedulingUrl: string
  contactUrl: string
  supportEmail: string
  onDismiss: () => void
}) {
  return (
    <div className="rounded-2xl border border-gold/40 bg-light-gold p-4">
      <p className="text-sm font-bold text-navy">Let&apos;s get you to a person</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-700">
        Here are the fastest ways to reach the Wiser Generations team directly.
      </p>
      <div className="mt-3 space-y-2">
        <a
          href={schedulingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('scheduling_cta_clicked', { source: 'ai_chat' })}
          className="block rounded-lg bg-navy px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          Book a free 30-minute call
        </a>
        <Link
          href={contactUrl}
          className="block rounded-lg border border-navy/20 bg-white px-3 py-2 text-center text-xs font-bold text-navy transition hover:border-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          Send a message
        </Link>
        <a
          href={`mailto:${supportEmail}`}
          className="block text-center text-xs font-semibold text-brand-blue underline underline-offset-2 hover:no-underline"
        >
          {supportEmail}
        </a>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-3 w-full text-center text-[11px] font-semibold text-gray-500 underline hover:text-navy"
      >
        Keep chatting instead
      </button>
    </div>
  )
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-0.5" aria-label="Assistant is typing">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-blue/60"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Icons (inline — no new dependency)
// ---------------------------------------------------------------------------

function ChatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  )
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
    </svg>
  )
}

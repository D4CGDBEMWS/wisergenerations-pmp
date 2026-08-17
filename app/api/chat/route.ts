import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { getSystemPrompt } from '@/lib/knowledge-base'
import { CHAT_CONFIG, isGiveawayActive } from '@/lib/site-config'

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// POST /api/chat
//
// The Wiser Generations Virtual Guide. The Anthropic API key is read from the
// server environment and never leaves this process — the browser only ever
// talks to this same-origin route, which is why the site's Content-Security-
// Policy needs no change.
//
// Required env vars:
//   ANTHROPIC_API_KEY  -- from https://platform.claude.com  (server-only, never
//                         prefix with NEXT_PUBLIC_)
//   ANTHROPIC_MODEL    -- optional override; defaults to claude-haiku-4-5
//
// Response is a stream of newline-delimited JSON frames:
//   {"type":"text","text":"..."}          incremental assistant text
//   {"type":"form","interest":"course"}   render the lead-capture form
//   {"type":"escalate","reason":"..."}    render the human-contact card
//   {"type":"error","message":"..."}      user-safe error message
//   {"type":"done"}                       stream finished
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = 'claude-haiku-4-5'
const MAX_TOKENS = 1024

// Chat replies are short, so this caps a runaway conversation without
// affecting real visitors. Tuned alongside CHAT_CONFIG.maxTurns.
const RATE_LIMIT = { limit: 30, windowMs: 5 * 60_000 }

type ClientMessage = { role: 'user' | 'assistant'; content: string }

const LEAD_INTERESTS = [
  'course',
  'coaching',
  'course_and_coaching',
  'ebook',
  'giveaway',
  'corporate',
  'veterans',
  'general',
] as const

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'show_lead_form',
    description:
      'Display the lead-capture form so the visitor can enter their first name and ' +
      'email address. Call this when the visitor has shown genuine interest and you ' +
      'have offered to send them information. Do not ask for an email address in your ' +
      'own message text — always use this tool, which renders a proper form with a ' +
      'privacy notice. Call it at most once per conversation unless the visitor asks ' +
      'to submit again.',
    input_schema: {
      type: 'object',
      properties: {
        interest: {
          type: 'string',
          enum: [...LEAD_INTERESTS],
          description:
            'What the visitor is actually interested in, based on the conversation.',
        },
        reason: {
          type: 'string',
          description:
            'One short sentence shown above the form explaining what they will receive, ' +
            'e.g. "Send me the PMP program details and current cohort availability."',
        },
      },
      required: ['interest', 'reason'],
    },
  },
  {
    name: 'escalate_to_human',
    description:
      'Hand the conversation off to a person. Call this immediately for billing, ' +
      'payment, refund, or account-access problems, when the visitor asks to speak ' +
      'with someone or with Crystal, when they are frustrated, or when they need an ' +
      'answer you do not have verified information for. Do not troubleshoot billing ' +
      'or access issues yourself.',
    input_schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          enum: ['billing', 'access', 'speak_to_human', 'unanswered', 'other'],
          description: 'Why the handoff is needed.',
        },
      },
      required: ['reason'],
    },
  },
]

function frame(obj: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n')
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req: NextRequest) {
  if (!CHAT_CONFIG.enabled) {
    return errorResponse('The assistant is currently unavailable.', 503)
  }

  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock

  const rateBlock = await rateLimit(req, 'chat', RATE_LIMIT)
  if (rateBlock) return rateBlock

  // -------------------------------------------------------------------------
  // Input validation
  // -------------------------------------------------------------------------
  let body: { messages?: unknown }
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid request body.', 400)
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return errorResponse('messages is required.', 400)
  }

  if (body.messages.length > CHAT_CONFIG.maxTurns) {
    return errorResponse(
      'This conversation has reached its length limit. Please start a new chat or contact us directly.',
      400
    )
  }

  const messages: Anthropic.MessageParam[] = []
  for (const raw of body.messages) {
    if (typeof raw !== 'object' || raw === null) {
      return errorResponse('Invalid message format.', 400)
    }
    const { role, content } = raw as Partial<ClientMessage>
    if (role !== 'user' && role !== 'assistant') {
      return errorResponse('Invalid message role.', 400)
    }
    if (typeof content !== 'string') {
      return errorResponse('Invalid message content.', 400)
    }
    const trimmed = content.trim()
    if (!trimmed) continue
    if (trimmed.length > CHAT_CONFIG.maxMessageLength) {
      return errorResponse(
        `Messages are limited to ${CHAT_CONFIG.maxMessageLength} characters.`,
        400
      )
    }
    messages.push({ role, content: trimmed })
  }

  if (messages.length === 0 || messages[0]!.role !== 'user') {
    return errorResponse('A conversation must begin with a visitor message.', 400)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Fail loudly rather than silently degrading — a chat widget that answers
    // nothing is worse than one that never appeared.
    console.error('[/api/chat] ANTHROPIC_API_KEY is not set')
    return errorResponse(
      'The assistant is temporarily unavailable. Please use the contact form and we will get right back to you.',
      503
    )
  }

  // -------------------------------------------------------------------------
  // Stream the response
  // -------------------------------------------------------------------------
  const client = new Anthropic({ apiKey })
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL

  const availableTools = isGiveawayActive()
    ? TOOLS
    : TOOLS.map((tool) =>
        tool.name === 'show_lead_form'
          ? {
              ...tool,
              input_schema: {
                ...tool.input_schema,
                properties: {
                  ...(tool.input_schema.properties as Record<string, unknown>),
                  interest: {
                    type: 'string',
                    enum: LEAD_INTERESTS.filter((i) => i !== 'giveaway'),
                    description:
                      'What the visitor is actually interested in, based on the conversation.',
                  },
                },
              },
            }
          : tool
      )

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      const send = (obj: unknown) => {
        if (!closed) controller.enqueue(frame(obj))
      }

      try {
        const anthropicStream = client.messages.stream({
          model,
          max_tokens: MAX_TOKENS,
          // cache_control makes the (large, identical-every-request) system
          // prompt bill at ~10% of input price after the first call.
          system: [
            {
              type: 'text',
              text: getSystemPrompt(),
              cache_control: { type: 'ephemeral' },
            },
          ],
          tools: availableTools,
          messages,
        })

        anthropicStream.on('text', (delta) => {
          send({ type: 'text', text: delta })
        })

        const final = await anthropicStream.finalMessage()

        // Tool calls become UI state, not conversation history. The client
        // stores assistant *text* only, so no tool_use block is ever replayed
        // without a matching tool_result on the next request.
        for (const block of final.content) {
          if (block.type !== 'tool_use') continue

          if (block.name === 'show_lead_form') {
            const input = block.input as { interest?: string; reason?: string }
            send({
              type: 'form',
              interest: LEAD_INTERESTS.includes(input.interest as never)
                ? input.interest
                : 'general',
              reason: typeof input.reason === 'string' ? input.reason : '',
            })
          } else if (block.name === 'escalate_to_human') {
            const input = block.input as { reason?: string }
            send({ type: 'escalate', reason: input.reason ?? 'other' })
          }
        }

        send({ type: 'done' })
      } catch (err) {
        // Log shape only — never log message content, which contains whatever
        // the visitor typed.
        if (err instanceof Anthropic.RateLimitError) {
          console.error('[/api/chat] Anthropic rate limit')
          send({
            type: 'error',
            message:
              'We are getting a lot of questions right now. Please try again in a moment.',
          })
        } else if (err instanceof Anthropic.AuthenticationError) {
          console.error('[/api/chat] Anthropic authentication failed — check ANTHROPIC_API_KEY')
          send({
            type: 'error',
            message:
              'The assistant is temporarily unavailable. Please use the contact form and we will get right back to you.',
          })
        } else if (err instanceof Anthropic.APIError) {
          console.error('[/api/chat] Anthropic API error:', err.status)
          send({
            type: 'error',
            message:
              'Something went wrong on our end. Please try again, or use the contact form.',
          })
        } else {
          console.error('[/api/chat] Unexpected error:', err)
          send({
            type: 'error',
            message:
              'Something went wrong. Please try again, or use the contact form.',
          })
        }
      } finally {
        closed = true
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}

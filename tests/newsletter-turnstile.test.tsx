// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor, act } from '@testing-library/react'
import { readFileSync } from 'fs'
import { join } from 'path'
import NewsletterSignup from '@/components/layout/NewsletterSignup'

// ---------------------------------------------------------------------------
// NewsletterSignup renders in the root layout, so it is on every page of the
// site. Its Turnstile error-callback used to set the form to an error state
// and print "Security check failed. Please refresh and try again." — meaning a
// third-party widget that could not start, for any reason, painted a red
// security warning across the whole site at a visitor who had not touched the
// form.
//
// These tests drive the real component in a DOM with a stubbed Turnstile, so
// they assert behaviour rather than the shape of the source. The distinction
// that matters throughout: a widget that fails to START is not a submission
// that failed, and only the second one is the visitor's problem.
//
// The security requirement is deliberately re-asserted rather than assumed —
// the whole risk of a change like this is quietly making it easier to submit.
// ---------------------------------------------------------------------------

const SITE_KEY = 'test-site-key'
const SECURITY_MESSAGE = 'Security check failed. Please refresh and try again.'
const INCOMPLETE_MESSAGE = 'Please complete the security check.'

type Callbacks = {
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
}

/** Captures the handlers the component hands to Turnstile so a test can fire them. */
let handlers: Callbacks = {}
let rendered = 0

function installTurnstile() {
  handlers = {}
  rendered = 0
  ;(window as unknown as { turnstile: unknown }).turnstile = {
    render: (_el: HTMLElement, opts: Callbacks & { sitekey: string }) => {
      handlers = opts
      rendered += 1
      return 'widget-1'
    },
    reset: () => {},
    remove: () => {},
  }
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', SITE_KEY)
  installTurnstile()
})

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  delete (window as unknown as { turnstile?: unknown }).turnstile
})

/** Turnstile invokes its callbacks from outside React, so the state updates
 *  they cause have to be flushed before anything is asserted about the DOM. */
const fire = (cb: (() => void) | undefined) => act(() => { cb?.() })

const emailBox = () => screen.getByLabelText(/email address/i)
const subscribe = () => screen.getByRole('button', { name: /subscribe/i }) as HTMLButtonElement
/** Plain DOM property — no jest-dom matcher dependency needed. */
const subscribeDisabled = () => subscribe().disabled

describe('A. Turnstile fails to initialise, before the visitor touches anything', () => {
  it('shows no security warning at all', async () => {
    render(<NewsletterSignup />)
    await waitFor(() => expect(rendered).toBe(1))

    fire(handlers['error-callback'])

    // The specific string that used to appear sitewide.
    expect(screen.queryByText(SECURITY_MESSAGE)).toBeNull()
    // And nothing else alarming took its place.
    expect(screen.queryByRole('alert')).toBeNull()
    expect(document.body.textContent).not.toMatch(/security check/i)
  })

  it('still clears the token, so the form knows it has nothing valid', () => {
    render(<NewsletterSignup />)
    fire(() => handlers.callback?.('a-token'))
    expect(subscribeDisabled()).toBe(false)

    fire(handlers['error-callback'])
    // A disabled Subscribe button is the only outward sign, which is correct:
    // there is nothing to submit with.
    expect(subscribeDisabled()).toBe(true)
  })

  it('an expired token is treated the same way — silently', () => {
    render(<NewsletterSignup />)
    fire(() => handlers.callback?.('a-token'))
    fire(handlers['expired-callback'])
    expect(subscribeDisabled()).toBe(true)
    expect(document.body.textContent).not.toMatch(/security check/i)
  })
})

describe('B. The visitor actually submits without a valid token', () => {
  it('does not send the request, and says so', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    render(<NewsletterSignup />)
    fire(handlers['error-callback']) // no token

    fireEvent.change(emailBox(), { target: { value: 'someone@example.com' } })
    fireEvent.submit(emailBox().closest('form')!)

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText(INCOMPLETE_MESSAGE)).toBeTruthy()
    // The submission is blocked, not merely discouraged.
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('surfaces the approved wording when the server rejects the token', async () => {
    // This is where SECURITY_MESSAGE legitimately reaches the visitor:
    // /api/subscribe returns it when verifyTurnstile() rejects the token.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: SECURITY_MESSAGE }),
    }))

    render(<NewsletterSignup />)
    fire(() => handlers.callback?.('a-stale-token'))
    fireEvent.change(emailBox(), { target: { value: 'someone@example.com' } })
    fireEvent.submit(emailBox().closest('form')!)

    await waitFor(() => expect(screen.getByText(SECURITY_MESSAGE)).toBeTruthy())
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})

describe('C. The ordinary path is unchanged', () => {
  it('sends the token and confirms the signup', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchSpy)

    render(<NewsletterSignup />)
    fire(() => handlers.callback?.('a-good-token'))
    fireEvent.change(emailBox(), { target: { value: 'someone@example.com' } })
    fireEvent.submit(emailBox().closest('form')!)

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))
    const [url, init] = fetchSpy.mock.calls[0]!
    expect(url).toBe('/api/subscribe')
    const sent = JSON.parse((init as RequestInit).body as string)
    expect(sent.turnstileToken).toBe('a-good-token')
    expect(sent.email).toBe('someone@example.com')

    await waitFor(() => expect(screen.getByRole('status')).toBeTruthy())
    expect(document.body.textContent).toMatch(/You’re in!/)
  })

  it('the button is disabled until a token arrives', async () => {
    render(<NewsletterSignup />)
    await waitFor(() => expect(rendered).toBe(1))
    expect(subscribeDisabled()).toBe(true)
    fire(() => handlers.callback?.('a-good-token'))
    expect(subscribeDisabled()).toBe(false)
  })
})

describe('D. Nothing the visitor reads was reworded', () => {
  const src = readFileSync(join(process.cwd(), 'components/layout/NewsletterSignup.tsx'), 'utf8')
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

  it('keeps every existing customer-facing string', () => {
    for (const phrase of [
      'Free Weekly Insights',
      'PM Tips from Crystal',
      'Exam tips, cohort announcements, and real-world PM wisdom. No spam. Unsubscribe anytime.',
      'you@example.com',
      'Subscribe',
      'Subscribing',
      INCOMPLETE_MESSAGE,
      'Could not sign you up. Please try again.',
      'Something went wrong. Please try again.',
      'Email address',
    ]) {
      expect(code, `missing: ${phrase}`).toContain(phrase)
    }
  })

  it('no longer announces a security failure from the widget callback', () => {
    // Comments are stripped, so the explanation of the fix cannot satisfy this.
    const cb = code.slice(code.indexOf("'error-callback'"), code.indexOf("'error-callback'") + 200)
    expect(cb).not.toContain('setStatus')
    expect(cb).not.toContain('setMessage')
    expect(code).not.toContain(`setMessage('${SECURITY_MESSAGE}')`)
  })

  it('the security requirement itself is untouched', () => {
    // Submission is gated on a token, and the widget still renders when a
    // site key is configured. Neither may be quietly dropped.
    expect(code).toContain('if (siteKey && !turnstileToken)')
    expect(code).toContain('turnstileToken,')
    expect(code).toMatch(/disabled=\{[^}]*!!siteKey && !turnstileToken/)
  })
})

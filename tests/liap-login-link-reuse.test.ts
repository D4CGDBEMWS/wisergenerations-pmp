import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Owner report 2026-11-04: clicking the LIAP email link a second time showed
// the Study Access sign-in page with "expired".

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

describe('a used or expired sign-in link', () => {
  const route = read('app/api/access/login/route.ts')
  it('sends an already signed-in, entitled customer straight to where the link was going', () => {
    expect(route).toContain('lookupUnusableToken(token)')
    expect(route).toContain('validateSession(req.cookies.get(SESSION_COOKIE)?.value)')
    expect(route).toContain('hasEntitlement(session.customerId, config.entitlementKey)')
  })
  it("otherwise uses the link's own product sign-in page, never /access for a book reader", () => {
    expect(route).toContain('`${config.signInPath}?error=expired`')
    expect(route).not.toContain("new URL('/access?error=expired'")
  })
  it('the lookup is read-only', () => {
    const lib = read('lib/auth/login-token.ts')
    const fn = lib.slice(lib.indexOf('export async function lookupUnusableToken'))
    expect(fn.slice(0, fn.indexOf('\n}\n'))).not.toMatch(/UPDATE|DELETE|INSERT/)
  })
  it('the LIAP sign-in page explains the error', () => {
    const page = read('app/living-is-a-project/access/page.tsx')
    expect(page).toContain('That link has already been used or has expired')
    expect(page).toContain('role="alert"')
  })
})

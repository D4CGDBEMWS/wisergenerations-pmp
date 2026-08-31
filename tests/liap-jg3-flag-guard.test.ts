import { describe, it, expect, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { notFound } from 'next/navigation'
import { isEnabled, assertEnabledOrNotFound } from '@/lib/flags'

// ---------------------------------------------------------------------------
// JG-3: the flag guard must fail closed as a 404, not a 500.
//
// The helper hand-set `digest = 'NEXT_NOT_FOUND'` on a plain Error. Next 16
// stopped recognising that, so a disabled route answered 500 with a stack
// trace instead of 404.
//
// That is not cosmetic. A 500 is a DIFFERENT answer from a 404, and a
// different answer is information: probing a disabled feature returned
// something a non-existent path never would — the exact enumeration signal
// the 404 was chosen to prevent.
//
// The decisive test is not "it throws". It is that what it throws is
// INDISTINGUISHABLE from what Next's own notFound() throws, because that is
// the only property that survives a framework upgrade.
// ---------------------------------------------------------------------------

const source = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const code = (p: string) =>
  source(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/** What Next itself throws for a 404, on the version actually installed. */
function realNotFoundError(): Error & { digest?: string } {
  try {
    notFound()
  } catch (err) {
    return err as Error & { digest?: string }
  }
  throw new Error('notFound() did not throw — the framework contract changed')
}

const FLAG_ENV = 'FEATURE_LIAP_JOURNEY'

afterEach(() => {
  delete process.env[FLAG_ENV]
})

describe('the flag guard fails closed as a 404', () => {
  it('feature disabled → throws the framework 404, not a generic error', () => {
    delete process.env[FLAG_ENV]
    expect(isEnabled('LIAP_JOURNEY')).toBe(false)

    let thrown: (Error & { digest?: string }) | null = null
    try {
      assertEnabledOrNotFound('LIAP_JOURNEY')
    } catch (err) {
      thrown = err as Error & { digest?: string }
    }
    expect(thrown, 'the guard must throw when the flag is off').not.toBeNull()

    // The whole fix, in one assertion: the guard's error and Next's own 404
    // error carry the same digest. If a future Next changes that shape, this
    // test moves with it rather than silently passing on a stale constant.
    const real = realNotFoundError()
    expect(thrown!.digest).toBe(real.digest)
    expect(thrown!.digest).toBeTruthy()
  })

  it('and never the hand-set digest that Next 16 stopped honouring', () => {
    const c = code('lib/flags.ts')
    // The precise defect: a literal digest string assigned to an Error.
    expect(c).not.toMatch(/digest\s*=\s*'NEXT_NOT_FOUND'/)
    expect(c).not.toMatch(/new Error\([^)]*disabled/)
    expect(c).toContain('notFound()')
    expect(c).toContain("from 'next/navigation'")
  })

  it('feature enabled → returns, and does not throw', () => {
    process.env[FLAG_ENV] = 'true'
    expect(isEnabled('LIAP_JOURNEY')).toBe(true)
    expect(() => assertEnabledOrNotFound('LIAP_JOURNEY')).not.toThrow()
  })

  it('anything other than the exact string "true" leaves the flag off', () => {
    for (const value of ['TRUE', 'True', '1', 'yes', 'on', '', ' true']) {
      process.env[FLAG_ENV] = value
      expect(isEnabled('LIAP_JOURNEY'), value).toBe(false)
      expect(() => assertEnabledOrNotFound('LIAP_JOURNEY'), value).toThrow()
    }
  })

  it('an unset flag is off, so a typo fails closed rather than open', () => {
    delete process.env[FLAG_ENV]
    expect(isEnabled('LIAP_JOURNEY')).toBe(false)
    // A misspelled flag name reads an unset variable, which is also false.
    expect(isEnabled('LIAP_JOURNEY_TYPO' as never)).toBe(false)
  })

  it('returns nothing on success, so no caller can read a value from it', () => {
    process.env[FLAG_ENV] = 'true'
    expect(assertEnabledOrNotFound('LIAP_JOURNEY')).toBeUndefined()
  })

  it('throws before doing anything else, so no protected work precedes it', () => {
    const c = code('lib/flags.ts')
    const fn = c.slice(c.indexOf('export function assertEnabledOrNotFound'))
    const body = fn.slice(fn.indexOf('{'), fn.indexOf('\n}'))
    // One statement. Nothing is computed, fetched or logged before the guard.
    expect(body).toContain('if (!isEnabled(flag)) notFound()')
    expect(body).not.toMatch(/await|fetch|console|db|query/i)
  })
})

describe('the guard is consistent with every hand-rolled gate', () => {
  it('the routes that chose notFound() directly still behave identically', () => {
    // Those routes worked around the broken helper. They are unchanged, and
    // now the helper agrees with them rather than differing.
    for (const route of [
      'app/liap/journey/page.tsx',
      'app/liap/journey/my-project/page.tsx',
      'app/liap/journey/facilitator/[retreatId]/page.tsx',
      'app/liap/game/page.tsx',
    ]) {
      const c = code(route)
      expect(c, route).toContain('notFound()')
    }
  })

  it('a disabled feature and a missing route are the same answer', () => {
    delete process.env[FLAG_ENV]
    let guardDigest: string | undefined
    try {
      assertEnabledOrNotFound('LIAP_JOURNEY')
    } catch (err) {
      guardDigest = (err as { digest?: string }).digest
    }
    // Identical to what a route that simply does not exist produces.
    expect(guardDigest).toBe(realNotFoundError().digest)
  })
})

import { describe, it, expect } from 'vitest'
import {
  base32Encode,
  base32Decode,
  generateSecret,
  counterFor,
  codeForCounter,
  verifyCode,
  enrolmentUri,
} from '@/lib/staff/totp'

// ---------------------------------------------------------------------------
// TOTP.
//
// This is hand-written rather than taken from npm, so "is it actually
// correct?" has to be answered rather than assumed. The first block below
// checks it against the published RFC 6238 test vectors — the same numbers
// every authenticator app is verified against. If these pass, a staff
// member's phone and this server will agree.
// ---------------------------------------------------------------------------

// RFC 6238 Appendix B uses the ASCII seed "12345678901234567890" for SHA-1.
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890', 'ascii'))

describe('RFC 6238 test vectors', () => {
  // Times and expected 8-digit values from the RFC, truncated to the 6 digits
  // this implementation emits.
  const VECTORS: Array<[number, string]> = [
    [59, '287082'],
    [1111111109, '081804'],
    [1111111111, '050471'],
    [1234567890, '005924'],
    [2000000000, '279037'],
    [20000000000, '353130'],
  ]

  for (const [seconds, expected] of VECTORS) {
    it(`matches the published code at t=${seconds}`, () => {
      expect(codeForCounter(RFC_SECRET, counterFor(seconds * 1000))).toBe(expected)
    })
  }
})

describe('base32', () => {
  it('round-trips arbitrary bytes', () => {
    for (const bytes of [[0], [255], [1, 2, 3], [0, 0, 0, 0, 0], [72, 101, 108, 108, 111]]) {
      const buf = Buffer.from(bytes)
      expect(base32Decode(base32Encode(buf))).toEqual(buf)
    }
  })

  it('tolerates how a person retypes a secret off a screen', () => {
    const secret = generateSecret()
    const messy = secret.toLowerCase().replace(/(.{4})/g, '$1 ')
    expect(base32Decode(messy)).toEqual(base32Decode(secret))
  })

  it('refuses characters that are not base32', () => {
    // 0, 1, 8 and 9 are excluded from the alphabet precisely because they are
    // confusable with O, I and B when read off a screen.
    expect(() => base32Decode('ABC0DEF')).toThrow()
    expect(() => base32Decode('hello!')).toThrow()
  })
})

describe('generated secrets', () => {
  it('are 160 bits, the size every authenticator app expects', () => {
    expect(base32Decode(generateSecret())).toHaveLength(20)
  })

  it('are not predictable', () => {
    const seen = new Set(Array.from({ length: 50 }, () => generateSecret()))
    expect(seen.size).toBe(50)
  })
})

describe('verifying a code', () => {
  const secret = generateSecret()
  const now = 1_800_000_000_000

  it('accepts the current code', () => {
    const code = codeForCounter(secret, counterFor(now))
    expect(verifyCode(secret, code, { atMs: now }).ok).toBe(true)
  })

  it('accepts one step of clock drift either way', () => {
    for (const drift of [-1, 1]) {
      const code = codeForCounter(secret, counterFor(now) + drift)
      expect(verifyCode(secret, code, { atMs: now }).ok).toBe(true)
    }
  })

  it('refuses two steps out — a code is good for 90 seconds, not longer', () => {
    for (const drift of [-2, 2, 10, -100]) {
      const code = codeForCounter(secret, counterFor(now) + drift)
      expect(verifyCode(secret, code, { atMs: now }).ok).toBe(false)
    }
  })

  it('refuses a code from a different secret', () => {
    const other = generateSecret()
    const code = codeForCounter(other, counterFor(now))
    expect(verifyCode(secret, code, { atMs: now }).ok).toBe(false)
  })

  it('refuses anything that is not six digits', () => {
    for (const bad of ['', '12345', '1234567', 'abcdef', '12 34 56 78', '-12345']) {
      expect(verifyCode(secret, bad, { atMs: now }).ok).toBe(false)
    }
  })

  it('tolerates spaces, because apps display codes in groups', () => {
    const code = codeForCounter(secret, counterFor(now))
    const spaced = `${code.slice(0, 3)} ${code.slice(3)}`
    expect(verifyCode(secret, spaced, { atMs: now }).ok).toBe(true)
  })
})

describe('a code cannot be used twice', () => {
  const secret = generateSecret()
  const now = 1_800_000_000_000

  it('reports the counter so the caller can record it', () => {
    const result = verifyCode(secret, codeForCounter(secret, counterFor(now)), { atMs: now })
    expect(result.ok).toBe(true)
    expect(result.counter).toBe(counterFor(now))
  })

  it('refuses the same code once its counter has been recorded', () => {
    // The replay this prevents: somebody reads the code over a shoulder or in
    // a screen share and uses it before the window closes. Without the floor
    // it stays valid for up to 90 seconds.
    const counter = counterFor(now)
    const code = codeForCounter(secret, counter)

    expect(verifyCode(secret, code, { atMs: now }).ok).toBe(true)
    expect(verifyCode(secret, code, { atMs: now, lastCounter: counter }).ok).toBe(false)
  })

  it('refuses an older code once a newer one has been used', () => {
    const counter = counterFor(now)
    const older = codeForCounter(secret, counter - 1)
    expect(verifyCode(secret, older, { atMs: now, lastCounter: counter }).ok).toBe(false)
  })

  it('still accepts the next code', () => {
    const counter = counterFor(now)
    const next = codeForCounter(secret, counter + 1)
    expect(verifyCode(secret, next, { atMs: now, lastCounter: counter }).ok).toBe(true)
  })
})

describe('the enrolment URI', () => {
  it('is a scannable otpauth URI carrying the secret and issuer', () => {
    const secret = generateSecret()
    const uri = enrolmentUri('owner@wisergenerations.com', secret)

    expect(uri.startsWith('otpauth://totp/')).toBe(true)

    const parsed = new URL(uri)
    expect(parsed.searchParams.get('secret')).toBe(secret)
    expect(parsed.searchParams.get('issuer')).toBe('Wiser Generations')
    expect(parsed.searchParams.get('digits')).toBe('6')
    expect(parsed.searchParams.get('period')).toBe('30')
  })

  it('escapes an address so the label cannot break the URI', () => {
    const uri = enrolmentUri('odd name+tag@example.com', generateSecret())
    expect(() => new URL(uri)).not.toThrow()
    expect(uri).not.toContain(' ')
  })
})

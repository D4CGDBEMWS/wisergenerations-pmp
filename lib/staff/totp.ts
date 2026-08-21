import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

// ---------------------------------------------------------------------------
// TOTP — the second factor for staff sign-in. RFC 6238.
//
// Hand-written rather than pulled from npm, and that is a deliberate choice
// worth defending: TOTP is about sixty lines of standard library code, and a
// dependency in the authentication path is a supply-chain risk on the one
// surface where a compromise means somebody can approve money. The algorithm
// has not changed since 2011 and is verified below against the published
// RFC 6238 test vectors, so "is our implementation right?" is answerable
// rather than trusted.
//
// The business owner chose an authenticator app on 21 August 2026 over
// emailed codes — which share the weakness of the magic link they would be
// doubling — and over passkeys, which are stronger but less familiar for a
// login used daily by two or three people.
// ---------------------------------------------------------------------------

/** Seconds per code. 30 is the near-universal default; changing it breaks every enrolled app. */
const STEP_SECONDS = 30

/** Digits in a code. */
const DIGITS = 6

/**
 * How many steps either side of now are accepted.
 *
 * One step, so a code is good for at most 90 seconds. Phone clocks drift and
 * people finish typing a moment late; zero tolerance produces support calls
 * that get "fixed" by widening this to something careless. One is the
 * smallest number that is actually usable.
 */
const SKEW_STEPS = 1

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/** Base32 (RFC 4648, no padding) — what every authenticator app expects. */
export function base32Encode(buf: Buffer): string {
  let bits = 0
  let value = 0
  let out = ''

  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return out
}

export function base32Decode(input: string): Buffer {
  // Users retype secrets off a screen: strip spaces, ignore case, drop the
  // padding some apps add.
  const clean = input.toUpperCase().replace(/[\s=]/g, '')

  let bits = 0
  let value = 0
  const out: number[] = []

  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char)
    if (idx === -1) throw new Error('invalid base32 character in TOTP secret')
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

/**
 * A new secret.
 *
 * 20 bytes = 160 bits, the size RFC 4226 specifies for HMAC-SHA1 and what
 * every authenticator app is built around.
 */
export function generateSecret(): string {
  return base32Encode(randomBytes(20))
}

/** Which 30-second step a moment falls in. */
export function counterFor(atMs: number): number {
  return Math.floor(atMs / 1000 / STEP_SECONDS)
}

/**
 * The code for one counter value.
 *
 * Standard HOTP dynamic truncation: HMAC the counter as a big-endian 64-bit
 * value, take the low nibble of the last byte as an offset, read four bytes
 * from there, mask the sign bit, and take the last six digits.
 */
export function codeForCounter(secret: string, counter: number): string {
  const key = base32Decode(secret)

  const buf = Buffer.alloc(8)
  // Split across two 32-bit writes: counter exceeds Number's 32-bit range,
  // and writeUInt32BE cannot take the whole thing.
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0)
  buf.writeUInt32BE(counter >>> 0, 4)

  const hmac = createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1]! & 0x0f
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    (hmac[offset + 1]! << 16) |
    (hmac[offset + 2]! << 8) |
    hmac[offset + 3]!

  return String(binary % 10 ** DIGITS).padStart(DIGITS, '0')
}

export interface VerifyResult {
  ok: boolean
  /** The counter the code matched. Store it to stop the same code being reused. */
  counter?: number
}

/**
 * Checks a submitted code.
 *
 * Two properties beyond "does it match":
 *
 *   Constant-time comparison, so the number of leading digits an attacker got
 *   right is not observable in the response time.
 *
 *   A floor. Passing the last counter this account used causes anything at or
 *   below it to be refused, which makes each code genuinely single-use rather
 *   than valid for its whole window. Without that, a code observed over a
 *   shoulder or in a screen share can be replayed for up to 90 seconds — and
 *   this is the factor standing between a stolen mailbox and financial
 *   approval, so the small hardening is worth it.
 */
export function verifyCode(
  secret: string,
  submitted: string,
  options: { atMs?: number; lastCounter?: number | null } = {}
): VerifyResult {
  const cleaned = submitted.replace(/\s/g, '')
  if (!/^\d{6}$/.test(cleaned)) return { ok: false }

  const now = counterFor(options.atMs ?? Date.now())
  const floor = options.lastCounter ?? null

  for (let drift = -SKEW_STEPS; drift <= SKEW_STEPS; drift++) {
    const counter = now + drift
    if (counter < 0) continue
    if (floor !== null && counter <= floor) continue

    const expected = codeForCounter(secret, counter)
    const a = Buffer.from(expected)
    const b = Buffer.from(cleaned)
    if (a.length === b.length && timingSafeEqual(a, b)) {
      return { ok: true, counter }
    }
  }
  return { ok: false }
}

/**
 * The otpauth:// URI an authenticator app scans.
 *
 * The label and issuer identify the account in the app's list, which matters
 * when somebody has a dozen entries and needs to find this one.
 *
 * Note what this is NOT: a QR image. Rendering the code is the caller's job,
 * and the URI must never be logged, emailed or persisted anywhere but the
 * staff record — it contains the secret.
 */
export function enrolmentUri(email: string, secret: string): string {
  const issuer = 'Wiser Generations'
  const label = `${issuer}:${email}`
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  })
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`
}

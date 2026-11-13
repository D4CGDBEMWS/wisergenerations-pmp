import { describe, it, expect, afterEach } from 'vitest'
import { FEATURE_FLAGS, isEnabled, type FeatureFlag } from '@/lib/flags'

// Flags fail closed. The failure mode this guards against is a truthy-looking
// value ("1", "yes", "TRUE") quietly opening a gate nobody approved.
const original = { ...process.env }
afterEach(() => {
  process.env = { ...original }
})

describe('feature flags default OFF', () => {
  it('every flag is off with nothing set', () => {
    for (const f of FEATURE_FLAGS) {
      delete process.env[`FEATURE_${f}`]
      expect(isEnabled(f), f).toBe(false)
    }
  })

  it('only the exact string "true" opens a flag', () => {
    const f: FeatureFlag = 'VT_LISTINGS'
    for (const v of ['1', 'yes', 'TRUE', 'True', 'on', '', ' true ']) {
      process.env[`FEATURE_${f}`] = v
      expect(isEnabled(f), `"${v}" must not enable`).toBe(false)
    }
    process.env[`FEATURE_${f}`] = 'true'
    expect(isEnabled(f)).toBe(true)
  })

  it('the two safety-critical flags are present and off', () => {
    for (const f of ['VT_BLESS_A_NEIGHBOR', 'VT_LIVE_BOOKINGS'] as const) {
      expect(FEATURE_FLAGS).toContain(f)
      delete process.env[`FEATURE_${f}`]
      expect(isEnabled(f)).toBe(false)
    }
  })
})

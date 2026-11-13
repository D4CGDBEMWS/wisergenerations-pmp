import { describe, it, expect } from 'vitest'
import { validateProfile } from '@/lib/profiles'
import { validateListing, detectPrivateDetails } from '@/lib/listings'

describe('profile validation', () => {
  const ok = { displayName: 'Dana R.', zip: '30080' }

  it('accepts a valid profile in the pilot area', () => {
    const r = validateProfile(ok)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toEqual({ displayName: 'Dana R.', zip: '30080' })
  })

  it('refuses a ZIP outside Cobb County, and says so plainly', () => {
    const r = validateProfile({ ...ok, zip: '30309' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toContain('zip_outside_pilot_area')
  })

  it('normalises a ZIP+4', () => {
    const r = validateProfile({ ...ok, zip: '30080-1234' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.zip).toBe('30080')
  })

  it('rejects non-string and empty input without throwing', () => {
    for (const bad of [null, undefined, 42, {}, []]) {
      const r = validateProfile({ displayName: bad, zip: bad })
      expect(r.ok).toBe(false)
    }
  })

  it('collects every problem at once rather than one at a time', () => {
    const r = validateProfile({ displayName: 'A', zip: 'nope' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errors).toContain('display_name_too_short')
      expect(r.errors).toContain('zip_invalid')
    }
  })
})

const ok = {
  title: 'Yard clean-up and leaf removal',
  body: 'Half-day and full-day options available.',
  kind: 'service',
  offerType: 'combined',
  zip: '30060',
  categorySlug: 'yard',
}

describe('listing validation', () => {

  it('accepts a well-formed listing', () => {
    const r = validateListing(ok)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.warnings).toEqual([])
  })

  it('refuses an unknown kind or offer type', () => {
    expect(validateListing({ ...ok, kind: 'rental' }).ok).toBe(false)
    expect(validateListing({ ...ok, offerType: 'crypto' }).ok).toBe(false)
  })

  it('refuses publication outside the pilot area', () => {
    const r = validateListing({ ...ok, zip: '90210' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toContain('zip_outside_pilot_area')
  })
})

describe('private details in public text are detected', () => {
  it('spots a phone number in several formats', () => {
    for (const t of ['call 770-555-0101', '(770) 555-0101', '+1 770.555.0101', '7705550101']) {
      expect(detectPrivateDetails(t), t).toContain('contains_phone_number')
    }
  })

  it('spots an email address', () => {
    expect(detectPrivateDetails('reach me at dana.r+vt@example.com')).toContain('contains_email')
  })

  it('spots a street address', () => {
    for (const t of ['123 Oak Street', '45 Maple Ave.', '9 Powder Springs Road']) {
      expect(detectPrivateDetails(t), t).toContain('contains_street_address')
    }
  })

  it('does not fire on ordinary listing prose', () => {
    expect(detectPrivateDetails('Half-day and full-day yard work, 4 or 8 hours.')).toEqual([])
    expect(detectPrivateDetails('I have 20 years of experience in Marietta.')).toEqual([])
  })

  it('warns but still validates — a warning is not a refusal', () => {
    const r = validateListing({ ...ok, body: 'Call me on 770-555-0101 to arrange a time.' })
    expect(r.ok).toBe(true)
    expect(r.warnings).toContain('contains_phone_number')
  })
})

// ---------------------------------------------------------------------------
// The pilot service area.
//
// Founder ruling: Cobb County, Georgia only. Any geographic expansion
// requires founder approval.
//
// ── WHY A LIST AND A GUARD, NOT A RADIUS ───────────────────────────────────
//
// A radius quietly expands: pick a centre and a mile count and the service
// area grows whenever somebody tweaks the number. An explicit ZIP allow-list
// cannot grow by accident — adding a ZIP is a visible diff, and the database
// (zip_areas + the listing publish trigger) refuses anything not on it.
//
// ── THIS LIST NEEDS FOUNDER CONFIRMATION ───────────────────────────────────
//
// These are the principal Cobb County ZIP codes. Some ZIPs on the county
// border also cover parts of Cherokee, Fulton or Paulding, and which of those
// count as "approved Cobb County service areas" is a business decision, not
// one for me to make. Treated as DRAFT until signed off.
// ---------------------------------------------------------------------------

export interface ZipArea {
  readonly zip: string
  readonly city: string
}

/** DRAFT — pending founder confirmation. */
export const COBB_COUNTY_ZIPS: readonly ZipArea[] = [
  { zip: '30008', city: 'Marietta' },
  { zip: '30060', city: 'Marietta' },
  { zip: '30062', city: 'Marietta' },
  { zip: '30064', city: 'Marietta' },
  { zip: '30066', city: 'Marietta' },
  { zip: '30067', city: 'Marietta' },
  { zip: '30068', city: 'Marietta' },
  { zip: '30080', city: 'Smyrna' },
  { zip: '30082', city: 'Smyrna' },
  { zip: '30101', city: 'Acworth' },
  { zip: '30102', city: 'Acworth' },
  { zip: '30106', city: 'Austell' },
  { zip: '30126', city: 'Mableton' },
  { zip: '30127', city: 'Powder Springs' },
  { zip: '30144', city: 'Kennesaw' },
  { zip: '30152', city: 'Kennesaw' },
  { zip: '30168', city: 'Austell' },
  { zip: '30339', city: 'Vinings' },
]

export const COUNTY = 'Cobb'
export const STATE = 'GA'

export function isInPilotArea(zip: string): boolean {
  return COBB_COUNTY_ZIPS.some((z) => z.zip === zip)
}

export function cityForZip(zip: string): string | null {
  return COBB_COUNTY_ZIPS.find((z) => z.zip === zip)?.city ?? null
}

/** Normalises user input ("30080-1234", " 30080 ") to a 5-digit ZIP, or null. */
export function normalizeZip(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const m = input.trim().match(/^(\d{5})(?:-\d{4})?$/)
  return m ? m[1]! : null
}

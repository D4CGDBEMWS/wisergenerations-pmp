// ---------------------------------------------------------------------------
// The approved programs.
//
// ── WHAT IS AND IS NOT IN THIS FILE ────────────────────────────────────────
//
// Every fact below was stated by the founder: the names, that both signature
// programs are open to qualified providers regardless of gender, the three
// booking durations, the three compensation shapes, and the list of
// celebrations.
//
// There is NO marketing prose here, because none was approved. No "trusted
// neighbours", no "peace of mind", no invented benefit. When the founder
// supplies descriptions they go in these `description` fields and nowhere
// else. Rendering facts is honest; writing the pitch would not be mine to do.
// ---------------------------------------------------------------------------

export type BookingDuration = 'individual' | 'half_day_4h' | 'full_day_8h'

export const DURATION_LABELS: Readonly<Record<BookingDuration, string>> = {
  individual: 'Individual task',
  half_day_4h: 'Half day — up to 4 hours',
  full_day_8h: 'Full day — up to 8 hours',
}

export type Compensation = 'paid' | 'barter' | 'combined'

export const COMPENSATION_LABELS: Readonly<Record<Compensation, string>> = {
  paid: 'Payment',
  barter: 'Barter',
  combined: 'Combined payment and barter',
}

export interface Program {
  readonly slug: string
  readonly name: string
  readonly trademark: boolean
  /** Founder-supplied only. Empty string means copy is still awaited. */
  readonly description: string
  readonly durations: readonly BookingDuration[]
  readonly compensation: readonly Compensation[]
  readonly enabled: boolean
  readonly notes?: string
}

export const PROGRAMS: readonly Program[] = [
  {
    slug: 'a-good-man-for-the-day',
    name: 'A Good Man for the Day',
    trademark: true,
    description: 'Practical services, offered by qualified providers regardless of gender.',
    durations: ['individual', 'half_day_4h', 'full_day_8h'],
    compensation: ['paid', 'barter', 'combined'],
    enabled: true,
  },
  {
    slug: 'a-good-woman-for-the-day',
    name: 'A Good Woman for the Day',
    trademark: true,
    description: 'Practical services, offered by qualified providers regardless of gender.',
    durations: ['individual', 'half_day_4h', 'full_day_8h'],
    compensation: ['paid', 'barter', 'combined'],
    enabled: true,
  },
  {
    slug: 'holiday-helping-hands',
    name: 'VillageTrade Holiday Helping Hands',
    trademark: true,
    description: '',
    durations: ['individual', 'half_day_4h', 'full_day_8h'],
    compensation: ['paid', 'barter', 'combined'],
    enabled: true,
    notes: 'Seasonal.',
  },
  {
    slug: 'holiday-help-wishlist',
    name: 'Holiday Help Wishlist',
    trademark: true,
    description: '',
    durations: ['individual'],
    compensation: ['paid', 'barter', 'combined'],
    enabled: true,
    notes: 'Customers may request multiple tasks; providers may submit bundled proposals.',
  },
  {
    slug: 'bless-a-neighbor',
    name: 'Bless a Neighbor',
    trademark: false,
    description: '',
    durations: [],
    compensation: [],
    // Founder ruling: disabled pending additional privacy and financial
    // safeguards. Listed here so it is not quietly forgotten; there is no
    // route, no schema and no UI behind it.
    enabled: false,
    notes: 'Disabled pending additional review.',
  },
]

/** Celebrations named by the founder. Not an exhaustive or exclusive list. */
export const CELEBRATIONS: readonly string[] = [
  'Thanksgiving',
  'Hanukkah',
  'Christmas',
  'Kwanzaa',
  'New Year’s',
]

export function activePrograms(): readonly Program[] {
  return PROGRAMS.filter((p) => p.enabled)
}

// Shared audience data for the homepage "Who Are You?" router.
//
// Lives in its own module so the router component and the test that guards the
// mapping can both import it without pulling a client component into a server
// context.

export const AUDIENCES = [
  { id: 'all', label: 'All Programs' },
  { id: 'professional', label: 'Career Transitioner' },
  { id: 'veteran', label: 'Veteran' },
  { id: 'corporate', label: 'Corporate Team' },
  { id: 'earlycareer', label: 'Early Career' },
]

// Exported so a test can assert every id here exists in PROGRAMS. It listed
// 'pmp-adult', which is not a program id — the id is 'pmp' — so selecting
// "Career Transitioner" silently filtered the PMP program out of the results.
export const AUDIENCE_MAP: Record<string, string[]> = {
  all: [],
  professional: ['pmp', 'capm-adult'],
  veteran: ['veterans'],
  corporate: ['corporate'],
  earlycareer: ['capm-adult'],
}

/** Where each program card's CTA goes. Kept beside the map it belongs to. */
export const PROGRAM_HREF: Record<string, string> = {
  pmp: '/pmp',
  'capm-adult': '/capm',
  veterans: '/veterans',
  corporate: '/corporate',
}

/** The per-card outcome headline, previously inlined as four conditionals. */
export const OUTCOME_HEADLINE: Record<string, string> = {
  pmp: 'Earn your credential. Advance your career.',
  'capm-adult': 'Land your first PM role — fast.',
  veterans: 'Your military leadership. Now certified.',
  corporate: 'Elevate your team. Standardize excellence.',
}

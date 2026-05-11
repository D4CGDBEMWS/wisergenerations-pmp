export const SITE_NAME = 'Wiser Generations Int\'l™'
export const SITE_URL = 'https://wisergenerations.com'
export const TAGLINE = 'Project Manage Your Career. Transform Your Future.™'
export const FOUNDER = 'Crystal Stewart, PMP®'
export const FOUNDER_TITLE = 'The Project Management Evangelist™'
export const COMPANY = 'Enterprise Academy™'

// ---------------------------------------------------------------------------
// PRICING TIERS — single source of truth for all pricing across the site.
// Homepage cards use `priceFrom` (the entry-level price).
// /programs and /pmp pages render the full PMP_TIERS / CAPM_TIERS arrays.
// /checkout uses CHECKOUT_PROGRAMS.
// ---------------------------------------------------------------------------

export const PMP_TIERS = [
  {
        id: 'pmp-essentials',
        name: 'PMP® Essentials',
        price: 1497,
        badge: '',
        highlight: false,
        description: 'Structured cohort prep for working professionals who are ready to earn the PMP® credential.',
        features: [
                '36 hours of PMI-aligned education',
                'Cohort access (live sessions)',
                'Practice exam bank (500+ questions)',
                'Study guide',
              ],
  },
  {
        id: 'pmp-professional',
        name: 'PMP® Professional',
        price: 2200,
        badge: 'Most Popular',
        highlight: true,
        description: 'Everything in Essentials, plus mentorship, application support, and a pass guarantee.',

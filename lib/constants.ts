export const SITE_NAME = 'Wiser Generations Int\'l'
export const SITE_URL = 'https://wisergenerations.com'
export const TAGLINE = 'Project Manage Your Career. Transform Your Future.™'
export const FOUNDER = 'Crystal Stewart,  PMP®'
export const FOUNDER_TITLE = 'The Project Management Evangelist™'
export const COMPANY = 'Enterprise Academy'

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
    price: 899,
    badge: '',
    highlight: false,
    description: 'Structured cohort prep for working professionals who are ready to earn the PMP® credential.',
    features: [
      '36 hours of PMI-aligned education',
      'Cohort access (live sessions)',
      'Practice bank: 694 questions + full-length mock exam',
      'Study guide',
    ],
  },
  {
    id: 'pmp-professional',
    name: 'PMP® Professional',
    price: 1199,
    badge: 'Most Popular',
    highlight: true,
    description: 'Everything in Essentials, plus mentorship, application support, and a pass guarantee.',
    features: [
      'Everything in Essentials',
      '1:1 mentorship sessions (3 during cohort)',
      'Exam application support',
      'Pass guarantee — restudy free if needed',
      'Personalized study plan',
    ],
  },
  {
    id: 'pmp-executive',
    name: 'PMP® Executive',
    price: 1499,
    badge: 'Premium',
    highlight: false,
    description: 'The full experience — mentorship, career coaching, and LinkedIn optimization post-cohort.',
    features: [
      'Everything in Professional',
      'Career coaching (4 sessions post-cohort)',
      'LinkedIn profile optimization',
      '6 months community access (included when available)',
    ],
  },
] as const

export const CAPM_TIERS = [
  {
    id: 'capm-essentials',
    name: 'CAPM® Essentials',
    price: 599,
    badge: '',
    highlight: false,
    description: 'Foundational PM training for early-career professionals and career changers entering project management.',
    features: [
      '23 hours of PMI-aligned education',
      'Cohort access',
      'Practice exam bank',
      'Study guide',
    ],
  },
  {
    id: 'capm-professional',
    name: 'CAPM® Professional',
    price: 799,
    badge: 'Most Popular',
    highlight: true,
    description: 'Everything in Essentials, plus career transition support to help you land your first PM role.',
    features: [
      'Everything in Essentials',
      'Career transition roadmap',
      'Resume and LinkedIn makeover',
      'CAPM® exam application support',
      'PM job search strategy',
    ],
  },
] as const

// Homepage program cards — show "from" price (entry tier) for each program.
export const PROGRAMS = [
  {
    id: 'pmp',
    name: 'PMP® Certification Prep',
    icon: '🏆',
    audience: 'Working professionals ready to earn the gold standard in PM',
    description: 'A structured, mentor-led program that prepares you to pass the PMP® exam and elevate your career. Built on real-world application — not just test prep.',
    features: ['36 hours of PMI-aligned education', 'Live virtual study sessions', 'Practice bank: 694 questions + full-length mock exam', 'Personalized study plan', 'Exam application support', 'Pass guarantee or restudy free'],
    price: 899,
    badge: 'Most Popular',
    color: 'border-gold',
  },
  {
    id: 'capm-adult',
    name: 'CAPM® Career Launcher',
    icon: '🚀',
    audience: 'Career transitioners entering project management',
    description: 'For professionals pivoting into PM from another field. Earn your CAPM® and build the foundation that gets you hired — and taken seriously — in your new career.',
    features: ['23 hours of PMI-aligned education', 'Career transition roadmap', 'Resume and LinkedIn makeover', 'CAPM exam application support', 'PM job search strategy', 'Community of career changers'],
    price: 599,
    badge: 'Best for Transitioners',
    color: 'border-teal',
  },
  {
    id: 'corporate',
    name: 'Corporate PM Training',
    icon: '🏢',
    audience: 'Teams and organizations',
    description: 'Custom PM training for your team delivered virtually or on-site in Metro Atlanta. Aligned with PMI standards. Tailored to your industry, your projects, your language.',
    features: ['Customized curriculum', 'On-site or virtual delivery', 'Team cohort format', 'PMI education hours documentation', 'Executive briefings available', 'Volume pricing for 5+ employees'],
    price: 0,
    badge: 'Custom Pricing',
    color: 'border-navy',
  },
  {
    id: 'veterans',
    name: 'Veterans PM Pathway',
    icon: '🎖️',
    audience: 'Military veterans transitioning to civilian careers',
    description: 'You already lead projects under pressure. Now translate your military experience into the PM credential employers recognize. Structured for the way veterans learn and lead.',
    features: ['Military-to-PM skills translation guide', 'PMP® or CAPM® prep (your choice)', 'Veteran peer cohort', 'Employer introduction program', 'Veteran discount applied'],
    price: 799,
    badge: 'Veteran Discount Applied',
    color: 'border-green-600',
  },
]

export const STATS = [
  { value: '20+', label: 'Years Enterprise PM Experience' },
  { value: 'Pass', label: 'Guarantee — We coach you until you pass' },
  { value: '694', label: 'Professionals Trained' },
  { value: '100%', label: 'PMI-Aligned Curriculum' },
]

// ---------------------------------------------------------------------------
// CHECKOUT PROGRAMS — the single list of things a customer can actually buy.
//
// Prices are READ FROM the tier definitions above rather than repeated here.
// Before this existed, /checkout and /api/checkout each kept their own copy of
// the price list, so the site could advertise $1,499 while Stripe charged $899
// and nothing would catch it.
//
// `id` values are STABLE and must not be renamed: they are written into Stripe
// PaymentIntent metadata and become Mailchimp tags via the Stripe webhook.
// Renaming one orphans the purchase history attached to it.
// ---------------------------------------------------------------------------

export type CheckoutProgram = {
  /** Stable identifier used in Stripe metadata and Mailchimp tags. */
  id: string
  /** The tier in PMP_TIERS / CAPM_TIERS this is sold as, when applicable. */
  tierId: string | null
  name: string
  /** Display price in whole dollars. */
  price: number
  /** What Stripe charges, in cents. Always derived — never typed by hand. */
  amount: number
  description: string
}

function checkoutProgramFromTier(
  id: string,
  tierId: string,
  description: string
): CheckoutProgram {
  const tier = [...PMP_TIERS, ...CAPM_TIERS].find((candidate) => candidate.id === tierId)

  // Fails the build rather than shipping a checkout button with no price.
  if (!tier) {
    throw new Error(
      `CHECKOUT_PROGRAMS references unknown tier "${tierId}". ` +
        `Add it to PMP_TIERS or CAPM_TIERS in lib/constants.ts.`
    )
  }

  return {
    id,
    tierId,
    name: tier.name,
    price: tier.price,
    amount: tier.price * 100,
    description,
  }
}

const veteransProgram = PROGRAMS.find((program) => program.id === 'veterans')

if (!veteransProgram) {
  throw new Error('PROGRAMS is missing the "veterans" entry that CHECKOUT_PROGRAMS depends on.')
}

export const CHECKOUT_PROGRAMS: CheckoutProgram[] = [
  checkoutProgramFromTier(
    'pmp-prep',
    'pmp-essentials',
    'Structured cohort prep with live instruction, the full practice bank, and a study guide.'
  ),
  checkoutProgramFromTier(
    'pmp-professional',
    'pmp-professional',
    'Everything in Essentials, plus 1:1 mentorship, exam application support, and the pass guarantee.'
  ),
  checkoutProgramFromTier(
    'pmp-executive',
    'pmp-executive',
    'The full experience — mentorship, career coaching, and LinkedIn optimization after your cohort.'
  ),
  checkoutProgramFromTier(
    'capm-launcher',
    'capm-essentials',
    'Foundational project management training for early-career professionals and career changers.'
  ),
  checkoutProgramFromTier(
    'capm-professional',
    'capm-professional',
    'Everything in CAPM® Essentials, plus career transition support to help you land your first PM role.'
  ),
  {
    id: 'veterans-pathway',
    tierId: null,
    name: veteransProgram.name,
    price: veteransProgram.price,
    amount: veteransProgram.price * 100,
    description:
      'A mission-aligned transition pathway designed for veterans moving into project management roles.',
  },
]

/** Maps a pricing tier to the checkout program that sells it. */
export function checkoutIdForTier(tierId: string): string | null {
  return CHECKOUT_PROGRAMS.find((program) => program.tierId === tierId)?.id ?? null
}

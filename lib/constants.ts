export const SITE_NAME = 'Wiser Generations Int\'l™'
export const SITE_URL = 'https://wisergenerations.com'
export const TAGLINE = 'Project Manage Your Career. Transform Your Future.™'
export const FOUNDER = 'Crystal Stewart, PMP®'
export const FOUNDER_TITLE = 'The Project Management Evangelist™'
export const COMPANY = 'Enterprise Ahcademy™'

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
        price: 2995,
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
        price: 997,
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
        price: 1497,
        badge: 'Most Popular',
        highlight: true,
        description: 'Everything in Essentials, plus career transition support to help you land your first PM role.',
        features: [
                'Everything in Essentials',
                'Career transition roadmap',
                'Resume and LinkedIn makeover',
                'CAPM exam application support',
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
        features: ['36 hours of PMI-aligned education', 'Live virtual study sessions', 'Practice exam bank (500+ questions)', 'Personalized study plan', 'Exam application support', 'Pass guarantee or restudy free'],
        price: 1497,
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
        price: 997,
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
        features: ['Military-to-PM skills translation guide', 'PMP® or CAPM® prep (your choice)', 'VA benefit compatibility guidance', 'Veteran peer cohort', 'Employer introduction program', 'Veteran discount applied'],
        price: 797,
        badge: 'Veteran Discount Applied',
        color: 'border-green-600',
  },
  ]

export const STATS = [
  { value: '20+', label: 'Years Enterprise PM Experience' },
  { value: 'Pass', label: 'Guarantee — We coach you until you pass' },
  { value: '500+', label: 'Professionals Trained' },
  { value: '100%', label: 'PMI-Aligned Curriculum' },
  ]

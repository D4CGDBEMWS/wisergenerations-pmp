import Link from 'next/link'

// ---------------------------------------------------------------------------
// ResourceCTA — reusable upsell banner used on every /resources/* page.
//
//   <ResourceCTA variant="soft" />  → Study Access $47/mo nudge
//   <ResourceCTA variant="hard" />  → Full PMP Prep program nudge
//
// Both variants link into the existing /checkout flow.
// ---------------------------------------------------------------------------

type Variant = 'soft' | 'hard'

const COPY: Record<Variant, { eyebrow: string; title: string; body: string; cta: string; href: string }> = {
  soft: {
    eyebrow: 'Want more PMP study tools?',
    title: 'Start Wiser Generations Int’l™ Study Access — $47/month',
    body:
      'Self-paced PMP® / CAPM® study library, practice question bank, monthly office hours, and private community. Cancel anytime.',
    cta: 'Start Study Access →',
    href: '/checkout',
  },
  hard: {
    eyebrow: 'Ready for live mentor coaching?',
    title: 'Enroll in the full PMP® Certification Prep program',
    body:
      'Mentor-led cohort instruction, 1:1 application support, and personalized exam-readiness coaching from Crystal Stewart and the Wiser Generations Int’l™ team.',
    cta: 'See full programs →',
    href: '/checkout#full-programs',
  },
}

export default function ResourceCTA({ variant = 'soft' }: { variant?: Variant }) {
  const copy = COPY[variant]
  const isSoft = variant === 'soft'

  return (
    <aside
      className={`my-12 overflow-hidden rounded-3xl border-2 p-8 shadow-sm ${
        isSoft
          ? 'border-amber-400 bg-gradient-to-br from-white to-amber-50'
          : 'border-navy bg-navy text-white'
      }`}
    >
      <p
        className={`text-xs font-bold uppercase tracking-[0.18em] ${
          isSoft ? 'text-amber-700' : 'text-gold'
        }`}
      >
        {copy.eyebrow}
      </p>
      <h3
        className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${
          isSoft ? 'text-slate-900' : 'text-white'
        }`}
      >
        {copy.title}
      </h3>
      <p className={`mt-3 max-w-2xl text-sm leading-6 ${isSoft ? 'text-slate-700' : 'text-gray-300'}`}>
        {copy.body}
      </p>
      <Link
        href={copy.href}
        className={`mt-5 inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition ${
          isSoft
            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            : 'bg-gold text-navy hover:bg-amber-400'
        }`}
      >
        {copy.cta}
      </Link>
    </aside>
  )
}

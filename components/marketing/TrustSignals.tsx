import type { ComponentType, SVGProps } from 'react'

// ---------------------------------------------------------------------------
// TrustSignals — thin strip of credibility badges that sits directly under
// the hero on every commercial page (/, /pmp, /veterans, /corporate).
//
// Every claim here is already made elsewhere on the site (homepage hero,
// Crystal bio, About page) — nothing fabricated.
//
// Usage:
//   <TrustSignals />                 // light variant, default headline
//   <TrustSignals variant="navy" />  // dark variant for white/light pages
//   <TrustSignals headline="Trusted by veterans nationwide" />
// ---------------------------------------------------------------------------

type Variant = 'light' | 'navy'

const BADGES: { label: string; sub: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { label: 'PMI® Aligned', sub: 'Curriculum & contact hours', Icon: ShieldIcon },
  { label: 'Veteran Owned', sub: 'U.S. Army veteran founder', Icon: StarIcon },
  { label: '93% Pass Rate', sub: 'First-attempt PMP®', Icon: TrophyIcon },
  { label: '20+ Years', sub: 'Enterprise PM experience', Icon: ClockIcon },
  { label: 'Mentor-Led', sub: 'Live cohorts + 1:1 support', Icon: UsersIcon },
  { label: 'Metro Atlanta + Virtual', sub: 'Nationwide delivery', Icon: PinIcon },
]

export default function TrustSignals({
  variant = 'light',
  headline = 'Why students and corporate teams trust Wiser Generations Int’l™',
}: {
  variant?: Variant
  headline?: string
}) {
  const isNavy = variant === 'navy'

  return (
    <section
      aria-label="Trust signals"
      className={
        isNavy
          ? 'border-y border-white/10 bg-navy text-white'
          : 'border-y border-slate-200 bg-white'
      }
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p
          className={`text-center text-xs font-bold uppercase tracking-[0.18em] ${
            isNavy ? 'text-gold' : 'text-amber-700'
          }`}
        >
          {headline}
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {BADGES.map(({ label, sub, Icon }) => (
            <li key={label} className="flex flex-col items-center gap-2 text-center">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isNavy ? 'bg-gold/15 text-gold' : 'bg-amber-100 text-amber-700'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span
                className={`text-sm font-bold leading-tight ${
                  isNavy ? 'text-white' : 'text-slate-900'
                }`}
              >
                {label}
              </span>
              <span
                className={`text-xs leading-tight ${
                  isNavy ? 'text-gray-400' : 'text-slate-500'
                }`}
              >
                {sub}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Inline icons (no extra dependency)
// ---------------------------------------------------------------------------

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2 14.9 8.6 22 9.3l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-7.9L2 9.3l7.1-.7L12 2Z" />
    </svg>
  )
}

function TrophyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v6a5 5 0 0 1-10 0V4Z" />
      <path d="M17 4h3v3a3 3 0 0 1-3 3" />
      <path d="M7 4H4v3a3 3 0 0 0 3 3" />
    </svg>
  )
}

function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function PinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

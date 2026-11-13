import Link from 'next/link'
import { BRAND_NAME, PILOT_AREA } from '@/lib/brand'

// Mobile-first: a bottom bar on phones (thumb reach), a header row on wider
// screens. Both render the same five destinations from one list, so they
// cannot drift apart.
const DESTINATIONS = [
  { href: '/', label: 'Home', icon: '🏡' },
  { href: '/browse', label: 'Browse', icon: '🔍' },
  { href: '/programs', label: 'Programs', icon: '🤝' },
  { href: '/safety', label: 'Safety', icon: '🛡️' },
  { href: '/account', label: 'Account', icon: '👤' },
] as const

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-navy">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className={`rounded-lg ${FOCUS}`} aria-label={`${BRAND_NAME} home`}>
          <span className="font-display text-lg font-bold text-white">
            Village<span className="text-gold">Trade</span>
          </span>
          <span className="block text-[10px] uppercase tracking-[0.12em] text-white/50">
            {PILOT_AREA}
          </span>
        </Link>
        <nav aria-label="Main" className="hidden gap-1 sm:flex">
          {DESTINATIONS.slice(1).map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white ${FOCUS}`}
            >
              {d.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white sm:hidden"
    >
      <ul className="mx-auto flex max-w-5xl">
        {DESTINATIONS.map((d) => (
          <li key={d.href} className="flex-1">
            <Link
              href={d.href}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-muted hover:text-navy ${FOCUS}`}
            >
              <span aria-hidden="true" className="text-base">
                {d.icon}
              </span>
              {d.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

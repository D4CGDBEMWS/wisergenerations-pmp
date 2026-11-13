import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// The VillageTrade design system — small, mobile-first, accessible.
//
// Every interactive element carries a visible focus ring and a touch target
// of at least 44px. Both are requirements rather than polish: this is an
// application people will use one-handed, outdoors, on a phone.
// ---------------------------------------------------------------------------

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy'

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled,
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const styles = {
    primary: 'bg-navy text-white hover:bg-navy-soft',
    secondary: 'bg-white text-navy border border-line hover:bg-warm-2',
    danger: 'bg-danger-pale text-danger border border-danger/30 hover:bg-danger hover:text-white',
  }[variant]
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-bold transition-colors disabled:opacity-60 ${styles} ${FOCUS}`}
    >
      {children}
    </button>
  )
}

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">{children}</div>
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'green' | 'gold' | 'danger'
}) {
  const styles = {
    neutral: 'bg-warm-2 text-muted border-line',
    green: 'bg-green-pale text-green border-green/20',
    gold: 'bg-gold-pale text-gold-text border-gold/30',
    danger: 'bg-danger-pale text-danger border-danger/20',
  }[tone]
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${styles}`}>
      {children}
    </span>
  )
}

export function SectionHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="font-display text-xl font-bold text-navy sm:text-2xl">
      {children}
    </h2>
  )
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="space-y-3 text-sm leading-relaxed text-muted sm:text-base">{children}</div>
}

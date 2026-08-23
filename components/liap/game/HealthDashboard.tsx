'use client'

import { HEALTH_KEYS, type Health } from '@/lib/game/types'
import { healthBand } from '@/lib/game/engine'
import { DIMENSION_LABELS } from '@/lib/game/results'

// ---------------------------------------------------------------------------
// The six dimensions, and the day's remaining attention.
//
// ── COLOUR IS NEVER THE MESSAGE ────────────────────────────────────────────
//
// §33. Every bar carries its number and its band as text. A participant who
// cannot distinguish the bar colours loses nothing, because the colour repeats
// what the words already say rather than saying anything of its own. The bars
// are `role="meter"` with real min/max/now values, so a screen reader gets the
// dashboard as six labelled measurements rather than six coloured divs.
//
// ── WHY IT IS ALWAYS ON SCREEN ─────────────────────────────────────────────
//
// A cost the participant has to click to see is a cost they will discover at
// 5:00 PM. The whole mechanic depends on watching a number move at the moment
// a decision moves it.
// ---------------------------------------------------------------------------

const BAND_STYLE: Record<ReturnType<typeof healthBand>, { bar: string; text: string; word: string }> = {
  critical: { bar: 'bg-red-600', text: 'text-red-700', word: 'Critical' },
  strained: { bar: 'bg-amber-500', text: 'text-amber-700', word: 'Strained' },
  steady: { bar: 'bg-brand-blue', text: 'text-brand-blue', word: 'Steady' },
  strong: { bar: 'bg-leaf', text: 'text-green-700', word: 'Strong' },
}

interface Props {
  health: Health
  focus: number
  focusOverdrawn: number
  /** Dimensions that just changed, for the "what moved" emphasis. */
  changed?: readonly string[]
  /**
   * One column instead of two.
   *
   * Needed because Tailwind's `sm:` keys off the VIEWPORT, not the container.
   * In the 18rem sidebar on a laptop the viewport is wide, so `sm:grid-cols-2`
   * applies and each dimension gets about 130px — enough to wrap every label
   * and its reading onto separate lines. The sidebar asks for one column; the
   * full-width use inside INSPECT keeps two.
   */
  compact?: boolean
}

export function HealthDashboard({
  health,
  focus,
  focusOverdrawn,
  changed = [],
  compact = false,
}: Props) {
  return (
    <section
      aria-label="Project health"
      className="rounded-xl border border-line bg-white p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-navy">
          Project health
        </h2>
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-navy">Focus left today: {focus}</span>
          {focusOverdrawn > 0 && (
            <span className="ml-2 text-red-700">
              ({focusOverdrawn} spent past empty)
            </span>
          )}
        </p>
      </div>

      <dl
        className={`mt-4 grid gap-x-6 gap-y-3 ${
          compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
        }`}
      >
        {HEALTH_KEYS.map((key) => {
          const value = health[key]
          const style = BAND_STYLE[healthBand(value)]
          return (
            <div key={key}>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-sm font-medium text-navy">
                  {DIMENSION_LABELS[key]}
                  {changed.includes(key) && (
                    <span className="ml-1.5 text-xs font-semibold text-gold">moved</span>
                  )}
                </dt>
                <dd className={`text-xs font-semibold ${style.text}`}>
                  {style.word} · {value}
                </dd>
              </div>
              <div
                role="meter"
                aria-label={`${DIMENSION_LABELS[key]}: ${style.word}`}
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-1 h-2 w-full overflow-hidden rounded-full bg-light-navy"
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${style.bar}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

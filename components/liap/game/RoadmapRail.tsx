'use client'

import { ROADMAP_STAGES, type RoadmapStageId } from '@/lib/game/types'

// ---------------------------------------------------------------------------
// The roadmap the day walks.
//
// It is on screen the whole time because the point of the game is not that the
// participant makes good decisions — it is that they see where a decision sits
// in a project. "Is it really done?" is a stage, and at 4:00 PM they are
// standing in it.
//
// ── THE LOOP IS DRAWN AS A LOOP ────────────────────────────────────────────
//
// Three stages are marked as cycling, and the rail says so in words rather
// than relying on an arrow graphic. A straight twelve-step rail would teach
// that planning finishes before execution starts, which is the single most
// common thing this experience exists to correct.
// ---------------------------------------------------------------------------

export function RoadmapRail({ current }: { current: RoadmapStageId | null }) {
  const currentIndex = ROADMAP_STAGES.findIndex((s) => s.id === current)

  return (
    <nav aria-label="Project roadmap" className="rounded-xl border border-line bg-paper p-4">
      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-navy">Where you are</h2>
      <ol className="mt-3 space-y-1">
        {ROADMAP_STAGES.map((stage, index) => {
          const isCurrent = stage.id === current
          const isPast = currentIndex >= 0 && index < currentIndex
          return (
            <li key={stage.id} className="flex items-start gap-2 text-sm leading-snug">
              <span
                aria-hidden="true"
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  isCurrent ? 'bg-gold' : isPast ? 'bg-brand-blue' : 'bg-gray-300'
                }`}
              />
              <span
                className={
                  isCurrent
                    ? 'font-bold text-navy'
                    : isPast
                      ? 'text-gray-600'
                      : 'text-gray-400'
                }
              >
                {stage.label}
                {stage.looping && (
                  <span className="ml-1 text-xs font-normal text-gray-500">· repeats</span>
                )}
                {isCurrent && <span className="sr-only"> (current stage)</span>}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        The middle three repeat. A project passes through them again every time something
        changes — which is most days.
      </p>
    </nav>
  )
}

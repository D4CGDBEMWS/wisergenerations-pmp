'use client'
import { useState, useRef, useId } from 'react'
import { AUDIENCES, AUDIENCE_MAP, PROGRAM_HREF, OUTCOME_HEADLINE } from './audiences'
import { useIsNarrow } from './use-is-narrow'

// ---------------------------------------------------------------------------
// PROTOTYPE — Phase 1A. Not authorized for merge or deployment.
//
// The "Who Are You?" router, lifted out of HomeClient so it can sit directly
// under the hero instead of two thirds of the way down the page.
//
// Every string here already existed: the five audience labels, the program
// names, audiences, outcome headlines, descriptions, features, prices, badges
// and the "Learn More →" call to action. Nothing was written for this file.
//
// Two things changed, both structural:
//
//   1. Semantics. The chips were plain buttons, so a screen reader announced
//      "All Programs, button" with no way to tell which one was active — the
//      selected state existed only as a colour. They are now a radio group:
//      one tab stop, arrow keys between options, and the checked state and
//      position ("2 of 5") announced natively. Touch targets meet 44px.
//
//   2. Mobile depth. In the default All Programs state the four cards stacked
//      to 2,683px of vertical scroll. Each card now opens and closes on small
//      screens, so all four are visible at once and any one of them can be
//      read in full without leaving the router. Nothing is removed: the same
//      text is in the same DOM at every width, so it stays selectable, findable
//      and crawlable. Desktop is untouched — every card renders open.
//
// The collapse is applied after mount rather than during render. That keeps
// the server HTML identical to today's, and it means a visitor whose
// JavaScript never arrives gets the whole page open rather than a set of
// headings that will not expand.
// ---------------------------------------------------------------------------

interface Program {
  id: string
  icon: string
  name: string
  audience: string
  color: string
  badge?: string
  price: number
  description: string
  features: string[]
}

export default function ProgramRouter({ programs }: { programs: Program[] }) {
  const [activeAudience, setActiveAudience] = useState('all')
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({})
  const narrow = useIsNarrow()
  const groupRef = useRef<HTMLDivElement>(null)
  const uid = useId()

  const filtered =
    activeAudience === 'all'
      ? programs
      : programs.filter((p) => AUDIENCE_MAP[activeAudience]?.includes(p.id))

  // Falling back to every program rather than an empty grid, as before.
  const displayPrograms = filtered.length > 0 ? filtered : programs

  // A card counts as open on a narrow screen when the visitor opened it, or
  // when they narrowed the field themselves — having asked for veterans, they
  // should not have to ask a second time to read the veterans card.
  const isOpen = (id: string) =>
    !narrow || (openCards[id] ?? activeAudience !== 'all')

  // Arrow keys move between radios, which is what the role promises.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const i = AUDIENCES.findIndex((a) => a.id === activeAudience)
    const last = AUDIENCES.length - 1
    const next =
      e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % AUDIENCES.length
      : (i - 1 + AUDIENCES.length) % AUDIENCES.length
    setActiveAudience(AUDIENCES[next]!.id)
    setOpenCards({})
    const radios = groupRef.current?.querySelectorAll<HTMLElement>('[role="radio"]')
    radios?.[next]?.focus()
  }

  return (
    <section className="py-14 md:py-20 bg-white" aria-labelledby={`${uid}-heading`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-10">
          <p className="text-gold-text text-sm font-bold uppercase tracking-widest mb-2">Find Your Program</p>
          <h2 id={`${uid}-heading`} className="text-3xl md:text-4xl font-bold text-navy mb-4">Who Are You?</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">Select your situation and we&apos;ll show you the right program.</p>
        </div>

        <div
          ref={groupRef}
          role="radiogroup"
          aria-labelledby={`${uid}-heading`}
          onKeyDown={onKeyDown}
          className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-8 md:mb-10"
        >
          {AUDIENCES.map((a) => {
            const active = activeAudience === a.id
            return (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => { setActiveAudience(a.id); setOpenCards({}) }}
                className={`min-h-[44px] px-5 py-2.5 rounded-full font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${
                  active
                    ? 'bg-navy text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {a.label}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {displayPrograms.map((p) => {
            const open = isOpen(p.id)
            const panelId = `${uid}-${p.id}-detail`
            return (
              <article
                key={p.id}
                className={`border-2 ${p.color} rounded-2xl p-5 md:p-8 md:hover:shadow-lg md:transition-all md:hover:-translate-y-1 relative`}
              >
                {p.badge && (
                  <span className="absolute top-4 right-4 bg-navy text-white text-xs font-bold px-3 py-1 rounded-full">
                    {p.badge}
                  </span>
                )}

                {/* On a narrow screen the card heading is the control that
                    opens it. Its accessible name is the program name, so the
                    disclosure needs no wording of its own — aria-expanded
                    carries the state. On md and up it is an inert heading. */}
                <button
                  type="button"
                  onClick={() => narrow && setOpenCards((s) => ({ ...s, [p.id]: !open }))}
                  aria-expanded={narrow ? open : undefined}
                  aria-controls={narrow ? panelId : undefined}
                  tabIndex={narrow ? 0 : -1}
                  className="w-full text-left md:cursor-default md:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 rounded-lg"
                >
                  <span className="block text-3xl md:text-4xl mb-2 md:mb-4 pr-24" aria-hidden="true">{p.icon}</span>
                  <span className="flex items-center gap-3">
                    <h3 className="flex-1 text-lg md:text-xl font-bold text-navy mb-1">{p.name}</h3>
                    {/* The affordance that says the card opens. Decorative:
                        aria-expanded on the button already states the fact. */}
                    <span
                      aria-hidden="true"
                      className={`md:hidden shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-navy transition-transform ${open ? 'rotate-180' : ''}`}
                    >
                      ▾
                    </span>
                  </span>
                  <span className="block text-gold-text text-sm font-medium mb-2 md:mb-3">{p.audience}</span>
                  {OUTCOME_HEADLINE[p.id] && (
                    <span className="block text-navy font-bold text-base mb-2">{OUTCOME_HEADLINE[p.id]}</span>
                  )}
                </button>

                <div id={panelId} className={open ? 'block' : 'hidden'}>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 mt-2">{p.description}</p>
                  <ul className="space-y-1 mb-6">
                    {p.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-gold" aria-hidden="true">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price and call to action stay visible whether the card is
                    open or shut: they are the reason the card is on the page. */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {p.price > 0 ? (
                    <p className="text-navy font-bold text-2xl">from ${p.price.toLocaleString()}</p>
                  ) : (
                    <p className="text-navy font-bold text-lg">Custom Pricing</p>
                  )}
                  <a
                    href={PROGRAM_HREF[p.id]}
                    className="inline-flex items-center min-h-[44px] bg-navy text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-900 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                  >
                    Learn More →
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

import { Card, Badge, SectionHeading, Prose } from '@/components/ui'
import {
  activePrograms,
  CELEBRATIONS,
  DURATION_LABELS,
  COMPENSATION_LABELS,
} from '@/lib/programs'
import { SAFETY_MESSAGE } from '@/lib/safety'

export const metadata = { title: 'Programs — VillageTrade' }

export default function ProgramsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">Programs</h1>

      <ul className="mt-6 space-y-4">
        {activePrograms().map((p) => (
          <li key={p.slug}>
            <Card>
              <h2 className="font-display text-lg font-bold text-navy">
                {p.name}
                {p.trademark && <span aria-hidden="true">&trade;</span>}
              </h2>

              {p.description ? (
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.description}</p>
              ) : (
                // No approved copy yet. An empty space is honest; invented
                // prose would not be.
                <p className="mt-2 text-sm italic text-muted">Description to follow.</p>
              )}

              {p.notes && <p className="mt-2 text-xs text-muted">{p.notes}</p>}

              {p.durations.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Booking</p>
                  <ul className="mt-1.5 flex flex-wrap gap-2">
                    {p.durations.map((d) => (
                      <li key={d}>
                        <Badge>{DURATION_LABELS[d]}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {p.compensation.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">
                    Compensation
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-2">
                    {p.compensation.map((c) => (
                      <li key={c}>
                        <Badge tone="green">{COMPENSATION_LABELS[c]}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>

      <section className="mt-8" aria-labelledby="celebrations-heading">
        <SectionHeading id="celebrations-heading">Seasonal help</SectionHeading>
        <Prose>
          <p>Holiday programs support {CELEBRATIONS.join(', ')} and other celebrations.</p>
        </Prose>
      </section>

      <section className="mt-8" aria-labelledby="payment-heading">
        <SectionHeading id="payment-heading">About payment</SectionHeading>
        <Prose>
          <p>
            VillageTrade records what two neighbours <strong>agree</strong>. It does not collect,
            hold or transfer money. Any payment is arranged and settled directly between the two
            people involved.
          </p>
        </Prose>
      </section>

      <p className="mt-8 rounded-xl border border-gold bg-gold-pale p-4 text-sm font-bold text-gold-text">
        {SAFETY_MESSAGE}
      </p>
    </div>
  )
}

import Link from 'next/link'
import { Button, Card, Badge, SectionHeading, Prose } from '@/components/ui'
import { MISSION, PILOT_AREA } from '@/lib/brand'
import { COBB_COUNTY_ZIPS } from '@/lib/geography'
import { SAFETY_MESSAGE } from '@/lib/safety'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <section className="rounded-2xl bg-navy p-6 text-white sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">{PILOT_AREA}</p>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">{MISSION}</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-white/75">
          Trade what you have. Get what you need. A local exchange where neighbours offer practical
          skills, work and items — for payment, for barter, or for both.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/browse">
            <span className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gold px-5 text-sm font-bold text-navy">
              Browse near you
            </span>
          </Link>
          <Link href="/safety">
            <span className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/30 px-5 text-sm font-bold text-white">
              How we keep it professional
            </span>
          </Link>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="local-heading">
        <SectionHeading id="local-heading">Local, on purpose</SectionHeading>
        <Prose>
          <p>
            VillageTrade is a neighbourhood marketplace, not a national one. The pilot covers{' '}
            {COBB_COUNTY_ZIPS.length} ZIP codes in {PILOT_AREA}, and listings are shown by how close
            they are to you.
          </p>
        </Prose>
        <ul className="mt-4 flex flex-wrap gap-2">
          {COBB_COUNTY_ZIPS.map((z) => (
            <li key={z.zip}>
              <Badge>
                {z.zip} · {z.city}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="standard-heading">
        <SectionHeading id="standard-heading">The standard</SectionHeading>
        <div className="mt-3">
          <Card>
            <p className="font-display text-lg font-bold text-navy">{SAFETY_MESSAGE}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Every exchange on VillageTrade is professional work between neighbours.{' '}
              <Link href="/safety" className="font-semibold text-gold-text underline underline-offset-2">
                Read the full conduct standard
              </Link>
              .
            </p>
          </Card>
        </div>
      </section>
    </div>
  )
}

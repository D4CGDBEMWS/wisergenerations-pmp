import Link from 'next/link'
import { Card, Badge, Prose } from '@/components/ui'
import { isDemoMode } from '@/lib/flags'
import { DEMO_LISTINGS, DEMO_CATEGORIES } from '@/lib/demo'
import { COBB_COUNTY_ZIPS } from '@/lib/geography'

export const metadata = { title: 'Browse — VillageTrade' }

const OFFER_LABEL = {
  paid: 'Paid',
  barter: 'Barter',
  combined: 'Paid or barter',
} as const

export default function BrowsePage() {
  const demo = isDemoMode()
  const listings = demo ? DEMO_LISTINGS : []

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">Browse near you</h1>
        <Link
          href="/listings/new"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-navy px-4 text-sm font-bold text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          Post a listing
        </Link>
      </div>

      <form className="mt-5 flex flex-wrap items-end gap-3" aria-label="Filter listings">
        <div>
          <label htmlFor="zip" className="block text-xs font-bold uppercase tracking-wide text-muted">
            ZIP code
          </label>
          <select
            id="zip"
            name="zip"
            defaultValue=""
            className="mt-1 min-h-[44px] rounded-xl border border-line bg-white px-3 text-sm"
          >
            <option value="">All pilot ZIPs</option>
            {COBB_COUNTY_ZIPS.map((z) => (
              <option key={z.zip} value={z.zip}>
                {z.zip} — {z.city}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wide text-muted">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue=""
            className="mt-1 min-h-[44px] rounded-xl border border-line bg-white px-3 text-sm"
          >
            <option value="">All categories</option>
            {DEMO_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </form>

      {listings.length === 0 ? (
        <div className="mt-8">
          <Card>
            <p className="font-bold text-navy">No listings yet</p>
            <Prose>
              <p>VillageTrade is in development and is not yet accepting members or listings.</p>
            </Prose>
          </Card>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {listings.map((l) => (
            <li key={l.id}>
              <Card>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={l.offerType === 'barter' ? 'green' : 'gold'}>
                    {OFFER_LABEL[l.offerType]}
                  </Badge>
                  <Badge>{l.kind === 'service' ? 'Service' : 'Item'}</Badge>
                </div>
                <h2 className="mt-2 font-display text-base font-bold text-navy">{l.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{l.body}</p>
                <p className="mt-3 text-xs text-muted">
                  {l.category} · {l.city} {l.zip} · {l.providerName}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

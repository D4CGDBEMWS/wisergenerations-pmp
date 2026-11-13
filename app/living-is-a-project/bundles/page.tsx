import Image from 'next/image'
import Link from 'next/link'
import localFont from 'next/font/local'
import { notFound } from 'next/navigation'
import { LiapCta } from '@/components/liap/LiapCta'
import { LiapPageView } from '@/components/liap/LiapPageView'
import { isEnabled } from '@/lib/flags'
import { LIAP_BOOK } from '@/lib/liap/product'
import {
  BUNDLES,
  bundleCopies,
  bundleSavings,
  bundleStatus,
  bundleValue,
  usd,
  type Bundle,
} from '@/lib/liap/bundles'

// ---------------------------------------------------------------------------
// Book bundles. Owner ruling 2026-10-30: one page for promotions on every
// book Crystal publishes. Each bundle shows what is inside, its full value,
// its price and the saving, and buys through /api/liap/bundle. Bundles are
// listed in lib/liap/bundles.ts; this page only reads them.
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

const cormorant = localFont({
  src: [
    { path: '../../fonts/liap/cormorant-garamond-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/liap/cormorant-garamond-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  display: 'swap',
})

const GOLD_TEXT = 'text-[#8A5A0C]'
const BODY = 'text-[#1E2F55]'
const EYEBROW = `text-xs font-semibold uppercase tracking-[0.3em] ${GOLD_TEXT}`

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Book Bundles | Crystal Glover Stewart',
  description: 'Bundle savings on books by Crystal Glover Stewart, available only at wisergenerations.com.',
}

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  })
}

function BundleCard({ b, index }: { b: Bundle; index: number }) {
  const status = bundleStatus(b)
  return (
    <article className="grid gap-8 rounded-3xl border border-[#CC9C48] p-6 sm:p-10 md:grid-cols-[minmax(0,240px)_1fr] md:items-center">
      <div className="relative mx-auto flex w-full max-w-[240px] justify-center">
        {Array.from({ length: Math.min(bundleCopies(b), 3) }).map((_, i) => (
          <Image
            key={i}
            src="/liap/author/living-is-a-project-cover.png"
            alt={i === 0 ? `${LIAP_BOOK.name} book cover` : ''}
            width={160}
            height={240}
            className="h-auto w-[44%] shadow-[0_12px_24px_rgba(0,27,58,0.25)]"
            style={{ marginLeft: i === 0 ? 0 : '-14%', zIndex: 3 - i, transform: `rotate(${(i - 1) * 4}deg)` }}
          />
        ))}
      </div>
      <div className="min-w-0">
        <p className={EYEBROW}>Bundle #{index + 1}</p>
        <h2 className={`${cormorant.className} mt-2 text-3xl font-semibold leading-tight text-[#001B3A] sm:text-4xl`}>
          {b.name}
        </h2>
        <p className={`mt-2 italic ${BODY}`}>
          {b.items.map((i) => `${i.quantity} × ${i.title} (${i.format})`).join(' · ')}
        </p>
        <p className={`mt-3 text-[15px] leading-relaxed ${BODY}`}>{b.tagline}</p>
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-gray-500">Value</dt>
            <dd className="font-semibold text-gray-500 line-through">{usd(bundleValue(b))}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Bundle price</dt>
            <dd className={`${cormorant.className} text-3xl font-semibold text-[#001B3A]`}>{usd(b.price)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">You save</dt>
            <dd className={`font-semibold ${GOLD_TEXT}`}>{usd(bundleSavings(b))}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-gray-600">
          + {LIAP_BOOK.shipping.label} shipping per order (US only). {b.note}
        </p>
        <div className="mt-6">
          {status === 'active' && <LiapCta bundle={b.slug} label={`Buy the bundle — ${usd(b.price)}`} />}
          {status === 'upcoming' && (
            <>
              <LiapCta bundle={b.slug} disabled label={`Opens ${fmtDay(b.startsAt)}`} />
              <p className="mt-3 text-sm text-gray-600">
                On sale {fmtDay(b.startsAt)} through {fmtDay(b.endsAt)}.
              </p>
            </>
          )}
          {status === 'ended' && <p className="font-semibold text-gray-600">This sale has ended.</p>}
        </div>
      </div>
    </article>
  )
}

export default function BundlesPage() {
  // Hidden until the owner turns on FEATURE_LIAP_BUNDLES.
  if (!isEnabled('LIAP') || !isEnabled('LIAP_BUNDLES')) notFound()
  const shown = BUNDLES.filter((b) => bundleStatus(b) !== 'ended')

  return (
    <main className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <LiapPageView event="liap_bundles_viewed" />
      <p className={EYEBROW}>Only at wisergenerations.com</p>
      <h1 className={`${cormorant.className} mt-3 text-4xl font-semibold leading-tight text-[#001B3A] sm:text-5xl`}>
        Book Bundles
      </h1>
      <p className={`mt-4 max-w-2xl text-[17px] leading-relaxed ${BODY}`}>
        Bundle savings on books by Crystal Glover Stewart, PMP®. Bundles are discounted and available only through
        this website.
      </p>
      <div className="mt-10 flex flex-col gap-8">
        {shown.length === 0 ? (
          <p className={BODY}>
            No bundles are on sale right now. <Link href="/author" className="underline">See the new book</Link>.
          </p>
        ) : (
          shown.map((b, i) => <BundleCard key={b.slug} b={b} index={i} />)
        )}
      </div>
    </main>
  )
}

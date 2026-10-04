import type { Metadata } from 'next'
import { DownloadPanel } from '@/components/legacy-kit/DownloadPanel'
import { linkState, purchaseByToken } from '@/lib/legacy-kit/purchases'

export const metadata: Metadata = {
  title: { absolute: 'Download your Legacy Kit | Wiser Generations International' },
  robots: { index: false, follow: false, nocache: true },
  // The token is in this page's address; don't hand it to any other site.
  referrer: 'no-referrer',
}

// ---------------------------------------------------------------------------
// Where the email's link lands. Opening this page uses no downloads; only the
// button does. See components/legacy-kit/DownloadPanel.tsx for why.
// ---------------------------------------------------------------------------

export default async function KitDownloadPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string | string[] }>
}) {
  const raw = (await searchParams).t
  const token = typeof raw === 'string' ? raw : ''
  let purchase = null
  try {
    purchase = token ? await purchaseByToken(token) : null
  } catch (err) {
    console.error('[legacy-kit/download] lookup failed', err)
  }

  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-text">Wiser Generations · Family Legacy</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-evergreen sm:text-4xl">Your Legacy Kit™</h1>
        <div className="mt-8">
          <DownloadPanel token={token} purchase={purchase} state={linkState(purchase)} />
        </div>
        <p className="mt-8 text-sm font-semibold text-gray-800">Educational only — not legal, tax or financial advice.</p>
      </div>
    </div>
  )
}

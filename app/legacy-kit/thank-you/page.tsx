import type { Metadata } from 'next'
import Stripe from 'stripe'
import { DownloadPanel } from '@/components/legacy-kit/DownloadPanel'
import { isPaidKitSession, linkState, recordPurchase, type KitPurchase } from '@/lib/legacy-kit/purchases'

export const metadata: Metadata = {
  title: { absolute: 'Thank you | Wiser Generations International' },
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

// ---------------------------------------------------------------------------
// After payment. The download appears only once the server has asked Stripe
// itself whether this session is a paid Legacy Kit purchase — the session id
// in the address is not trusted on its own.
//
// It records the purchase too (the same idempotent call the webhook makes),
// because Stripe's redirect can beat the webhook here by a second or two, and
// a buyer who has just paid should not be told to wait for an email.
// ---------------------------------------------------------------------------

async function confirm(sessionId: string): Promise<{ purchase: KitPurchase; token: string } | 'unpaid' | 'error'> {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return 'error'
  try {
    const stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' })
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!isPaidKitSession(session)) return 'unpaid'
    const { purchase, link } = await recordPurchase(session)
    const token = new URL(link).searchParams.get('t') ?? ''
    return { purchase, token }
  } catch (err) {
    console.error('[legacy-kit/thank-you] could not confirm session', err)
    return 'error'
  }
}

export default async function KitThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>
}) {
  const raw = (await searchParams).session_id
  const result = await confirm(typeof raw === 'string' ? raw : '')
  const support = process.env.LEGACY_KIT_SUPPORT_EMAIL || 'info@wisergenerations.com'

  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-text">Wiser Generations · Family Legacy</p>
        {typeof result === 'object' ? (
          <>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-evergreen sm:text-4xl">
              Thank you. Your Legacy Kit™ is ready.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-gray-800">
              Download it now. We&rsquo;ve also emailed the link to{' '}
              <strong>{result.purchase.email}</strong>, with your purchase confirmation.
            </p>
            <div className="mt-8">
              <DownloadPanel token={result.token} purchase={result.purchase} state={linkState(result.purchase)} />
            </div>
            <p className="mt-6 text-base leading-relaxed text-gray-700">
              Start with the Important notices on page 2, and sign them. Fill in one section at a time,
              and review the whole kit together each October.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-evergreen sm:text-4xl">
              {result === 'unpaid' ? 'We’re still confirming your payment' : 'We couldn’t load your download here'}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-gray-800">
              {result === 'unpaid'
                ? 'This can take a moment. Refresh this page in a minute. Your download link will also arrive by email as soon as payment is confirmed.'
                : 'If you completed payment, your download link is on its way to your email. If it hasn’t arrived in a few minutes, check your spam folder or email us.'}
            </p>
            <a href={`mailto:${support}`} className="mt-4 inline-block font-semibold text-evergreen underline">
              {support}
            </a>
          </>
        )}
        <p className="mt-10 text-sm font-semibold text-gray-800">Educational only — not legal, tax or financial advice.</p>
      </div>
    </div>
  )
}

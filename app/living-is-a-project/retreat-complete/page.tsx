import Link from 'next/link'
import { LIAP_RETREAT } from '@/lib/liap/product'

export const metadata = {
  title: 'Your retreat seat is reserved | Wiser Generations',
  robots: { index: false, follow: false },
}

// After Retreat payment. Like the pre-buy thank-you page, it does not look the
// order up: the webhook may land a moment after Stripe redirects.
export default function RetreatCompletePage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Registration confirmed</p>
      <h1 className="mt-4 text-3xl font-bold leading-tight text-navy sm:text-4xl">
        Thank you. Your seat at {LIAP_RETREAT.name} is reserved.
      </h1>
      <div className="mt-6 space-y-4 leading-relaxed text-gray-700">
        <p>Stripe has emailed your receipt. We&rsquo;ll follow up by email with your retreat details.</p>
        <p>
          Questions before then?{' '}
          <Link href="/contact" className="font-semibold text-navy underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </main>
  )
}

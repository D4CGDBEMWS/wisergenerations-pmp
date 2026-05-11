import Link from 'next/link'
import type { Metadata } from 'next'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export const metadata: Metadata = {
  // SECURITY: this page can be reached with a payment_intent query param.
  // PaymentIntent IDs are practically unguessable, but we still want this
  // page kept out of search engines, link previews, and Googlebot caches.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  title: 'Enrollment Confirmed | Wiser Generations Int’l™',
  description: 'Your Wiser Generations Int’l enrollment has been confirmed.',
}

type Props = {
  // Next.js 15+: searchParams is now a Promise.
  searchParams?: Promise<{
    payment_intent?: string
  }>
}

async function getEnrollment(paymentIntentId?: string) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey || !paymentIntentId?.startsWith('pi_')) {
    return null
  }

  try {
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-08-27.basil' })
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return null
    }

    // SECURITY: do not return name or email from this server function.
    // The page used to render them, but anyone with the URL (browser
    // history, screenshots, referrer leaks, support tickets) would then
    // see the buyer's identity. The receipt email is sent separately by
    // Stripe; the user already knows their own name.
    return {
      program: paymentIntent.metadata.program_name || 'Wiser Generations Program',
    }
  } catch (error) {
    console.error('Thank-you lookup error:', error)
    return null
  }
}

export default async function ThankYouPage({ searchParams }: Props) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const enrollment = await getEnrollment(resolvedSearchParams.payment_intent)

  return (
    <div className="min-h-screen bg-gray-50">
      <script dangerouslySetInnerHTML={{ __html: `if(typeof gtag==='function'){gtag('event','enrollment_complete')}` }} />
      <header className="bg-[#0a1628] px-6 py-4 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded bg-[#c9a84c] text-sm font-bold text-[#0a1628]">
              WG
            </div>
            <span className="font-semibold tracking-wide">Wiser Generations Int’l™</span>
          </Link>
          <span className="text-sm text-gray-300">Enrollment confirmed</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <section className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
              ✓
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a84c]">Thank you</p>
            <h1 className="mt-3 text-3xl font-bold text-[#0a1628] sm:text-4xl">
              {enrollment ? "You're officially enrolled." : 'Your payment was received.'}
            </h1>
            <p className="mt-4 text-base text-gray-600 sm:text-lg">
              {enrollment
                ? `You have been enrolled in ${enrollment.program}.`
                : 'We are verifying your enrollment details now. If you just completed payment, this page may update after a short refresh.'}
            </p>
            <p className="mt-3 text-sm text-gray-500">
              A confirmation and receipt have been sent to the email address on file.
            </p>
          </div>

          <div className="mt-10 grid gap-6 text-left md:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-6">
              <h2 className="text-lg font-semibold text-[#0a1628]">What happens next?</h2>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <p>1. Your receipt is emailed automatically after payment.</p>
                <p>2. Your student portal and onboarding details are sent by the team.</p>
                <p>3. You can book your kickoff call with Crystal using the link below.</p>
                <p>4. Study materials and next-step guidance follow after enrollment review.</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#0a1628] p-6 text-white">
              <h2 className="text-lg font-semibold text-[#c9a84c]">Book your kickoff call</h2>
              <p className="mt-3 text-sm text-gray-300">
                Choose a convenient time to connect with Crystal and map out your certification plan.
              </p>
              <a
                href="https://calendly.com/space4grace/30min-pod"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-xl bg-[#c9a84c] px-5 py-3 font-semibold text-[#0a1628] transition hover:bg-[#b8963e]"
              >
                Open Calendly
              </a>
              <p className="mt-4 text-xs text-gray-400">
                Need help? Email{' '}
                <a className="underline" href="mailto:info@wisergenerations.com">
                  info@wisergenerations.com
                </a>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-sm font-medium text-[#0a1628] underline underline-offset-4">
              Return to home page
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

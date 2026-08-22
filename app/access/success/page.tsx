import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import Link from 'next/link'
import { upsertCustomer } from '@/lib/customers'
import { grantEntitlement, STUDY_ACCESS } from '@/lib/entitlements'
import { identifyCheckoutSession, productGrants } from '@/lib/programs'
import {
  createSession,
  SESSION_COOKIE,
  LEGACY_COOKIE,
  sessionCookieOptions,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth/session'

export default async function AccessSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const sessionId = searchParams.session_id

  if (!sessionId) {
    redirect('/access')
  }

  let email = ''
  let customerName = ''

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    })

    const session = await stripe.checkout.sessions.retrieve(sessionId as string)

    // ── B-1. Paid is not the same as "paid for THIS product" ──────────────
    //
    // This page used to grant Study Access to any paid checkout session whose
    // id arrived in the query string. Every LIAP book buyer is handed a real
    // session id on their own success page, so pasting it here bought a
    // $49/month PMP product for the price of a book — and a future Boot Camp
    // purchase would have done the same.
    //
    // The product is now identified before anything is granted, and an
    // unrecognised, absent or foreign marker grants nothing.
    const product = identifyCheckoutSession(session)

    if (session.payment_status !== 'paid') {
      redirect('/access')
    }

    email = session.customer_email || (session.metadata?.email ?? '')
    customerName = typeof session.customer_details?.name === 'string'
      ? session.customer_details.name
      : ''

    // Record the purchase as an entitlement and open a real session.
    //
    // The previous implementation set wg_study_access to the Stripe session id
    // and treated that cookie's presence as authorization. It is replaced by a
    // durable entitlement plus an opaque server-side session, so access
    // survives independently of anything the browser holds.
    // Deliberately non-fatal. Stripe has already confirmed payment by this
    // point, so a database problem must not turn a successful purchase into an
    // error page. If this fails the customer still sees confirmation, and the
    // Stripe webhook grants the entitlement independently — failing that, the
    // login route's bounded Stripe lookup grants it on first sign-in. Three
    // independent paths to the same grant.
    try {
      const customer = await upsertCustomer({
        email,
        name: customerName || null,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
      })

      // Fails closed. A session this system cannot name, or one belonging to
      // another Wiser Generations program, reaches here and grants nothing —
      // the page still confirms their purchase, because it was real.
      if (productGrants(product, STUDY_ACCESS)) {
        await grantEntitlement({
          customerId: customer.id,
          entitlementKey: STUDY_ACCESS,
          sourceType: session.subscription ? 'subscription' : 'order',
          sourceId:
            (typeof session.subscription === 'string' ? session.subscription : null) ?? session.id,
          idempotencyKey: `checkout:${session.id}:${STUDY_ACCESS}`,
        })
      } else {
        console.warn(
          `[/access/success] no Study Access grant: session ${session.id} identifies as ` +
            `${product ? `${product.program}/${product.marker}` : 'an unrecognised product'}`
        )
      }

      const { token } = await createSession({ customerId: customer.id })
      const cookieStore = await cookies()
      cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions(SESSION_MAX_AGE_SECONDS))
      cookieStore.set(LEGACY_COOKIE, '', { path: '/', maxAge: 0 })
    } catch (grantErr) {
      console.error('[/access/success] could not record entitlement or open session:', grantErr)
    }
  } catch (err) {
    console.error('[/access/success] error:', err)
    redirect('/access')
  }

  const greeting = customerName ? ('Welcome, ' + customerName + '!') : 'Welcome!'
  const emailNote = email ? (' for ' + email) : ''

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-20">
      <div className="max-w-lg w-full text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold text-[#0a1628] mb-4">You are In!</h1>
        <p className="text-xl text-gray-600 mb-2">{greeting}</p>
        <p className="text-gray-600 mb-8">
          {'Your Study Access Package is now active' + emailNote + '. You have full access to the PMP® Exam Simulator and PMBOK Flashcards.'}
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8 text-left">
          <h2 className="font-bold text-[#0a1628] mb-3">Your tools are ready:</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <p className="font-semibold text-[#0a1628]">PMP Exam Simulator</p>
                <p className="text-sm text-gray-600">40+ questions across People, Process, and Business Environment</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🃏</span>
              <div>
                <p className="font-semibold text-[#0a1628]">PMBOK Flashcards</p>
                <p className="text-sm text-gray-600">85+ glossary terms with flip-card study mode</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/exam-simulator"
            className="bg-yellow-400 hover:bg-yellow-300 text-[#0a1628] font-bold py-4 px-8 rounded-xl text-lg transition-colors"
          >
            Start Exam Simulator
          </Link>
          <Link
            href="/flashcards"
            className="border-2 border-[#0a1628] text-[#0a1628] hover:bg-paper font-bold py-4 px-8 rounded-xl text-lg transition-colors"
          >
            Study Flashcards
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          A confirmation has been sent to you by Stripe.
          Questions? Email{' '}
          <a href="mailto:info@wisergenerations.com" className="text-yellow-600 underline">
            info@wisergenerations.com
          </a>
        </p>
      </div>
    </main>
  )
}

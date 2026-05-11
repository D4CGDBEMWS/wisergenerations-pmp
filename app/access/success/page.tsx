import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import Link from 'next/link'

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

    if (session.payment_status !== 'paid') {
      redirect('/access')
    }

    email = session.customer_email || (session.metadata?.email ?? '')
    customerName = typeof session.customer_details?.name === 'string'
      ? session.customer_details.name
      : ''

    const cookieStore = await cookies()
    cookieStore.set('wg_study_access', sessionId as string, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
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
          {'Your Study Access Package is now active' + emailNote + '. You have full access to the PMP Exam Simulator and PMBOK Flashcards.'}
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
            className="border-2 border-[#0a1628] text-[#0a1628] hover:bg-gray-50 font-bold py-4 px-8 rounded-xl text-lg transition-colors"
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

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { readLiapAccess } from '@/lib/liap/entitlements'
import { queryOne } from '@/lib/db/client'
import { AssessmentForm } from '@/components/liap/AssessmentForm'
import { LiapPageView } from '@/components/liap/LiapPageView'
import { assessmentOpen } from '@/lib/liap/assessment-availability'

export const metadata = {
  title: 'Life Project-Ready™ Assessment | Wiser Generations',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// The assessment. §34.
//
// Authorization happens here, on the server, before a single question is
// rendered — not inside the form component, where it would be a suggestion.
// The API re-checks on every save and every submit, because a session can be
// revoked and an entitlement refunded between the page loading and the last
// question being answered.
//
// The two failures are told apart deliberately, unlike elsewhere in the
// system: someone who is signed out needs to sign in, and someone signed in
// without a preorder needs to know that. Both are the customer's own state
// rather than an oracle about anyone else, so neither leaks anything.
// ---------------------------------------------------------------------------

export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ retake?: string }>
}) {
  const { retake } = await searchParams
  const access = await readLiapAccess()

  if (!access) {
    // The LIAP sign-in page, not the Study Access one. Shared authentication
    // infrastructure must not be visible to a reader as another product's
    // branding — owner ruling, 22 August 2026.
    redirect('/living-is-a-project/access')
  }

  if (!access.entitled) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-24">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">
          Your assessment isn&rsquo;t unlocked yet
        </h1>
        <p className="mt-4 leading-relaxed text-gray-600">
          The Life Project-Ready™ Assessment comes with a preorder of{' '}
          <em>Living Is a Project&hellip;Are You Ready?</em> We can&rsquo;t find a preorder on this account yet.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/living-is-a-project/book"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-navy px-6 font-bold text-white transition-colors hover:bg-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Preorder the book
          </Link>
          <Link
            href="/living-is-a-project/verify-preorder"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-gray-300 px-6 font-semibold text-navy transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            I preordered elsewhere
          </Link>
        </div>
        <p className="mt-8 text-sm text-gray-500">
          If you preordered in the last few minutes, give it a moment and refresh — payment
          confirmation can take a short time to arrive.
        </p>
      </main>
    )
  }

  // Entitled, but the Assessment has not opened yet (LIAP_ASSESSMENT off).
  // The entitlement is already recorded; nothing more is needed from the buyer.
  if (!assessmentOpen()) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-24">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">
          Thank you — your assessment is reserved
        </h1>
        <p className="mt-4 leading-relaxed text-gray-600">
          Your purchase of <em>Living Is a Project&hellip;Are You Ready?</em> includes the Life
          Project-Ready™ Assessment. It opens soon — we&rsquo;ll email you the moment it&rsquo;s
          ready, and you won&rsquo;t need to buy anything else.
        </p>
      </main>
    )
  }

  // Owner report, 2026-11-04: a buyer who had already finished was dropped
  // straight into a fresh assessment. Someone with a completed assessment now
  // sees when they finished and where their results are, and starts again
  // only by choosing to.
  if (retake !== '1') {
    const done = await queryOne<{ completed_at: string }>(
      `SELECT completed_at FROM assessments
        WHERE customer_id = $1 AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1`,
      [access.session.customerId]
    ).catch(() => null)
    if (done) {
      const when = new Date(done.completed_at).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York',
      })
      return (
        <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-24">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">You&rsquo;ve completed your assessment</h1>
          <p className="mt-4 leading-relaxed text-gray-600">
            You finished the Life Project-Ready&trade; Assessment on {when}. Your personalized plan was emailed
            to you: look for &ldquo;Your Life Project-Ready&trade; Plan Is Ready&rdquo; and use the
            &ldquo;View my personalized plan&rdquo; button in that email.
          </p>
          <p className="mt-4 leading-relaxed text-gray-600">
            Life changes, and so can your answers. You can take the assessment again at any time for a fresh plan.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/living-is-a-project/assessment?retake=1"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-navy px-6 font-bold text-white transition-colors hover:bg-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Take it again
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-gray-300 px-6 font-semibold text-navy transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              Can&rsquo;t find the email?
            </Link>
          </div>
        </main>
      )
    }
  }

  return (
    <main className="bg-gray-50">
      <LiapPageView event="liap_assessment_started" />
      <AssessmentForm />
    </main>
  )
}

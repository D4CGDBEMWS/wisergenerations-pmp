import Link from 'next/link'
import { redirect } from 'next/navigation'
import { readLiapAccess } from '@/lib/liap/entitlements'
import { AssessmentForm } from '@/components/liap/AssessmentForm'
import { LiapPageView } from '@/components/liap/LiapPageView'

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

export default async function AssessmentPage() {
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
          Your Assessment isn&rsquo;t activated yet.
        </h1>
        <p className="mt-4 leading-relaxed text-gray-600">
          Every new copy includes a unique access code. Register the code included with your book
          to activate your Assessment access.
        </p>
        {/* Registration is the normal route and is therefore the primary action.
            The old copy diagnosed a missing preorder, which is the wrong
            question: this reader may have been given the book, or bought it
            from a retailer, and in both cases they have a code and no
            preorder for us to find. */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/liap/book"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gold px-6 font-bold text-navy transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            Register my book
          </Link>
          <Link
            href="/living-is-a-project/book"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-gray-300 px-6 font-semibold text-navy transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
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
      </main>
    )
  }

  return (
    <main className="bg-gray-50">
      <LiapPageView event="liap_assessment_started" />
      <AssessmentForm />
    </main>
  )
}

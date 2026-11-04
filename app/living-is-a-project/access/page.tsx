import { LiapAccessForm } from '@/components/liap/LiapAccessForm'

export const metadata = {
  title: 'Continue Your LIAP Journey | Wiser Generations',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// The LIAP sign-in page.
//
// Owner ruling, 22 August 2026: one identity and shared authentication
// infrastructure, with a program-specific entry experience.
//
// Until now there was one sign-in surface, headed "Sign In to Study Tools" and
// asking for "the email from your Study Access subscription". A book reader
// sent there had arrived at another product — the language, the branding and
// the destination all belonged to the PMP business. Shared plumbing is not
// supposed to be visible to a customer, and that page made it visible.
//
// Everything underneath is the same: the same customers table, the same
// single-use token, the same opaque session. What differs is what the reader
// reads, what the email says, and where the link lands.
//
// All copy here is the owner's approved wording, verbatim.
// ---------------------------------------------------------------------------

const ERRORS: Record<string, string> = {
  expired: 'That link has already been used or has expired. Enter your email below and we’ll send you a new one.',
  'no-access': 'We couldn’t find LIAP access for that email. Use the email you pre-ordered with, or contact info@wisergenerations.com.',
}

export default async function LiapAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const message = error ? ERRORS[error] : undefined
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16 sm:py-24">
      <h1 className="text-3xl font-bold leading-tight text-navy sm:text-4xl">
        Continue Your LIAP Journey
      </h1>
      <p className="mt-4 leading-relaxed text-gray-700">
        Enter the email associated with your LIAP access and we&rsquo;ll send you a secure link.
      </p>

      {message && (
        <p role="alert" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-navy">
          {message}
        </p>
      )}

      <LiapAccessForm />
    </main>
  )
}

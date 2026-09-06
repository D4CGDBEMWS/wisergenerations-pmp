import Link from 'next/link'
import { VerifyPreorderForm } from '@/components/liap/VerifyPreorderForm'

export const metadata = {
  title: 'Verify your preorder | Wiser Generations',
  description: 'Preordered Living Is a Project…Are You Ready? from another retailer? Verify it here to activate your assessment.',
}

// ---------------------------------------------------------------------------
// §25. For customers who preordered somewhere other than here.
//
// The page is honest that this is reviewed by a person and takes time. A form
// that implied instant access and then did not deliver it would generate
// exactly the support load it was meant to avoid.
// ---------------------------------------------------------------------------

export default function VerifyPreorderPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-bold leading-tight text-navy sm:text-4xl">
        Preordered somewhere else?
      </h1>
      {/* Registration is the normal route; this page is the exception path for
          eligible copies without a usable code. A retailer customer holding a
          card should not be queued behind a human review. */}
      <p className="mt-4 rounded-lg border border-gold bg-light-gold px-4 py-3 leading-relaxed text-navy">
        If your copy has an access code,{' '}
        <Link href="/liap/book" className="font-bold underline hover:no-underline">
          register your book instead
        </Link>{' '}
        — it&rsquo;s instant.
      </p>
      <p className="mt-4 leading-relaxed text-gray-700">
        The Life Project-Ready™ Assessment comes with every preorder of{' '}
        <em>Living Is a Project&hellip;Are You Ready?</em> — including ones placed through another retailer.
        Send us the details and we&rsquo;ll activate it.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-gray-500">
        A person checks each one, so this is not instant. We&rsquo;ll email you when it&rsquo;s
        done, usually within two business days.
      </p>

      <VerifyPreorderForm />
    </main>
  )
}

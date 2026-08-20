import { VerifyPreorderForm } from '@/components/liap/VerifyPreorderForm'

export const metadata = {
  title: 'Verify your preorder | Wiser Generations',
  description: 'Preordered Life Is a Project… Be Ready. from another retailer? Verify it here to unlock your assessment.',
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
      <p className="mt-4 leading-relaxed text-gray-700">
        The Life Project-Ready™ Assessment comes with every preorder of{' '}
        <em>Life Is a Project… Be Ready.</em> — including ones placed through another retailer.
        Send us the details and we&rsquo;ll unlock it.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-gray-500">
        A person checks each one, so this is not instant. We&rsquo;ll email you when it&rsquo;s
        done, usually within two business days.
      </p>

      <VerifyPreorderForm />
    </main>
  )
}

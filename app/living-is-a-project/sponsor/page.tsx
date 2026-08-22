import { Suspense } from 'react'
import type { Metadata } from 'next'
import { RetreatInterestForm } from '@/components/liap/RetreatInterestForm'

// ---------------------------------------------------------------------------
// Sponsorship enquiries.
//
// ⚠ DRAFT COPY, AWAITING OWNER APPROVAL.
//
// Two things this page deliberately does not do. It does not describe any
// contribution as a tax-deductible charitable donation, because Wiser
// Generations International is a for-profit business and it would not be
// true. And it takes no money: sponsorship is a relationship that ends in an
// agreement and an invoice, not a checkout.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Sponsorship — Living Is a Project...Are You Ready?™',
  description: 'Support a participant or partner with Wiser Generations International.',
  robots: { index: false, follow: false },
}

export default function SponsorPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-xs font-bold uppercase tracking-widest text-gold">
        Living Is a Project...Are You Ready?™
      </p>
      <h1 className="mt-3 text-4xl font-bold text-navy">Sponsor a participant</h1>
      <p className="mt-4 text-lg text-gray-700">
        Some people who would get the most from this weekend are the least able
        to fund it themselves. Sponsors — businesses, congregations, veteran
        organisations, individuals — make those places possible.
      </p>
      <p className="mt-4 text-gray-700">
        Every sponsorship is arranged individually. Tell us what you have in
        mind and we will come back to you.
      </p>

      <div className="mt-10 rounded-xl border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-navy">Start the conversation</h2>
        <div className="mt-6">
          <Suspense fallback={<div className="min-h-[400px]" />}>
            <RetreatInterestForm
              inquiryType="sponsor"
              submitLabel="Send enquiry"
              confirmation="Thank you — we will be in touch to talk it through. Nothing has been charged."
            />
          </Suspense>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-600">
        Wiser Generations International is a for-profit business. Sponsorships
        and contributions are not tax-deductible charitable donations.
      </p>
    </main>
  )
}

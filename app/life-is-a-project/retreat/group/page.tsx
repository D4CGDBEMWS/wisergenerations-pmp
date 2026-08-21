import { Suspense } from 'react'
import type { Metadata } from 'next'
import { RetreatInterestForm } from '@/components/liap/RetreatInterestForm'
import { LIAP_RETREAT } from '@/lib/liap/retreat'

// ---------------------------------------------------------------------------
// Group enquiries — relationship-driven, with no self-service path.
//
// ⚠ DRAFT COPY, AWAITING OWNER APPROVAL.
//
// The load-bearing absence: no group discount is advertised, offered or
// calculated. No discount formula exists anywhere in this codebase. A group
// price is a number the owner records against a specific proposal after a
// conversation, and the five-person threshold below is a DISPLAY rule that
// decides which call to action appears — it prices nothing.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Group enquiries — Life Is a Project™ Retreat',
  description: 'Bringing a group to the Weekend Masterclass Retreat. Request information.',
  robots: { index: false, follow: false },
}

export default function GroupPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-xs font-bold uppercase tracking-widest text-gold">
        Life Is a Project™ Retreat
      </p>
      <h1 className="mt-3 text-4xl font-bold text-navy">Bringing a group</h1>
      <p className="mt-4 text-lg text-gray-700">
        Teams, congregations, families and organisations of{' '}
        {LIAP_RETREAT.groupThreshold} or more are welcome. Group arrangements are
        put together individually, because rooms, dates and what a group wants
        out of the weekend all differ.
      </p>

      <div className="mt-10 rounded-xl border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-navy">Request group information</h2>
        <p className="mt-2 mb-6 text-gray-700">
          Tell us roughly how many people and what you have in mind. We will
          come back to you with a proposal.
        </p>
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <RetreatInterestForm
            inquiryType="group"
            submitLabel="Request group information"
            confirmation="We will put together a proposal and come back to you. Nothing has been charged and no places are held yet."
          />
        </Suspense>
      </div>
    </main>
  )
}

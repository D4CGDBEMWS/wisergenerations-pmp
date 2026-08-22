import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { RetreatInterestForm } from '@/components/liap/RetreatInterestForm'
import { LIAP_RETREAT } from '@/lib/liap/retreat'

// ---------------------------------------------------------------------------
// The Weekend Masterclass Retreat — interest list only.
//
// ⚠ DRAFT COPY, AWAITING OWNER APPROVAL. Every visible sentence on this page
// is a placeholder written strictly from the owner's permitted-disclosure
// list and must be reviewed and replaced before the flag is switched on. AI
// does not publish customer-facing LIAP marketing copy.
//
// What this page may say, per the retreat IP rule: the price, that lodging
// and meals are included, that it is a weekend masterclass, that it involves
// facilitated real-time brainstorming, individual working time, reflection,
// planning and implementation, and that group opportunities exist for five or
// more.
//
// What it must NOT say, and does not: the detailed agenda, any hour-by-hour
// schedule, the exercise sequence, internal prompts, facilitator methodology,
// the participant reveal sequence, or anything from the protected curriculum.
// That material is released to participants, and not before arrival.
//
// There is deliberately no purchase button. The retreat is a managed premium
// conversion: interest, then review, then a private registration path issued
// to an approved participant. A public Buy Now here would give away every
// control the owner needs over dates, capacity, room configuration and who
// is in the room.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Weekend Masterclass Retreat — Living Is a Project...Are You Ready?™',
  description:
    'An immersive weekend masterclass. Lodging and meals included. Join the interest list.',
  // Not indexed while the copy is a draft and no date is announced.
  robots: { index: false, follow: false },
}

export default function RetreatPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-xs font-bold uppercase tracking-widest text-gold">
        Living Is a Project...Are You Ready?™
      </p>
      <h1 className="mt-3 text-4xl font-bold text-navy">
        The Weekend Masterclass Retreat
      </h1>
      <p className="mt-4 text-lg text-gray-700">
        A weekend to work on the thing you keep postponing — with the room, the
        time and the facilitation to actually finish something.
      </p>

      <dl className="mt-8 grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-gray-600">Investment</dt>
          <dd className="text-lg font-semibold text-navy">
            {LIAP_RETREAT.priceLabel} per person
          </dd>
        </div>
        <div>
          <dt className="text-sm text-gray-600">Included</dt>
          <dd className="text-lg font-semibold text-navy">Lodging and meals</dd>
        </div>
      </dl>

      <h2 className="mt-10 text-2xl font-bold text-navy">What the weekend involves</h2>
      <ul className="mt-4 space-y-2 text-gray-700">
        <li>Facilitated real-time brainstorming</li>
        <li>Individual working time on your own project</li>
        <li>Structured reflection</li>
        <li>Planning</li>
        <li>Implementation — you leave having started, not just decided</li>
      </ul>
      <p className="mt-4 text-sm text-gray-600">
        The full agenda is shared with participants ahead of arrival, along with
        everything needed to prepare and travel.
      </p>

      <div className="mt-12 rounded-xl border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-navy">Join the interest list</h2>
        <p className="mt-2 mb-6 text-gray-700">
          Places are limited and confirmed individually. Tell us a little about
          what you would bring to the weekend and we will be in touch about
          dates and availability.
        </p>
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <RetreatInterestForm
            inquiryType="individual"
            submitLabel="Join the interest list"
            confirmation="We review every enquiry personally and will be in touch about dates and availability. Nothing has been charged and no place is held yet."
          />
        </Suspense>
      </div>

      <p className="mt-8 text-sm text-gray-700">
        Coming as a group of five or more?{' '}
        <Link href="/living-is-a-project/retreat/group" className="font-semibold underline">
          Request group information
        </Link>
        .
      </p>
    </main>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { GIVEAWAY, LINKS, isGiveawayActive } from '@/lib/site-config'
import { FOUNDER } from '@/lib/constants'
import GiveawayEntryForm from './GiveawayEntryForm'
import GiveawayViewTracker from './GiveawayViewTracker'

// Every value on this page comes from content/config/giveaway.json so the
// owner can run a new giveaway without a developer. Nothing is hard-coded.

export const metadata: Metadata = {
  title: GIVEAWAY.title,
  description: GIVEAWAY.description,
}

function formatDate(value: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function GiveawayPage() {
  const live = isGiveawayActive()

  return (
    <div className="bg-paper">
      <GiveawayViewTracker active={live} />

      {/* Hero */}
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            {live ? 'Free Giveaway' : 'Giveaway'}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {GIVEAWAY.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-gray-300">
            {GIVEAWAY.description}
          </p>

          {live && (
            <dl className="mx-auto mt-10 grid max-w-lg grid-cols-2 gap-4 text-left">
              <div className="rounded-xl border border-white/15 bg-white/5 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Session length
                </dt>
                <dd className="mt-1 text-lg font-bold text-gold">
                  {GIVEAWAY.sessionDurationMinutes} minutes
                </dd>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Entries close
                </dt>
                <dd className="mt-1 text-lg font-bold text-gold">
                  {formatDate(GIVEAWAY.entryDeadline)}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        {live ? (
          <>
            <GiveawayEntryForm rulesHref="#official-rules" />

            {/* What the winner gets */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold tracking-tight text-navy">
                What the winner receives
              </h2>
              <p className="mt-3 text-base leading-7 text-gray-600">
                One {GIVEAWAY.sessionDurationMinutes}-minute one-on-one project management
                coaching session with {FOUNDER}, The Project Management Evangelist™ — 20+ years
                of enterprise PM experience, focused entirely on your situation.
              </p>
            </div>
          </>
        ) : (
          /* ---- No giveaway running -------------------------------------
             Honest empty state rather than a form that goes nowhere. */
          <div className="rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-navy">
              No giveaway is running right now
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-gray-600">
              We run coaching giveaways periodically. In the meantime, the fastest way to get
              personal help is a free 30-minute strategy call — no drawing required.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href={LINKS.scheduling}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-navy px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Book a free strategy call
              </a>
              <Link
                href={LINKS.freeGuide}
                className="rounded-xl border-2 border-navy/15 bg-white px-6 py-3 text-sm font-bold text-navy transition hover:border-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Get the free PMP® guide
              </Link>
            </div>
          </div>
        )}

        {/* Official rules — always shown, so the terms are inspectable even
            between campaigns. */}
        <div id="official-rules" className="mt-16 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight text-navy">Official rules</h2>

          <dl className="mt-6 space-y-5 text-sm leading-7 text-gray-700">
            {live && (
              <>
                <div>
                  <dt className="font-bold text-navy">Entry period</dt>
                  <dd>
                    {GIVEAWAY.entryStartDate ? formatDate(GIVEAWAY.entryStartDate) : 'Now'} through{' '}
                    {formatDate(GIVEAWAY.entryDeadline)}.
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-navy">Winner selection</dt>
                  <dd>
                    {formatDate(GIVEAWAY.winnerSelectionDate)}. {GIVEAWAY.winnerAnnouncement}
                  </dd>
                </div>
              </>
            )}
            <div>
              <dt className="font-bold text-navy">Eligibility</dt>
              <dd>{GIVEAWAY.eligibility}</dd>
            </div>
            <div>
              <dt className="font-bold text-navy">Terms</dt>
              <dd>{GIVEAWAY.terms}</dd>
            </div>
            <div>
              <dt className="font-bold text-navy">Sponsor</dt>
              <dd>
                Wiser Generations Int&apos;l, an Enterprise Academy program, Smyrna, Georgia.
                Questions:{' '}
                <a
                  href={`mailto:${LINKS.supportEmail}`}
                  className="font-semibold text-brand-blue underline hover:no-underline"
                >
                  {LINKS.supportEmail}
                </a>
                .
              </dd>
            </div>
          </dl>

          <p className="mt-8 text-xs leading-relaxed text-gray-500">
            This giveaway is not administered by, sponsored by, or associated with the Project
            Management Institute (PMI)® or any social media platform. See our{' '}
            <Link href={LINKS.privacyPolicy} className="underline hover:no-underline">
              Privacy Policy
            </Link>{' '}
            for how entry information is handled.
          </p>
        </div>
      </section>
    </div>
  )
}

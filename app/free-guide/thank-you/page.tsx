import type { Metadata } from 'next'
import Link from 'next/link'
import { LINKS, isGiveawayActive, GIVEAWAY } from '@/lib/site-config'
import { PMP_TIERS } from '@/lib/constants'
import GuideDownloadButton from './GuideDownloadButton'

// The guide lives in /public, so access does not depend on an email arriving.
const GUIDE_PATH = '/PMP-Exam-Change-Guide-WiserGenerations.pdf'

export const metadata: Metadata = {
  title: 'Your Free Guide Is Ready',
  description:
    'Download The 2026 PMP® Exam, Decoded — then see how Wiser Generations Int\'l turns it into a pass.',
  // A conversion confirmation page has no search value and should never
  // compete with /free-guide in the index.
  robots: { index: false, follow: true },
}

const entryPrice = PMP_TIERS[0].price

export default function FreeGuideThankYouPage() {
  const giveawayLive = isGiveawayActive()

  return (
    <div className="bg-paper">
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Confirmation */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-leaf-soft">
            <svg
              className="h-8 w-8 text-leaf"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-navy sm:text-5xl">
            Your guide is ready.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-gray-600">
            <strong className="text-navy">The 2026 PMP® Exam, Decoded</strong> — everything that
            changed on the current exam, and how to prepare for it.
          </p>

          <div className="mt-8">
            <GuideDownloadButton href={GUIDE_PATH} />
            <p className="mt-3 text-sm text-gray-500">
              We&apos;ve also emailed you a copy so it&apos;s easy to find later.
            </p>
          </div>
        </div>

        {/* Next step — the course */}
        <div className="mt-14 rounded-3xl border-2 border-gold bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
            Your next step
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            Want help putting what you&apos;re learning into action?
          </h2>
          <p className="mt-3 text-base leading-7 text-gray-600">
            The guide tells you what changed. The program gets you certified. Mentor-led PMP® prep
            with Crystal Stewart, PMP® — live cohorts, 35 PMI contact hours, a 694-question
            practice bank.
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              '36 hours of PMI-aligned education',
              'Live virtual cohort sessions',
              'Exam application support',
              'Pass guarantee — restudy free if needed',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf-soft text-xs font-bold text-leaf">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={LINKS.pmp}
              className="flex-1 rounded-xl bg-navy px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              Explore the PMP® Program — from ${entryPrice.toLocaleString('en-US')}
            </Link>
            <a
              href={LINKS.scheduling}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-xl border-2 border-navy/15 bg-white px-6 py-3.5 text-center text-sm font-bold text-navy transition hover:border-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              Book a free strategy call
            </a>
          </div>
        </div>

        {/* Giveaway — only when one is actually running */}
        {giveawayLive && (
          <div className="mt-8 rounded-3xl border border-line bg-light-gold p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              While you&apos;re here
            </p>
            <h3 className="mt-2 text-xl font-bold text-navy">{GIVEAWAY.title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
              {GIVEAWAY.description}
            </p>
            <Link
              href={LINKS.giveaway}
              className="mt-4 inline-block rounded-lg bg-gold px-6 py-2.5 text-sm font-bold text-navy transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              See the details
            </Link>
          </div>
        )}

        {/* Quiet secondary links — deliberately understated so they do not
            compete with the primary conversion above. */}
        <div className="mt-10 text-center text-sm text-gray-500">
          Or keep exploring:{' '}
          <Link href={LINKS.freePractice} className="font-semibold text-brand-blue underline hover:no-underline">
            free practice questions
          </Link>
          {' · '}
          <Link href={LINKS.blog} className="font-semibold text-brand-blue underline hover:no-underline">
            the blog
          </Link>
          {' · '}
          <Link href={LINKS.faq} className="font-semibold text-brand-blue underline hover:no-underline">
            FAQ
          </Link>
        </div>
      </section>
    </div>
  )
}

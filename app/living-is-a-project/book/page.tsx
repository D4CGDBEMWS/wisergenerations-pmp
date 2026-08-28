import Link from 'next/link'
import { LiapPageView } from '@/components/liap/LiapPageView'
import { LiapCta } from '@/components/liap/LiapCta'
import { LIAP_BOOK } from '@/lib/liap/product'
import { publicationDate } from '@/lib/liap/launch'

export const metadata = {
  title: 'Living Is a Project…Are You Ready? | Wiser Generations',
  description:
    `Preorder Living Is a Project…Are You Ready? and receive the Life Project-Ready™ Assessment at no additional charge. Publishing ${publicationDate()} from Goshen Publishing.`,
}

// ---------------------------------------------------------------------------
// The book page. §6, §7.
//
// The assessment is described as included, never priced. §7 is explicit that
// inflated dollar-value claims are not to be used, and "a $197 value, free"
// is exactly the move it rules out — it also invites the reader to work out
// that the number was invented.
// ---------------------------------------------------------------------------

const FAQ = [
  {
    q: 'When does the book ship?',
    a: `Publication is ${publicationDate()}. Preorder customers are charged now and receive their copy on release.`,
  },
  {
    q: 'When do I get the assessment?',
    a: 'Immediately. Your preorder unlocks the Life Project-Ready™ Assessment as soon as payment is confirmed — you do not wait for the book to arrive.',
  },
  {
    q: 'How long does the assessment take?',
    a: 'Most people finish in fifteen to twenty minutes. It saves as you go, so you can stop and come back.',
  },
  {
    q: 'Is the assessment scored by AI?',
    a: 'No. Every score, position and recommendation is produced by a fixed set of rules. Two people who answer identically receive identical results, and we can explain exactly why you were told what you were told.',
  },
  {
    q: 'What happens to what I write?',
    a: 'The open-ended answers are stored separately from everything else and deleted after 90 days. They are never sent to advertising or analytics systems, and never used for marketing.',
  },
  {
    q: 'I preordered somewhere else. Can I still get the assessment?',
    a: 'Yes. Submit your retailer order details for verification and we will unlock it once confirmed.',
  },
]

export default function LiapBookPage() {
  return (
    <main className="bg-white">
      <LiapPageView event="liap_book_view" />

      <section className="border-b border-gray-200 bg-navy text-white">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Goshen Publishing · {publicationDate()}
            </p>
            <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
              Living Is a Project&hellip;Are You Ready?
            </h1>

            <div className="mt-6 max-w-xl space-y-4 text-lg leading-relaxed text-gray-200">
              <p>Some life projects are chosen. Others choose us.</p>
              <p>Either way, we still need a plan for what comes next.</p>
            </div>

            <p className="mt-6 max-w-xl leading-relaxed text-gray-300">
              A practical book about managing the changes that arrive whether or not you planned
              them — job loss, retirement, caregiving, relocation, a business opening up, a
              relationship ending. It applies the discipline of project management to the parts of
              life that matter most, without turning your life into a spreadsheet.
            </p>

            <div className="mt-8 rounded-xl border border-white/15 bg-white/5 p-5">
              <p className="font-semibold text-gold">Your book begins the journey.</p>
              <p className="text-gold">Your assessment tells you where to begin.</p>
              <p className="mt-3 text-sm leading-relaxed text-gray-300">
                Preorder <em>Living Is a Project&hellip;Are You Ready?</em> and receive the Life Project-Ready&trade;
                Assessment at no additional charge.
              </p>
            </div>
          </div>

          {/* Cover */}
          <div className="lg:pt-2">
            <div
              className="mx-auto flex aspect-[2/3] w-full max-w-[280px] flex-col justify-between rounded-lg bg-gradient-to-br from-[#12233c] to-[#0A1628] p-6 text-center shadow-2xl ring-1 ring-white/10"
              role="img"
              aria-label="Cover of Living Is a Project…Are You Ready?"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                Wiser Generations
              </p>
              <div>
                <p className="text-2xl font-bold leading-tight text-white">
                  Living Is a<span className="block">Project&hellip;</span>
                </p>
                <p className="mt-3 text-lg font-semibold text-gold">Are You Ready?</p>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400">
                Goshen Publishing
              </p>
            </div>
            <dl className="mx-auto mt-6 max-w-[280px] space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                <dt className="text-gray-400">Price</dt>
                <dd className="font-semibold text-white">{LIAP_BOOK.priceLabel}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                <dt className="text-gray-400">Format</dt>
                <dd className="font-semibold text-white">{LIAP_BOOK.format}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">Publishes</dt>
                <dd className="font-semibold text-white">{publicationDate()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Primary CTA */}
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center sm:p-10">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">
            Preorder the book. Start your project now.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Your assessment unlocks the moment your preorder is confirmed. The book arrives in
            October.
          </p>
          <LiapCta className="mt-7 flex justify-center" />
          <p className="mt-4 text-sm text-gray-500">
            Secure checkout by Stripe.{' '}
            <Link
              href="/living-is-a-project/verify-preorder"
              className="font-semibold text-brand-blue underline underline-offset-2 hover:text-navy"
            >
              Preordered from another retailer?
            </Link>
          </p>
        </div>
      </section>

      {/* Author */}
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
          <h2 className="text-xl font-bold text-navy">About the author</h2>
          <p className="mt-4 leading-relaxed text-gray-700">
            Crystal Stewart is the founder of Wiser Generations, where she has spent her career
            teaching people to plan work that matters and finish it. <em>Living Is a Project&hellip;Are You Ready?</em> turns that same discipline toward the projects nobody assigns you — the
            ones that arrive with a phone call.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
          <h2 className="text-xl font-bold text-navy">Questions</h2>
          <dl className="mt-6 space-y-6">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold text-navy">{item.q}</dt>
                <dd className="mt-1.5 leading-relaxed text-gray-600">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  )
}

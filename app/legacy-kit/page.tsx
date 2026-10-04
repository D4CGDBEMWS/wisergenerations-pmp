import type { Metadata } from 'next'
import { BuyBox } from '@/components/legacy-kit/BuyBox'
import { readKitOutline } from '@/lib/legacy-kit/content'
import { LEGACY_KIT_NAME_TM, LEGACY_KIT_PRICE_DISPLAY } from '@/lib/legacy-kit/product'

export const metadata: Metadata = {
  title: { absolute: 'Legacy Kit for Families | Wiser Generations International' },
  description:
    'The Wiser Generations International Legacy Kit™ is a $30 fillable PDF workbook families complete at home to plan their first 90 days: save, invest and protect.',
}

// ---------------------------------------------------------------------------
// The Legacy Kit sales page.
//
// Copy rules from the owner's brief, enforced here rather than remembered:
//   - no income, savings or results promises
//   - no testimonials until real ones arrive with written consent
//   - "Educational only — not legal, tax or financial advice" on the page
//   - the Important notices repeated verbatim, from the same file as the PDF
// ---------------------------------------------------------------------------

/** One plain line per kit section, describing what the family fills in. */
const SECTION_BLURBS: Record<string, string> = {
  'Important notices (read first)': 'What the kit is and is not, safety contacts, and your one-household license.',
  'How to use this kit': 'How to work through the kit together, and a roadmap to mark where your family is now.',
  'Our family profile and mission': 'Who is in your plan, your family mission, five values, and the patterns you choose to end.',
  'First 90 days: save, invest, protect': 'Checklists for days 1–30, 31–60 and 61–90, and a day-90 review.',
  'Family budget and Legacy savings': 'A monthly budget, a Legacy savings tracker for each child, and an optional sponsor record.',
  'Readiness check and scorecard': 'Score eight areas of family life, then track simple monthly counts.',
  'Family constitution starter': 'Ten starting points for how your family lives and decides, with signature lines.',
  'Structure planner': 'The building blocks many families set up over years, and a list of your professionals.',
  'Resources': 'Georgia statewide contacts, and space to record what your own city and county tell you.',
}

const FAQ = [
  {
    q: 'What exactly do I get?',
    a: `A fillable PDF workbook. You can type your answers into the PDF and save it, or print it and write by hand. A download link arrives by email right after purchase.`,
  },
  {
    q: 'Is this legal, tax or financial advice?',
    a: 'No. The kit is educational planning worksheets. Before you sign a trust, form an LLC or nonprofit, buy insurance, invest, or change taxes, talk to a licensed attorney, CPA, insurance agent or financial adviser in your state.',
  },
  {
    q: 'We don’t live in Georgia. Is it still useful?',
    a: 'The planning worksheets work anywhere, but the state-specific details and contacts are for Georgia. Families outside Georgia, or outside the United States, should follow the laws of their own country, state or province and local government. The Resources section has blank rows for your own local contacts.',
  },
  {
    q: 'Can I share it with relatives or my church?',
    a: 'One purchase covers one household. Please don’t copy, resell or share the kit. Churches, nonprofits and community organizations can offer the kit to families under a separate partner license.',
  },
  {
    q: 'Does Wiser Generations see what we write?',
    a: 'No. Your answers stay on your own device or paper. We only receive what is needed to process your purchase and deliver the file.',
  },
  {
    q: 'Is the kit faith-based?',
    a: 'Yes. It is grounded in the Bible and quotes the King James Version. Faith content is offered, never forced.',
  },
  {
    q: 'What is your refund policy?',
    // Owner's decision, 4 Oct 2026: no refunds. Wording from the launch plan's
    // disclaimer 11, pending attorney review.
    a: 'Because the kit is a digital download delivered immediately, all sales are final. If your download link does not work, contact us and we will send a new one.',
  },
]

export default function LegacyKitPage() {
  const { sections, notices } = readKitOutline()

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">For families</p>
          <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">{LEGACY_KIT_NAME_TM}</h1>
          <p className="mt-4 text-xl text-gold sm:text-2xl">Plan your family’s first 90 days, together.</p>
          <div className="mt-8 max-w-2xl space-y-4 text-lg leading-relaxed text-gray-200">
            <p>
              A fillable workbook your family completes at home: your mission and values, a budget,
              savings goals for each child, a readiness check, a family constitution starter and a
              plan for what to build next.
            </p>
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#buy"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gold px-7 text-center text-base font-bold text-navy transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Get the kit — {LEGACY_KIT_PRICE_DISPLAY}
            </a>
            <a
              href="#inside"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/40 px-7 text-center text-base font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              See what’s inside
            </a>
          </div>
          <p className="mt-8 text-base font-semibold text-white">
            Educational only — not legal, tax or financial advice.
          </p>
        </div>
      </section>

      {/* First 90 days */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <p className="text-lg font-semibold leading-snug text-navy sm:text-2xl">
            The first 90 days: <span className="text-brand-blue">save, invest, protect.</span>
          </p>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-gray-700">
            The kit keeps the start simple. Days 1–30 you start: a family meeting, a profile and a
            budget. Days 31–60 you save and invest: a savings habit and one investing basic learned
            together. Days 61–90 you protect your family spiritually, physically and emotionally,
            and review what worked.
          </p>
        </div>
      </section>

      {/* What it is / who it's for */}
      <section className="mx-auto grid max-w-5xl gap-10 px-5 py-14 sm:px-8 sm:py-20 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">What it is</h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-700">
            A planning workbook, not a course and not a service. Every blank is a form field you can
            type into, and every checklist has boxes to tick. Fill it in one section at a time, meet
            once a month to update it, and review the whole kit together each October.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">Who it’s for</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-lg leading-relaxed text-gray-700">
            <li>Parents and grandparents who want a written plan the whole family can see.</li>
            <li>Families starting to save, organize paperwork or talk about the future together.</li>
            <li>Families who want faith-grounded planning they can adapt to their own beliefs.</li>
          </ul>
        </div>
      </section>

      {/* What's inside */}
      <section id="inside" className="bg-gray-50">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">What’s inside</h2>
          <ol className="mt-8 space-y-0">
            {sections.map((title, index) => {
              const last = index === sections.length - 1
              return (
                <li key={title} className="relative flex gap-5 pb-8 last:pb-0">
                  {!last && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px bg-gray-300"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className="relative z-10 mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 border-navy bg-navy text-xs font-bold text-white"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-navy">{title}</h3>
                    {SECTION_BLURBS[title] && (
                      <p className="mt-1 text-base text-gray-700">{SECTION_BLURBS[title]}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* Local rules */}
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <div className="rounded-2xl border-l-4 border-gold bg-amber-50 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">Check your local rules</h2>
          <p className="mt-2 text-lg leading-relaxed text-gray-800">
            The kit’s state details are for Georgia. Wherever you live, check with your city and
            county government before acting on anything local, such as zoning, building permits,
            home businesses, business licenses, home child care or elder care, short-term rentals
            and property taxes. Local rules can be stricter than state law.
          </p>
        </div>
      </section>

      {/* Important notices, verbatim from the kit */}
      <section id="important-notices" className="mx-auto max-w-5xl scroll-mt-24 px-5 pb-14 sm:px-8">
        <h2 className="text-2xl font-bold text-navy sm:text-3xl">Important notices</h2>
        <p className="mt-2 text-base text-gray-700">
          These appear on the first pages of the kit, word for word. Please read them before you buy.
        </p>
        <ul className="mt-6 space-y-3 text-base leading-relaxed text-gray-800">
          {notices.map((notice) => (
            <li key={notice.lead}>
              <strong className="text-navy">{notice.lead}</strong> {notice.body}
            </li>
          ))}
        </ul>
      </section>

      {/* Buy */}
      <section id="buy" className="scroll-mt-24 bg-navy">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-14 sm:px-8 sm:py-20 md:grid-cols-2 md:items-center">
          <div className="min-w-0 text-white">
            <h2 className="text-2xl font-bold sm:text-3xl">Get the kit</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-200">
              {LEGACY_KIT_PRICE_DISPLAY}, one household, yours to fill in and keep. Prices are in
              U.S. dollars and the kit can be bought from anywhere in the world.
            </p>
            <p className="mt-4 text-base text-gray-300">
              Church, nonprofit or community organization? Partner and bulk options are coming;{' '}
              <a href="/contact" className="font-semibold text-gold underline">contact us</a>.
            </p>
          </div>
          <BuyBox />
        </div>
      </section>

      {/* FAQ — native <details>, no client JavaScript */}
      <section aria-labelledby="faq-heading" className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
        <h2 id="faq-heading" className="text-2xl font-bold text-navy sm:text-3xl">
          Questions families ask
        </h2>
        <div className="mt-8 divide-y divide-gray-200 rounded-2xl border border-gray-200">
          {FAQ.map((item) => (
            <details key={item.q} className="group p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
                {item.q}
                <span aria-hidden="true" className="text-2xl text-gray-500 group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-base leading-relaxed text-gray-700">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-10 text-center text-base font-semibold text-gray-800">
          Educational only — not legal, tax or financial advice.
        </p>
      </section>
    </main>
  )
}

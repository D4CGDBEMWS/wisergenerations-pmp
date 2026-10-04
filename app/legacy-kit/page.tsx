import type { Metadata } from 'next'
import { BuyBox } from '@/components/legacy-kit/BuyBox'
import { readKitOutline } from '@/lib/legacy-kit/content'
import { LEGACY_KIT_NAME_TM, LEGACY_KIT_PRICE_DISPLAY } from '@/lib/legacy-kit/product'

export const metadata: Metadata = {
  title: { absolute: 'Family Legacy | Wiser Generations International' },
  description:
    'Plan your family’s legacy across generations. Start with the Wiser Generations International Legacy Kit™, a $30 fillable PDF workbook your family completes at home.',
}

// ---------------------------------------------------------------------------
// The family Legacy page.
//
// Owner ruling, 4 October 2026: this is the Wiser Generations family Legacy
// page, separate from the PMP offering and hidden the same way as LIAP (the
// layout's flag gate, noindex, no sitemap entry, its own shell). The page
// presents the family legacy approach first and the kit as the way to start.
//
// Written for a phone first. The owner found the earlier version too long on
// mobile, so the price and Buy button come early, and the long reference
// material (what's inside, the Important notices, local rules, the FAQ) sits
// in tap-to-open sections. Native <details>, so it all works without
// JavaScript and stays readable by search-in-page and screen readers.
//
// What stays off this page: anything from the family's own Master Plan
// (names, places, housing, trust or entity details). That plan is private;
// only the general approach it teaches is described here.
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

/** The approach, in three steps. General only — nothing from the private plan. */
const STEPS = [
  {
    title: 'Gather and agree',
    body: 'Hold a family meeting. Write down who is in your plan, your mission and the values you want to pass on.',
  },
  {
    title: 'Your first 90 days',
    body: 'Start a budget and a savings habit, learn one investing basic together, and protect your family’s faith, health and peace.',
  },
  {
    title: 'Review every October',
    body: 'Come back together once a year to look at what worked, update the plan and set the next year’s goals.',
  },
]

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

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

/** A tap-to-open panel. Large tap target, plus sign that turns into a cross. */
function Fold({
  id,
  title,
  hint,
  children,
}: {
  id?: string
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <details id={id} className="group scroll-mt-24 border-b border-sand last:border-b-0">
      <summary
        className={`flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-left ${FOCUS} focus-visible:outline-evergreen [&::-webkit-details-marker]:hidden`}
      >
        <span>
          <span className="block text-lg font-bold text-evergreen">{title}</span>
          {hint && <span className="mt-0.5 block text-sm text-gray-600">{hint}</span>}
        </span>
        <span
          aria-hidden="true"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-evergreen-soft text-xl leading-none text-evergreen transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  )
}

export default function LegacyKitPage() {
  const { sections, notices } = readKitOutline()

  return (
    <div className="bg-cream">
      {/* Hero — short on a phone: one promise, one line of context, one button. */}
      <section className="bg-evergreen text-white">
        <div className="mx-auto max-w-5xl px-5 pb-10 pt-10 sm:px-8 sm:pb-20 sm:pt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold sm:text-sm">
            Wiser Generations · Family Legacy
          </p>
          <h1 className="mt-4 text-[2rem] font-bold leading-[1.15] sm:text-5xl">
            Build a legacy your whole family can see.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85">
            A simple way for parents and grandparents to plan across generations: faith, family,
            money and protection, written down and reviewed together every year.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#buy"
              className={`inline-flex min-h-[52px] items-center justify-center rounded-xl bg-gold px-7 text-center text-base font-bold text-evergreen transition-colors hover:bg-yellow-400 ${FOCUS} focus-visible:outline-white`}
            >
              Start with the Legacy Kit — {LEGACY_KIT_PRICE_DISPLAY}
            </a>
            <a
              href="#how"
              className={`inline-flex min-h-[48px] items-center justify-center rounded-xl px-4 text-center text-base font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white ${FOCUS} focus-visible:outline-white`}
            >
              How it works
            </a>
          </div>
          <p className="mt-6 text-sm font-semibold text-white/90">
            Educational only — not legal, tax or financial advice.
          </p>
        </div>
      </section>

      {/* How it works — three steps, stacked on a phone. */}
      <section id="how" className="scroll-mt-20">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
          <h2 className="text-2xl font-bold text-evergreen sm:text-3xl">How it works</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sand md:flex-col">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-evergreen text-sm font-bold text-gold"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-evergreen">{step.title}</h3>
                  <p className="mt-1 text-base leading-relaxed text-gray-700">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The kit and the buy box together, so the price is never far away. */}
      <section id="buy" className="scroll-mt-20 bg-sand/60">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 sm:px-8 sm:py-16 md:grid-cols-2 md:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-text">Start here</p>
            <h2 className="mt-2 text-2xl font-bold text-evergreen sm:text-3xl">{LEGACY_KIT_NAME_TM}</h2>
            <p className="mt-3 text-lg leading-relaxed text-gray-800">
              A fillable workbook your family completes at home: your mission and values, a budget,
              savings goals for each child, a readiness check, a family constitution starter and a
              plan for what to build next.
            </p>
            <ul className="mt-4 space-y-2 text-base leading-relaxed text-gray-800">
              <li className="flex gap-2"><span aria-hidden="true" className="text-leaf">●</span>For parents and grandparents who want a written plan everyone can see.</li>
              <li className="flex gap-2"><span aria-hidden="true" className="text-leaf">●</span>For families starting to save, organize paperwork or talk about the future.</li>
              <li className="flex gap-2"><span aria-hidden="true" className="text-leaf">●</span>Faith-grounded, and yours to adapt to your own beliefs.</li>
            </ul>
            <p className="mt-5 text-base text-gray-700">
              Church, nonprofit or community group? Partner and bulk options are coming;{' '}
              <a href="/contact" className="font-semibold text-evergreen underline">contact us</a>.
            </p>
          </div>
          <BuyBox />
        </div>
      </section>

      {/* Reference material, folded so the page stays short on a phone. */}
      <section aria-label="Details" className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
        <h2 className="text-2xl font-bold text-evergreen sm:text-3xl">Before you buy</h2>
        <div className="mt-4 rounded-2xl bg-white px-5 shadow-sm ring-1 ring-sand sm:px-7">
          <Fold id="inside" title="What’s inside" hint={`${sections.length} sections, in order`}>
            <ol className="space-y-4">
              {sections.map((title, index) => (
                <li key={title} className="flex gap-3">
                  <span aria-hidden="true" className="w-6 flex-none pt-0.5 text-right text-sm font-bold text-gold-text">
                    {index + 1}.
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-evergreen">{title}</h3>
                    {SECTION_BLURBS[title] && (
                      <p className="mt-0.5 text-base text-gray-700">{SECTION_BLURBS[title]}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Fold>

          <Fold id="important-notices" title="Important notices" hint="Read before you buy · also on the kit’s first pages">
            <p className="text-base text-gray-700">
              These appear on the first pages of the kit, word for word.
            </p>
            <ul className="mt-4 space-y-3 text-base leading-relaxed text-gray-800">
              {notices.map((notice) => (
                <li key={notice.lead}>
                  <strong className="text-evergreen">{notice.lead}</strong> {notice.body}
                </li>
              ))}
            </ul>
          </Fold>

          <Fold title="Check your local rules" hint="The kit’s state details are for Georgia">
            <p className="text-base leading-relaxed text-gray-800">
              Wherever you live, check with your city and county government before acting on
              anything local, such as zoning, building permits, home businesses, business licenses,
              home child care or elder care, short-term rentals and property taxes. Local rules can
              be stricter than state law.
            </p>
          </Fold>
        </div>

        <h2 id="faq-heading" className="mt-12 text-2xl font-bold text-evergreen sm:text-3xl">
          Questions families ask
        </h2>
        <div aria-labelledby="faq-heading" className="mt-4 rounded-2xl bg-white px-5 shadow-sm ring-1 ring-sand sm:px-7">
          {FAQ.map((item) => (
            <Fold key={item.q} title={item.q}>
              <p className="text-base leading-relaxed text-gray-700">{item.a}</p>
            </Fold>
          ))}
        </div>

        <p className="mt-10 text-center text-base font-semibold text-gray-800">
          Educational only — not legal, tax or financial advice.
        </p>
      </section>
    </div>
  )
}

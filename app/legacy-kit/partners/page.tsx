import type { Metadata } from 'next'
import { LEGACY_KIT_NAME_TM, LEGACY_KIT_PRICE_DISPLAY } from '@/lib/legacy-kit/product'

export const metadata: Metadata = {
  title: { absolute: 'Partners — Legacy Kit | Wiser Generations International' },
  description:
    'How churches, nonprofits and community organizations can offer the Wiser Generations International Legacy Kit™ to the families they serve.',
}

// ---------------------------------------------------------------------------
// For churches, nonprofits and community organizations.
//
// Drawn from the launch plan's "Stage 1: Nonprofit partner pilot". Kept to what
// the plan commits to. Numbers the plan gives only as examples (bulk fee,
// revenue share) are NOT published: pricing is agreed per partner in the
// partner license, which the attorney drafts.
// ---------------------------------------------------------------------------

const MODELS = [
  {
    title: 'Free to families',
    body: 'Your organization, or a sponsor such as a local business or donor, pays for the kits and gives them to families at no cost.',
  },
  {
    title: 'Families buy the kit',
    body: `Families pay the regular ${LEGACY_KIT_PRICE_DISPLAY} price, and your organization shares in each sale.`,
  },
  {
    title: 'As part of a class',
    body: 'You run a class or workshop on family planning and include the kit for each family taking part.',
  },
]

const PROMISES = [
  'Families keep their own filled-in kits. Partners never collect what a family writes.',
  'The kit is offered as written: “Offered by [your organization] in partnership with Wiser Generations International,” with no changes to its content.',
  'Facilitators take one 2-hour training before the first class: how the kit works, the disclaimers, when to refer a family to a lawyer, CPA or counselor, and how to report harm.',
  'Partners follow their own child and elder protection policy and report harm right away.',
  'Results are reported in counts only, never names. Family stories are shared only with written consent.',
  'Agreements run for one year, and either side can end one on 30 days’ notice.',
]

export default function PartnersPage() {
  const contact = process.env.LEGACY_KIT_SUPPORT_EMAIL || 'info@wisergenerations.com'
  return (
    <div className="bg-cream">
      <section className="bg-evergreen text-white">
        <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold sm:text-sm">For partners</p>
          <h1 className="mt-4 text-[2rem] font-bold leading-[1.15] sm:text-5xl">
            Bring the Legacy Kit to the families you serve.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85">
            Churches, community development and financial-literacy nonprofits, housing counselors, CDFIs,
            and HBCU or extension programs already have families&rsquo; trust. The {LEGACY_KIT_NAME_TM} gives
            those families a simple written plan to start from.
          </p>
          <a
            href={`mailto:${contact}?subject=${encodeURIComponent('Legacy Kit partnership')}`}
            className="mt-7 inline-flex min-h-[52px] items-center justify-center rounded-xl bg-gold px-7 text-center text-base font-bold text-evergreen transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Talk with us about partnering
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <h2 className="text-2xl font-bold text-evergreen sm:text-3xl">Three ways to offer it</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {MODELS.map((m) => (
            <li key={m.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sand">
              <h3 className="text-lg font-bold text-evergreen">{m.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-gray-700">{m.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-base text-gray-700">
          Bulk pricing and revenue sharing are set out in a written partner license.
        </p>
      </section>

      <section className="bg-sand/60">
        <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
          <h2 className="text-2xl font-bold text-evergreen sm:text-3xl">How a partnership works</h2>
          <ol className="mt-6 space-y-4 text-base leading-relaxed text-gray-800">
            <li><strong className="text-evergreen">1. Meet.</strong> We share a one-page summary, a sample of the kit and its disclaimers, and ask what your families need most.</li>
            <li><strong className="text-evergreen">2. Sign a partner license.</strong> It covers price to families, branding, privacy and safety.</li>
            <li><strong className="text-evergreen">3. Train facilitators.</strong> One 2-hour session before your first class.</li>
            <li><strong className="text-evergreen">4. Run a small first group</strong> of families over their first 90 days, with a short anonymous survey at day 30 and day 90.</li>
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <h2 className="text-2xl font-bold text-evergreen sm:text-3xl">What every partner agrees to</h2>
        <ul className="mt-6 space-y-3 text-base leading-relaxed text-gray-800">
          {PROMISES.map((p) => (
            <li key={p.slice(0, 24)} className="flex gap-3">
              <span aria-hidden="true" className="text-leaf">●</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm font-semibold text-gray-800">
          Educational only — not legal, tax or financial advice. The partner license is drafted by our attorney.
        </p>
      </section>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import Faq from '@/components/marketing/Faq'

export const metadata: Metadata = {
  title: 'PMP® PDU Resources — Earn Your 60 PDUs Every 3 Years',
  description:
    'How to earn the 60 PDUs required to maintain your PMP® credential. Free PDU sources, the Talent Triangle breakdown, and how to log them in PMI® CCRS.',
  alternates: { canonical: '/resources/pdu-resources' },
  openGraph: {
    title: 'PMP® PDU Resources — Wiser Generations Int’l™',
    description:
      'Free guide to earning the 60 PDUs you need to renew your PMP® credential.',
    url: 'https://wisergenerations.com/resources/pdu-resources',
    type: 'article',
  },
}

// ---------------------------------------------------------------------------
// PDU Resources page — for credential holders, supports retention/upsell
// after the exam. Targets searches like "PMP PDUs", "how to earn PDUs",
// "free PMP PDUs", "PMI Talent Triangle PDUs".
// ---------------------------------------------------------------------------

const TALENT_TRIANGLE = [
  {
    pillar: 'Ways of Working',
    minimum: 8,
    description:
      'Predictive (Waterfall), Agile, hybrid, and other delivery approaches. PDUs in this category cover the technical "how" of running projects.',
    examples: [
      'PMBOK® Guide chapters and updates',
      'Scrum / Kanban / SAFe® courses',
      'Risk management workshops',
      'Earned value management training',
    ],
  },
  {
    pillar: 'Power Skills',
    minimum: 8,
    description:
      'Leadership, communication, conflict resolution, emotional intelligence, negotiation, team-building. The "people side" of PM that PMI® increasingly emphasizes.',
    examples: [
      'Leadership and influence courses',
      'Coaching and mentoring training',
      'Conflict resolution workshops',
      'Stakeholder engagement deep-dives',
    ],
  },
  {
    pillar: 'Business Acumen',
    minimum: 8,
    description:
      'Strategy, business analysis, organizational change, financial literacy, and the value-delivery side of PM. How projects connect to business outcomes.',
    examples: [
      'Business case development',
      'Strategic planning courses',
      'Organizational change management',
      'Financial literacy for PMs',
    ],
  },
] as const

const FREE_PDU_SOURCES = [
  {
    name: 'PMI® Webinars (ProjectManagement.com)',
    pdus: '~1 PDU each',
    cost: 'Free with PMI® membership',
    description:
      'Hundreds of on-demand webinars across all three Talent Triangle pillars. The single largest free PDU source for PMI® members.',
  },
  {
    name: 'PMI® Chapter meetings',
    pdus: '~1 PDU per meeting',
    cost: 'Often free for members',
    description:
      'Local PMI® chapters host monthly events and study groups. Most count for PDUs and many are free or low-cost.',
  },
  {
    name: 'Coursera / edX audit mode',
    pdus: 'Varies (1 PDU per hour)',
    cost: 'Free in audit mode',
    description:
      'Many university PM courses on Coursera and edX can be audited free. Self-report the contact hours as PDUs.',
  },
  {
    name: 'Self-directed reading',
    pdus: 'Up to 8 PDUs per cycle',
    cost: 'Free',
    description:
      'Reading PM books, articles, and white papers counts toward PDUs (capped at 8 per 3-year cycle). Document the source and time spent.',
  },
  {
    name: 'PMI® podcasts (PMI Projectified, etc.)',
    pdus: '~0.5 PDU per episode',
    cost: 'Free',
    description:
      'Listen during your commute. Document the episode title, date, and runtime in PMI® CCRS.',
  },
  {
    name: 'Volunteering as a PM',
    pdus: 'Up to 8 PDUs per cycle',
    cost: 'Free (your time)',
    description:
      'Volunteer PM work for nonprofits, PMI® chapters, or community organizations counts as "Giving Back" PDUs.',
  },
] as const

const FAQ_ITEMS = [
  {
    q: 'How many PDUs do I need to maintain my PMP®?',
    a: 'You need 60 Professional Development Units (PDUs) every 3 years to maintain your PMP® credential. Of those 60: at least 35 must be in Education (Talent Triangle), and up to 25 can be in Giving Back (volunteering, working as a practitioner, creating content).',
  },
  {
    q: 'What\u2019s the minimum per Talent Triangle pillar?',
    a: 'PMI® requires a minimum of 8 PDUs in each of the three pillars: Ways of Working, Power Skills, and Business Acumen. The remaining 11 Education PDUs can be distributed however you choose across the three pillars.',
  },
  {
    q: 'Where do I log my PDUs?',
    a: 'PMI® CCRS (Continuing Certification Requirements System) at ccrs.pmi.org. Log in with your PMI® account, click "Report PDUs," choose the activity type, and enter the details. Most courses, webinars, and books take 2 minutes to log.',
  },
  {
    q: 'Can I earn ALL 60 PDUs free?',
    a: 'Technically yes — between PMI® webinars (free for members), volunteering, self-directed reading, podcasts, and audit-mode online courses, you can hit 60 PDUs over 3 years without paying anything beyond your PMI® membership. Most PMs mix free and paid sources.',
  },
  {
    q: 'What happens if I don\u2019t earn 60 PDUs in 3 years?',
    a: 'Your PMP® enters a 1-year suspension period. During suspension you can still earn the missing PDUs to reinstate. If you don\u2019t reinstate within the suspension year, your PMP® expires and you have to retake the exam. Don\u2019t let it lapse.',
  },
  {
    q: 'Do PMP® prep courses count for PDUs?',
    a: 'Courses you teach or take after earning your PMP® count as PDUs. Your original PMP® prep course (the 35 contact hours you used to qualify for the exam) does NOT count toward PDUs — those were already used to earn the credential.',
  },
] as const

export default function PduResourcesPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            For PMP® Credential Holders
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            How to earn your 60 PMP® PDUs every 3 years
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-300">
            The PMI® Talent Triangle breakdown, free PDU sources, and how to log them in CCRS.
            Don&rsquo;t let your hard-earned PMP® lapse.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['60 PDUs / 3 years', '35 Education', '25 Giving Back', '8 min per pillar'].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-gold/40 px-3 py-1 text-xs font-bold text-gold"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* PDU breakdown */}
        <section className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">The 60-PDU breakdown</h2>
          <p className="mt-2 text-sm text-slate-600">
            PMI® splits the 60 required PDUs into two buckets. Hit the minimums in each.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-3xl font-bold text-slate-900">35</p>
              <p className="mt-1 text-sm font-bold text-slate-700">Education PDUs (minimum)</p>
              <p className="mt-2 text-sm text-slate-600">
                Spread across the PMI® Talent Triangle. Minimum 8 per pillar; remaining 11
                allocated however you choose.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-3xl font-bold text-slate-900">25</p>
              <p className="mt-1 text-sm font-bold text-slate-700">Giving Back PDUs (maximum)</p>
              <p className="mt-2 text-sm text-slate-600">
                Working as a practitioner (max 8), creating content (max 8), volunteering (max 8),
                or sharing knowledge (max 8). Capped at 25 total.
              </p>
            </div>
          </div>
        </section>

        {/* Talent Triangle */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900">The PMI® Talent Triangle</h2>
          <p className="mt-2 text-sm text-slate-600">
            Education PDUs must be distributed across three pillars. PMI® refreshed this in 2022.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {TALENT_TRIANGLE.map((pillar) => (
              <article
                key={pillar.pillar}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <header>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Min {pillar.minimum} PDUs
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{pillar.pillar}</h3>
                </header>
                <p className="mt-3 text-sm leading-6 text-slate-700">{pillar.description}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Examples
                </p>
                <ul className="mt-2 space-y-1">
                  {pillar.examples.map((ex) => (
                    <li key={ex} className="flex items-start gap-2 text-xs text-slate-600">
                      <span aria-hidden className="text-amber-600">▸</span>
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Free PDU sources */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900">Free PDU sources</h2>
          <p className="mt-2 text-sm text-slate-600">
            You can earn most or all of your 60 PDUs without paying for additional courses.
            Here&rsquo;s where to look first.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {FREE_PDU_SOURCES.map((source) => (
              <article
                key={source.name}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <header className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-900">{source.name}</h3>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    {source.cost}
                  </span>
                </header>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-amber-700">
                  {source.pdus}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{source.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Study Access angle for PDUs */}
        <section className="mt-16 overflow-hidden rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-white to-amber-50 p-8 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
            Need a structured PDU source?
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Wiser Generations Int’l™ Study Access — $47/month
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            Our monthly office hours, study library content, and PM template walkthroughs are
            self-reportable as Education PDUs across all three Talent Triangle pillars. A typical
            subscriber earns 10–15 PDUs per year just by participating, in addition to the
            branded PM templates dropped on the 1st of every month.
          </p>
          <Link
            href="/checkout"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400"
          >
            Start Study Access — $47/month →
          </Link>
        </section>

        {/* How to log */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900">How to log PDUs in PMI® CCRS</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              Go to <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">ccrs.pmi.org</code>{' '}
              and sign in with your PMI® account.
            </li>
            <li>Click <strong>Report PDUs</strong> in the top navigation.</li>
            <li>
              Select the activity category: Course or Training, Online or Digital Media,
              Read, Informal Learning, Working as a Practitioner, etc.
            </li>
            <li>
              Enter the activity name, provider, date, contact hours, and PDU breakdown by
              Talent Triangle pillar.
            </li>
            <li>
              <strong>Log PDUs as you earn them</strong> — don&rsquo;t batch them at the end of
              the cycle. PMI® can audit any claim, so keep certificates and receipts.
            </li>
          </ol>
        </section>

        {/* Related */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900">Related resources</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Link
              href="/resources/pmp-formulas"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Reference</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">PMP® Formulas Cheat Sheet</h3>
              <p className="mt-2 text-sm text-slate-600">
                Quick refresher on EVM, PERT, and other formulas you may have forgotten.
              </p>
            </Link>
            <Link
              href="/resources/pm-templates"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Templates</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">Branded PM Templates</h3>
              <p className="mt-2 text-sm text-slate-600">
                Agile + Waterfall templates for your active projects. Free with Study Access.
              </p>
            </Link>
            <Link
              href="/resources"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Hub</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">All free PMP® resources</h3>
              <p className="mt-2 text-sm text-slate-600">
                Browse every guide, reference, and tool from Wiser Generations Int’l™.
              </p>
            </Link>
          </div>
        </section>
      </div>

      {/* FAQ — emits FAQPage JSON-LD */}
      <Faq items={FAQ_ITEMS} heading="PDU FAQ" />

      {/* Article schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'How to earn your 60 PMP® PDUs every 3 years',
            description:
              'Free guide to the PMI® Talent Triangle, free PDU sources, and how to log PDUs in CCRS.',
            author: { '@type': 'Organization', name: 'Wiser Generations Int’l™' },
            publisher: { '@type': 'Organization', name: 'Wiser Generations Int’l™' },
            mainEntityOfPage: 'https://wisergenerations.com/resources/pdu-resources',
          }),
        }}
      />
    </main>
  )
}

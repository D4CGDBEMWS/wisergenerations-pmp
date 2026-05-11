import type { Metadata } from 'next'
import Link from 'next/link'
import Faq from '@/components/marketing/Faq'

export const metadata: Metadata = {
  title: 'Free Branded PM Templates — Agile & Waterfall',
  description:
    'Wiser Generations Int’l™ branded project management templates for Agile and Waterfall teams. Free monthly templates included with every $47/month Study Access subscription.',
  alternates: { canonical: '/resources/pm-templates' },
  openGraph: {
    title: 'Branded PM Templates — Wiser Generations Int’l™',
    description:
      'Agile and Waterfall PM templates included free with every Study Access subscription.',
    url: 'https://wisergenerations.com/resources/pm-templates',
    type: 'website',
  },
}

// ---------------------------------------------------------------------------
// PM Templates landing page
// Promotes the monthly templates perk for Study Access ($47/mo) subscribers.
// All templates are listed publicly so visitors can see exactly what they
// get; downloads are gated behind subscription (delivered via Mailchimp drip
// triggered by the "pm-templates-monthly" tag the webhook applies).
// ---------------------------------------------------------------------------

type Template = {
  name: string
  format: string
  description: string
  uses: string
}

const WATERFALL_TEMPLATES: Template[] = [
  {
    name: 'Project Charter',
    format: 'Word + Google Docs',
    description:
      'Authorize the project, define objectives, identify the project manager, and capture high-level scope, risks, and stakeholders in one document.',
    uses: 'Initiating any new project, securing sponsor sign-off',
  },
  {
    name: 'Stakeholder Register & Power/Interest Grid',
    format: 'Excel + Google Sheets',
    description:
      'Track every stakeholder, their role, contact info, influence level, and engagement strategy. Includes a printable Power/Interest grid.',
    uses: 'Stakeholder analysis, communication planning',
  },
  {
    name: 'Work Breakdown Structure (WBS)',
    format: 'Excel + Google Sheets',
    description:
      'Decompose project scope into deliverables and work packages. Includes WBS dictionary tab and visual hierarchy view.',
    uses: 'Scope definition, estimating, schedule baseline',
  },
  {
    name: 'Risk Register',
    format: 'Excel + Google Sheets',
    description:
      'Catalog risks with probability, impact, EMV, response strategy, owner, and trigger conditions. Pre-built risk scoring formulas included.',
    uses: 'Risk identification, qualitative analysis, response planning',
  },
  {
    name: 'Communication Plan & Status Report',
    format: 'Word + Google Docs',
    description:
      'Define who needs what information, when, and how. Plus a one-page weekly status report template aligned to RAG (red/amber/green) reporting.',
    uses: 'Communication planning, executive reporting',
  },
  {
    name: 'Change Request & Change Log',
    format: 'Word + Excel',
    description:
      'Standardized change request form and change log to feed integrated change control. Tracks impact assessment, CCB decision, and approval.',
    uses: 'Integrated change control, scope management',
  },
  {
    name: 'Lessons Learned Register',
    format: 'Excel + Google Sheets',
    description:
      'Capture what worked, what didn&rsquo;t, and what to do differently next time. Categorized by knowledge area for easy retrieval.',
    uses: 'Project closeout, organizational process assets',
  },
]

const AGILE_TEMPLATES: Template[] = [
  {
    name: 'Product Backlog & Story Map',
    format: 'Excel + Google Sheets',
    description:
      'Prioritized product backlog with story points, acceptance criteria, and value scoring. Includes a story map view for release planning.',
    uses: 'Backlog refinement, release planning',
  },
  {
    name: 'User Story & Definition of Done',
    format: 'Word + Google Docs',
    description:
      'User story template with INVEST checklist, acceptance criteria scaffold, and a configurable Definition of Done your team can adopt as-is.',
    uses: 'Story writing, sprint planning',
  },
  {
    name: 'Sprint Planner & Capacity Tracker',
    format: 'Excel + Google Sheets',
    description:
      'Plan sprints with team capacity, story commitments, and a burndown chart. Auto-calculates remaining work day-by-day.',
    uses: 'Sprint planning, daily stand-ups',
  },
  {
    name: 'Sprint Retrospective Board',
    format: 'PDF + Miro-ready',
    description:
      'Printable Start/Stop/Continue and Mad/Sad/Glad retrospective formats, plus action item tracker to close the loop sprint over sprint.',
    uses: 'Retrospectives, continuous improvement',
  },
  {
    name: 'Velocity & Burndown Tracker',
    format: 'Excel + Google Sheets',
    description:
      'Multi-sprint velocity tracker with rolling average, sprint-level burndown, and release-level burnup charts.',
    uses: 'Forecasting, sprint reviews',
  },
  {
    name: 'Agile RACI / Roles Matrix',
    format: 'Excel + Google Sheets',
    description:
      'Adapted RACI for Scrum and Kanban teams: Product Owner, Scrum Master, Dev Team, Stakeholders. Pre-filled with common ceremonies.',
    uses: 'Team launch, role clarity',
  },
] as const

const TEMPLATES_FAQ = [
  {
    q: 'How do I get the templates?',
    a: 'Subscribe to Wiser Generations Int’l™ Study Access ($47/month). The first template arrives in your inbox within 24 hours, and a fresh template is delivered on the 1st of each month for as long as your subscription is active.',
  },
  {
    q: 'What format are the templates in?',
    a: 'Most templates are delivered as Microsoft Office files (Word, Excel) with editable Google Docs / Sheets versions of every file. A few visual templates (retrospective boards, story maps) include PDF and Miro-ready formats.',
  },
  {
    q: 'Can I use these templates at work or with clients?',
    a: 'Yes. Subscribers receive a personal-use commercial license — use the templates on any project at your job, with your clients, or in your own consulting practice. You may not resell or redistribute the templates as standalone products.',
  },
  {
    q: 'What if I cancel my subscription?',
    a: 'You keep every template that was delivered to your inbox while you were a subscriber — they\u2019re yours forever. You\u2019ll just stop receiving the new monthly drops once your subscription lapses.',
  },
  {
    q: 'Are templates the only thing I get with Study Access?',
    a: 'No — Study Access also includes the self-paced PMP®/CAPM® study library, practice question bank, monthly live Q&A office hours, and the private study community. The templates are a member bonus on top of all of that.',
  },
  {
    q: 'Can I request a specific template?',
    a: 'Yes! Subscribers can vote on which template Crystal builds next via the monthly office hours. Your input directly shapes the template roadmap.',
  },
] as const

export default function PmTemplatesPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-950">
              ⭐ Member Bonus
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
              Wiser Generations Int’l™ Templates
            </span>
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Branded PM templates for Agile &amp; Waterfall — free with Study Access
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-300">
            Get a fresh Wiser Generations Int’l™ branded project management template every month —
            Project Charter, Risk Register, Sprint Planner, Retrospective Board, and more.
            Included free with every $47/month Study Access subscription.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/checkout"
              className="rounded-lg bg-gold px-6 py-3 text-base font-bold text-navy transition hover:bg-amber-400"
            >
              Start Study Access — $47/month →
            </Link>
            <Link
              href="#templates"
              className="rounded-lg border border-white/30 px-6 py-3 text-base font-bold text-white transition hover:bg-white/10"
            >
              See the templates
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Value strip */}
        <section className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-8 shadow-sm">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-3xl font-bold text-slate-900">13+</p>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Templates in the library and growing
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">2 formats</p>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Microsoft Office + Google Docs / Sheets
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">Monthly</p>
              <p className="mt-1 text-sm font-medium text-slate-600">
                A new template drops on the 1st of every month
              </p>
            </div>
          </div>
        </section>

        {/* Waterfall templates */}
        <section id="templates" className="mt-16 scroll-mt-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
            Waterfall / Predictive
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Templates for traditional projects
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {WATERFALL_TEMPLATES.map((t) => (
              <TemplateCard key={t.name} template={t} />
            ))}
          </div>
        </section>

        {/* Agile templates */}
        <section className="mt-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
            Agile / Scrum
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Templates for Agile teams
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {AGILE_TEMPLATES.map((t) => (
              <TemplateCard key={t.name} template={t} />
            ))}
          </div>
        </section>

        {/* Big subscribe CTA */}
        <section className="mt-16 overflow-hidden rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-white to-amber-50 p-10 shadow-lg">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              Get all 13 templates — and a fresh one every month
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Start Study Access — $47/month
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Self-paced PMP®/CAPM® study library, practice question bank, monthly office
              hours, private community, and the full PM templates library — including a brand
              new template delivered to your inbox on the 1st of every month. Cancel anytime.
            </p>
            <Link
              href="/checkout"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-amber-500 px-8 py-4 text-base font-bold text-slate-950 shadow-sm transition hover:bg-amber-400"
            >
              Start Study Access — $47/month →
            </Link>
            <p className="mt-3 text-xs text-slate-500">
              Secure checkout via Stripe. First template arrives within 24 hours.
            </p>
          </div>
        </section>
      </div>

      {/* FAQ — emits FAQPage JSON-LD */}
      <Faq items={TEMPLATES_FAQ} heading="PM Templates FAQ" />

      {/* Article schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: 'Wiser Generations Int’l™ PM Templates',
            description:
              'Branded project management templates for Agile and Waterfall teams, delivered monthly to Wiser Generations Int’l™ Study Access subscribers.',
            provider: { '@type': 'Organization', name: 'Wiser Generations Int’l™' },
            offers: {
              '@type': 'Offer',
              price: '47.00',
              priceCurrency: 'USD',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '47.00',
                priceCurrency: 'USD',
                billingDuration: 'P1M',
                unitText: 'MONTH',
              },
            },
          }),
        }}
      />
    </main>
  )
}

// ---------------------------------------------------------------------------
// TemplateCard — single template preview tile
// ---------------------------------------------------------------------------
function TemplateCard({ template }: { template: Template }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900">{template.name}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          {template.format}
        </span>
      </div>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{template.description}</p>
      <p className="mt-3 text-xs text-slate-500">
        <strong className="text-slate-700">Best for:</strong> {template.uses}
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
        <span aria-hidden className="text-base">🔒</span>
        <span className="text-xs font-bold text-amber-800">
          Member download — included with Study Access
        </span>
      </div>
    </article>
  )
}

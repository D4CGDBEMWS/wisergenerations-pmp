import type { Metadata } from 'next'
import Link from 'next/link'
import ResourceCTA from '@/components/marketing/ResourceCTA'

export const metadata: Metadata = {
  title: 'PMP® Resource Center — Free Guides, Formulas & Study Tools',
  description:
    'Free PMP® and CAPM® study resources from Wiser Generations Int’l™: exam change guides, formula references, practice questions, and study plans for career transitioners and veterans.',
  alternates: { canonical: '/resources' },
  openGraph: {
    title: 'PMP® Resource Center — Wiser Generations Int’l™',
    description:
      'Free PMP® study resources, formula references, exam change guides, and practice questions.',
    url: 'https://wisergenerations.com/resources',
    type: 'website',
  },
}

// ---------------------------------------------------------------------------
// Resource hub — single landing page that surfaces every free Wiser
// Generations™ resource and funnels into the Study Access subscription tier.
// ---------------------------------------------------------------------------

type Resource = {
  title: string
  description: string
  href: string
  badge?: string
  external?: boolean
}

const FEATURED: Resource = {
  title: 'PMP® Exam Changes 2026 — Free Guide',
  description:
    'Crystal Stewart\u2019s field guide to the 2026 PMP® exam updates: what\u2019s new, what to study, and how to plan your prep timeline.',
  href: '/free-guide',
  badge: 'Most popular',
}

const RESOURCES: Resource[] = [
  {
    title: 'PMP® Formulas Reference',
    description:
      'The 12 formulas that show up most on the PMP® exam, with purpose, calculation, and when-to-use notes.',
    href: '/resources/pmp-formulas',
    badge: 'New',
  },
  {
    title: 'PMP® Practice Questions',
    description:
      '8 free sample PMP® exam questions with full answer explanations to gauge your readiness.',
    href: '/resources/practice-questions',
    badge: 'Free',
  },
  {
    title: 'PMP® ITTO Cheat Sheet',
    description:
      'Inputs, Tools & Techniques, and Outputs across the 10 PMI® knowledge areas — patterns, not memorization.',
    href: '/resources/itto-cheat-sheet',
    badge: 'New',
  },
  {
    title: 'Branded PM Templates (Agile + Waterfall)',
    description:
      '13+ branded PM templates — Project Charter, Risk Register, Sprint Planner, and more. Free with Study Access.',
    href: '/resources/pm-templates',
    badge: 'Member bonus',
  },
  {
    title: 'Career Transition Roadmap',
    description:
      'A 5-phase, 12-month plan for transitioning into PM from any background. Action items, timelines, and salary benchmarks.',
    href: '/resources/career-transition',
    badge: 'New',
  },
  {
    title: 'PMP® PDU Resources',
    description:
      'How to earn the 60 PDUs needed to renew your PMP® every 3 years — including 6 free PDU sources.',
    href: '/resources/pdu-resources',
    badge: 'For PMPs',
  },
  {
    title: 'Wiser Generations Int’l™ Blog',
    description:
      'Weekly articles on PMP® prep, career transition, veterans, and corporate training. Subscribe for launch.',
    href: '/resources/blog',
    badge: 'Coming soon',
  },
  {
    title: 'Veterans PM Pathway',
    description:
      'Resources tailored to veterans translating military experience into project management roles.',
    href: '/veterans',
  },
  {
    title: 'Corporate Team Training',
    description:
      'Cohort-based PMP® and CAPM® training for corporate L&D teams and federal contractors.',
    href: '/corporate',
  },
  {
    title: 'PMI® Official Site',
    description:
      'Project Management Institute — the certifying body for PMP®, CAPM®, and PMI-ACP®.',
    href: 'https://www.pmi.org',
    external: true,
  },
]

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            Wiser Generations Int’l™ Resource Center
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Free PMP® study tools, guides, and exam resources
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300">
            Everything we use with our students — from exam change guides to formula references —
            available free. When you&rsquo;re ready for live coaching, our $47/month Study Access
            and full programs are one click away.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/free-guide"
              className="rounded-lg bg-gold px-5 py-3 text-sm font-bold text-navy transition hover:bg-amber-400"
            >
              📥 Get the 2026 Exam Guide
            </Link>
            <Link
              href="/checkout"
              className="rounded-lg border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              See checkout options
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Featured */}
        <section aria-labelledby="featured-heading">
          <h2
            id="featured-heading"
            className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
          >
            Featured resource
          </h2>
          <Link
            href={FEATURED.href}
            className="mt-4 block overflow-hidden rounded-3xl border-2 border-gold bg-gradient-to-br from-white to-amber-50 p-8 shadow-sm transition hover:shadow-md"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                {FEATURED.badge ? (
                  <span className="inline-flex items-center rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-950">
                    ★ {FEATURED.badge}
                  </span>
                ) : null}
                <h3 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {FEATURED.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">{FEATURED.description}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950">
                Download free →
              </span>
            </div>
          </Link>
        </section>

        {/* Soft CTA — Study Access upsell */}
        <ResourceCTA variant="soft" />

        {/* Resource grid */}
        <section aria-labelledby="all-resources-heading">
          <h2
            id="all-resources-heading"
            className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
          >
            All resources
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {RESOURCES.map((resource) => {
              const cardClass =
                'group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md'

              const inner = (
                <>
                  {resource.badge ? (
                    <span className="self-start rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                      {resource.badge}
                    </span>
                  ) : null}
                  <h3 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-navy">
                    {resource.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                    {resource.description}
                  </p>
                  <span className="mt-4 text-sm font-bold text-gold group-hover:text-amber-600">
                    {resource.external ? 'Visit site →' : 'Open resource →'}
                  </span>
                </>
              )

              if (resource.external) {
                return (
                  <a
                    key={resource.href}
                    href={resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClass}
                  >
                    {inner}
                  </a>
                )
              }

              return (
                <Link key={resource.href} href={resource.href} className={cardClass}>
                  {inner}
                </Link>
              )
            })}
          </div>
        </section>

        {/* Hard CTA — full programs */}
        <ResourceCTA variant="hard" />

        {/* FAQ section — basic SEO schema */}
        <section aria-labelledby="faq-heading" className="mt-16">
          <h2
            id="faq-heading"
            className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
          >
            Frequently asked
          </h2>
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {FAQ.map((item) => (
              <details key={item.q} className="group p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-slate-900">
                  {item.q}
                  <span className="text-gold transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* JSON-LD FAQ schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }),
        }}
      />
    </main>
  )
}

const FAQ = [
  {
    q: 'Are these PMP® resources really free?',
    a: 'Yes. Every guide and reference page on this hub is free. Wiser Generations Int’l™ Study Access ($47/month) and our full mentor-led programs are paid options for students who want deeper practice questions, live coaching, and accountability.',
  },
  {
    q: 'Do I need to be a PMI® member to use these resources?',
    a: 'No. Our resources are written for prospective PMP® and CAPM® candidates and do not require PMI® membership. PMI® membership is recommended once you commit to sitting for the exam, since it discounts the exam fee.',
  },
  {
    q: 'How do these resources compare to a full PMP® course?',
    a: 'These free resources are great for building foundational knowledge. A full mentor-led course like our PMP® Certification Prep adds live instruction, application support, practice exams, and personalized coaching from Crystal Stewart and the Wiser Generations Int’l™ team.',
  },
  {
    q: 'Can corporate teams use these for L&D?',
    a: 'Yes. Many corporate L&D teams use our free resources to gauge baseline readiness before enrolling cohorts in our paid Corporate Training program. Contact us to discuss group rates.',
  },
] as const

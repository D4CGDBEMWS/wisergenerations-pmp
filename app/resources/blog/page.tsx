import type { Metadata } from 'next'
import Link from 'next/link'
import BlogLaunchSignup from '@/components/marketing/BlogLaunchSignup'

export const metadata: Metadata = {
  title: 'Wiser Generations Int’l™ Blog — PMP®, Career Transition, Veterans',
  description:
    'Crystal Stewart\u2019s upcoming blog covering PMP® exam prep, career transition, veterans pathways, and corporate training. Subscribe for launch.',
  alternates: { canonical: '/resources/blog' },
  openGraph: {
    title: 'Wiser Generations Int’l™ Blog',
    description:
      'PMP® exam prep, career transition, and veterans PM resources from Crystal Stewart.',
    url: 'https://wisergenerations.com/resources/blog',
    type: 'website',
  },
}

// ---------------------------------------------------------------------------
// Blog stub — establishes the URL structure so Crystal can backfill posts
// later. Currently shows a "coming soon" hero with launch list email
// capture, plus links into the existing pillar pages so visitors who land
// here have somewhere productive to go.
// ---------------------------------------------------------------------------

const PLANNED_TOPICS = [
  {
    category: 'PMP® Exam Prep',
    posts: [
      'How to build a 12-week PMP® study plan that actually works',
      'The 5 PMP® exam questions everyone gets wrong',
      'PMP® or CAPM® — which credential should you start with?',
      'What\u2019s actually changing on the July 8, 2026 PMP® exam',
    ],
  },
  {
    category: 'Career Transition',
    posts: [
      'How marketers can pivot into project management in 12 months',
      'From IT engineer to tech PM — the credentials that matter',
      'Healthcare professionals: the fastest-growing PM specialty',
      'How to write a PM resume that gets past ATS filters',
    ],
  },
  {
    category: 'Veterans Pathway',
    posts: [
      'Translating your MOS into PMP® application language',
      'GI Bill® reality check: what really pays for PM certification',
      'From E-7 to senior PM in 18 months — a real transition story',
    ],
  },
  {
    category: 'Corporate Training',
    posts: [
      'How to justify PMP® training to your CFO',
      'Building a high-trust internal PMO from scratch',
      'Why your team\u2019s "Agile transformation" stalled (and how to restart)',
    ],
  },
]

const RECENT_RESOURCES = [
  {
    title: 'PMP® Formulas Cheat Sheet',
    href: '/resources/pmp-formulas',
    badge: 'Reference',
  },
  {
    title: 'PMP® ITTO Cheat Sheet',
    href: '/resources/itto-cheat-sheet',
    badge: 'Reference',
  },
  {
    title: 'Free PMP® Practice Questions',
    href: '/resources/practice-questions',
    badge: 'Practice',
  },
  {
    title: 'Career Transition Roadmap',
    href: '/resources/career-transition',
    badge: 'Guide',
  },
  {
    title: 'PMP® PDU Resources',
    href: '/resources/pdu-resources',
    badge: 'Renewal',
  },
  {
    title: 'Branded PM Templates',
    href: '/resources/pm-templates',
    badge: 'Member bonus',
  },
] as const

export default function BlogStubPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            Wiser Generations Int’l™ Blog
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            New posts launching soon
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-300">
            Crystal Stewart and the Wiser Generations Int’l™ team are publishing weekly articles on
            PMP® exam prep, career transition, veterans pathways, and corporate training. Drop
            your email and we&rsquo;ll notify you the moment the first post lands.
          </p>
          <BlogLaunchSignup />
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Planned topics */}
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
            Coming up
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Topics we&rsquo;ll be writing about
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Here&rsquo;s the editorial calendar. Have a topic you want covered first?{' '}
            <Link href="/contact" className="font-bold text-amber-700 underline">
              Tell us
            </Link>{' '}
            — we prioritize what subscribers ask for.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {PLANNED_TOPICS.map((cat) => (
              <article
                key={cat.category}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  {cat.category}
                </p>
                <ul className="mt-3 space-y-2">
                  {cat.posts.map((post) => (
                    <li key={post} className="flex items-start gap-2 text-sm text-slate-700">
                      <span aria-hidden className="mt-0.5 text-amber-600">▸</span>
                      <span>{post}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Existing resources */}
        <section className="mt-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
            While you wait
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Free guides and references already published
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            We&rsquo;ve already shipped a full library of free PMP® resources. Start here.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {RECENT_RESOURCES.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md"
              >
                <span className="self-start rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  {r.badge}
                </span>
                <h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-navy">
                  {r.title}
                </h3>
                <span className="mt-3 text-sm font-bold text-gold group-hover:text-amber-600">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

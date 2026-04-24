import type { Metadata } from 'next'
import Link from 'next/link'
import ResourceCTA from '@/components/marketing/ResourceCTA'
import Faq from '@/components/marketing/Faq'

export const metadata: Metadata = {
  title: 'Career Transition to Project Management — A Practical Roadmap',
  description:
    'Free roadmap for transitioning into project management from any career background. Timeline, certifications, portfolio building, and how to land your first PM role.',
  alternates: { canonical: '/resources/career-transition' },
  openGraph: {
    title: 'Career Transition to PM — Wiser Generations Int’l™',
    description:
      'A practical, step-by-step roadmap for moving into project management — from any background.',
    url: 'https://wisergenerations.com/resources/career-transition',
    type: 'article',
  },
}

// ---------------------------------------------------------------------------
// Career Transition pillar page — third high-value SEO target
// Focuses on Wiser Generations Int’l™' primary audience: working professionals
// switching careers into PM. Funnels into Study Access ($47/mo) for the
// study materials and the full programs for live mentor support.
// ---------------------------------------------------------------------------

const PHASES = [
  {
    n: 1,
    title: 'Months 0–1: Decide if PM is the right fit',
    body: 'Project management isn&rsquo;t a personality test — it\u2019s a daily practice. Spend the first month understanding what PMs actually do (and don\u2019t), reading PMI\u2019s Code of Ethics, and shadowing a PM in your current company if possible. If the day-to-day energizes you (planning, coordinating, unblocking, communicating) — keep going. If it drains you, pivot.',
    actions: [
      'Read PMI\u2019s "What is Project Management" overview',
      'Listen to 3 PM podcast episodes (PM Happy Hour, PMI Projectified)',
      'Set up a 30-min coffee chat with a working PM in any industry',
      'Audit a free PM course on Coursera or LinkedIn Learning',
    ],
  },
  {
    n: 2,
    title: 'Months 1–3: Map your existing experience to PM language',
    body: 'You almost certainly have project management experience already — you just don\u2019t call it that. Anyone who has organized a launch, coordinated cross-team work, managed a budget, or led a deliverable to a deadline has been doing PM work. The next step is translating that into PMI\u2019s vocabulary so it counts on a PMP application and on a resume.',
    actions: [
      'List every project you\u2019ve led, scoped, or coordinated (no matter how small)',
      'For each, write down: scope, stakeholders, timeline, budget, outcome',
      'Re-write your resume bullets using PM verbs: scoped, planned, mitigated, escalated, delivered',
      'Read 5 PMP-eligible job descriptions and note the recurring keywords',
    ],
  },
  {
    n: 3,
    title: 'Months 3–6: Earn your foundational credential',
    body: 'You don\u2019t need a credential to start applying for PM roles, but you\u2019ll get more interviews with one. CAPM® is the entry-level PMI® credential and requires no prior PM experience — just 23 contact hours of education. PMP® requires 36+ months of project leadership experience plus 35 contact hours. Most career transitioners start with CAPM® and earn PMP® once they have 3 years in seat.',
    actions: [
      'Choose CAPM® (no experience required) or PMP® (3+ years experience)',
      'Enroll in a PMI-aligned prep course (35 contact hours included)',
      'Join a study cohort or community for accountability',
      'Schedule your exam date 8–12 weeks out — locks you in',
    ],
  },
  {
    n: 4,
    title: 'Months 6–9: Build a real PM portfolio',
    body: 'Hiring managers want to see that you can do the work, not just pass an exam. The fastest way to build a portfolio is volunteer projects, internal projects at your current job, or small consulting engagements. Document everything — charters, status reports, lessons learned — because that becomes your interview ammunition.',
    actions: [
      'Volunteer to PM 1–2 projects at your current job (cross-team is best)',
      'Write a project charter, communication plan, and risk register for each',
      'Build a portfolio webpage or PDF showing 3–5 projects',
      'Publish 2–3 LinkedIn articles about PM lessons you\u2019ve learned',
    ],
  },
  {
    n: 5,
    title: 'Months 9–12: Land your first PM role',
    body: 'This is where most career transitioners stall — they apply to "Project Manager" titles instead of stepping-stone roles. Look for "Junior PM," "Project Coordinator," "Scrum Master," "Implementation Specialist," "Program Coordinator," or "PMO Analyst." These roles get you the title and the experience that unlocks the senior PM jobs in 18–24 months.',
    actions: [
      'Target 30 stepping-stone roles per week (not just "PM" titles)',
      'Customize your resume for each application using job description keywords',
      'Reach out to a hiring manager on LinkedIn for every application',
      'Practice answering: "Walk me through a project you\u2019ve managed."',
      'Negotiate the offer — even $5K up-front compounds over your career',
    ],
  },
] as const

const COMMON_BACKGROUNDS = [
  {
    from: 'Marketing / Communications',
    why:
      'You\u2019ve already managed launches, coordinated cross-team campaigns, hit deadlines under pressure, and worked with budgets. PM is a natural next step — especially in marketing operations and digital project management.',
  },
  {
    from: 'IT / Software Engineering',
    why:
      'You understand technical scope, dependencies, and risk in a way most PMs don\u2019t. Tech PM and Scrum Master roles love engineers who want to lead. Agile credentials (PMI-ACP®, CSM) often complement PMP®.',
  },
  {
    from: 'Operations / Logistics',
    why:
      'You\u2019ve been managing scope, schedule, cost, quality, and resources every day — that\u2019s the entire PMP® curriculum. The transition is largely about translating Ops vocabulary into PMI® vocabulary.',
  },
  {
    from: 'Healthcare / Clinical',
    why:
      'Healthcare project management is one of the fastest-growing PM specialties. Your domain expertise is rare and valuable — pair it with PMP® and you\u2019re positioned for Healthcare PMO roles or EHR implementation work.',
  },
  {
    from: 'Education / Training',
    why:
      'Curriculum development, program coordination, and stakeholder management are core PM skills. EdTech, instructional design PM, and corporate L&D are great destination industries.',
  },
  {
    from: 'Military / Government',
    why:
      'Mission planning IS project management. Veterans transition into PM faster than almost any other group. See our Veterans PM Pathway for the dedicated track.',
  },
] as const

const FAQ_ITEMS = [
  {
    q: 'Do I really need a PMP® or CAPM® to break into project management?',
    a: 'Technically no — but practically yes. Recruiters use credentials as a filter, and applicant tracking systems screen for them. You can land your first PM role without one, but it will take longer and you\u2019ll start at a lower salary band. Most career transitioners earn back the cost of certification within 90 days of their first PM job.',
  },
  {
    q: 'How long does it take to transition into project management?',
    a: 'Most career transitioners go from "deciding" to "first PM offer" in 9–18 months if they follow a structured path. That timeline assumes ~10 hours per week of focused effort. If you can do internal PM work at your current job, the transition is faster.',
  },
  {
    q: 'What\u2019s the salary like for an entry-level PM?',
    a: 'In the U.S., entry-level Project Coordinator and Junior PM roles typically pay $55K–$75K. With PMP® and 3–5 years of experience, mid-level PMs earn $90K–$130K. Senior PMs and PMOs earn $130K–$180K+. Tech, healthcare, and federal contracting tend to pay above the median.',
  },
  {
    q: 'Should I get PMP® or CAPM® first?',
    a: 'CAPM® if you have less than 36 months of project leadership experience. PMP® if you have 36+ months and want to skip the entry-level credential. CAPM® is the faster on-ramp for true career changers; PMP® is the right call for experienced operators who just need the title.',
  },
  {
    q: 'Can I do this while keeping my current job?',
    a: 'Yes — and we strongly recommend it. Quitting before you have a PM offer puts you in a weaker negotiating position. Study evenings and weekends, build your portfolio at your current job, and only resign once you\u2019ve signed an offer.',
  },
  {
    q: 'How does Wiser Generations Int’l™ help with this specifically?',
    a: 'Crystal Stewart spent 20+ years in enterprise PM before founding Wiser Generations Int’l™ — she\u2019s coached hundreds of career transitioners through this exact path. Our PMP® and CAPM® programs include resume review, interview prep, application support, and mentor coaching specifically for people switching careers, not just exam prep.',
  },
] as const

export default function CareerTransitionPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            Career Transition Roadmap
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            How to transition into project management — from any background
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-300">
            A practical, 12-month roadmap built from 20+ years coaching career transitioners
            into PM roles. No fluff, no "follow your passion" — just the specific moves that
            land first PM jobs.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['Decide', 'Translate', 'Certify', 'Portfolio', 'Land the role'].map((s, i) => (
              <span
                key={s}
                className="rounded-full border border-gold/40 px-3 py-1 text-xs font-bold text-gold"
              >
                Phase {i + 1} · {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Intro */}
        <section className="prose prose-slate max-w-none">
          <p className="text-base leading-7 text-slate-700">
            Most career-change advice for project management is either too vague (&ldquo;take a
            course and apply!&rdquo;) or too narrow (&ldquo;here&rsquo;s how to get a job at
            Google&rdquo;). This roadmap is the middle path: a phased plan that works for any
            industry, written by someone who&rsquo;s coached hundreds of career transitioners
            through it. Follow it, and you&rsquo;ll be in your first PM role in 9–18 months.
          </p>
        </section>

        {/* Phases */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">The 5-phase roadmap</h2>
          <ol className="mt-6 space-y-6">
            {PHASES.map((phase) => (
              <li
                key={phase.n}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <header className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-base font-bold text-slate-950">
                    {phase.n}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{phase.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{phase.body}</p>
                  </div>
                </header>
                <div className="mt-4 ml-14">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Action items
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {phase.actions.map((a) => (
                      <li key={a} className="flex items-start gap-2 text-sm text-slate-700">
                        <span aria-hidden className="mt-0.5 text-amber-600">▸</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Soft CTA */}
        <ResourceCTA variant="soft" />

        {/* Common backgrounds */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900">
            What if I&rsquo;m coming from <em>that</em> background?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Here&rsquo;s how to position your existing experience for a PM role, by industry of
            origin.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {COMMON_BACKGROUNDS.map((bg) => (
              <article
                key={bg.from}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Coming from
                </p>
                <h3 className="mt-1 text-base font-bold text-slate-900">{bg.from}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">{bg.why}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Hard CTA */}
        <ResourceCTA variant="hard" />

        {/* Related resources */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900">Related resources</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Link
              href="/free-guide"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Free guide</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">PMP® Exam Changes 2026</h3>
              <p className="mt-2 text-sm text-slate-600">
                Critical reading if you&rsquo;re planning to certify before July 8, 2026.
              </p>
            </Link>
            <Link
              href="/resources/practice-questions"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Practice</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">Free PMP® Practice Questions</h3>
              <p className="mt-2 text-sm text-slate-600">
                Test your readiness with 8 free exam-style questions.
              </p>
            </Link>
            <Link
              href="/veterans"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Pathway</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">Veterans PM Pathway</h3>
              <p className="mt-2 text-sm text-slate-600">
                A dedicated transition track for active duty, Guard, Reserve, and veterans.
              </p>
            </Link>
          </div>
        </section>
      </div>

      {/* FAQ — emits FAQPage JSON-LD */}
      <Faq items={FAQ_ITEMS} heading="Career transition FAQ" />

      {/* Article schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to transition into project management',
            description:
              'A practical 12-month roadmap for transitioning into project management from any career background.',
            step: PHASES.map((p) => ({
              '@type': 'HowToStep',
              position: p.n,
              name: p.title,
              text: p.body,
            })),
            provider: { '@type': 'Organization', name: 'Wiser Generations Int’l™' },
          }),
        }}
      />
    </main>
  )
}

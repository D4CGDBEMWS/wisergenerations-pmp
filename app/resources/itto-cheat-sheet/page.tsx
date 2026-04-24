import type { Metadata } from 'next'
import Link from 'next/link'
import ResourceCTA from '@/components/marketing/ResourceCTA'
import Faq from '@/components/marketing/Faq'

export const metadata: Metadata = {
  title: 'PMP® ITTO Cheat Sheet — Inputs, Tools, Techniques & Outputs',
  description:
    'Free PMP® ITTO cheat sheet from Wiser Generations Int’l™. Common inputs, tools and techniques, and outputs across the 10 PMI® knowledge areas — with memory tricks and patterns.',
  alternates: { canonical: '/resources/itto-cheat-sheet' },
  openGraph: {
    title: 'PMP® ITTO Cheat Sheet — Wiser Generations Int’l™',
    description:
      'Free PMP® ITTO cheat sheet covering the 10 knowledge areas, common inputs/outputs, and memory tricks.',
    url: 'https://wisergenerations.com/resources/itto-cheat-sheet',
    type: 'article',
  },
}

// ---------------------------------------------------------------------------
// PMP ITTO Cheat Sheet — second SEO pillar page (after PMP Formulas).
// Targets long-tail searches like "PMP ITTO cheat sheet", "PMP ITTOs",
// "PMBOK inputs and outputs". Funnels into Study Access ($47/mo).
// ---------------------------------------------------------------------------

const KNOWLEDGE_AREAS = [
  {
    name: 'Integration Management',
    short: 'Integration',
    purpose:
      'Coordinates everything else — the project charter, project management plan, change requests, and final close.',
  },
  {
    name: 'Scope Management',
    short: 'Scope',
    purpose:
      'Defines what is in (and out of) the project. Produces the scope baseline (scope statement, WBS, WBS dictionary).',
  },
  {
    name: 'Schedule Management',
    short: 'Schedule',
    purpose:
      'Sequences activities, estimates durations, and produces the schedule baseline. Critical Path Method lives here.',
  },
  {
    name: 'Cost Management',
    short: 'Cost',
    purpose:
      'Estimates, budgets, and controls cost. Produces the cost baseline (the time-phased budget).',
  },
  {
    name: 'Quality Management',
    short: 'Quality',
    purpose:
      'Plans quality requirements, manages quality during execution, and controls deliverables against acceptance criteria.',
  },
  {
    name: 'Resource Management',
    short: 'Resource',
    purpose:
      'Plans, acquires, develops, and manages the team and physical resources. Includes team-building and conflict resolution.',
  },
  {
    name: 'Communications Management',
    short: 'Communications',
    purpose:
      'Plans how information will be created, distributed, stored, and disposed of. Communication channels formula lives here.',
  },
  {
    name: 'Risk Management',
    short: 'Risk',
    purpose:
      'Identifies, analyzes (qualitative and quantitative), plans responses, implements responses, and monitors risks. EMV lives here.',
  },
  {
    name: 'Procurement Management',
    short: 'Procurement',
    purpose:
      'Plans procurements, conducts procurements (vendor selection), and controls procurements (contract administration).',
  },
  {
    name: 'Stakeholder Management',
    short: 'Stakeholder',
    purpose:
      'Identifies stakeholders, plans engagement, manages engagement, and monitors stakeholder relationships throughout the project.',
  },
] as const

const COMMON_INPUTS = [
  { name: 'Project Management Plan', why: 'Subsidiary plans (scope, schedule, cost, etc.) are inputs to nearly every process.' },
  { name: 'Project Documents', why: 'Risk register, stakeholder register, lessons learned register — these flow into many processes.' },
  { name: 'Enterprise Environmental Factors (EEFs)', why: 'External & internal conditions outside the team\u2019s control: regulations, market conditions, organizational culture.' },
  { name: 'Organizational Process Assets (OPAs)', why: 'Templates, historical data, lessons learned databases, organizational policies and procedures.' },
  { name: 'Agreements', why: 'Contracts and SLAs flow into procurement, scope, and risk processes.' },
  { name: 'Work Performance Data', why: 'Raw measurements from execution feed into all monitoring and controlling processes.' },
] as const

const COMMON_TOOLS = [
  { name: 'Expert Judgment', why: 'Appears in nearly every planning process. When the question lists it among options, it\u2019s often the right answer for unfamiliar situations.' },
  { name: 'Meetings', why: 'Status meetings, kickoffs, retrospectives, change control board meetings.' },
  { name: 'Data Gathering', why: 'Brainstorming, interviews, focus groups, checklists, questionnaires & surveys, benchmarking.' },
  { name: 'Data Analysis', why: 'Alternatives analysis, cost-benefit analysis, root-cause analysis, variance analysis, trend analysis, earned value analysis.' },
  { name: 'Data Representation', why: 'Matrices (RACI, probability/impact), flowcharts, scatter diagrams, hierarchical charts.' },
  { name: 'Decision Making', why: 'Voting, autocratic, multi-criteria decision analysis (MCDA).' },
  { name: 'Interpersonal & Team Skills', why: 'Active listening, conflict management, facilitation, negotiation, leadership.' },
] as const

const COMMON_OUTPUTS = [
  { name: 'Change Requests', why: 'Almost any monitoring & controlling process can produce a change request — which then enters integrated change control.' },
  { name: 'Project Management Plan Updates', why: 'Subsidiary plans get updated as the project evolves.' },
  { name: 'Project Documents Updates', why: 'Risk register, lessons learned, stakeholder register, etc.' },
  { name: 'Work Performance Information', why: 'Raw data interpreted in context — feeds into reporting and decision-making.' },
  { name: 'Work Performance Reports', why: 'Formatted information distributed to stakeholders (status reports, dashboards, recommendations).' },
] as const

const PATTERNS = [
  {
    title: 'Plans flow downhill, then back up',
    body:
      'Subsidiary plans (scope, schedule, cost, quality, etc.) are created in their respective Plan processes, integrated into the Project Management Plan, and then referenced as inputs by every process that follows.',
  },
  {
    title: 'EEFs and OPAs are inputs almost everywhere',
    body:
      'If an answer choice mentions Enterprise Environmental Factors or Organizational Process Assets and the question asks about inputs, it\u2019s probably correct. They\u2019re inputs to ~80% of planning and executing processes.',
  },
  {
    title: 'Monitoring & Controlling processes produce Change Requests',
    body:
      'When the exam asks what a Control X process produces, "change requests" is almost always one of the right outputs — alongside work performance information and updates.',
  },
  {
    title: 'Expert Judgment is everywhere in Planning',
    body:
      'When in doubt about a Planning process tool, Expert Judgment is a safe bet. It\u2019s explicitly listed in nearly every Plan and Develop process.',
  },
  {
    title: 'Outputs of one process are inputs to the next',
    body:
      'The Project Charter (output of Develop Project Charter) is an input to Identify Stakeholders, Develop Project Management Plan, Define Scope, and many more. Trace the flow.',
  },
] as const

const FAQ_ITEMS = [
  {
    q: 'Do I really need to memorize all 49 PMBOK® processes and their ITTOs?',
    a: 'No. The current PMP® exam (and the 2026 update) tests your understanding of how processes flow together and which tools/techniques solve which problems — not rote memorization of every input and output. Focus on knowledge area patterns, common ITTOs, and the major process outputs (change requests, baselines, plans).',
  },
  {
    q: 'Are ITTOs still on the exam after PMBOK® 7?',
    a: 'PMBOK® 7 shifted to a principles-based format, but the PMP® exam is built from the Examination Content Outline (ECO), not directly from PMBOK®. ECO-aligned content still includes process-thinking, tools and techniques, and the major artifacts. ITTOs remain relevant — just don\u2019t obsess over rote lists.',
  },
  {
    q: 'How is the 2026 PMP® exam handling ITTOs differently?',
    a: 'The July 8, 2026 update emphasizes situational judgment, AI in PM, sustainability, and value delivery. ITTO trivia questions are less common; scenario questions where you choose the right tool or technique are more common. Our PMP® Exam Changes 2026 free guide breaks this down in detail.',
  },
  {
    q: 'What\u2019s the fastest way to learn ITTOs without burning out?',
    a: 'Group ITTOs by knowledge area, learn the patterns (common inputs, common tools, common outputs), and drill scenario questions instead of flashcards. Wiser Generations Int’l™ Study Access ($47/month) includes a structured ITTO drill module that takes 2–3 weeks instead of months.',
  },
] as const

export default function IttoCheatSheetPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            Free PMP® Reference
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            The PMP® ITTO cheat sheet — patterns, not memorization
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-300">
            The 10 PMI® knowledge areas, the inputs and outputs that show up everywhere, and the
            patterns that let you answer ITTO questions without flashcards.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['Knowledge Areas', 'Common Inputs', 'Common Tools', 'Common Outputs', 'Patterns'].map((cat) => (
              <a
                key={cat}
                href={`#${cat.toLowerCase().replace(/\s+/g, '-')}`}
                className="rounded-full border border-gold/40 px-3 py-1 text-xs font-bold text-gold transition hover:bg-gold/10"
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Intro */}
        <section className="prose prose-slate max-w-none">
          <p className="text-base leading-7 text-slate-700">
            ITTOs (Inputs, Tools &amp; Techniques, Outputs) are the building blocks of PMI® process
            thinking. The PMP® exam doesn&rsquo;t expect you to recite all 49 process tables —
            it expects you to <strong>recognize patterns</strong> and pick the right tool for a
            given situation. This cheat sheet gives you the patterns.
          </p>
        </section>

        {/* Knowledge Areas */}
        <section id="knowledge-areas" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900">The 10 Knowledge Areas</h2>
          <p className="mt-2 text-sm text-slate-600">
            Every PMI® process belongs to one knowledge area and one process group. Knowing the
            purpose of each area helps you answer questions even when you don&rsquo;t remember the
            exact ITTO.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {KNOWLEDGE_AREAS.map((ka) => (
              <article
                key={ka.name}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <header className="flex items-center gap-3">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                    {ka.short}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{ka.name}</h3>
                </header>
                <p className="mt-2 text-sm leading-6 text-slate-700">{ka.purpose}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Common Inputs */}
        <section id="common-inputs" className="mt-16 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900">Inputs that show up everywhere</h2>
          <p className="mt-2 text-sm text-slate-600">
            If you&rsquo;re stuck on an ITTO question and these are answer choices, lean toward
            them — they appear as inputs in the majority of processes.
          </p>
          <ul className="mt-6 space-y-3">
            {COMMON_INPUTS.map((item) => (
              <li
                key={item.name}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="font-bold text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.why}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Soft CTA */}
        <ResourceCTA variant="soft" />

        {/* Common Tools */}
        <section id="common-tools" className="mt-16 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900">
            Tools &amp; Techniques that recur across processes
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            These show up so frequently that the PMI® exam often uses them as &ldquo;default&rdquo;
            correct answers when no situation-specific tool fits.
          </p>
          <ul className="mt-6 space-y-3">
            {COMMON_TOOLS.map((item) => (
              <li
                key={item.name}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="font-bold text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.why}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Common Outputs */}
        <section id="common-outputs" className="mt-16 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900">Outputs that recur across processes</h2>
          <p className="mt-2 text-sm text-slate-600">
            These outputs appear in many processes — especially monitoring &amp; controlling.
          </p>
          <ul className="mt-6 space-y-3">
            {COMMON_OUTPUTS.map((item) => (
              <li
                key={item.name}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="font-bold text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.why}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Patterns */}
        <section id="patterns" className="mt-16 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900">5 patterns that beat memorization</h2>
          <p className="mt-2 text-sm text-slate-600">
            Memorize these patterns instead of individual ITTO tables. They&rsquo;ll get you to the
            right answer on most ITTO scenario questions.
          </p>
          <ol className="mt-6 space-y-4">
            {PATTERNS.map((p, i) => (
              <li
                key={p.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Pattern {i + 1}
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">{p.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{p.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Hard CTA */}
        <ResourceCTA variant="hard" />

        {/* Related resources */}
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
                The 12 most-tested PMP® formulas with purpose and when-to-use notes.
              </p>
            </Link>
            <Link
              href="/resources/practice-questions"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Practice</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">Free PMP® Practice Questions</h3>
              <p className="mt-2 text-sm text-slate-600">
                8 exam-style questions with full answer explanations across all 3 domains.
              </p>
            </Link>
            <Link
              href="/free-guide"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Free guide</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">PMP® Exam Changes 2026</h3>
              <p className="mt-2 text-sm text-slate-600">
                What&rsquo;s new on the 2026 PMP® exam and how to plan your prep.
              </p>
            </Link>
          </div>
        </section>
      </div>

      {/* FAQ — uses shared component, emits FAQPage JSON-LD */}
      <Faq items={FAQ_ITEMS} heading="ITTO frequently asked" />

      {/* Article JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'The PMP® ITTO cheat sheet — patterns, not memorization',
            description:
              'Free PMP® ITTO reference covering the 10 knowledge areas, common inputs/tools/outputs, and 5 patterns to answer ITTO questions without rote memorization.',
            author: { '@type': 'Organization', name: 'Wiser Generations Int’l™' },
            publisher: { '@type': 'Organization', name: 'Wiser Generations Int’l™' },
            mainEntityOfPage: 'https://wisergenerations.com/resources/itto-cheat-sheet',
          }),
        }}
      />
    </main>
  )
}

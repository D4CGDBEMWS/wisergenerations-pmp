import type { Metadata } from 'next'
import Link from 'next/link'
import ResourceCTA from '@/components/marketing/ResourceCTA'
import PracticeQuestionsLeadForm from '@/components/marketing/PracticeQuestionsLeadForm'

export const metadata: Metadata = {
  title: 'Free PMP® Practice Questions — 8 Sample PMP® Exam Questions',
  description:
    '8 free PMP® exam-style practice questions with full answer explanations from Wiser Generations Int’l™. Test your readiness for the 2026 PMP® exam.',
  alternates: { canonical: '/resources/practice-questions' },
  openGraph: {
    title: 'Free PMP® Practice Questions — Wiser Generations Int’l™',
    description:
      'Free PMP® exam-style practice questions with full answer explanations.',
    url: 'https://wisergenerations.com/resources/practice-questions',
    type: 'article',
  },
}

// ---------------------------------------------------------------------------
// Free PMP Practice Questions — SEO + lead-magnet page
// Mirrors PMA's /free-pmp-questions funnel: free sample questions → email
// capture for "more" → upsell into Study Access for the full bank.
// ---------------------------------------------------------------------------

type Question = {
  id: number
  domain: string
  question: string
  choices: { letter: 'A' | 'B' | 'C' | 'D'; text: string }[]
  answer: 'A' | 'B' | 'C' | 'D'
  explanation: string
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    domain: 'People',
    question:
      'A new project manager is taking over a project mid-execution. The team is underperforming and morale is low. What should the project manager do FIRST?',
    choices: [
      { letter: 'A', text: 'Replace the underperforming team members.' },
      { letter: 'B', text: 'Hold one-on-one meetings with each team member to understand the issues.' },
      { letter: 'C', text: 'Escalate the situation to the project sponsor immediately.' },
      { letter: 'D', text: 'Re-baseline the schedule to give the team more time.' },
    ],
    answer: 'B',
    explanation:
      'A servant-leader project manager builds trust before taking action. One-on-ones surface the root causes (unclear goals, blockers, interpersonal friction) and signal that the new PM cares. Replacing people, escalating, or re-baselining are reactions, not diagnoses.',
  },
  {
    id: 2,
    domain: 'Process',
    question:
      'A project has a Budget at Completion (BAC) of $200,000. The Earned Value (EV) is $80,000 and the Actual Cost (AC) is $100,000. What is the Cost Performance Index (CPI)?',
    choices: [
      { letter: 'A', text: '0.80' },
      { letter: 'B', text: '1.25' },
      { letter: 'C', text: '0.40' },
      { letter: 'D', text: '2.50' },
    ],
    answer: 'A',
    explanation:
      'CPI = EV ÷ AC = 80,000 ÷ 100,000 = 0.80. A CPI below 1.0 means the project is over budget — for every $1 spent, only $0.80 of work has been completed.',
  },
  {
    id: 3,
    domain: 'Process',
    question:
      'Using the same project from the previous question, what is the Estimate at Completion (EAC), assuming current cost performance continues?',
    choices: [
      { letter: 'A', text: '$160,000' },
      { letter: 'B', text: '$220,000' },
      { letter: 'C', text: '$250,000' },
      { letter: 'D', text: '$300,000' },
    ],
    answer: 'C',
    explanation:
      'When current variances are typical of future work, EAC = BAC ÷ CPI = 200,000 ÷ 0.80 = $250,000. The project is forecast to finish $50,000 over budget if nothing changes.',
  },
  {
    id: 4,
    domain: 'People',
    question:
      'A project team has 6 members. A new stakeholder joins the team. How many additional communication channels are created?',
    choices: [
      { letter: 'A', text: '1' },
      { letter: 'B', text: '6' },
      { letter: 'C', text: '7' },
      { letter: 'D', text: '21' },
    ],
    answer: 'B',
    explanation:
      'Channels = n × (n − 1) ÷ 2. With 6 people: 6 × 5 ÷ 2 = 15. With 7 people: 7 × 6 ÷ 2 = 21. The difference is 21 − 15 = 6 new channels. Tip: the new stakeholder adds one channel to each existing member.',
  },
  {
    id: 5,
    domain: 'Business Environment',
    question:
      'During project execution, a regulatory change requires the team to add new compliance documentation. What should the project manager do FIRST?',
    choices: [
      { letter: 'A', text: 'Begin work on the documentation immediately to stay compliant.' },
      { letter: 'B', text: 'Submit a change request through the integrated change control process.' },
      { letter: 'C', text: 'Inform the team and update the project schedule.' },
      { letter: 'D', text: 'Add the cost to the contingency reserve.' },
    ],
    answer: 'B',
    explanation:
      'Any change to scope, schedule, or cost — even mandatory regulatory ones — must go through integrated change control. The change request is reviewed, approved, and only then incorporated into the baselines. Skipping change control violates project governance.',
  },
  {
    id: 6,
    domain: 'Process — Agile',
    question:
      'In a Scrum team, who is responsible for prioritizing the product backlog?',
    choices: [
      { letter: 'A', text: 'The Scrum Master' },
      { letter: 'B', text: 'The Development Team' },
      { letter: 'C', text: 'The Product Owner' },
      { letter: 'D', text: 'The Project Sponsor' },
    ],
    answer: 'C',
    explanation:
      'The Product Owner owns the product backlog and is solely accountable for ordering items to maximize value. The Scrum Master facilitates the process; the Development Team selects items for the sprint; the Sponsor is not a Scrum role.',
  },
  {
    id: 7,
    domain: 'People',
    question:
      'Two senior engineers on the project are in open conflict over the technical approach, and it is delaying decisions. As project manager, what is the BEST conflict resolution technique to use?',
    choices: [
      { letter: 'A', text: 'Smoothing — emphasize areas of agreement.' },
      { letter: 'B', text: 'Withdrawing — let the conflict cool down on its own.' },
      { letter: 'C', text: 'Compromising — find a middle ground that gives each side something.' },
      { letter: 'D', text: 'Collaborating — work together to find a solution that satisfies both.' },
    ],
    answer: 'D',
    explanation:
      'Collaborating (problem-solving) is the highest-value conflict resolution technique on the PMP® exam — it produces win-win outcomes and is preferred whenever there is time. Compromising is a fallback when collaboration is not possible. Smoothing and withdrawing are temporary fixes that do not resolve the underlying issue.',
  },
  {
    id: 8,
    domain: 'Process',
    question:
      'A risk has a 30% probability of occurring and would cost the project $40,000 if it does. What is the Expected Monetary Value (EMV) of this risk?',
    choices: [
      { letter: 'A', text: '$4,000' },
      { letter: 'B', text: '$12,000' },
      { letter: 'C', text: '$28,000' },
      { letter: 'D', text: '$40,000' },
    ],
    answer: 'B',
    explanation:
      'EMV = Probability × Impact = 0.30 × $40,000 = $12,000. Sum the EMVs across all identified risks to size your contingency reserve. Negative impacts are costs (threats); positive impacts are benefits (opportunities).',
  },
]

export default function PracticeQuestionsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            Free PMP® Practice
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            8 free PMP® practice questions — with full answer explanations
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-300">
            Realistic, exam-style questions covering all three PMP® domains: People, Process, and
            Business Environment. Click any question to reveal the answer and explanation.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {(['People', 'Process', 'Business Environment'] as const).map((d) => (
              <span
                key={d}
                className="rounded-full border border-gold/40 px-3 py-1 text-xs font-bold text-gold"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* How to use */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">How to use these questions</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>Read each question and pick your answer before revealing.</li>
            <li>Click <em>&ldquo;Show answer &amp; explanation&rdquo;</em> to check yourself.</li>
            <li>If you miss one, write down <strong>why</strong>, not just the right answer.</li>
            <li>Aim for 80%+ before scheduling your real exam.</li>
          </ol>
        </section>

        {/* Questions */}
        <ol className="mt-10 space-y-6">
          {QUESTIONS.map((q) => (
            <li
              key={q.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <header className="flex items-start justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Question {q.id} · {q.domain}
                </p>
              </header>
              <p className="mt-3 text-base font-semibold leading-7 text-slate-900">
                {q.question}
              </p>
              <ul className="mt-4 space-y-2">
                {q.choices.map((choice) => (
                  <li
                    key={choice.letter}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800"
                  >
                    <span className="font-bold text-navy">{choice.letter}.</span>
                    <span>{choice.text}</span>
                  </li>
                ))}
              </ul>
              <details className="group mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <summary className="cursor-pointer list-none text-sm font-bold text-emerald-800">
                  Show answer &amp; explanation
                  <span className="ml-2 text-emerald-600 transition group-open:rotate-45 inline-block">+</span>
                </summary>
                <div className="mt-3 text-sm leading-6 text-emerald-900">
                  <p className="font-bold">Correct answer: {q.answer}</p>
                  <p className="mt-2">{q.explanation}</p>
                </div>
              </details>
            </li>
          ))}
        </ol>

        {/* Mid-page lead capture */}
        <div className="mt-12">
          <PracticeQuestionsLeadForm />
        </div>

        {/* Soft CTA — Study Access */}
        <ResourceCTA variant="soft" />

        {/* Hard CTA — Full programs */}
        <ResourceCTA variant="hard" />

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900">Practice question FAQ</h2>
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

        {/* Related resources */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900">Related resources</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
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

      {/* JSON-LD: Quiz + FAQPage schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Quiz',
            name: 'Free PMP® Practice Questions',
            about: 'PMP® Certification Exam Preparation',
            educationalLevel: 'Professional certification',
            educationalUse: 'Self-assessment',
            provider: { '@type': 'Organization', name: 'Wiser Generations Int’l™' },
          }),
        }}
      />
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
    q: 'How realistic are these PMP® practice questions?',
    a: 'These questions are written in the style of the current PMI® PMP® exam, with situational scenarios, EVM math, and Agile content. They are not actual exam questions (those are confidential under NDA) but reflect the format, difficulty, and domain coverage you can expect.',
  },
  {
    q: 'How many practice questions should I do before the real PMP® exam?',
    a: 'Most students who pass the PMP® on the first try complete 1,000–2,000 practice questions during prep, scoring 75–80%+ on full-length mocks before testing. Wiser Generations Int’l™ Study Access ($47/month) includes a much larger question bank with detailed explanations.',
  },
  {
    q: 'Are the explanations enough to learn from, or do I need a course?',
    a: 'For self-disciplined learners with prior PM experience, the explanations plus a study guide may be enough. For most candidates, a structured course with mentor support, live Q&A, and accountability dramatically increases first-attempt pass rates. See our PMP® Certification Prep program for live cohort options.',
  },
  {
    q: 'Do you cover all three exam domains (People, Process, Business Environment)?',
    a: 'Yes. The 8 sample questions above touch People (servant leadership, conflict, communication), Process (EVM, EMV, Scrum), and Business Environment (compliance, change control). The 25 follow-up questions emailed to you after signup expand coverage further.',
  },
] as const

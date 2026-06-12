import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'PMP® Exam Changes July 2026: Everything You Need to Know | Wiser Generations',
  description: 'PMI confirmed major changes to the PMP exam effective July 8, 2026. New domain weights, AI and sustainability content, new question formats. Here is what every aspiring PMP needs to know.',
}

const CALENDLY = 'https://calendly.com/space4grace/30min-pod'

export default function PmpExamChangesPost() {
  return (
    <main className="bg-white">

      {/* Hero */}
      <section className="bg-brand-blue text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/blog" className="text-gold text-sm hover:underline">Blog</Link>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400 text-sm">Exam Updates</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            PMP® Exam Changes July 2026: Everything You Need to Know
          </h1>
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>By Crystal Stewart, PMP</span>
            <span>March 2026</span>
            <span>8 min read</span>
          </div>
        </div>
      </section>

      {/* Article content */}
      <article className="py-16 px-4">
        <div className="max-w-3xl mx-auto prose prose-lg">

          <div className="bg-gold/20 border-l-4 border-gold rounded-r-xl p-6 mb-10">
            <p className="font-bold text-navy text-lg mb-2">The short version:</p>
            <p className="text-navy">
              PMI made significant changes to the PMP exam effective July 8, 2026. Domain weights shifted,
              new question types were added, and AI and sustainability content entered the exam for the first time.
              Here&apos;s exactly what changed — and how to prepare to pass the current exam on your first attempt.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">What PMI Changed</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            PMI periodically updates the PMP exam to reflect how project management is actually practiced.
            The July 8, 2026 change is one of the more significant updates in recent years — touching domain weights,
            question formats, and content areas simultaneously.
          </p>

          <h3 className="text-xl font-bold text-navy mt-8 mb-3">Domain Weight Shifts</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            The three domains of the PMP exam are People, Process, and Business Environment. Their weights changed:
          </p>
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse bg-paper rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-brand-blue text-white">
                  <th className="text-left p-4 font-semibold">Domain</th>
                  <th className="text-left p-4 font-semibold">Previous Weight</th>
                  <th className="text-left p-4 font-semibold">Current Weight</th>
                  <th className="text-left p-4 font-semibold">Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-medium">People</td>
                  <td className="p-4">42%</td>
                  <td className="p-4">33%</td>
                  <td className="p-4 text-red-600 font-medium">-9%</td>
                </tr>
                <tr className="border-b border-gray-200 bg-white">
                  <td className="p-4 font-medium">Process</td>
                  <td className="p-4">50%</td>
                  <td className="p-4">41%</td>
                  <td className="p-4 text-red-600 font-medium">-9%</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Business Environment</td>
                  <td className="p-4">8%</td>
                  <td className="p-4">26%</td>
                  <td className="p-4 text-green-600 font-medium">+18%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">
            The Business Environment domain is growing significantly — from 8% to 26% of the exam.
            This reflects PMI moving the exam toward strategic alignment, benefits realization, organizational agility,
            and the project manager as a business leader — not just a scheduler.
          </p>

          <h3 className="text-xl font-bold text-navy mt-8 mb-3">New Question Formats</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Earlier PMP exams used multiple-choice, drag-and-drop, matching, and hotspot questions.
            The 2026 update added new formats:
          </p>
          <ul className="space-y-3 mb-6">
            {[
              { type: 'Case Sets', desc: 'Multi-question scenarios based on a shared project situation — similar to a mini case study.' },
              { type: 'Pull-Down Lists', desc: 'Questions where you select from a scrollable list of options rather than a fixed four-choice format.' },
              { type: 'Graphics-Based Questions', desc: 'Questions that present data visually — charts, dashboards, or project artifacts — requiring interpretation.' },
              { type: 'Extended Matching', desc: 'Match multiple items across two larger lists rather than simple one-to-one pairings.' }
            ].map((item) => (
              <li key={item.type} className="flex items-start gap-3">
                <span className="text-gold font-bold mt-0.5">▸</span>
                <div>
                  <strong className="text-navy">{item.type}:</strong>{' '}
                  <span className="text-gray-700">{item.desc}</span>
                </div>
              </li>
            ))}
          </ul>

          <h3 className="text-xl font-bold text-navy mt-8 mb-3">New Content: AI and Sustainability</h3>
          <p className="text-gray-700 leading-relaxed mb-6">
            For the first time, the PMP exam will include content on artificial intelligence in project management
            and sustainability considerations in project delivery. These are first-generation content areas —
            meaning there are still limited proven study materials for them.
            Because these are newer content areas, current, up-to-date preparation matters more than ever.
          </p>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">What This Means for Your Prep</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            A PMP is a PMP — same letters after your name, same salary impact, same global recognition,
            regardless of which version of the exam you sit. What matters is that you pass. The 2026 changes
            simply mean your prep has to match the current exam: the heavier Business Environment domain,
            the new question formats, and the AI and sustainability content areas.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            That is exactly what mentor-led, up-to-date preparation is for. Studying from outdated materials —
            or trying to self-pace through first-generation content with few proven resources — is where most
            first-attempt failures come from.
          </p>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">How Wiser Generations Prepares You</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Our cohorts are fully updated for the current exam — covering the new domain weights, the new question
            formats, and the AI and sustainability content. Every cohort is built to get you exam-ready with
            Crystal&apos;s full mentor support and the pass guarantee behind you, so you walk in prepared to pass
            on your first try.
          </p>

          <div className="bg-brand-blue text-white rounded-2xl p-8 mt-10">
            <h3 className="text-xl font-bold mb-4">Ready to Pass the Current PMP® Exam?</h3>
            <p className="text-gray-300 mb-6">
              Book a free strategy call with Crystal. She will walk you through the current cohort schedule,
              confirm your eligibility, and map your path to passing on your first attempt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                className="bg-gold text-navy font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors text-center">
                Book a Free Call
              </a>
              <Link href="/free-guide"
                className="border border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white hover:text-navy transition-colors text-center">
                Download the Free Guide
              </Link>
            </div>
          </div>

        </div>
      </article>

      {/* Related posts */}
      <section className="bg-paper py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-navy mb-6">More Articles</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { href: '/blog/capm-vs-pmp-which-certification', title: 'CAPM® vs PMP: Which Certification Is Right for Your Career?', cat: 'Career Strategy' },
              { href: '/blog/veterans-pmp-military-experience', title: 'Veterans and the PMP: How Military Experience Maps to Certification', cat: 'Veterans' },
              { href: '/blog/pmp-salary-roi-2026', title: 'Is the PMP Worth It in 2026? Salary Data and Career ROI', cat: 'Career Strategy' }
            ].map((post) => (
              <Link key={post.href} href={post.href}
                className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gold transition-colors group">
                <span className="text-xs font-semibold text-gold">{post.cat}</span>
                <h4 className="font-bold text-navy mt-2 text-sm group-hover:text-gold transition-colors">{post.title}</h4>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}

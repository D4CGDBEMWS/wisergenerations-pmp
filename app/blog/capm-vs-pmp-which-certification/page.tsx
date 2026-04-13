import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'CAPM vs PMP: Which Certification Is Right for Your Career? | Wiser Generations',
  description: 'CAPM or PMP? Learn the key differences in eligibility requirements, cost, salary impact, and career outcomes — and how to decide which PMI certification makes sense for where you are right now.',
}

const CALENDLY = 'https://calendly.com/space4grace/15min'

export default function CapmVsPmpPost() {
  return (
    <main className="bg-white">
      <section className="bg-navy text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/blog" className="text-gold text-sm hover:underline">Blog</Link>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400 text-sm">Career Strategy</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            CAPM vs PMP: Which Certification Is Right for Your Career?
          </h1>
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>By Crystal Stewart, PMP</span>
            <span>February 2026</span>
            <span>6 min read</span>
          </div>
        </div>
      </section>

      <article className="py-16 px-4">
        <div className="max-w-3xl mx-auto">

          <div className="bg-gold/20 border-l-4 border-gold rounded-r-xl p-6 mb-10">
            <p className="font-bold text-navy text-lg mb-2">Bottom line up front:</p>
            <p className="text-navy">
              The CAPM is for people entering project management. The PMP is for people who have been leading projects.
              If you qualify for the PMP, pursue the PMP. If you do not yet qualify — or you are making a career transition
              into PM — the CAPM is a smart, strategic step.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">The Quick Comparison</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse bg-gray-50 rounded-lg overflow-hidden text-sm">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="text-left p-4">Factor</th>
                  <th className="text-left p-4">CAPM</th>
                  <th className="text-left p-4">PMP</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Experience Required', 'None', '36–60 months leading projects'],
                  ['Education Required', 'High school diploma', '4-year degree or high school + more experience'],
                  ['PM Education Hours', '23 hours', '35 hours'],
                  ['Exam Questions', '150 questions', '180 questions'],
                  ['Exam Duration', '3 hours', '4 hours'],
                  ['Salary Impact', 'Entry-level lift', 'Significant (avg +25% over non-certified PMs)'],
                  ['Best For', 'Career transitioners, early career', 'Working PMs with experience'],
                  ['WG Program Cost', 'From $997', 'From $1,497'],
                ].map(([factor, capm, pmp]) => (
                  <tr key={factor} className="border-b border-gray-200 even:bg-white">
                    <td className="p-4 font-medium text-navy">{factor}</td>
                    <td className="p-4 text-gray-700">{capm}</td>
                    <td className="p-4 text-gray-700">{pmp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">When the CAPM Makes Sense</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The CAPM (Certified Associate in Project Management) is PMI&apos;s entry-level credential.
            It validates that you understand project management fundamentals — without requiring years of leading projects.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            The CAPM is the right choice if you are making a career transition into project management,
            if you have less than three years of project leadership experience, if you want a PMI credential
            to show employers while you build your PMP eligibility, or if you are early in your career
            and want to establish credibility before you have the experience for the PMP.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            At Wiser Generations, the CAPM Career Launcher program is specifically designed for career transitioners.
            It includes a career transition roadmap, resume and LinkedIn support, and job search strategy — not just
            exam prep. Because passing the CAPM exam is step one. Getting hired with it is step two.
          </p>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">When the PMP Is the Right Move</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The PMP (Project Management Professional) is the gold standard PM credential worldwide.
            It is recognized by employers in every industry, in every country where project management is practiced.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            If you have three or more years of experience leading projects — even if your title was never
            &quot;Project Manager&quot; — you likely qualify for the PMP. Military leadership, operational management,
            and cross-functional coordination all count. Crystal helps every student document their experience
            accurately and compellingly.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            The salary impact of the PMP is well-documented. PMI&apos;s annual Earning Power report consistently
            shows that PMP-certified professionals earn significantly more than their non-certified peers —
            and the gap tends to grow over time as PMP holders move into larger program management and leadership roles.
          </p>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">Can I Do CAPM Now and PMP Later?</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Absolutely — and many professionals do exactly this. The CAPM establishes your PMI credential and
            membership in the PM community. As you gain experience, you build toward the PMP.
            The study you do for the CAPM overlaps significantly with PMP prep — so it is not starting over,
            it is building on a foundation you have already laid.
          </p>

          <div className="bg-navy text-white rounded-2xl p-8 mt-10">
            <h3 className="text-xl font-bold mb-4">Not Sure Which Is Right for You?</h3>
            <p className="text-gray-300 mb-6">
              Book a free strategy call with Crystal. She will review your background, assess your eligibility,
              and tell you honestly which certification makes the most sense — and how to get there.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                className="bg-gold text-navy font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors text-center">
                Book a Free Call
              </a>
              <Link href="/programs"
                className="border border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white hover:text-navy transition-colors text-center">
                View Programs
              </Link>
            </div>
          </div>

        </div>
      </article>

      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-navy mb-6">More Articles</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { href: '/blog/pmp-exam-changes-july-2026', title: 'PMP Exam Changes July 2026: Everything You Need to Know', cat: 'Exam Updates' },
              { href: '/blog/veterans-pmp-military-experience', title: 'Veterans and the PMP: How Military Experience Maps to Certification', cat: 'Veterans' },
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

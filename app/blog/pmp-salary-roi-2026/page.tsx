import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Is the PMP Worth It in 2026? Salary Data and Career ROI | Wiser Generations',
  description: 'Does the PMP certification actually pay off? We break down the salary data, career outcomes, and return on investment for PMP certification in 2026.',
}

const CALENDLY = 'https://calendly.com/space4grace/15min'

export default function PmpSalaryRoiPost() {
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
            Is the PMP Worth It in 2026? Salary Data and Career ROI
          </h1>
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>By Crystal Stewart, PMP</span>
            <span>December 2025</span>
            <span>5 min read</span>
          </div>
        </div>
      </section>

      <article className="py-16 px-4">
        <div className="max-w-3xl mx-auto">

          <div className="bg-gold/20 border-l-4 border-gold rounded-r-xl p-6 mb-10">
            <p className="font-bold text-navy text-lg mb-2">The short answer: yes.</p>
            <p className="text-navy">
              The PMP is one of the most studied professional certifications in terms of salary impact.
              The data consistently shows a meaningful salary premium — and the credential opens doors
              that experience alone cannot.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">What the Data Shows</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            PMI publishes an annual Earning Power survey covering project management salaries across industries
            and geographies. The findings are consistent year over year: PMP-certified professionals earn
            more than their non-certified counterparts — and the premium tends to grow over time.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { stat: '25%+', label: 'Median salary premium for PMP holders vs. non-certified PMs in the US' },
              { stat: '#3', label: 'PMP ranked among the top 3 most valuable certifications globally by multiple surveys' },
              { stat: '$135K+', label: 'Median annual salary for PMP-certified project managers in the United States' },
            ].map((item) => (
              <div key={item.stat} className="bg-navy text-white rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-gold mb-2">{item.stat}</div>
                <p className="text-gray-300 text-sm leading-relaxed">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs mb-8 italic">
            Source: PMI Earning Power: Project Management Salary Survey and industry salary databases.
            Figures represent medians and vary by location, industry, and experience level.
          </p>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">Why the PMP Commands a Premium</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The salary premium is not just about the letters. The PMP is a signal that carries weight
            because it is genuinely hard to earn — you need real experience, formal education hours,
            and you have to pass a rigorous exam. Employers know this. When they see PMP on a resume,
            they know the candidate has done the work.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            The credential also opens doors in industries and organizations that specifically require it.
            Federal contracting, defense, healthcare system implementation, and large enterprise IT projects
            often require PMP certification for project leadership roles. Without it, you cannot apply.
            With it, you are competitive for positions that simply were not accessible before.
          </p>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">Calculating Your ROI</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            A PMP prep program at Wiser Generations starts at $1,497. The PMI exam fee for members is $405.
            The PMI membership itself is $139/year. Total initial investment is roughly $2,000–$2,200.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            If the PMP adds $10,000 to your annual salary — a conservative estimate based on available data —
            you break even in about 90 days. If it opens a role at $20,000 more than your current position,
            the payback period is even shorter.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            And unlike other investments, the credential does not depreciate. You hold the PMP for life
            with PDU maintenance. The compounding effect of a higher salary base, combined with the doors
            it opens over a career, makes the ROI calculation look better every year.
          </p>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">Who Benefits Most</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The PMP credential delivers the highest ROI for three groups:
          </p>
          <div className="space-y-4 mb-8">
            {[
              { group: 'Experienced PMs without a credential', body: 'If you have been doing the work but lack the certification, the PMP is low-hanging fruit. You likely qualify, you already understand the concepts, and a passing score immediately upgrades your positioning in every future job application.' },
              { group: 'Veterans transitioning to civilian PM roles', body: 'Military leadership experience maps well to PMP eligibility — but civilian employers often need the credential as a translation layer. The PMP bridges the gap between your demonstrated capability and what the job posting requires.' },
              { group: 'Career transitioners entering PM', body: 'For people pivoting into project management from another field, the CAPM or PMP credential provides immediate credibility and access to roles that would otherwise require years of PM-specific experience to unlock.' },
            ].map((item) => (
              <div key={item.group} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-navy mb-2">{item.group}</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="bg-navy text-white rounded-2xl p-8 mt-10">
            <h3 className="text-xl font-bold mb-4">Ready to Calculate Your Personal ROI?</h3>
            <p className="text-gray-300 mb-6">
              Book a free strategy call with Crystal. She will assess your eligibility, tell you which
              program makes sense, and help you map the timeline from enrollment to credential — so you
              can make an informed decision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                className="bg-gold text-navy font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors text-center">
                Book a Free Call
              </a>
              <Link href="/programs"
                className="border border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white hover:text-navy transition-colors text-center">
                View Programs & Pricing
              </Link>
            </div>
          </div>

        </div>
      </article>
    </main>
  )
}

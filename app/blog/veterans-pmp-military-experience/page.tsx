import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Veterans and the PMP: How Military Experience Maps to Certification | Wiser Generations',
  description: 'Military experience translates directly to PMP eligibility. Learn how to document your service for the PMI application, which roles qualify, and how the veteran cohort experience works.',
}

const CALENDLY = 'https://calendly.com/space4grace/30min-pod'

export default function VeteransPmpPost() {
  return (
    <main className="bg-white">
      <section className="bg-navy text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/blog" className="text-gold text-sm hover:underline">Blog</Link>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400 text-sm">Veterans</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Veterans and the PMP: How Military Experience Maps to Certification
          </h1>
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>By Crystal Stewart, PMP</span>
            <span>January 2026</span>
            <span>7 min read</span>
          </div>
        </div>
      </section>

      <article className="py-16 px-4">
        <div className="max-w-3xl mx-auto">

          <div className="bg-gold/20 border-l-4 border-gold rounded-r-xl p-6 mb-10">
            <p className="font-bold text-navy text-lg mb-2">If you served, you managed projects.</p>
            <p className="text-navy">
              You just did not call it that. Military operations, logistics coordination, personnel management,
              mission planning — these are project management. The PMP is a civilian certification that validates
              what you already know how to do. The challenge is translation, not qualification.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">Why Veterans Are Uniquely Positioned for the PMP</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            PMI defines a project manager as someone who leads a team to achieve defined objectives within
            scope, schedule, and budget constraints. By that definition, most veterans with leadership roles
            have been managing projects for their entire service career.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            Squad leaders coordinating personnel and resources across a mission. Logistics specialists
            managing supply chains under pressure. Operations officers planning and executing multi-phase
            initiatives. Company commanders responsible for outcomes across hundreds of people and millions
            of dollars of equipment. All of this is project management. PMI recognizes this.
          </p>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">What PMI Counts as Project Experience</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            To qualify for the PMP, you need 36 months of experience leading projects (with a four-year degree)
            or 60 months (with a high school diploma). PMI evaluates this experience based on five criteria:
            whether there was a defined objective, a team, defined start and end dates, budget management,
            and cross-functional stakeholder coordination.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Military experience meets these criteria across almost every leadership role. The key is knowing
            how to frame and document your experience in PMI language — which is where many veterans underestimate
            what they have done.
          </p>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">Translating Military Roles to PMI Language</h2>
          <div className="space-y-4 mb-8">
            {[
              { military: 'Squad Leader / Team Leader', pm: 'Led cross-functional team to deliver defined operational objectives on schedule.' },
              { military: 'Operations Officer / S3', pm: 'Planned and executed multi-phase projects involving personnel, equipment, and stakeholder coordination.' },
              { military: 'Logistics / Supply Officer', pm: 'Managed procurement, supply chain, and resource allocation for projects across multiple units.' },
              { military: 'Company / Battery Commander', pm: 'Directed project teams, managed budgets, and delivered outcomes for complex, multi-stakeholder initiatives.' },
              { military: 'Program Manager / G6', pm: 'Led enterprise-scale programs with cross-functional dependencies, risk management, and executive reporting.' },
            ].map((item) => (
              <div key={item.military} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="font-bold text-navy text-sm mb-1">{item.military}</div>
                <div className="text-gray-600 text-sm">{item.pm}</div>
              </div>
            ))}
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">
            This is not fabrication — it is accurate translation. The experience is real.
            The challenge is describing it in the language PMI uses to evaluate applications.
            Crystal walks every veteran student through this process as part of the program.
          </p>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">The Veteran Cohort Advantage</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Wiser Generations runs veteran-specific cohorts where you train alongside fellow veterans
            and service members. This matters more than it might seem at first.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            When you study alongside people who share your background, the examples land differently.
            The case studies resonate. The vocabulary clicks faster. You are not spending cognitive energy
            translating civilian PM scenarios into something recognizable — you are applying the frameworks
            to situations you have actually lived.
          </p>

          <h2 className="text-2xl font-bold text-navy mt-10 mb-4">Funding Options for Veterans</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Veterans have access to multiple funding pathways for PM certification prep.
            Employer tuition assistance is common for veterans in the federal contracting space.
            Some veterans explore VET TEC for tech-adjacent training programs.
            The veteran discount at Wiser Generations brings program tuition to $797 — making it
            one of the most accessible PMP prep options available.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            Crystal discusses all available funding options on the free strategy call.
            She does not make assumptions about what you have access to — she asks, and helps you find the right path.
          </p>

          <div className="bg-navy text-white rounded-2xl p-8 mt-10">
            <div className="text-2xl mb-3">🎖️</div>
            <h3 className="text-xl font-bold mb-4">Built for Veterans, by Someone Who Has Been There</h3>
            <p className="text-gray-300 mb-6">
              Crystal Stewart is a U.S. Army veteran. She has walked the transition from military to civilian PM career.
              The veteran program is designed by someone who understands your background — not someone guessing at it.
              Book a free call to talk about your path.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                className="bg-gold text-navy font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors text-center">
                Book a Free Call
              </a>
              <Link href="/veterans"
                className="border border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white hover:text-navy transition-colors text-center">
                Veterans Program
              </Link>
            </div>
          </div>

        </div>
      </article>
    </main>
  )
}

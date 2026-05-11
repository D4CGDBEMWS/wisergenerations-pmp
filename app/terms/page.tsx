import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — Wiser Generations™',
  description:
    'Terms governing use of the Wiser Generations™ website and enrollment in its certification training programs.',
  robots: { index: true, follow: true },
}

const EFFECTIVE_DATE = 'April 7, 2026'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-4xl font-bold text-navy mb-3">Terms of Service</h1>
        <p className="text-gray-500 text-sm">Effective {EFFECTIVE_DATE}</p>
      </div>

      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5 mb-10 text-sm text-amber-900">
        <p className="font-bold mb-1">⚠️ Draft for review</p>
        <p>
          These terms are a working draft scaffolded against the actual products and flows on this
          site. <strong>This is not legal advice.</strong> Have qualified legal counsel review
          before publishing — particularly the refund, dispute, and limitation-of-liability
          sections.
        </p>
      </div>

      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-navy">1. Agreement</h2>
          <p className="text-gray-700 leading-relaxed">
            By visiting or using wisergenerations.com (the "Site"), or by enrolling in any program
            offered through it, you agree to these Terms of Service and our{' '}
            <Link href="/privacy" className="text-gold hover:underline">
              Privacy Policy
            </Link>
            . If you do not agree, please do not use the Site or enroll in any program.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">2. Who we are</h2>
          <p className="text-gray-700 leading-relaxed">
            Wiser Generations™ is an independent project management training program operated as
            part of Enterprise Academy™, based in Smyrna, Georgia (Metro Atlanta), with virtual
            programs delivered nationwide. Wiser Generations™ and Enterprise Academy™ are not
            affiliated with, endorsed by, or sponsored by the Project Management Institute, Inc.
            ("PMI"). PMP®, CAPM®, PMI-ACP®, PMBOK®, and related marks are registered marks of PMI.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">3. Programs and enrollment</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            We offer instructor-led and self-paced certification training programs. Specific
            offerings, pricing, schedules, and inclusions are listed on the Site and may change at
            our discretion. The price displayed at the time of your purchase is the price you pay.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Enrollment in a program is confirmed when payment is successfully processed and you
            receive a written enrollment confirmation by email.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">4. Payment</h2>
          <p className="text-gray-700 leading-relaxed">
            Payments are processed by Stripe, Inc. We accept the payment methods Stripe makes
            available. By submitting payment, you authorise us (via Stripe) to charge the amount
            shown at checkout, in U.S. dollars, plus any applicable taxes. All sales are final
            unless otherwise stated in Section 5.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">5. Refund policy</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            <strong>[PLACEHOLDER — review and edit before publishing.]</strong> A reasonable
            starting point for instructor-led cohorts:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              <strong>Full refund</strong> if you withdraw at least 7 days before the cohort start
              date.
            </li>
            <li>
              <strong>50% refund</strong> if you withdraw between 6 days before and the cohort start
              date.
            </li>
            <li>
              <strong>No refund</strong> after the cohort starts, except in the case of medical or
              military emergencies, which we will consider on a case-by-case basis.
            </li>
            <li>
              <strong>Self-paced programs:</strong> 14-day money-back guarantee from the date of
              purchase, provided you have completed less than 25% of the course content.
            </li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-3">
            To request a refund, email{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline">
              info@wisergenerations.com
            </a>{' '}
            with your enrollment confirmation. Refunds are issued to the original payment method
            within 10 business days of approval.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">6. Your conduct</h2>
          <p className="text-gray-700 leading-relaxed mb-3">When using the Site or enrolled in a program, you agree to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Provide accurate registration and enrollment information</li>
            <li>Keep your account credentials confidential</li>
            <li>
              Not share, resell, redistribute, or republish any course materials, recordings, or
              proprietary content without written permission
            </li>
            <li>Not interfere with or disrupt the Site, its security, or other students</li>
            <li>Not use the Site or its content to harass, defame, or harm anyone</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">7. Intellectual property</h2>
          <p className="text-gray-700 leading-relaxed">
            All Site content, course materials, study guides, recordings, and the Wiser
            Generations™ and Enterprise Academy™ marks are owned by us or our licensors. You may
            use the materials for your own personal study and exam preparation. You may not copy,
            distribute, sublicense, or create derivative works without written permission. PMI marks
            referenced anywhere on the Site remain the property of PMI.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">8. No certification guarantee</h2>
          <p className="text-gray-700 leading-relaxed">
            Our programs are designed to prepare you for PMI certification exams, but{' '}
            <strong>we cannot guarantee that you will pass</strong>. Exam outcomes depend on your
            study, eligibility, and PMI's own scoring. Pass-rate statistics on the Site reflect
            historical results from prior students and are not promises about your individual
            outcome.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">9. Disclaimers</h2>
          <p className="text-gray-700 leading-relaxed">
            The Site and our programs are provided <em>"as is"</em> without warranties of any kind,
            either express or implied. We do not warrant that the Site will be uninterrupted,
            error-free, or free of viruses or harmful components, or that any defects will be
            corrected. You use the Site at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">10. Limitation of liability</h2>
          <p className="text-gray-700 leading-relaxed">
            <strong>[PLACEHOLDER — review with counsel.]</strong> To the fullest extent permitted by
            law, in no event shall Wiser Generations™, Enterprise Academy™, or any of our
            affiliates, officers, employees, or agents be liable for any indirect, incidental,
            special, consequential, or punitive damages, including loss of profits, data, or
            goodwill, arising out of or in connection with your use of the Site or any program. Our
            total liability for any claim arising out of these Terms or your use of the Site shall
            not exceed the amount you paid us in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">11. Indemnification</h2>
          <p className="text-gray-700 leading-relaxed">
            You agree to defend and indemnify Wiser Generations™ and Enterprise Academy™ from any
            claims arising out of your breach of these Terms, your violation of any law, or your
            misuse of the Site or course materials.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">12. Governing law and disputes</h2>
          <p className="text-gray-700 leading-relaxed">
            These Terms are governed by the laws of the State of Georgia, USA, without regard to
            conflict-of-law principles. Any dispute arising out of these Terms or your use of the
            Site shall be resolved exclusively in the state or federal courts located in Cobb
            County, Georgia, and you consent to the personal jurisdiction of those courts.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">13. Changes to these terms</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update these Terms from time to time. The "Effective" date at the top will
            reflect the most recent change. Continued use of the Site or any program after a change
            constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">14. Contact</h2>
          <p className="text-gray-700 leading-relaxed">
            Questions about these Terms? Email{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline">
              info@wisergenerations.com
            </a>
            .
          </p>
        </section>

        <section className="border-t border-gray-200 pt-6 mt-10">
          <p className="text-sm text-gray-500">
            See also our{' '}
            <Link href="/privacy" className="text-gold hover:underline font-medium">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  )
}

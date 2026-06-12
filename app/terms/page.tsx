import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — Wiser Generations',
  description:
    'Terms governing use of the Wiser Generations website and enrollment in its certification training programs.',
  robots: { index: true, follow: true },
}

const EFFECTIVE_DATE = 'June 12, 2026'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-4xl font-bold text-navy mb-3">Terms of Service</h1>
        <p className="text-gray-500 text-sm">Effective {EFFECTIVE_DATE}</p>
      </div>

      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-navy">1. Agreement</h2>
          <p className="text-gray-700 leading-relaxed">
            By visiting or using wisergenerations.com (the &quot;Site&quot;), or by enrolling in any program
            or subscription offered through it, you agree to these Terms of Service and our{' '}
            <Link href="/privacy-policy" className="text-gold hover:underline">
              Privacy Policy
            </Link>
            . If you do not agree, please do not use the Site, enroll in any program, or start a subscription.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">2. Who we are</h2>
          <p className="text-gray-700 leading-relaxed">
            Wiser Generations is an independent project management training program operated as
            part of Enterprise Academy, based in Smyrna, Georgia (Metro Atlanta), with virtual
            programs delivered nationwide. Wiser Generations and Enterprise Academy are not
            affiliated with, endorsed by, or sponsored by the Project Management Institute, Inc.
            (&quot;PMI&quot;). PMP®, CAPM®, PMI-ACP®, PMBOK®, and related marks are registered marks of PMI.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">3. Programs and enrollment</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            We offer live, instructor-led cohort-based certification training programs and a
            month-to-month Study Access subscription that provides access to our practice tools and
            study materials. Specific offerings, pricing, schedules, and inclusions are listed on the
            Site and may change at our discretion. The price displayed at the time of your purchase is
            the price you pay.
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
            available. By submitting payment, you authorize us (via Stripe) to charge the amount
            shown at checkout, in U.S. dollars, plus any applicable taxes. Except as provided in
            Section 6 (Refund policy), all program payments are final.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">5. Study Access subscription &amp; auto-renewal</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Study Access is a recurring subscription billed monthly at the price shown at signup
            (currently $49 per month, plus any applicable taxes). By starting a subscription, you
            acknowledge and agree to the following:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              <strong>Automatic renewal.</strong> Your subscription automatically renews each month
              and your payment method is charged the then-current monthly fee until you cancel.
            </li>
            <li>
              <strong>Ongoing authorization.</strong> You authorize us, through Stripe, to store your
              payment method and charge the recurring fee on each renewal date until your subscription
              is cancelled.
            </li>
            <li>
              <strong>Cancel anytime.</strong> You may cancel at any time by emailing{' '}
              <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline">
                info@wisergenerations.com
              </a>{' '}
              with the subject line &quot;Cancel Study Access.&quot; Cancellation takes effect at the end
              of your current billing period. You keep access through the period you have already paid
              for, and you will not be charged again.
            </li>
            <li>
              <strong>No partial-period refunds.</strong> Monthly subscription fees are
              non-refundable, including for the current billing period in which you cancel.
            </li>
            <li>
              <strong>Price changes.</strong> We may change the subscription price. We will give you
              advance notice by email before a price change takes effect, and the new price will apply
              to your next renewal. If you do not agree, you may cancel before the change takes effect.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">6. Refund policy</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            <strong>Live, instructor-led cohort programs:</strong>
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
              <strong>No refund</strong> after the cohort starts, except in the case of documented
              medical or military emergencies, which we will consider on a case-by-case basis.
            </li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            <strong>Study Access subscription:</strong> monthly subscription fees are non-refundable.
            You may cancel at any time as described in Section 5; cancellation stops future charges but
            does not refund the current billing period.
          </p>
          <p className="text-gray-700 leading-relaxed mt-4">
            To request a refund, email{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline">
              info@wisergenerations.com
            </a>{' '}
            with your enrollment confirmation. Approved refunds are issued to the original payment
            method within 10 business days of approval.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">7. Your conduct</h2>
          <p className="text-gray-700 leading-relaxed mb-3">When using the Site or enrolled in a program, you agree to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Provide accurate registration and enrollment information</li>
            <li>Keep your account credentials and access links confidential</li>
            <li>
              Not share, resell, redistribute, or republish any course materials, recordings, or
              proprietary content without written permission
            </li>
            <li>Not interfere with or disrupt the Site, its security, or other students</li>
            <li>Not use the Site or its content to harass, defame, or harm anyone</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">8. Intellectual property</h2>
          <p className="text-gray-700 leading-relaxed">
            All Site content, course materials, study guides, recordings, and the Wiser
            Generations and Enterprise Academy marks are owned by us or our licensors. You may
            use the materials for your own personal study and exam preparation. You may not copy,
            distribute, sublicense, or create derivative works without written permission. PMI marks
            referenced anywhere on the Site remain the property of PMI.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">9. No certification guarantee; results disclaimer</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Our programs are designed to prepare you for PMI certification exams, but{' '}
            <strong>we cannot guarantee that you will pass</strong>. Exam outcomes depend on your
            study, eligibility, and PMI&apos;s own scoring. Pass-rate statistics, the number of
            professionals trained, and similar figures shown on the Site reflect historical results
            from prior students and are not promises about your individual outcome.
          </p>
          <p className="text-gray-700 leading-relaxed mb-3">
            Any salary, earnings, or career-outcome figures referenced on the Site are general
            industry data drawn from third-party sources (such as PMI surveys). They are provided for
            informational purposes only, vary widely by individual, role, industry, and location, and
            are <strong>not a promise or guarantee of income or employment</strong>.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Our optional Pass Guarantee is a separate, restudy-based commitment described on our{' '}
            <Link href="/guarantee" className="text-gold hover:underline">
              Pass Guarantee
            </Link>{' '}
            page. It is not a refund guarantee, and it applies only if you meet all of the eligibility
            conditions stated on that page (including minimum attendance, completion of assigned work,
            and timing requirements). Those conditions are incorporated into these Terms by reference.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">10. Disclaimers</h2>
          <p className="text-gray-700 leading-relaxed">
            The Site and our programs are provided <em>&quot;as is&quot;</em> without warranties of any kind,
            either express or implied. We do not warrant that the Site will be uninterrupted,
            error-free, or free of viruses or harmful components, or that any defects will be
            corrected. You use the Site at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">11. Limitation of liability</h2>
          <p className="text-gray-700 leading-relaxed">
            To the fullest extent permitted by law, in no event shall Wiser Generations, Enterprise
            Academy, or any of our affiliates, officers, employees, or agents be liable for any
            indirect, incidental, special, consequential, or punitive damages, including loss of
            profits, data, or goodwill, arising out of or in connection with your use of the Site,
            any program, or any subscription. Our total liability for any claim arising out of these
            Terms, your use of the Site, or any program or subscription shall not exceed the amount
            you paid us in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">12. Indemnification</h2>
          <p className="text-gray-700 leading-relaxed">
            You agree to defend and indemnify Wiser Generations and Enterprise Academy from any
            claims arising out of your breach of these Terms, your violation of any law, or your
            misuse of the Site or course materials.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">13. Governing law and disputes</h2>
          <p className="text-gray-700 leading-relaxed">
            These Terms are governed by the laws of the State of Georgia, USA, without regard to
            conflict-of-law principles. Any dispute arising out of these Terms or your use of the
            Site shall be resolved exclusively in the state or federal courts located in Cobb
            County, Georgia, and you consent to the personal jurisdiction of those courts.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">14. Changes to these terms</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update these Terms from time to time. The &quot;Effective&quot; date at the top will
            reflect the most recent change. Continued use of the Site, any program, or any
            subscription after a change constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">15. Contact</h2>
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
            <Link href="/privacy-policy" className="text-gold hover:underline font-medium">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  )
}

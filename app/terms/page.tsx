import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: "Terms of Service for Wiser Generations Int'l - the rules and conditions governing use of our website and programs.",
}

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-4xl font-bold text-navy mb-4">Terms of Service</h1>
        <p className="text-gray-500 text-sm">Effective Date: April 12, 2026</p>
      </div>

      <div className="space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">1. Agreement to Terms</h2>
          <p>
            By accessing or using wisergenerations.com or purchasing any program from Wiser Generations
            Int&apos;l™ / Enterprise Academy™, you agree to be bound by these Terms of Service. If you do not
            agree, please do not use the Site or our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">2. Services</h2>
          <p>We provide PMP® and CAPM® certification training including:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Live, mentor-led cohort training (virtual and Metro Atlanta, GA)</li>
            <li>Self-paced study libraries and practice exam question banks</li>
            <li>One-on-one coaching and PMI application support</li>
            <li>Corporate team training</li>
            <li>Veterans PM Pathway programs</li>
            <li>Free educational resources, guides, and templates</li>
          </ul>
          <p className="mt-3">
            We are PMI-aligned but not affiliated with or endorsed by PMI®. PMP® and CAPM® are registered
            trademarks of the Project Management Institute, Inc.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">3. Enrollment and Payment</h2>
          <p>
            <strong>3.1 Enrollment</strong> is complete upon receipt of payment and confirmation. Seats are
            limited and first-come, first-served.
          </p>
          <p className="mt-2">
            <strong>3.2 Pricing.</strong> All prices are in U.S. dollars. Changes will not affect confirmed
            enrollments.
          </p>
          <p className="mt-2">
            <strong>3.3 Payment.</strong> Payments are processed securely through Stripe. We do not store
            your full card details on our servers.
          </p>
          <p className="mt-2">
            <strong>3.4 Subscriptions.</strong> Study Access is billed monthly. Cancel anytime by emailing{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline">
              info@wisergenerations.com
            </a>
            . Access continues through the end of the billing period.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">4. Refund Policy</h2>
          <p>
            <strong>4.1 Full Programs.</strong> Full refunds if requested in writing within 7 days of enrollment
            and before the cohort start date. No refunds after the cohort begins; we may offer a credit at our
            discretion.
          </p>
          <p className="mt-2">
            <strong>4.2 Study Access Subscriptions</strong> are non-refundable. Cancel before the next billing
            date to stop future charges.
          </p>
          <p className="mt-2">
            <strong>4.3 Corporate Training</strong> refund terms are governed by the applicable Statement of
            Work.
          </p>
          <p className="mt-3">
            To request a refund, email{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline">
              info@wisergenerations.com
            </a>{' '}
            with your name, enrollment details, and reason.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">5. Intellectual Property</h2>
          <p>
            All course materials, study guides, practice questions, templates, videos, and branding are the
            proprietary property of Enterprise Academy™ / Wiser Generations Int&apos;l™. You may use content only
            for personal, non-commercial educational purposes. Sharing access credentials is prohibited.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">6. Student Conduct</h2>
          <p>By enrolling, you agree to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Engage respectfully with instructors, staff, and fellow students.</li>
            <li>Complete your own work honestly for PMI® application purposes.</li>
            <li>Follow PMI&reg;&apos;s Code of Ethics and Professional Conduct.</li>
            <li>Not record or redistribute live session content without written consent.</li>
          </ul>
          <p className="mt-3">
            We reserve the right to remove any student without refund for serious misconduct.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">7. No Guarantee of Exam Results</h2>
          <p>
            We cannot guarantee you will pass any certification exam. Exam outcomes depend on individual effort,
            study habits, and PMI&reg;&apos;s independent evaluation. Our published pass rates are historical
            averages, not guarantees of individual performance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">8. Limitation of Liability</h2>
          <p>
            Services are provided &quot;as is.&quot; To the maximum extent permitted by law, our total aggregate
            liability shall not exceed the amount you paid us in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">9. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Georgia, U.S.A. Disputes shall be resolved
            in the state or federal courts of Cobb County, Georgia.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">10. Contact</h2>
          <div className="mt-2 bg-gray-50 rounded-xl p-5 border border-gray-200">
            <p className="font-bold text-navy">Wiser Generations Int&apos;l™ / Enterprise Academy™</p>
            <p>Smyrna, Georgia (Metro Atlanta)</p>
            <p>
              Email:{' '}
              <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline font-medium">
                info@wisergenerations.com
              </a>
            </p>
          </div>
        </section>

      </div>

      <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
        <Link href="/privacy-policy" className="text-gold hover:underline font-medium text-sm">Privacy Policy</Link>
        <Link href="/contact" className="text-gold hover:underline font-medium text-sm">Contact Us</Link>
        <Link href="/" className="text-gray-400 hover:text-navy text-sm">Back to Home</Link>
      </div>
    </div>
  )
}

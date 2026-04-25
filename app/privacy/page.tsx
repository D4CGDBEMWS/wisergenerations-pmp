import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Wiser Generations™',
  description:
    'How Wiser Generations™ collects, uses, and protects personal information from visitors and students.',
  // Legal pages should be indexable so search engines surface them when users
  // look for "wisergenerations privacy policy". Standard practice.
  robots: { index: true, follow: true },
}

const EFFECTIVE_DATE = 'April 7, 2026'

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-4xl font-bold text-navy mb-3">Privacy Policy</h1>
        <p className="text-gray-500 text-sm">Effective {EFFECTIVE_DATE}</p>
      </div>

      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5 mb-10 text-sm text-amber-900">
        <p className="font-bold mb-1">⚠️ Draft for review</p>
        <p>
          This policy is a working draft tailored to the data flows actually present in the
          Wiser Generations™ codebase. <strong>It is not legal advice.</strong> Please have
          qualified legal counsel review before publishing — particularly the GDPR, CCPA/CPRA,
          and CAN-SPAM sections.
        </p>
      </div>

      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-navy">1. Who we are</h2>
          <p className="text-gray-700 leading-relaxed">
            Wiser Generations™ is an independent project management training program operated as
            part of Enterprise Academy™. Our mailing location is Smyrna, Georgia (Metro Atlanta),
            and we deliver training virtually nationwide. For privacy questions, contact us at{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline">
              info@wisergenerations.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">2. Information we collect</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            We only collect personal information that you provide to us directly through one of the
            forms on this site, plus a small amount of technical information collected automatically
            when you visit:
          </p>

          <h3 className="text-lg font-semibold text-navy mt-5 mb-2">Information you give us</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              <strong>Free guide signup</strong> (<code>/free-guide</code>): your first name and email
              address.
            </li>
            <li>
              <strong>Contact form</strong> (<code>/contact</code>): your name, email address,
              optional subject line, and the message you send us.
            </li>
            <li>
              <strong>Checkout</strong> (<code>/checkout</code>): your name, email address, phone
              number, and payment details. Payment card information is collected and processed
              directly by Stripe; we never see or store your full card number.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-navy mt-5 mb-2">Information collected automatically</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              <strong>IP address</strong>, used briefly (60 seconds to 5 minutes, depending on the
              endpoint) to enforce per-IP rate limits on our API endpoints. Stored in a short-lived
              Upstash Redis cache or, if Upstash is unavailable, in process memory. Not associated
              with any other identity field.
            </li>
            <li>
              <strong>Standard request metadata</strong> (user agent, referrer, request timestamp)
              that is automatically logged by our hosting provider, Vercel, for operational and
              abuse-prevention purposes.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-navy mt-5 mb-2">What we do NOT collect</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>We do not use Google Analytics, Meta Pixel, Hotjar, or any third-party analytics SDK.</li>
            <li>We do not set tracking cookies. The site uses no cookies for marketing purposes.</li>
            <li>We do not buy mailing lists or enrich your data from third-party sources.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">3. How we use your information</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>To deliver the free guide you requested.</li>
            <li>To respond to your contact-form messages.</li>
            <li>To process and confirm your enrollment in our certification programs.</li>
            <li>
              To send you transactional messages related to your enrollment (receipts, schedule
              changes, course materials).
            </li>
            <li>
              To send periodic educational emails about our programs. You can unsubscribe at any
              time using the link at the bottom of any marketing email.
            </li>
            <li>To enforce rate limits and prevent abuse of our forms and APIs.</li>
            <li>To comply with legal obligations (tax, accounting, etc.).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">4. Service providers we share data with</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            We rely on the following third-party processors to operate the site. Each receives only
            the minimum data needed to perform its function:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200">
              <thead className="bg-light-navy">
                <tr>
                  <th className="text-left p-3 border-b border-gray-200 font-semibold text-navy">Provider</th>
                  <th className="text-left p-3 border-b border-gray-200 font-semibold text-navy">Purpose</th>
                  <th className="text-left p-3 border-b border-gray-200 font-semibold text-navy">Data shared</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr>
                  <td className="p-3 border-b border-gray-100">Stripe</td>
                  <td className="p-3 border-b border-gray-100">Payment processing</td>
                  <td className="p-3 border-b border-gray-100">Name, email, phone, payment card</td>
                </tr>
                <tr>
                  <td className="p-3 border-b border-gray-100">Resend</td>
                  <td className="p-3 border-b border-gray-100">Transactional email (contact form delivery)</td>
                  <td className="p-3 border-b border-gray-100">Name, email, message body</td>
                </tr>
                <tr>
                  <td className="p-3 border-b border-gray-100">ConvertKit</td>
                  <td className="p-3 border-b border-gray-100">Free-guide email delivery and follow-up</td>
                  <td className="p-3 border-b border-gray-100">First name, email</td>
                </tr>
                <tr>
                  <td className="p-3 border-b border-gray-100">Mailchimp</td>
                  <td className="p-3 border-b border-gray-100">Post-purchase customer email list</td>
                  <td className="p-3 border-b border-gray-100">Name, email</td>
                </tr>
                <tr>
                  <td className="p-3 border-b border-gray-100">Upstash (Redis)</td>
                  <td className="p-3 border-b border-gray-100">Rate-limit cache</td>
                  <td className="p-3 border-b border-gray-100">IP address (short-lived)</td>
                </tr>
                <tr>
                  <td className="p-3 border-b border-gray-100">Vercel</td>
                  <td className="p-3 border-b border-gray-100">Hosting and edge delivery</td>
                  <td className="p-3 border-b border-gray-100">Standard request metadata</td>
                </tr>
                <tr>
                  <td className="p-3">Bluehost / Titan Email</td>
                  <td className="p-3">DNS hosting and email delivery for info@wisergenerations.com</td>
                  <td className="p-3">Email message contents</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-700 leading-relaxed mt-3">
            We do not sell your personal information to anyone, ever.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">5. How long we keep your data</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              <strong>Free-guide and marketing list members:</strong> until you unsubscribe, at which
              point we remove your record from ConvertKit / Mailchimp within 7 days.
            </li>
            <li>
              <strong>Contact-form messages:</strong> retained in our inbox indefinitely unless you
              ask us to delete them.
            </li>
            <li>
              <strong>Enrollment and payment records:</strong> retained for 7 years to comply with
              tax and accounting requirements.
            </li>
            <li>
              <strong>Rate-limit IP records:</strong> 60 seconds to 5 minutes, then automatically
              deleted.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">6. Your rights</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Depending on where you live, you have some or all of the following rights:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              <strong>Access</strong> — request a copy of the personal information we hold about you.
            </li>
            <li>
              <strong>Correction</strong> — ask us to fix inaccurate information.
            </li>
            <li>
              <strong>Deletion</strong> — ask us to delete your information, subject to retention
              obligations (e.g. tax records).
            </li>
            <li>
              <strong>Opt-out of marketing</strong> — unsubscribe from any email at any time using
              the link at the bottom of the email.
            </li>
            <li>
              <strong>Data portability</strong> — receive your information in a portable format.
            </li>
            <li>
              <strong>Withdrawal of consent</strong> — withdraw any consent you previously gave us.
            </li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            To exercise any of these rights, email{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline">
              info@wisergenerations.com
            </a>{' '}
            with the subject line <em>"Privacy Request"</em>. We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">7. California residents (CCPA / CPRA)</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            If you are a California resident, you have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Know what personal information we have collected about you</li>
            <li>Delete that information</li>
            <li>Correct inaccurate information</li>
            <li>
              Opt out of the "sale" or "sharing" of your personal information.{' '}
              <strong>We do not sell or share your personal information for cross-context behavioral
              advertising</strong>, so there is nothing to opt out of, but you may still submit a
              request to confirm this.
            </li>
            <li>Non-discrimination for exercising any of these rights</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-3">
            Submit California requests via email to{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline">
              info@wisergenerations.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">8. EU / UK residents (GDPR / UK GDPR)</h2>
          <p className="text-gray-700 leading-relaxed">
            We process personal data on the following lawful bases:{' '}
            <strong>contract</strong> (delivering programs you purchase),{' '}
            <strong>consent</strong> (free-guide and newsletter signups),{' '}
            <strong>legitimate interests</strong> (rate limiting and abuse prevention), and{' '}
            <strong>legal obligation</strong> (tax recordkeeping). You have the rights described in
            Section 6 above. If you believe we are not handling your data lawfully, you have the
            right to lodge a complaint with your local data protection authority.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">9. Children</h2>
          <p className="text-gray-700 leading-relaxed">
            Our programs are intended for adult professionals. We do not knowingly collect personal
            information from children under 16. If you believe a child has provided us with
            information, contact us and we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">10. Security</h2>
          <p className="text-gray-700 leading-relaxed">
            We use HTTPS for all traffic, store secrets in environment variables (never in source
            control), use Stripe-hosted payment forms so card data never touches our servers,
            rate-limit all public APIs, and follow industry-standard security practices. No system
            is perfectly secure — if you become aware of a vulnerability, please email{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline">
              info@wisergenerations.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">11. Changes to this policy</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update this policy from time to time. The "Effective" date at the top will reflect
            the most recent change. Material changes will be communicated to enrolled students by
            email.
          </p>
        </section>

        <section className="border-t border-gray-200 pt-6 mt-10">
          <p className="text-sm text-gray-500">
            See also our{' '}
            <Link href="/terms" className="text-gold hover:underline font-medium">
              Terms of Service
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  )
}

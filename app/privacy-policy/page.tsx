import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Wiser Generations Int\'l — how we collect, use, and protect your information.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-4xl font-bold text-navy mb-4">Privacy Policy</h1>
        <p className="text-gray-500 text-sm">Effective Date: April 12, 2026 &nbsp;·&nbsp; Last Updated: August 20, 2026</p>
      </div>

      <div className="prose prose-slate max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">1. Who We Are</h2>
          <p>
            Wiser Generations Int&apos;l is an Enterprise Academy program operated by Crystal Stewart, PMP®,
            based in Smyrna, Georgia. We provide PMP® and CAPM® certification training for career
            transitioners, corporate teams, and U.S. military veterans — both virtually nationwide and
            in-person in Metro Atlanta.
          </p>
          <p className="mt-2">
            For questions about this policy, contact us at{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline font-medium">
              info@wisergenerations.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">2. Information We Collect</h2>
          <p>We collect information you provide directly to us, including:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li><strong>Contact information</strong> — name, email address, and phone number when you fill out a form, subscribe to our newsletter, or purchase a program.</li>
            <li><strong>Payment information</strong> — credit card and billing details, processed securely by Stripe. We never store your full card number on our servers.</li>
            <li><strong>Program enrollment data</strong> — information you provide when enrolling in a course, including professional background relevant to PMI® applications.</li>
            <li><strong>Communications</strong> — emails, messages, or inquiries you send to us.</li>
          </ul>
          <p className="mt-3">We also collect certain information automatically when you use our website:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li><strong>Usage data</strong> — pages visited, time spent, links clicked, and referring URLs, collected via Google Analytics.</li>
            <li><strong>Device and browser data</strong> — IP address, browser type, operating system, and device identifiers.</li>
            <li><strong>Cookies</strong> — small text files placed on your device to improve your experience. See Section 9 for details.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Deliver and administer the programs, courses, and services you purchase or request.</li>
            <li>Process payments and send receipts and enrollment confirmations.</li>
            <li>Send you newsletters, exam tips, cohort announcements, and promotional content — only if you have opted in. You may unsubscribe at any time.</li>
            <li>Schedule and confirm strategy calls and discovery sessions via Calendly.</li>
            <li>Respond to your inquiries and provide customer support.</li>
            <li>Improve our website, courses, and marketing based on aggregate usage analytics.</li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p className="mt-3">
            We do not sell, rent, or trade your personal information to third parties for their marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">4. Third-Party Services</h2>
          <p>We use the following trusted third-party services that may process your data on our behalf:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li><strong>Stripe</strong> — payment processing. Governed by the <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Stripe Privacy Policy</a>.</li>
            <li><strong>Mailchimp (Intuit)</strong> — email newsletter delivery and subscriber management. Governed by the <a href="https://www.intuit.com/privacy/statement/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Intuit Privacy Statement</a>.</li>
            <li><strong>Calendly</strong> — scheduling and booking of discovery and strategy calls. Governed by the <a href="https://calendly.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Calendly Privacy Policy</a>.</li>
            <li><strong>Google Analytics</strong> — website traffic and usage analytics. Governed by the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Google Privacy Policy</a>. You may opt out via <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Google&apos;s opt-out browser add-on</a>.</li>
            <li><strong>Vercel</strong> — website hosting and infrastructure. Governed by the <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Vercel Privacy Policy</a>.</li>
            <li><strong>Neon</strong> — the database holding your account, purchase and study-access records, hosted in the United States. Governed by the <a href="https://neon.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Neon Privacy Policy</a>.</li>
            <li><strong>Resend</strong> — delivery of account emails such as sign-in links and contact form messages. Governed by the <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Resend Privacy Policy</a>.</li>
            <li><strong>Kit (formerly ConvertKit)</strong> — delivery of the free study guide and its follow-up sequence. Governed by the <a href="https://kit.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Kit Privacy Policy</a>.</li>
            <li><strong>Cloudflare</strong> — bot and spam protection on our forms. Governed by the <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Cloudflare Privacy Policy</a>.</li>
            <li><strong>Upstash</strong> — rate limiting to protect our forms from abuse. Governed by the <a href="https://upstash.com/trust/privacy.pdf" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Upstash Privacy Policy</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">5. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to provide our services, comply with
            legal obligations, resolve disputes, and enforce our agreements. Specifically:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Newsletter subscriber data is retained until you unsubscribe.</li>
            <li>Purchase and enrollment records are retained for at least 7 years for tax and legal compliance.</li>
            <li>Inquiry and support communications are retained for 3 years.</li>
            <li>If you create an account or request a free resource but never make a purchase, we delete your record within 180 days.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">6. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li><strong>Access</strong> the personal data we hold about you.</li>
            <li><strong>Correct</strong> inaccurate or incomplete data.</li>
            <li><strong>Delete</strong> your data (subject to legal retention obligations).</li>
            <li><strong>Opt out</strong> of marketing emails at any time via the unsubscribe link in any email.</li>
            <li><strong>Data portability</strong> — receive a copy of your data in a structured, machine-readable format.</li>
            <li><strong>Withdraw consent</strong> at any time where we rely on consent to process your data.</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email us at{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline font-medium">
              info@wisergenerations.com
            </a>{' '}
            with the subject line &quot;Privacy Request.&quot; We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">7. California Residents (CCPA / CPRA)</h2>
          <p>If you are a California resident, you have the right to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Know what personal information we have collected about you.</li>
            <li>Delete that information.</li>
            <li>Correct inaccurate information.</li>
            <li>
              Opt out of the &quot;sale&quot; or &quot;sharing&quot; of your personal information.{' '}
              <strong>We do not sell or share your personal information for cross-context behavioral
              advertising</strong>, so there is nothing to opt out of, but you may still submit a
              request to confirm this.
            </li>
            <li>Non-discrimination for exercising any of these rights.</li>
          </ul>
          <p className="mt-3">
            Submit California requests via email to{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline font-medium">
              info@wisergenerations.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">8. EU / UK Residents (GDPR / UK GDPR)</h2>
          <p>
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
          <h2 className="text-xl font-bold text-navy mb-3">9. Cookies</h2>
          <p>We use the following types of cookies:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li><strong>Essential cookies</strong> — required for the site to function (e.g., security tokens, session management).</li>
            <li><strong>Analytics cookies</strong> — Google Analytics cookies that help us understand how visitors use the site. You can opt out using Google&apos;s opt-out tool.</li>
            <li><strong>Third-party cookies</strong> — Stripe and Calendly may set cookies when you interact with their embedded components.</li>
          </ul>
          <p className="mt-3">
            You can control or disable cookies through your browser settings. Note that disabling certain cookies
            may affect the functionality of our website, including the checkout and booking features.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">10. Security</h2>
          <p>
            We take reasonable technical and organizational measures to protect your personal information against
            unauthorized access, loss, or disclosure. Our website uses HTTPS encryption, and payment data is
            processed exclusively through Stripe&apos;s PCI-DSS compliant infrastructure. However, no method of
            transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">11. Children&apos;s Privacy</h2>
          <p>
            Our services are designed for adults pursuing professional certification, including our CAPM&reg; pathway
            for learners aged 18&ndash;24. We do not knowingly collect personal information from anyone under the age
            of 18. If you believe someone under 18 has provided us with personal information, please contact us
            immediately at{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline font-medium">
              info@wisergenerations.com
            </a>{' '}
            and we will promptly delete it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the &quot;Last Updated&quot;
            date at the top of this page. We encourage you to review this policy periodically. Continued use of
            our website after changes are posted constitutes your acceptance of the revised policy.
          </p>
        </section>

        {/* Owner-approved substance, 23 August 2026. Every factual claim in
            this section is asserted against the implementation by
            tests/liap-privacy-copy.test.ts — the question count, the dimension
            count, the narrative count, the absence of AI scoring, the 90-day
            purge, the hashed token, the automatic email, and the exclusion of
            narrative from both the Snapshot and the email.

            The recovery-history paragraph is OWNER-VERIFIED EXTERNAL
            CONFIGURATION. It describes Neon settings the owner checked in the
            console; nothing in this repository can confirm or change them, and
            no code here should try. */}
        <section>
          <h2 className="text-xl font-bold text-navy mb-3">
            13. Life Project-Ready&trade; Assessment Privacy
          </h2>
          <p>
            Wiser Generations International LLC respects the personal nature of the reflection
            involved in the Life Project-Ready&trade; Assessment. This section explains how
            information submitted through the assessment is used, retained, and protected.
          </p>

          <h3 className="mt-5 font-bold text-navy">Information You Provide</h3>
          <p className="mt-2">
            The assessment contains 40 scored questions across eight dimensions, along with three
            optional narrative questions that allow you to provide additional context in your own
            words.
          </p>
          <p className="mt-2">
            The assessment also uses information necessary to provide access to and deliver your
            results, including the customer information associated with your eligible book
            pre-purchase.
          </p>

          <h3 className="mt-5 font-bold text-navy">How Your Results Are Determined</h3>
          <p className="mt-2">
            Assessment results are produced through established, deterministic scoring rules.
          </p>
          <p className="mt-2">
            Artificial intelligence does not calculate, modify, override, or determine your
            assessment score or readiness position.
          </p>
          <p className="mt-2">
            The assessment is intended as a personal planning and reflection resource. It is not a
            clinical, medical, psychological, financial, legal, or other professional evaluation.
          </p>

          <h3 className="mt-5 font-bold text-navy">Narrative Responses and Retention</h3>
          <p className="mt-2">
            The Life Project-Ready&trade; Assessment includes three optional narrative questions
            that allow you to provide additional context in your own words.
          </p>
          <p className="mt-2">
            Narrative responses are retained in the active application for up to 90 days and are
            then automatically removed. Your verbatim narrative responses are not included in your
            downloadable Life Project Snapshot or results email.
          </p>
          <p className="mt-2">
            Once the applicable retention period has passed and the automated purge occurs, your
            narrative responses are no longer available through your assessment results in the
            active application.
          </p>

          <h3 className="mt-5 font-bold text-navy">Infrastructure Recovery History</h3>
          <p className="mt-2">
            Our database provider maintains limited point-in-time recovery history for operational
            recovery purposes.
          </p>
          <p className="mt-2">
            Under our current production configuration, that recovery history is retained for up to
            6 hours.
          </p>
          <p className="mt-2">
            As a result, information removed from the active application may remain temporarily
            recoverable within this limited recovery history before expiring through the
            provider&rsquo;s normal retention process.
          </p>
          <p className="mt-2">
            We currently maintain no separate database snapshots or scheduled snapshots that extend
            this retention period.
          </p>
          <p className="mt-2">
            Recovery-history settings may change as our infrastructure needs evolve. Any such change
            will be managed in accordance with our applicable privacy and data-retention
            obligations.
          </p>

          <h3 className="mt-5 font-bold text-navy">Your Life Project Snapshot</h3>
          <p className="mt-2">
            After completing the assessment, you receive access to your personalized results and a
            downloadable Life Project Snapshot.
          </p>
          <p className="mt-2">
            The Snapshot may include your dimension scores, strengths, areas requiring attention,
            hidden-urgency indicators when applicable, actionable focus areas, Protect &middot;
            Resolve &middot; Move recommendations, and your 30/60/90-day plan.
          </p>
          <p className="mt-2">
            Your verbatim narrative responses are not included in the downloadable Snapshot.
          </p>

          <h3 className="mt-5 font-bold text-navy">Secure Results Access</h3>
          <p className="mt-2">
            Assessment results are made available through a secure, randomly generated results link.
            The underlying result token is stored in hashed form.
          </p>
          <p className="mt-2">
            Treat your results link as private. Anyone who obtains a usable results link may
            potentially be able to view the information available through that link.
          </p>
          <p className="mt-2">At present, the results link does not automatically expire.</p>

          <h3 className="mt-5 font-bold text-navy">Email Delivery</h3>
          <p className="mt-2">
            After successful assessment submission, the system automatically sends your results
            email to the email address associated with your assessment access.
          </p>
          <p className="mt-2">Your narrative responses are not included in the results email.</p>
          <p className="mt-2">
            Your secure results page also provides access to your downloadable Life Project
            Snapshot. A resend option is available if you need the results email again.
          </p>

          <h3 className="mt-5 font-bold text-navy">Your Choices</h3>
          <p className="mt-2">
            You control what you write in the narrative portions of the assessment. Please avoid
            entering Social Security numbers, financial-account credentials, passwords, detailed
            medical information, or other highly sensitive information that is not necessary to use
            the assessment.
          </p>

          <h3 className="mt-5 font-bold text-navy">
            Questions About Your Assessment Information
          </h3>
          <p className="mt-2">
            Questions concerning the Life Project-Ready&trade; Assessment or the handling of
            assessment information may be directed to:
          </p>
          <div className="mt-3 bg-paper rounded-xl p-5 border border-gray-200">
            <p className="font-bold text-navy">Wiser Generations International LLC</p>
            <p>
              <a
                href="mailto:info@wisergenerations.com"
                className="text-gold hover:underline font-medium"
              >
                info@wisergenerations.com
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy mb-3">14. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy or our data practices, please contact:
          </p>
          <div className="mt-3 bg-paper rounded-xl p-5 border border-gray-200">
            <p className="font-bold text-navy">Wiser Generations Int&apos;l / Enterprise Academy</p>
            <p>Smyrna, Georgia (Metro Atlanta)</p>
            <p>
              Email:{' '}
              <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline font-medium">
                info@wisergenerations.com
              </a>
            </p>
            <p>Website: <Link href="/" className="text-gold hover:underline font-medium">wisergenerations.com</Link></p>
          </div>
        </section>

      </div>

      <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
        <Link href="/terms" className="text-gold hover:underline font-medium text-sm">Terms of Service →</Link>
        <Link href="/contact" className="text-gold hover:underline font-medium text-sm">Contact Us →</Link>
        <Link href="/" className="text-gray-400 hover:text-navy text-sm">← Back to Home</Link>
      </div>
    </div>
  )
}

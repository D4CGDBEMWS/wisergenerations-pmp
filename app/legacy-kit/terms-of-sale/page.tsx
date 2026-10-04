import type { Metadata } from 'next'
import { KIT_DISCLAIMERS } from '@/lib/legacy-kit/terms'
import {
  LEGACY_KIT_DOWNLOAD_LIMIT,
  LEGACY_KIT_LINK_HOURS,
  LEGACY_KIT_NAME_TM,
  LEGACY_KIT_PRICE_DISPLAY,
} from '@/lib/legacy-kit/product'

export const metadata: Metadata = {
  title: { absolute: 'Terms of Sale — Legacy Kit | Wiser Generations International' },
  description: 'Draft Terms of Sale and license for the Wiser Generations International Legacy Kit™.',
}

// ---------------------------------------------------------------------------
// Terms of Sale for the kit. DRAFT — pending attorney review.
//
// Two kinds of text, kept visibly apart:
//   1. "How buying works" — facts about how this site sells the kit (price,
//      delivery, link limits, cancellation waiver). Those are what the code
//      actually does, read from lib/legacy-kit/product.ts so they can't drift.
//   2. Disclaimers 1–11 — the owner's draft legal text, verbatim from the
//      launch plan, rendered from lib/legacy-kit/terms.ts.
// The PMP Terms of Service (/terms) do not cover the kit and are not linked.
// ---------------------------------------------------------------------------

export default function TermsOfSalePage() {
  const support = process.env.LEGACY_KIT_SUPPORT_EMAIL || 'info@wisergenerations.com'
  return (
    <div className="bg-cream">
      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p
          role="note"
          className="rounded-xl border-l-4 border-gold bg-white px-5 py-4 text-base font-bold text-evergreen ring-1 ring-sand"
        >
          DRAFT — pending attorney review. These terms are not final.
        </p>

        <h1 className="mt-8 text-3xl font-bold leading-tight text-evergreen sm:text-4xl">Terms of Sale and License</h1>
        <p className="mt-3 text-lg text-gray-800">{LEGACY_KIT_NAME_TM}</p>
        <p className="mt-1 text-sm text-gray-600">Draft of 4 October 2026</p>

        <section aria-labelledby="buying" className="mt-10">
          <h2 id="buying" className="text-2xl font-bold text-evergreen">How buying works</h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-800">
            <p>
              <strong>Seller.</strong> The kit is sold by Wiser Generations International, Smyrna, Georgia,
              United States. Business address: to be added before sales open.
            </p>
            <p>
              <strong>Price and payment.</strong> {LEGACY_KIT_PRICE_DISPLAY} in U.S. dollars, one time, for one
              household. Sales tax or VAT is added at checkout where it is owed, based on your billing
              address. Payment is handled by Stripe; we never see or store your card details.
            </p>
            <p>
              <strong>Delivery.</strong> The kit is a fillable PDF. Right after payment you can download it
              on screen, and we email you a download link. The link works for {LEGACY_KIT_LINK_HOURS} hours
              and up to {LEGACY_KIT_DOWNLOAD_LIMIT} downloads. If it expires or doesn&rsquo;t work, email{' '}
              <a href={`mailto:${support}`} className="font-semibold text-evergreen underline">{support}</a>{' '}
              and we will send a new one.
            </p>
            <p>
              <strong>Your right to cancel (EU and UK buyers).</strong> Buyers in the European Union and the
              United Kingdom normally have 14 days to cancel an online purchase. Before you buy, you are
              asked to agree that your download starts immediately and that you lose this right once the
              download begins. We confirm that agreement in your purchase email.
            </p>
            <p>
              <strong>Refunds.</strong> Because the Kit is a digital download delivered immediately, all
              sales are final. If your download link does not work, contact us and we will send a new one.
            </p>
            <p>
              <strong>Your information.</strong> We collect only your email address and billing address to
              process your purchase and deliver the kit. See the{' '}
              <a href="/privacy-policy#legacy-kit" className="font-semibold text-evergreen underline">Privacy Policy</a>.
            </p>
          </div>
        </section>

        <section aria-labelledby="disclaimers" className="mt-12">
          <h2 id="disclaimers" className="text-2xl font-bold text-evergreen">Disclaimers and license</h2>
          <ol className="mt-6 space-y-8">
            {KIT_DISCLAIMERS.map((d) => (
              <li key={d.n}>
                <h3 className="text-lg font-bold text-evergreen">
                  {d.n}. {d.title}
                </h3>
                <div className="mt-2 space-y-3 text-base leading-relaxed text-gray-800">
                  {d.paras.map((p) => (
                    <p key={p.slice(0, 32)}>{p}</p>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="contact" className="mt-12">
          <h2 id="contact" className="text-2xl font-bold text-evergreen">Contact</h2>
          <p className="mt-3 text-base leading-relaxed text-gray-800">
            For download problems:{' '}
            <a href={`mailto:${support}`} className="font-semibold text-evergreen underline">{support}</a>.
            We can&rsquo;t give legal, tax or financial advice.
          </p>
        </section>
      </article>
    </div>
  )
}

import { notFound } from 'next/navigation'
import { JOURNEY, firewallViolations } from '@/lib/liap/journey/content'
import { JourneySection } from '@/components/liap/journey/JourneySection'
import { sectionNumber, isAboveFirewall, FIREWALL_SECTION } from '@/lib/liap/journey/sections'

// ---------------------------------------------------------------------------
// A development harness. NOT the journey page.
//
// Steps 1–3 built the contract and the primitive; final page assembly is a
// separate approval. This exists so the owner can see the fourteen slots and
// where the firewall sits, without that decision being pre-empted.
//
// Hard-gated on NODE_ENV rather than on a feature flag. A flag can be turned
// on by mistake in a Vercel dashboard; NODE_ENV cannot, so there is no
// configuration that reveals this page.
//
// Stated precisely, because the looser version would be wrong: the route IS
// compiled into the production bundle and appears in the route table. What it
// does there is return 404 on every request, always, with no way to configure
// otherwise. Verified against a real production build rather than assumed.
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

export default function JourneyPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const violations = firewallViolations()

  return (
    <main>
      <div className="border-b-4 border-amber-500 bg-amber-50 px-5 py-6">
        <p className="mx-auto max-w-5xl font-mono text-xs font-semibold uppercase tracking-widest text-amber-700">
          Development preview · not the live page · no approved copy
        </p>
        <p className="mx-auto mt-2 max-w-5xl text-sm text-amber-900">
          Every amber box is a slot awaiting approved content. In production
          those render nothing at all. The firewall lifts at section{' '}
          {sectionNumber(FIREWALL_SECTION)}: no price, product name or purchase
          CTA appears above it.{' '}
          {violations.length === 0
            ? 'Firewall check: clean.'
            : `Firewall check: ${violations.length} violation(s).`}
        </p>
      </div>

      {JOURNEY.map((content) => (
        <div key={content.id}>
          <p className="mx-auto max-w-5xl px-5 pt-8 font-mono text-[0.65rem] uppercase tracking-widest text-gray-500 sm:px-8">
            §{sectionNumber(content.id)} · {content.id} · {content.kind} ·{' '}
            {isAboveFirewall(content.id) ? 'above firewall' : 'below firewall'}
          </p>
          <JourneySection content={content} />
        </div>
      ))}
    </main>
  )
}

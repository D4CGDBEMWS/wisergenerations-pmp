import type { ReactNode } from 'react'
import { copyText, type SectionContent } from '@/lib/liap/journey/content'
import { isAboveFirewall, sectionNumber } from '@/lib/liap/journey/sections'
import { SectionTracker } from './SectionTracker'
import { PendingSlot } from './PendingSlot'

// ---------------------------------------------------------------------------
// One section of the journey. Fourteen uses, one implementation.
//
// Spacing, anchor behaviour, tracking, image sizing and accessibility are
// decided here once, rather than fourteen times with fourteen chances to
// diverge. A section differs from its neighbours only in the content it is
// handed.
//
// ── UNAPPROVED COPY CANNOT REACH A VISITOR ─────────────────────────────────
//
// copyText() returns null for anything still pending, and this component
// renders nothing in its place in production. That is a mechanical guarantee
// rather than a policy: with every flag on and the page live, text nobody
// approved has no code path to the screen. In development the slot shows a
// visibly marked placeholder so layout can be worked on.
//
// ── MOBILE FIRST, BECAUSE OF WHERE THE TRAFFIC COMES FROM ──────────────────
//
// A substantial share of visitors arrive from a short or a QR code on a
// phone, mid-story. So the section is a vertical block first and a
// two-column layout only where there is room, the anchor has scroll margin so
// a deep link lands ON the section rather than above it, and every image slot
// reserves its aspect ratio so nothing jumps as the page loads.
// ---------------------------------------------------------------------------

interface Props {
  content: SectionContent
  /** Rendered inside the section — pillars, offer detail, FAQ, chooser. */
  children?: ReactNode
}

export function JourneySection({ content, children }: Props) {
  const headline = copyText(content.headline)
  const supporting = content.supporting ? copyText(content.supporting) : null
  const eyebrow = content.eyebrow ? copyText(content.eyebrow) : null
  const ctaLabel = content.cta ? copyText(content.cta.label) : null

  const above = isAboveFirewall(content.id)

  return (
    <section
      id={content.id}
      // Deep links from a short must land on the section, not scroll past it.
      className="scroll-mt-20 border-b border-gray-200 py-16 sm:py-24"
      aria-labelledby={headline ? `${content.id}-heading` : undefined}
    >
      <SectionTracker sectionId={content.id} />

      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 sm:px-8">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">{eyebrow}</p>
        ) : (
          content.eyebrow && <PendingSlot label={`§${sectionNumber(content.id)} eyebrow`} copy={content.eyebrow} />
        )}

        {headline ? (
          <h2
            id={`${content.id}-heading`}
            className="max-w-3xl text-balance text-3xl font-bold text-navy sm:text-4xl"
          >
            {headline}
          </h2>
        ) : (
          <PendingSlot label={`§${sectionNumber(content.id)} headline`} copy={content.headline} />
        )}

        {supporting ? (
          <p className="max-w-2xl text-lg text-gray-700">{supporting}</p>
        ) : (
          content.supporting && (
            <PendingSlot label={`§${sectionNumber(content.id)} supporting`} copy={content.supporting} />
          )
        )}

        {content.media && <MediaFrame content={content} />}

        {children}

        {/* Offer detail. Never reached above the firewall — the content
            contract cannot describe a pre-firewall section that has a price,
            and firewallViolations() proves it. */}
        {!above && (content.price || content.productName) && (
          <dl className="flex flex-wrap gap-x-10 gap-y-2">
            {content.productName && (
              <div>
                <dt className="text-sm text-gray-600">What it is</dt>
                <dd className="font-semibold text-navy">{content.productName}</dd>
              </div>
            )}
            {/* A held price renders nothing. copyText returns null for a
                pending value, so an unconfirmed number has no path to a
                visitor — the same guarantee that covers every other string
                on this page. */}
            {content.price && copyText(content.price) && (
              <div>
                <dt className="text-sm text-gray-600">Price</dt>
                <dd className="font-semibold text-navy">{copyText(content.price)}</dd>
              </div>
            )}
          </dl>
        )}

        {content.cta &&
          (ctaLabel ? (
            <JourneyCta
              href={content.cta.href}
              tier={content.cta.tier}
              sectionId={content.id}
              label={ctaLabel}
            />
          ) : (
            <PendingSlot label={`§${sectionNumber(content.id)} CTA`} copy={content.cta.label} />
          ))}
      </div>
    </section>
  )
}

/**
 * The image slot.
 *
 * Reserves its aspect ratio whether or not an asset exists yet, so adding the
 * real photograph later does not change the layout — and so a fourteen-section
 * scroll never jumps while images load.
 *
 * No asset and no approved alternative text means no frame in production. An
 * empty grey box is worse than nothing on a page that is meant to be mostly
 * visual.
 */
function MediaFrame({ content }: { content: SectionContent }) {
  const media = content.media!
  const alt = copyText(media.alt)

  if (!media.desktop && !media.mobile) {
    return (
      <PendingSlot
        label={`§${sectionNumber(content.id)} image · ${media.aspect.desktop} desktop, ${media.aspect.mobile} mobile`}
        copy={media.alt}
        style={{ aspectRatio: media.aspect.mobile }}
      />
    )
  }

  // Real assets arrive with the approved Marketing Kit. Until then this branch
  // is unreachable, and it stays deliberately simple: the responsive picture
  // element is assembled in step 4, not invented against assets that do not
  // exist yet.
  return (
    <figure className="overflow-hidden rounded-xl" style={{ aspectRatio: media.aspect.mobile }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.mobile ?? media.desktop ?? ''}
        alt={alt ?? ''}
        className="h-full w-full object-cover"
      />
    </figure>
  )
}

/**
 * A call to action.
 *
 * The tier travels with the click so reporting can answer which rung of the
 * ladder a visitor chose — and the firewall means every CTA above section 8
 * carries the 'journey' tier, which asks for attention and nothing else.
 */
function JourneyCta({
  href,
  tier,
  sectionId,
  label,
}: {
  href: string
  tier: SectionContent['cta'] extends undefined ? never : NonNullable<SectionContent['cta']>['tier']
  sectionId: SectionContent['id']
  label: string
}) {
  const isJourney = tier === 'journey'

  return (
    <a
      href={href}
      data-cta-tier={tier}
      data-section-id={sectionId}
      className={
        isJourney
          ? 'inline-flex w-fit items-center gap-2 font-semibold text-navy underline underline-offset-4'
          : 'inline-flex w-fit items-center rounded-lg bg-navy px-6 py-3 font-bold text-white'
      }
    >
      {label}
    </a>
  )
}

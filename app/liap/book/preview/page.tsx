import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isEnabled } from '@/lib/flags'
import {
  SNEAK_PREVIEW_LABEL,
  SNEAK_PREVIEW_TAGLINE,
  PREVIEW_CONTENT_APPROVED,
  PREVIEW_SECTIONS,
  PREVIEW_PENDING_NOTICE,
} from '@/lib/liap/preview'

export const metadata = {
  // Bare title, so the root layout's template applies the brand exactly once.
  title: `${SNEAK_PREVIEW_TAGLINE} | Living Is a Project…Are You Ready?`,
  description:
    'A look inside Living Is a Project…Are You Ready? by Crystal Glover Stewart, PMP®.',
  // Not indexed while the content is a placeholder. Removing this line is part
  // of shipping the approved excerpt, not part of building the shell.
  robots: { index: false, follow: false },
  keywords: [],
  openGraph: { images: [] },
}

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// /liap/book/preview — "SNEAK PREVIEW / Get a Look Inside".
//
// ── WHY IT SITS HERE ───────────────────────────────────────────────────────
//
// Nested under /liap/book, which is the seam the repository already treats as
// durable and the only URL intended for print. The printed collateral keeps
// carrying one URL; this is a destination the book experience offers, not a
// second thing to put on a poster.
//
// It is OUTSIDE app/living-is-a-project, so it is outside that tree's
// FEATURE_LIAP gate. That is the entire point: a look inside the book is
// marketing for people who have not bought yet, and it must not require the
// assessment, the results pages or the checkout to be open.
//
// ── WHY IT 404s AND /liap/book DOES NOT ────────────────────────────────────
//
// Its parent deliberately never 404s, because a QR code on a printed book must
// not dead-end. The opposite is right here: nothing printed points at this
// path, so while the flag is off it should be indistinguishable from a route
// that does not exist. Probing for unreleased manuscript material should find
// nothing.
//
// The two behaviours look inconsistent and are not. Each follows from whether
// ink exists.
//
// ── NO PAYMENT, NO SESSION, NO DATABASE ────────────────────────────────────
//
// A look inside is free. This page reads a flag and renders text. It touches
// no session, no entitlement, no Stripe, no migration-dependent table — which
// is what makes it reviewable in a Vercel Preview while every other LIAP
// control stays exactly where it is.
// ---------------------------------------------------------------------------

export default function SneakPreviewPage() {
  if (!isEnabled('LIAP_BOOK_PREVIEW')) notFound()

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-text">
        {SNEAK_PREVIEW_LABEL}
      </p>

      <h1 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl">
        {SNEAK_PREVIEW_TAGLINE}
      </h1>

      <p className="mt-4 leading-relaxed text-gray-700">
        <em>Living Is a Project&hellip;Are You Ready?&trade;</em> by Crystal Glover Stewart,
        PMP&reg;
      </p>

      <hr className="mt-8 border-gray-200" />

      {PREVIEW_CONTENT_APPROVED && PREVIEW_SECTIONS.length > 0 ? (
        <div className="mt-8 flex flex-col gap-8">
          {PREVIEW_SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold text-navy">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="mt-3 leading-relaxed text-gray-700">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      ) : (
        /* No approved excerpt yet. The shell says so plainly rather than
           filling the space with prose that would read as the author's. */
        <div
          role="note"
          className="mt-8 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-6"
        >
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
            Not for publication
          </p>
          <p className="mt-2 leading-relaxed text-gray-700">{PREVIEW_PENDING_NOTICE}</p>
        </div>
      )}

      <hr className="mt-10 border-gray-200" />

      <p className="mt-8 leading-relaxed text-gray-700">
        Ready for the whole thing?
      </p>
      <Link
        href="/living-is-a-project/book"
        className="mt-3 inline-flex min-h-[52px] items-center justify-center rounded-xl bg-gold px-8 font-bold text-navy transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        Preorder the book
      </Link>
    </div>
  )
}

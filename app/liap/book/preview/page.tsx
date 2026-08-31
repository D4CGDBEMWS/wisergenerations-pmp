import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isEnabled } from '@/lib/flags'
import { LIAP_BOOK } from '@/lib/liap/product'
import {
  SNEAK_PREVIEW_LABEL,
  SNEAK_PREVIEW_TAGLINE,
  PREVIEW_EDITION,
  PREVIEW_PROMISE,
  PREVIEW_AUTHOR,
  PREVIEW_IMPRINT,
  PREVIEW_SECTIONS,
  REFLECTIONS,
  PREVIEW_CLOSING_LINE,
  PREORDER_HEADING,
  PREORDER_BODY,
} from '@/lib/liap/preview'

export const metadata = {
  // Bare title, so the root layout's template applies the brand exactly once.
  title: `${SNEAK_PREVIEW_TAGLINE} | Living Is a Project…Are You Ready?`,
  description:
    'A preorder preview edition of Living Is a Project…Are You Ready? by Crystal Glover Stewart, PMP®.',
  // Not indexed. The route 404s while its flag is off so a crawler cannot
  // reach it anyway, but this makes the intent explicit rather than incidental
  // -- a pre-launch page should not be able to appear in search results ahead
  // of the campaign. Removing this line is part of opening the preview on
  // October 1, and is the owner's call, not a side effect of shipping content.
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
// Nested under /liap/book, the seam this repository already treats as durable
// and the only URL intended for print. Printed collateral keeps carrying one
// URL; this is a destination the book experience offers, not a second thing to
// put on a poster.
//
// It is OUTSIDE app/living-is-a-project, so outside that tree's FEATURE_LIAP
// gate. That is the point: a look inside the book is for people who have not
// bought yet, and must not require the assessment, results or checkout to be
// open.
//
// ── WHY IT 404s AND /liap/book DOES NOT ────────────────────────────────────
//
// Its parent must never 404 — a QR code on a printed book cannot dead-end. The
// opposite is right here: nothing printed points at this path, so while the
// flag is off it should be indistinguishable from a route that does not exist.
// Two behaviours, one rule — does ink exist.
//
// ── THE READING EXPERIENCE ─────────────────────────────────────────────────
//
// Seven sections of approved prose, each closing on the reflection questions
// the owner ruled controlled. The questions are pulled from REFLECTIONS by
// index rather than written into this file, so there is exactly one copy of
// each and a test can compare it to the source.
//
// The reflections are marked up as a <ul>, because that is what they are: a
// list of questions to sit with. A screen reader announcing "list, 2 items"
// before them tells the reader something true about the shape of the page.
//
// No QR code, in any form. The source instructs that the public QR is not to
// be fabricated, so the preorder call to action is a link to a route this
// repository controls.
//
// No payment, no session, no database, no migration. A look inside is free.
// ---------------------------------------------------------------------------

export default function SneakPreviewPage() {
  if (!isEnabled('LIAP_BOOK_PREVIEW')) notFound()

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      {/* Masthead */}
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-text">
          {SNEAK_PREVIEW_LABEL} &middot; {PREVIEW_EDITION}
        </p>

        <h1 className="mt-4 text-3xl font-bold leading-tight text-navy sm:text-4xl">
          {/* The trademark sits inside the span so there is no break
              opportunity between "Ready?" and the mark — outside it, the
              browser wrapped the ™ onto a line of its own. */}
          Living Is a Project&hellip;<span className="text-gold-text">Are You Ready?&trade;</span>
        </h1>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">
          {PREVIEW_PROMISE}
        </p>

        <p className="mt-5 text-sm text-gray-600">
          {PREVIEW_AUTHOR} &middot; {PREVIEW_IMPRINT}
        </p>
      </header>

      <hr className="mt-8 border-gray-200" />

      {/* The preview itself */}
      {PREVIEW_SECTIONS.map((section) => (
        <section key={section.heading} className="mt-10">
          <h2 className="text-xl font-bold text-navy sm:text-2xl">{section.heading}</h2>

          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="mt-4 leading-relaxed text-gray-700">
              {paragraph}
            </p>
          ))}

          {section.reflections.length > 0 && (
            <ul className="mt-6 flex flex-col gap-3 rounded-xl border-l-4 border-gold bg-light-gold/40 px-5 py-5">
              {section.reflections.map((i) => (
                <li key={i} className="font-semibold leading-relaxed text-navy">
                  {REFLECTIONS[i]}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <p className="mt-10 text-center text-lg font-bold leading-relaxed text-navy">
        {PREVIEW_CLOSING_LINE}
      </p>

      <hr className="mt-10 border-gray-200" />

      {/* Preorder. A link to a route this repository controls — never a
          fabricated QR code. */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-navy sm:text-2xl">{PREORDER_HEADING}</h2>
        <p className="mt-4 leading-relaxed text-gray-700">{PREORDER_BODY}</p>

        <Link
          href="/living-is-a-project/book"
          className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-xl bg-gold px-8 font-bold text-navy transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          Preorder &mdash; ${(LIAP_BOOK.amount / 100).toFixed(2)}
        </Link>

        <p className="mt-6 text-sm text-gray-500">
          {PREVIEW_AUTHOR} &middot; {PREVIEW_IMPRINT}
        </p>
      </section>
    </div>
  )
}

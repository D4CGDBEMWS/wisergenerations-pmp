'use client'

import { trackEvent } from '@/components/Analytics'

/**
 * Thin client wrapper so the thank-you page itself can stay a server
 * component. Fires the `ebook_download` conversion event, then lets the
 * browser handle the link normally — the download is never blocked on
 * analytics succeeding.
 */
export default function GuideDownloadButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      download
      onClick={() => trackEvent('ebook_download', { guide: 'pmp_exam_changes_2026' })}
      className="inline-flex items-center gap-2 rounded-xl bg-gold px-8 py-4 text-base font-bold text-navy shadow-sm transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5" />
        <path d="M12 15V3" />
      </svg>
      Download your guide (PDF)
    </a>
  )
}

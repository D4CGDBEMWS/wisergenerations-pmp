import type { KitPurchase, LinkState } from '@/lib/legacy-kit/purchases'

// ---------------------------------------------------------------------------
// The download box shared by the thank-you page and the download page.
//
// Downloading is a button that POSTs, never a plain link. Email security
// scanners open every link in an email to check it; if opening the link used a
// download, a buyer could find all five gone before they ever clicked. A scan
// opens the page, and the page uses nothing.
// ---------------------------------------------------------------------------

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-evergreen'

function when(date: Date): string {
  return `${date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })} (Eastern)`
}

const MESSAGES: Record<Exclude<LinkState, 'ok'>, { title: string; body: string }> = {
  'not-found': {
    title: 'We can’t find this download link',
    body: 'Please use the link in your confirmation email. If it still doesn’t work, email us and we will send a new one.',
  },
  revoked: {
    title: 'This download link has been cancelled',
    body: 'This purchase was refunded, so the link no longer works. If you think this is a mistake, email us.',
  },
  expired: {
    title: 'This download link has expired',
    body: 'Links last 72 hours. Email us with the address you bought with and we will send you a new one.',
  },
  'used-up': {
    title: 'All downloads on this link have been used',
    body: 'If you still need the file, email us with the address you bought with and we will send a new link.',
  },
}

export function DownloadPanel({
  token,
  purchase,
  state,
}: {
  token: string
  purchase: KitPurchase | null
  state: LinkState
}) {
  const support = process.env.LEGACY_KIT_SUPPORT_EMAIL || 'info@wisergenerations.com'

  if (state !== 'ok' || !purchase) {
    const m = MESSAGES[state === 'ok' ? 'not-found' : state]
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand sm:p-8" role="status">
        <h2 className="text-xl font-bold text-evergreen">{m.title}</h2>
        <p className="mt-2 text-base leading-relaxed text-gray-700">{m.body}</p>
        <a href={`mailto:${support}`} className={`mt-4 inline-block font-semibold text-evergreen underline ${FOCUS}`}>
          {support}
        </a>
      </div>
    )
  }

  const left = purchase.downloadLimit - purchase.downloadsUsed
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sand sm:p-8">
      <form method="post" action="/api/legacy-kit/download">
        <input type="hidden" name="t" value={token} />
        <button
          type="submit"
          className={`inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-gold px-7 text-lg font-bold text-evergreen transition-colors hover:bg-yellow-400 ${FOCUS}`}
        >
          Download the kit (PDF)
        </button>
      </form>
      <p className="mt-4 text-base text-gray-700">
        {left} of {purchase.downloadLimit} downloads left · link works until {when(purchase.expiresAt)}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        Save the PDF to your computer or phone right away. Then open it in Adobe Acrobat Reader,
        Preview or your browser to type into it, or print it and write by hand.
      </p>
    </div>
  )
}

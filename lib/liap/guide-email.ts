// ---------------------------------------------------------------------------
// Words to Know: delivered by the website itself.
//
// Owner ruling 2026-10-29: the guide must not depend on a Mailchimp journey
// existing. On sign-up the page shows a download button and this sends the
// link straight away through Resend (already used for contact and results
// emails). The Mailchimp welcome series, once built, adds the follow-ups.
//
// Never throws: a failed send must not fail the sign-up, because the reader
// already has the download button in front of them.
// ---------------------------------------------------------------------------

export const GUIDE_PATH = '/liap/author/words-to-know.pdf'
export const GUIDE_SUBJECT = 'Your Words to Know Guide Is Here'

function guideUrl(): string {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wisergenerations.com'
  return `${origin.replace(/\/$/, '')}${GUIDE_PATH}`
}

export function guideEmailText(url: string): string {
  return [
    'Thank you for requesting Words to Know: 30 Project Management Terms to Help You Navigate the Projects That Matter in Life.',
    '',
    `Download your guide: ${url}`,
    '',
    'You know more than you think.',
    '— Crystal Glover Stewart',
    '',
    'You are receiving this because you asked for the free guide at wisergenerations.com/author.',
  ].join('\n')
}

export function guideEmailHtml(url: string): string {
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Georgia,serif;color:#1E2F55">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8A5A0C;margin:0">Your free guide</p>
<h1 style="font-size:30px;line-height:1.15;color:#001B3A;margin:12px 0 0">Words to Know</h1>
<p style="font-size:17px;line-height:1.5;margin:8px 0 0">30 Project Management Terms to Help You Navigate the Projects That Matter in Life</p>
<p style="margin:28px 0"><a href="${url}" style="display:inline-block;background:#001B3A;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:15px;padding:14px 26px;border-radius:999px">Download your guide (PDF)</a></p>
<p style="font-size:17px;line-height:1.5;margin:0">You know more than you think.</p>
<p style="font-size:17px;margin:6px 0 0">— Crystal Glover Stewart</p>
<p style="font-family:Arial,sans-serif;font-size:12px;color:#5A5F70;margin:32px 0 0">You are receiving this because you asked for the free guide at wisergenerations.com/author. If the button doesn't work, copy this link: ${url}</p>
</div></body></html>`
}

/** Sends the guide link. Returns true only if Resend accepted the message. */
export async function sendWordsToKnowGuide(to: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[liap/guide-email] RESEND_API_KEY not set; guide not emailed')
    return false
  }
  const from =
    process.env.MAGIC_LINK_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'info@wisergenerations.com'
  const url = guideUrl()
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `Crystal Glover Stewart <${from}>`,
        to: [to],
        subject: GUIDE_SUBJECT,
        html: guideEmailHtml(url),
        text: guideEmailText(url),
      }),
    })
    if (!res.ok) {
      console.error(`[liap/guide-email] Resend rejected the send: HTTP ${res.status}`)
      return false
    }
    return true
  } catch (err) {
    console.error('[liap/guide-email] send threw:', err)
    return false
  }
}

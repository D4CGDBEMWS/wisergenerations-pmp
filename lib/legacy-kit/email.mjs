// ---------------------------------------------------------------------------
// The kit's delivery email, sent through Mailchimp Transactional.
//
// Owner's choice, 4 October 2026: Mailchimp sends the confirmation and the
// download link. Mailchimp Transactional (formerly Mandrill) is Mailchimp's
// one-to-one purchase-email service; the regular Mailchimp audience is not
// used, so buying the kit does not add anyone to a marketing list.
//
// Needs, in the environment:
//   MAILCHIMP_TRANSACTIONAL_API_KEY  from Mailchimp → Transactional → Settings
//   LEGACY_KIT_FROM_EMAIL            an address on a domain verified (DKIM)
//                                    in Mailchimp Transactional
//
// Click and open tracking are OFF. Click tracking would rewrite the download
// link through Mailchimp's servers, and the link is a key to a paid file.
//
// The email restates the EU/UK waiver the buyer agreed to at checkout. EU and
// UK rules expect that confirmation "on a durable medium", and an email is one.
//
// Plain .mjs so the re-send script can use it without a TypeScript build.
// ---------------------------------------------------------------------------

export const KIT_EMAIL_SUBJECT = 'Your Wiser Generations International Legacy Kit™ is ready'

const EVERGREEN = '#1F3B2C'
const GOLD = '#C9A84C'

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * @param {{ link: string, hours: number, limit: number, contactEmail?: string }} input
 */
export function kitEmailHtml({ link, hours, limit, contactEmail = 'info@wisergenerations.com' }) {
  const href = escapeHtml(link)
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1A1A1A">
  <div style="background:${EVERGREEN};padding:24px;border-radius:8px 8px 0 0">
    <p style="color:${GOLD};margin:0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:bold">Wiser Generations · Family Legacy</p>
    <h1 style="color:#ffffff;margin:8px 0 0;font-size:22px;line-height:1.3">Your Legacy Kit™ is ready</h1>
  </div>
  <div style="background:#FAF6EE;padding:28px;border-radius:0 0 8px 8px">
    <p style="margin:0 0 16px;line-height:1.6">Thank you for your purchase. Your fillable Wiser Generations International Legacy Kit™ is ready to download.</p>
    <p style="text-align:center;margin:28px 0">
      <a href="${href}" style="background:${GOLD};color:${EVERGREEN};padding:14px 30px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">Download your kit</a>
    </p>
    <p style="margin:0 0 16px;line-height:1.6">Your link works for <strong>${hours} hours</strong> and up to <strong>${limit} downloads</strong>. Save the PDF to your computer or phone as soon as you download it, then type into it or print it.</p>
    <p style="margin:0 0 16px;line-height:1.6;font-size:14px">If the button does not work, copy this link into your browser:<br><span style="word-break:break-all;color:#555">${href}</span></p>
    <div style="background:#ffffff;border-left:4px solid ${GOLD};padding:14px 16px;margin:20px 0">
      <p style="margin:0 0 8px;line-height:1.5;font-size:14px"><strong>Your confirmation.</strong> At checkout you agreed that your download starts immediately and that you lose your 14-day right to cancel once the download begins. Because the kit is a digital download delivered immediately, all sales are final.</p>
      <p style="margin:0;line-height:1.5;font-size:14px">Educational only — not legal, tax or financial advice. Please read the Important notices on page 2 of the kit before you begin.</p>
    </div>
    <p style="margin:0 0 6px;line-height:1.6;font-size:14px">One purchase covers one household. Please keep the link private and don't share the kit.</p>
    <p style="margin:0;line-height:1.6;font-size:14px">Link not working or expired? Email <a href="mailto:${escapeHtml(contactEmail)}" style="color:${EVERGREEN}">${escapeHtml(contactEmail)}</a> and we will send a new one. (For download problems only; we can't give legal or financial advice.)</p>
  </div>
  <p style="color:#777;font-size:12px;line-height:1.5;margin:16px 4px 0">Wiser Generations International, Smyrna, Georgia. You are receiving this email because you bought the Legacy Kit. It is not a marketing email.</p>
</div>`
}

export function kitEmailText({ link, hours, limit, contactEmail = 'info@wisergenerations.com' }) {
  return `Your Wiser Generations International Legacy Kit™ is ready

Thank you for your purchase. Download your fillable kit here:
${link}

Your link works for ${hours} hours and up to ${limit} downloads. Save the PDF to your computer or phone as soon as you download it, then type into it or print it.

YOUR CONFIRMATION
At checkout you agreed that your download starts immediately and that you lose your 14-day right to cancel once the download begins. Because the kit is a digital download delivered immediately, all sales are final.

Educational only — not legal, tax or financial advice. Please read the Important notices on page 2 of the kit before you begin.

One purchase covers one household. Please keep the link private and don't share the kit.

Link not working or expired? Email ${contactEmail} and we will send a new one. (For download problems only; we can't give legal or financial advice.)

Wiser Generations International, Smyrna, Georgia. You are receiving this email because you bought the Legacy Kit. It is not a marketing email.`
}

/** True when the Mailchimp Transactional settings are present. */
export function kitEmailConfigured() {
  return Boolean(process.env.MAILCHIMP_TRANSACTIONAL_API_KEY && process.env.LEGACY_KIT_FROM_EMAIL)
}

/**
 * Sends the delivery email. Resolves true when Mailchimp accepted it ("sent",
 * "queued" or "scheduled"); throws when Mailchimp rejects it or is
 * unreachable, so the caller can let Stripe retry.
 *
 * @param {{ to: string, link: string, hours: number, limit: number, fetchImpl?: typeof fetch }} input
 */
export async function sendKitEmail({ to, link, hours, limit, fetchImpl = fetch }) {
  const key = process.env.MAILCHIMP_TRANSACTIONAL_API_KEY
  const from = process.env.LEGACY_KIT_FROM_EMAIL
  if (!key || !from) throw new Error('Mailchimp Transactional is not configured.')
  const contactEmail = process.env.LEGACY_KIT_SUPPORT_EMAIL || 'info@wisergenerations.com'

  const res = await fetchImpl('https://mandrillapp.com/api/1.0/messages/send.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key,
      message: {
        from_email: from,
        from_name: 'Wiser Generations International',
        to: [{ email: to, type: 'to' }],
        headers: { 'Reply-To': contactEmail },
        subject: KIT_EMAIL_SUBJECT,
        html: kitEmailHtml({ link, hours, limit, contactEmail }),
        text: kitEmailText({ link, hours, limit, contactEmail }),
        track_opens: false,
        track_clicks: false,
        preserve_recipients: false,
        tags: ['legacy-kit-delivery'],
      },
    }),
  })

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(`Mailchimp Transactional error ${res.status}: ${body?.message ?? 'no detail'}`)
  }
  const result = Array.isArray(body) ? body[0] : null
  if (!result || !['sent', 'queued', 'scheduled'].includes(result.status)) {
    throw new Error(
      `Mailchimp Transactional did not send the kit email: ${result?.status ?? 'no result'}` +
        (result?.reject_reason ? ` (${result.reject_reason})` : '')
    )
  }
  return true
}

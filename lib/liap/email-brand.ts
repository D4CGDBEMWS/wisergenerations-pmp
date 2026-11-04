// ---------------------------------------------------------------------------
// The Living Is a Project email look. Owner request, 2026-11-04: the emails
// had no pictures or icons and felt impersonal.
//
// Table layout and inline styles, because that is what email apps render
// reliably. Images are PNG/JPG files on the live site (never SVG, which most
// email apps block) and always load from the production address, so a test
// copy of the site still sends emails whose pictures show.
//
// Copy inside each email stays with that email's own module; this file only
// frames it: the banner, the sign-off from Crystal and the footer.
// ---------------------------------------------------------------------------

export const BRAND_ASSET_ORIGIN = 'https://www.wisergenerations.com'
const A = `${BRAND_ASSET_ORIGIN}/liap/brand`

export const EMAIL_COLORS = {
  navy: '#001B3A',
  ink: '#1E2F55',
  gold: '#CC9C48',
  goldText: '#8A5A0C',
  cream: '#FBF9F5',
  creamDeep: '#F6F1E6',
  rule: '#EADFC8',
} as const

/** A small gold icon on a cream circle (PNG). Only names that exist in public/liap/brand/icons. */
export function emailIcon(name: 'protect' | 'resolve' | 'move' | 'plan' | 'mail' | 'download' | 'strengths', size = 44): string {
  return `<img src="${A}/icons/${name}.png" width="${size}" height="${size}" alt="" style="display:block;border:0;width:${size}px;height:${size}px">`
}

export function emailButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto"><tr>
<td style="background:${EMAIL_COLORS.gold};border-radius:999px">
<a href="${href}" style="display:inline-block;padding:15px 34px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;letter-spacing:.04em;color:${EMAIL_COLORS.navy};text-decoration:none;border-radius:999px">${label}</a>
</td></tr></table>`
}

/**
 * The full email: banner, the body passed in, Crystal's sign-off, footer.
 * `signoffName` lets the sign-in email omit the PMP credential, which a LIAP
 * sign-in email must never mention (tests/program-boundary.test.ts).
 */
export function brandedEmail(opts: {
  preheader: string
  bodyHtml: string
  signoffName?: string
}): string {
  const name = opts.signoffName ?? 'Crystal Glover Stewart'
  return `<!doctype html><html><body style="margin:0;padding:0;background:${EMAIL_COLORS.creamDeep}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${opts.preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EMAIL_COLORS.creamDeep}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td style="padding:0;line-height:0">
<img src="${A}/email-banner.png" width="600" alt="Living Is a Project…Are You Ready?™" style="display:block;width:100%;max-width:600px;height:auto;border:0">
</td></tr>
<tr><td style="padding:32px 36px 8px;font-family:Arial,Helvetica,sans-serif;color:${EMAIL_COLORS.ink};font-size:16px;line-height:1.6">
${opts.bodyHtml}
</td></tr>
<tr><td style="padding:8px 36px 30px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${EMAIL_COLORS.rule};width:100%"><tr>
<td width="76" style="padding:22px 16px 0 0;vertical-align:middle">
<img src="${A}/crown.png" width="60" alt="" style="display:block;width:60px;height:auto;border:0">
</td>
<td style="padding:22px 0 0;vertical-align:middle;font-family:Georgia,'Times New Roman',serif">
<p style="margin:0;font-size:20px;font-style:italic;color:${EMAIL_COLORS.goldText}">Warmly,</p>
<p style="margin:2px 0 0;font-size:17px;font-weight:bold;color:${EMAIL_COLORS.navy}">${name}</p>
<p style="margin:2px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5A5F70">Life is a journey. Enjoy the ride!</p>
</td></tr></table>
</td></tr>
<tr><td style="background:${EMAIL_COLORS.navy};padding:18px 36px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#C9D2DE">
<img src="${A}/crown.png" width="34" alt="" style="display:inline-block;vertical-align:middle;width:34px;height:auto;border:0;margin-right:8px">
<span style="vertical-align:middle">Questions? Reply to this email or write to <a href="mailto:info@wisergenerations.com" style="color:${EMAIL_COLORS.gold}">info@wisergenerations.com</a>.<br>© 2026 Wiser Generations International LLC</span>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

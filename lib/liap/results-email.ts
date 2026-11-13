import type { RenderedReport } from './recommendations'
import { brandedEmail, emailButton, emailIcon, EMAIL_COLORS } from './email-brand'

// ---------------------------------------------------------------------------
// The results email. §23.
//
// It carries the position, the headline actions and a link. It deliberately
// does NOT carry the narrative answers, the affected area, or the urgency: an
// email sits in an inbox for years, gets forwarded, and is indexed by the mail
// provider. Someone's sentence about their diagnosis does not belong in one.
//
// The link is the opaque result token — the same capability the customer
// already holds — so opening it three weeks later on a different device still
// works, which is the whole point of sending it.
// ---------------------------------------------------------------------------

export const RESULTS_SUBJECT = 'Your Life Project-Ready™ Plan Is Ready'

export function resultsEmailHtml(report: RenderedReport, resultsUrl: string): string {
  // Owner request, 2026-11-04: same words as before, now with the Living Is a
  // Project banner, the campaign's crown, an icon per step and Crystal's
  // sign-off (lib/liap/email-brand.ts). No dimension name appears, by design.
  const c = EMAIL_COLORS
  const actions = report.actions
    .map(
      (a) => `
        <tr>
          <td width="60" style="padding:0 14px 18px 0;vertical-align:top">${emailIcon(a.kind)}</td>
          <td style="padding:2px 0 18px;vertical-align:top">
            <p style="margin:0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${c.goldText};font-weight:bold">${
              a.kind === 'protect' ? 'Protect' : a.kind === 'resolve' ? 'Resolve' : 'Move'
            }</p>
            <p style="margin:4px 0 0;font-size:17px;font-weight:bold;color:${c.navy}">${escapeHtml(a.headline)}</p>
          </td>
        </tr>`
    )
    .join('')

  const body = `
    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${c.navy}">
      Something changed — or something is about to.
    </p>
    <p style="margin:0 0 24px">
      Your Life Project-Ready™ Assessment has helped organize what deserves your attention next.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.navy};border-radius:12px;margin:0 0 28px">
      <tr><td style="padding:24px 26px">
        <p style="margin:0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:${c.gold};font-weight:bold">Your Life Project Position</p>
        <p style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;color:#ffffff">${escapeHtml(report.positionLabel)}</p>
        <p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:#D7DEE8">${escapeHtml(report.positionMeaning)}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:21px;color:${c.navy}">Your next best three</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${actions}</table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.cream};border:1px solid ${c.rule};border-radius:12px;margin:8px 0 0">
      <tr>
        <td width="60" style="padding:18px 0 18px 18px;vertical-align:top">${emailIcon('plan')}</td>
        <td style="padding:18px 18px 18px 14px">
          <p style="margin:0 0 4px">Your plan also includes:</p>
          <p style="margin:0;font-size:15px;line-height:1.8;color:${c.ink}">
            ✦ Your eight readiness dimensions<br>
            ✦ Strengths you can use<br>
            ✦ Priority areas<br>
            ✦ Your 30/60/90-day starting plan
          </p>
        </td>
      </tr>
    </table>

    ${emailButton(resultsUrl, 'View my personalized plan')}

    <p style="margin:0;font-size:15px">
      Your downloadable Life Project Snapshot is available from your secure results page so you can keep it and use it as you move forward.
    </p>
    <p style="margin:14px 0 18px;font-size:13px;color:#6b7280">
      This link opens your plan. Keep it private — anyone with the link can read it.
    </p>`

  return brandedEmail({
    preheader: `Your Life Project Position: ${escapeHtml(report.positionLabel)}. Your next best three are inside.`,
    bodyHtml: body,
  })
}

export function resultsEmailText(report: RenderedReport, resultsUrl: string): string {
  const actions = report.actions
    .map((a) => `  ${a.kind.toUpperCase()}: ${a.headline}`)
    .join('\n')

  return `Something changed — or something is about to.

Your Life Project-Ready™ Assessment has helped organize what deserves your
attention next.

YOUR LIFE PROJECT POSITION
${report.positionLabel}
${report.positionMeaning}

YOUR NEXT BEST THREE
${actions}

Your plan also includes your eight readiness dimensions, strengths you can
use, priority areas, and your 30/60/90-day starting plan.

View your personalized plan:
${resultsUrl}

Your downloadable Life Project Snapshot is available from your secure results page so you can keep it and use it as you move forward.

This link opens your plan. Keep it private — anyone with the link can read it.`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

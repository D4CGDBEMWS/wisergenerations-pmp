import type { FullReport } from './recommendations'

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

export function resultsEmailHtml(report: FullReport, resultsUrl: string): string {
  const actions = report.actions
    .map(
      (a) => `
        <tr><td style="padding:0 0 18px">
          <p style="margin:0;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#C9A84C;font-weight:bold">${
            a.kind === 'protect' ? 'Protect' : a.kind === 'resolve' ? 'Resolve' : 'Move'
          }</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:bold;color:#0A1628">${escapeHtml(a.headline)}</p>
        </td></tr>`
    )
    .join('')

  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#0A1628;padding:24px;text-align:center;border-radius:8px 8px 0 0">
    <h1 style="color:#C9A84C;margin:0;font-size:22px">Wiser Generations</h1>
    <p style="color:#B9C4D2;margin:6px 0 0;font-size:13px">Life Is a Project™</p>
  </div>

  <div style="background:#f9fafb;padding:32px;border-radius:0 0 8px 8px">
    <p style="color:#374151;line-height:1.6;margin:0 0 16px">
      Something changed — or something is about to.
    </p>
    <p style="color:#374151;line-height:1.6;margin:0 0 24px">
      Your Life Project-Ready™ Assessment has helped organize what deserves your attention next.
    </p>

    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px">
      <p style="margin:0;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6b7280">Your Life Project Position</p>
      <p style="margin:6px 0 0;font-size:24px;font-weight:bold;color:#0A1628">${escapeHtml(report.positionLabel)}</p>
      <p style="margin:8px 0 0;font-size:14px;color:#4b5563;line-height:1.6">${escapeHtml(report.positionMeaning)}</p>
    </div>

    <p style="margin:0 0 12px;font-size:14px;font-weight:bold;color:#0A1628">Your next best three</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">${actions}</table>

    <p style="color:#374151;line-height:1.6;margin:8px 0 4px">Your plan also includes:</p>
    <ul style="color:#374151;line-height:1.7;margin:0 0 24px;padding-left:20px">
      <li>Your eight readiness dimensions</li>
      <li>Strengths you can use</li>
      <li>Priority areas</li>
      <li>Your 30/60/90-day starting plan</li>
    </ul>

    <p style="text-align:center;margin:28px 0">
      <a href="${resultsUrl}" style="background:#C9A84C;color:#0A1628;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">View my personalized plan</a>
    </p>

    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:24px 0 0">
      This link opens your plan. Keep it private — anyone with the link can read it.
    </p>
  </div>
</div>`
}

export function resultsEmailText(report: FullReport, resultsUrl: string): string {
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

This link opens your plan. Keep it private — anyone with the link can read it.`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

import { brandedEmail, emailButton, emailIcon, EMAIL_COLORS } from './email-brand'
import { WORKSHOP, sessionLabel, type WorkshopSession, type ZoomDetails } from './workshop'

// ---------------------------------------------------------------------------
// Workshop emails: confirmation (with the Zoom details and a calendar file),
// the morning-of reminder, and the replay + survey after the session.
// All in the Living Is a Project look (lib/liap/email-brand.ts).
// ---------------------------------------------------------------------------

const c = EMAIL_COLORS

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function zoomBlock(z: ZoomDetails): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.cream};border:1px solid ${c.rule};border-radius:12px;margin:0 0 8px">
<tr><td style="padding:18px 22px;font-size:15px;line-height:1.7">
<p style="margin:0 0 6px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${c.goldText};font-weight:bold">How to join on Zoom</p>
<a href="${esc(z.url)}" style="color:${c.navy};font-weight:bold;word-break:break-all">${esc(z.url)}</a><br>
Meeting ID: <strong>${esc(z.meetingId)}</strong> · Passcode: <strong>${esc(z.passcode)}</strong>
</td></tr></table>`
}

function sessionBlock(s: WorkshopSession): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.navy};border-radius:12px;margin:0 0 20px">
<tr><td style="padding:22px 24px">
<p style="margin:0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:${c.gold};font-weight:bold">Your session</p>
<p style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#ffffff">${esc(sessionLabel(s))}</p>
<p style="margin:6px 0 0;font-size:14px;color:#D7DEE8">${WORKSHOP.durationMinutes} minutes, live on Zoom</p>
</td></tr></table>`
}

export const CONFIRMATION_SUBJECT = 'You’re registered: Be Ready to Make the Turn Workshop'

export function confirmationEmail(s: WorkshopSession, z: ZoomDetails | null): { subject: string; html: string; text: string } {
  const joinHtml = z
    ? zoomBlock(z)
    : `<p style="margin:0 0 8px">Your Zoom link will be emailed to you before the workshop.</p>`
  const html = brandedEmail({
    preheader: `You’re registered for ${esc(sessionLabel(s))}.`,
    bodyHtml: `
<p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${c.navy}">You’re registered. Your seat is saved.</p>
<p style="margin:0 0 22px">Thank you for joining the ${WORKSHOP.name}. Bring your Life Project-Ready™ results if you have them; we will work from where you are.</p>
${sessionBlock(s)}
${joinHtml}
<p style="margin:14px 0 0;font-size:14px;color:#5A5F70">A calendar invitation is attached. We will also send a reminder the morning of your session.</p>
<p style="margin:14px 0 18px;font-size:13px;color:#6b7280">${esc(WORKSHOP.terms)}</p>`,
  })
  const text = [
    'You’re registered. Your seat is saved.',
    '',
    `${WORKSHOP.name}`,
    `Your session: ${sessionLabel(s)} (${WORKSHOP.durationMinutes} minutes, live on Zoom)`,
    '',
    z ? `Join on Zoom: ${z.url}\nMeeting ID: ${z.meetingId}\nPasscode: ${z.passcode}` : 'Your Zoom link will be emailed to you before the workshop.',
    '',
    'A calendar invitation is attached. We will also send a reminder the morning of your session.',
    '',
    WORKSHOP.terms,
    '',
    'Crystal Glover Stewart',
    'Life is a journey. Enjoy the ride!',
  ].join('\n')
  return { subject: CONFIRMATION_SUBJECT, html, text }
}

export function reminderEmail(s: WorkshopSession, z: ZoomDetails | null): { subject: string; html: string; text: string } {
  const html = brandedEmail({
    preheader: `Today: ${esc(sessionLabel(s))}.`,
    bodyHtml: `
<p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${c.navy}">Your workshop is today.</p>
<p style="margin:0 0 22px">We start on time. Join a few minutes early, and have something to write with.</p>
${sessionBlock(s)}
${z ? zoomBlock(z) : ''}
${z ? emailButton(esc(z.url), 'Join on Zoom') : ''}`,
  })
  const text = [
    'Your workshop is today.',
    `${sessionLabel(s)}`,
    '',
    z ? `Join on Zoom: ${z.url}\nMeeting ID: ${z.meetingId}\nPasscode: ${z.passcode}` : '',
    '',
    'Crystal Glover Stewart',
  ].join('\n')
  return { subject: `Today: ${WORKSHOP.name}`, html, text }
}

export function replayEmail(s: WorkshopSession, replayUrl: string, surveyUrl: string): { subject: string; html: string; text: string } {
  const html = brandedEmail({
    preheader: 'Your workshop replay is ready, plus three quick questions.',
    bodyHtml: `
<p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${c.navy}">Thank you for making the turn with us.</p>
<p style="margin:0 0 22px">Here is the replay of your session (${esc(sessionLabel(s))}), so you can go back to any part of it.</p>
${emailButton(esc(replayUrl), 'Watch the replay')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.cream};border:1px solid ${c.rule};border-radius:12px;margin:8px 0 18px">
<tr><td width="60" style="padding:18px 0 18px 18px;vertical-align:top">${emailIcon('strengths')}</td>
<td style="padding:18px 18px 18px 14px">
<p style="margin:0 0 4px;font-weight:bold;color:${c.navy}">Three quick questions</p>
<p style="margin:0 0 10px;font-size:15px">How was the workshop, what helped most, and what would you like next? It takes about a minute.</p>
<a href="${esc(surveyUrl)}" style="color:${c.goldText};font-weight:bold">Answer the three questions →</a>
</td></tr></table>`,
  })
  const text = [
    'Thank you for making the turn with us.',
    '',
    `Your replay (${sessionLabel(s)}): ${replayUrl}`,
    '',
    `Three quick questions (about a minute): ${surveyUrl}`,
    '',
    'Crystal Glover Stewart',
  ].join('\n')
  return { subject: `Your replay: ${WORKSHOP.name}`, html, text }
}

/** A calendar file (iCalendar) for the session. Zoom link in the location when known. */
export function sessionIcs(s: WorkshopSession, z: ZoomDetails | null, uid: string): string {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const fold = (v: string) => v.replace(/[\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
  const desc = z
    ? `Join on Zoom: ${z.url}\nMeeting ID: ${z.meetingId}\nPasscode: ${z.passcode}`
    : 'Your Zoom link will be emailed before the workshop.'
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wiser Generations//LIAP Workshop//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@wisergenerations.com`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(s.startsAt)}`,
    `DTEND:${stamp(s.endsAt)}`,
    `SUMMARY:${fold(WORKSHOP.name)}`,
    `DESCRIPTION:${fold(desc)}`,
    `LOCATION:${fold(z ? z.url : 'Zoom')}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

/** Sends through Resend. Never throws; true only if Resend accepted it. */
export async function sendWorkshopEmail(input: {
  to: string | string[]
  subject: string
  html: string
  text: string
  attachments?: { filename: string; content: string }[]
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[liap/workshop-email] RESEND_API_KEY not set')
    return false
  }
  const from = process.env.MAGIC_LINK_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'info@wisergenerations.com'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `Crystal Glover Stewart <${from}>`,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.attachments ? { attachments: input.attachments } : {}),
      }),
    })
    if (!res.ok) console.error(`[liap/workshop-email] Resend rejected: HTTP ${res.status}`)
    return res.ok
  } catch (err) {
    console.error('[liap/workshop-email] send threw', err)
    return false
  }
}

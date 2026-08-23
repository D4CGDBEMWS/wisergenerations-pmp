import PDFDocument from 'pdfkit'
import type { RenderedReport } from './recommendations'

// ---------------------------------------------------------------------------
// The Life Project Snapshot — a durable copy of a report the customer owns.
//
// Owner ruling: "Yours to keep. Yours to use." was not true, because there was
// nothing to keep. A results page behind an unexpiring link is not a copy; it
// is a permission. This is the copy.
//
// ── IT INVENTS NOTHING ─────────────────────────────────────────────────────
//
// Every number, label, action and plan line is read from the report the
// deterministic engine already produced. No AI, no interpretation, no new
// scoring, no readiness category that does not already exist. Regenerating it
// twice from the same assessment produces the same document, because the
// report it renders is itself stored rather than recomputed.
//
// ── AND IT CARRIES NO NARRATIVE ────────────────────────────────────────────
//
// The PDF is the one artefact that leaves the system entirely — it lands in a
// downloads folder and survives every retention rule this application has. So
// it renders headlines, scores, plan lines and dates, and NOT the action
// bodies, because a body is where a quotation of the participant's own
// sentence appears while the narrative is still live.
//
// That is the whole reason `body` is absent below. A PDF quoting "I am leaving
// my husband" would outlive the 90-day promise by years, in a place no purge
// can reach. A test asserts the rendered text contains no narrative.
// ---------------------------------------------------------------------------

const NAVY = '#0A1628'
const GOLD = '#C9A84C'
const INK = '#374151'
const MUTED = '#6B7280'
const RED = '#B91C1C'

const PAGE = { size: 'LETTER' as const, margin: 54 }
const WIDTH = 612 - PAGE.margin * 2

export interface SnapshotInput {
  report: RenderedReport
  /** Completion date, ISO. Passed in so this stays clock-free and testable. */
  completedOn: string
}

/**
 * A filename a person can find again in six months.
 *
 * Carries the product and the date, and deliberately no token, no assessment
 * id and no customer id — a filename is visible in a downloads list, a backup,
 * a shared screen and a support ticket.
 */
export function snapshotFilename(completedOn: string): string {
  const date = /^\d{4}-\d{2}-\d{2}/.test(completedOn) ? completedOn.slice(0, 10) : 'undated'
  return `Life-Project-Snapshot-${date}.pdf`
}

export async function buildSnapshotPdf(input: SnapshotInput): Promise<Buffer> {
  const { report } = input
  const doc = new PDFDocument({
    size: PAGE.size,
    margin: PAGE.margin,
    info: {
      Title: 'Life Project Snapshot',
      Author: 'Wiser Generations',
      // No customer name, no email, no token, no id.
      Subject: 'Life Project-Ready™ Assessment',
    },
  })

  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  // ── Header ───────────────────────────────────────────────────────────────
  doc.rect(0, 0, 612, 96).fill(NAVY)
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(9)
    .text('WISER GENERATIONS', PAGE.margin, 30, { characterSpacing: 1.6 })
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20)
    .text('Life Project Snapshot', PAGE.margin, 46)
  doc.fillColor('#B9C4D2').font('Helvetica').fontSize(9)
    .text(`Life Project-Ready™ Assessment  ·  Completed ${input.completedOn}`, PAGE.margin, 72)

  doc.y = 124
  doc.fillColor(INK)

  // ── Position ─────────────────────────────────────────────────────────────
  label(doc, 'YOUR LIFE PROJECT POSITION')
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(18)
    .text(report.positionLabel, { width: WIDTH })
  doc.moveDown(0.3)
  doc.fillColor(INK).font('Helvetica').fontSize(10)
    .text(report.positionMeaning, { width: WIDTH, lineGap: 2 })
  doc.moveDown(0.4)
  doc.fillColor(MUTED).font('Helvetica').fontSize(9)
    .text(`Total ${report.total} of 200`, { width: WIDTH })

  // ── Hidden urgencies, if any ─────────────────────────────────────────────
  if (report.urgent.length > 0) {
    doc.moveDown(1)
    const top = doc.y
    doc.rect(PAGE.margin, top, WIDTH, 18 + report.urgent.length * 13).fill('#FEF2F2')
    doc.fillColor(RED).font('Helvetica-Bold').fontSize(10)
      .text('Needs attention first', PAGE.margin + 10, top + 6, { width: WIDTH - 20 })
    doc.font('Helvetica').fontSize(9)
    for (const u of report.urgent) {
      doc.fillColor(RED).text(`${u.name} — ${u.score} of 25`, PAGE.margin + 10, doc.y + 1, {
        width: WIDTH - 20,
      })
    }
    doc.y = top + 22 + report.urgent.length * 13
    doc.fillColor(INK)
  }

  // ── Eight dimensions ─────────────────────────────────────────────────────
  doc.moveDown(1)
  label(doc, 'YOUR EIGHT DIMENSIONS')
  doc.moveDown(0.2)
  for (const s of report.scores) {
    const y = doc.y
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10).text(s.name, PAGE.margin, y, { width: 210 })
    doc.fillColor(MUTED).font('Helvetica').fontSize(9)
      .text(`${s.score} / 25`, PAGE.margin + 216, y + 1, { width: 48 })
    doc.fillColor(MUTED).fontSize(9)
      .text(report.classificationLabels[s.classification], PAGE.margin + 272, y + 1, { width: 110 })
    // The bar repeats what the numbers say; it is never the only signal.
    const barX = PAGE.margin + 392
    const barW = WIDTH - 392
    doc.roundedRect(barX, y + 3, barW, 6, 3).fill('#E8EDF5')
    doc.roundedRect(barX, y + 3, Math.max(2, (barW * (s.score - 5)) / 20), 6, 3)
      .fill(s.score <= 10 ? RED : GOLD)
    doc.fillColor(INK)
    doc.y = y + 17
  }

  // ── Strengths ────────────────────────────────────────────────────────────
  if (report.strengths.length > 0) {
    doc.moveDown(0.8)
    label(doc, 'WHAT YOU HAVE TO WORK WITH')
    doc.fillColor(INK).font('Helvetica').fontSize(10)
      .text(report.strengths.map((s) => `${s.name} (${s.score}/25)`).join('   ·   '), {
        width: WIDTH,
      })
  }

  // ── Protect / Resolve / Move — headlines only ────────────────────────────
  doc.moveDown(1)
  label(doc, 'YOUR NEXT BEST THREE')
  doc.moveDown(0.2)
  for (const a of report.actions) {
    if (doc.y > 660) doc.addPage()
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(8)
      .text(a.kind.toUpperCase(), { width: WIDTH, characterSpacing: 1.2 })
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11)
      .text(a.headline, { width: WIDTH })
    doc.moveDown(0.5)
  }

  // ── 30 / 60 / 90 ─────────────────────────────────────────────────────────
  for (const phase of report.plan.phases) {
    if (doc.y > 600) doc.addPage()
    doc.moveDown(0.6)
    label(doc, `${phase.window.toUpperCase()}  ·  ${phase.title.toUpperCase()}`)
    doc.fillColor(INK).font('Helvetica').fontSize(10)
    for (const item of phase.items) {
      doc.text(`•  ${item}`, { width: WIDTH, lineGap: 1.5, indent: 0 })
      doc.moveDown(0.15)
    }
  }

  if (report.plan.reviewOn) {
    doc.moveDown(0.8)
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10)
      .text(`Next review: ${report.plan.reviewOn}`, { width: WIDTH })
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  doc.moveDown(1.2)
  doc.fillColor(MUTED).font('Helvetica').fontSize(8)
    .text(
      'This snapshot reflects the answers you gave on the date shown. It is yours to keep. ' +
        'Wiser Generations · Life Project-Ready™ Assessment',
      { width: WIDTH, lineGap: 1.5 }
    )

  doc.end()
  return done
}

function label(doc: PDFKit.PDFDocument, text: string): void {
  doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8)
    .text(text, PAGE.margin, doc.y, { width: WIDTH, characterSpacing: 1.2 })
  doc.moveDown(0.35)
}

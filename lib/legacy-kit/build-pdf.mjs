import PDFDocument from 'pdfkit'
import { readFileSync } from 'fs'
import { join } from 'path'
import { KIT_VERSION, KIT_EDITION } from './version.mjs'

// ---------------------------------------------------------------------------
// The Wiser Generations International Legacy Kit™ — the fillable PDF.
//
// Built from content/wgi-legacy-kit.md, the same file the website reads its
// section list and Important notices from, so the page and the PDF cannot
// disagree. Edit the markdown, then run `npm run kit:pdf`.
//
// What the launch plan asks of the PDF, and where it is done here:
//   - a fillable field for every blank ..... blanks (\_\_\_), empty table
//                                             cells and "$" cells become text
//                                             fields; ☐ becomes a checkbox
//   - print-friendly ...................... every field also has a printed
//                                             line or cell border, so an empty
//                                             kit prints as a paper workbook
//   - notices on the first two pages ....... cover (page 1) points to them;
//                                             the notices are page 2
//   - ™ and version/date on the cover ...... KIT_VERSION, KIT_EDITION
//   - accessible ............................ real text, document language and
//                                             title, a bookmark per section, a
//                                             tooltip label on every field
//
// Text and fields are both 12pt (owner's brief: typed answers as readable as
// the printed words). Field font size is fixed, never auto-size.
//
// Fields use Helvetica, a standard PDF font every viewer already has, so a
// viewer never has to draw typed text with a font subset that lacks the glyph.
//
// ── ONE PDFKIT QUIRK ───────────────────────────────────────────────────────
//
// pdfkit writes a field's own font size only when the field's font differs
// from the form's default font; otherwise the field inherits "auto size". The
// form is therefore initialised with Helvetica-Bold and every field is made
// in Helvetica, so each field carries an explicit 12pt. A test checks this.
//
// ── PER-BUYER STAMP ────────────────────────────────────────────────────────
//
// `stamp` adds "Licensed to …" to every footer. The launch plan asks for the
// buyer's name and email on each copy; delivery passes them in when the file
// is generated for a purchase. The build script leaves it empty.
// ---------------------------------------------------------------------------

export { KIT_VERSION, KIT_EDITION } from './version.mjs'
export const KIT_NAME_TM = 'Wiser Generations International Legacy Kit™'
/** The doc's closing line, now printed on every page. ™ added, as on the cover. */
export const KIT_FOOTER =
  'Wiser Generations International Legacy Kit™ © 2026. Licensed for one household. Educational use only; see Important notices.'

const SOURCE = join(process.cwd(), 'content', 'wgi-legacy-kit.md')
const LOGO = join(process.cwd(), 'public', 'wg-wordmark-light.png')

// Page geometry, in points (72 per inch). US Letter, 0.75in sides.
const PAGE_W = 612
const PAGE_H = 792
const LEFT = 54
const RIGHT = PAGE_W - 54
const WIDTH = RIGHT - LEFT
const TOP = 60
const BOTTOM = PAGE_H - 78 // content stops here; the footer sits below

const SIZE = 12
const LINE = 17 // leading for 12pt text
const PAD = 5 // table cell padding

// The Legacy section's colours, matching the website.
const EVERGREEN = '#1F3B2C'
const GOLD = '#C9A84C'
const INK = '#1A1A1A'
const MUTED = '#5A5A5A'
const RULE = '#9C9483'
const CREAM = '#FAF6EE'

const REGULAR = 'Helvetica'
const BOLD = 'Helvetica-Bold'

// ---------------------------------------------------------------------------
// Markdown → blocks. The kit uses a small, fixed subset of markdown; anything
// else is a build error rather than something silently dropped.
// ---------------------------------------------------------------------------

/** Strip markdown escapes the doc export adds (\_ and the like). */
function unescape(text) {
  return text.replace(/\\([\\`*_{}[\]()#+\-.!|])/g, '$1')
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export function parseKit(markdown) {
  const lines = markdown.replace(/<!--[\s\S]*?-->/g, '').split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    let m
    if ((m = /^(#{1,3}) (.*)$/.exec(line))) {
      blocks.push({ type: `h${m[1].length}`, text: unescape(m[2].trim()) })
      i++
    } else if (line.startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i]
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim())
        if (!cells.every((c) => /^:?-{3,}:?$/.test(c))) rows.push(cells)
        i++
      }
      blocks.push({ type: 'table', header: rows[0], rows: rows.slice(1) })
    } else if ((m = /^- (.*)$/.exec(line))) {
      blocks.push({ type: 'bullet', text: m[1] })
      i++
    } else if ((m = /^(\d+)\. (.*)$/.exec(line))) {
      blocks.push({ type: 'number', n: m[1], text: m[2] })
      i++
    } else {
      blocks.push({ type: 'para', text: line })
      i++
    }
  }
  return blocks
}

/**
 * Inline markdown → tokens: words (bold or not) and blanks.
 * A blank is three or more underscores once escapes are removed.
 */
function tokenize(raw) {
  const text = unescape(raw)
  const tokens = []
  const parts = text.split(/(\*\*.+?\*\*|_{3,})/)
  for (const part of parts) {
    if (!part) continue
    if (/^_{3,}$/.test(part)) {
      tokens.push({ kind: 'blank', len: part.length, spaceBefore: /\s$/.test(tokens.at(-1)?.trail ?? ' ') })
      continue
    }
    const bold = part.startsWith('**') && part.endsWith('**')
    const body = bold ? part.slice(2, -2) : part
    const leading = /^\s/.test(body)
    const words = body.split(/\s+/).filter(Boolean)
    // A space before a style change ("simple: **save**") belongs to the
    // word after it, so look at how the previous token ended too.
    const prevTrail = /\s$/.test(tokens.at(-1)?.trail ?? '')
    words.forEach((word, idx) => {
      tokens.push({ kind: 'word', text: word, bold, spaceBefore: idx > 0 || leading || prevTrail, trail: '' })
    })
    if (tokens.length && /\s$/.test(body)) tokens.at(-1).trail = ' '
  }
  return tokens
}

// ---------------------------------------------------------------------------
// The renderer.
// ---------------------------------------------------------------------------

export function buildKitPdf({ stamp = '' } = {}) {
  const markdown = readFileSync(SOURCE, 'utf8')
  const blocks = parseKit(markdown)

  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: TOP, bottom: 0, left: LEFT, right: PAGE_W - RIGHT },
    bufferPages: true,
    autoFirstPage: true,
    pdfVersion: '1.7',
    lang: 'en-US',
    displayTitle: true,
    info: {
      Title: `${KIT_NAME_TM} (Fill-in Edition)`,
      Author: 'Wiser Generations International',
      Subject: `Family legacy planning workbook. Version ${KIT_VERSION}, ${KIT_EDITION}. Educational use only.`,
      Keywords: 'family legacy, planning workbook, fillable',
      // Fixed so rebuilding unchanged text gives an unchanged file.
      CreationDate: new Date('2026-10-04T12:00:00Z'),
      ModDate: new Date('2026-10-04T12:00:00Z'),
    },
  })

  // See ONE PDFKIT QUIRK above.
  doc.font(BOLD)
  doc.initForm()
  doc.font(REGULAR).fontSize(SIZE)

  const state = {
    y: TOP,
    section: 'cover',
    counters: {},
    lastWords: [],
  }

  const sections = [] // { title, slug, page }
  let outlineParent = null

  // ── field helpers ────────────────────────────────────────────────────────

  function fieldName(kind) {
    // PDF partial field names may not contain periods.
    const key = state.section.replace(/[^a-z0-9]+/g, '_')
    state.counters[key] = (state.counters[key] ?? 0) + 1
    return `${key}_${kind}${String(state.counters[key]).padStart(2, '0')}`
  }

  function textField(x, y, w, h, label) {
    doc.font(REGULAR)
    doc.formText(fieldName('t'), x, y, w, h, {
      fontSize: SIZE,
      TU: new String(label || 'Fill in'),
    })
  }

  // Checkbox appearances are written out, not left to the viewer, so the tick
  // shows the same in Acrobat, Chrome, Preview and when printed.
  const BOX = 14
  const tickOn = doc.ref({ Type: 'XObject', Subtype: 'Form', BBox: [0, 0, BOX, BOX], Resources: {} })
  tickOn.end('q 0.122 0.231 0.173 RG 1.8 w 1 J 1 j 3 7.4 m 5.8 4.2 l 11.2 10.6 l S Q')
  const tickOff = doc.ref({ Type: 'XObject', Subtype: 'Form', BBox: [0, 0, BOX, BOX], Resources: {} })
  tickOff.end('% empty')

  function checkbox(x, y, label) {
    doc.save().lineWidth(1).strokeColor(EVERGREEN).rect(x, y, BOX, BOX).stroke().restore()
    doc.font(REGULAR)
    doc.formCheckbox(fieldName('c'), x, y, BOX, BOX, {
      TU: new String(label || 'Done'),
      AP: { N: { Yes: tickOn, Off: tickOff } },
      AS: 'Off',
      V: 'Off',
      MK: { CA: new String('4') },
    })
  }

  // ── page helpers ─────────────────────────────────────────────────────────

  function newPage() {
    doc.addPage()
    state.y = TOP
  }

  function ensure(height) {
    if (state.y + height > BOTTOM) newPage()
  }

  function drawText(str, x, y, { bold = false, size = SIZE, color = INK } = {}) {
    doc.font(bold ? BOLD : REGULAR).fontSize(size).fillColor(color)
    doc.text(str, x, y, { lineBreak: false })
  }

  function width(str, bold = false, size = SIZE) {
    return doc.font(bold ? BOLD : REGULAR).fontSize(size).widthOfString(str)
  }

  /**
   * Lay out inline tokens in a box. With draw=false it only measures.
   * `pageBreaks` lets free-flowing text continue onto the next page; text
   * inside a table cell never breaks (the row is moved whole instead).
   *
   * Returns { height, endY }: height is for measuring a single-page box,
   * endY is where the next block starts (on whatever page flow ended on).
   */
  function flow(tokens, x0, w, y0, { draw = true, pageBreaks = false, label = '' } = {}) {
    const space = width(' ')
    let x = x0
    let y = y0
    let lineHasContent = false
    let run = null // { x, str, bold } — consecutive words in one style
    const recent = label ? label.split(' ') : []

    const flush = () => {
      if (run && draw) drawText(run.str, run.x, y, { bold: run.bold })
      run = null
    }
    const newline = () => {
      flush()
      y += LINE
      x = x0
      lineHasContent = false
      if (pageBreaks && draw && y + LINE > BOTTOM) {
        newPage()
        y = state.y
      }
    }

    tokens.forEach((tok, idx) => {
      const isLast = idx === tokens.length - 1
      if (tok.kind === 'word') {
        const ww = width(tok.text, tok.bold)
        const gap = lineHasContent && tok.spaceBefore ? space : 0
        if (lineHasContent && x + gap + ww > x0 + w) newline()
        const g = lineHasContent && tok.spaceBefore ? space : 0
        if (run && run.bold === tok.bold && g > 0) {
          run.str += ' ' + tok.text
        } else if (run && run.bold === tok.bold && g === 0) {
          run.str += tok.text
        } else {
          flush()
          run = { x: x + g, str: tok.text, bold: tok.bold }
        }
        x += g + ww
        lineHasContent = true
        recent.push(tok.text)
        if (recent.length > 6) recent.shift()
      } else {
        flush()
        const gap = lineHasContent && tok.spaceBefore ? space : 0
        const want = Math.min(w, Math.max(54, tok.len * 5.2))
        let remaining = x0 + w - x - gap
        if (lineHasContent && remaining < Math.min(want, 90)) {
          newline()
          remaining = w
        }
        const startX = x + (lineHasContent ? gap : 0)
        // A blank that ends its line of text (or is followed only by a full
        // stop) runs to the right edge, leaving room for that stop.
        const nextTok = tokens[idx + 1]
        const tailPunct =
          nextTok && idx + 2 === tokens.length && nextTok.kind === 'word' && !nextTok.spaceBefore && /^[.,;:!?]+$/.test(nextTok.text)
            ? width(nextTok.text) + 1
            : 0
        const fw = isLast || tailPunct ? x0 + w - startX - tailPunct : Math.min(want, x0 + w - startX)
        if (draw) {
          doc
            .save()
            .lineWidth(0.75)
            .strokeColor(RULE)
            .moveTo(startX, y + LINE - 2)
            .lineTo(startX + fw, y + LINE - 2)
            .stroke()
            .restore()
          const name = recent.join(' ').replace(/[:*]+$/, '').trim()
          textField(startX, y - 1, fw, LINE + 1, name)
        }
        x = startX + fw
        lineHasContent = true
      }
    })
    flush()
    return { height: y + LINE - y0, endY: y + LINE }
  }

  // ── blocks ───────────────────────────────────────────────────────────────

  function heading2(text) {
    newPage()
    const slug = slugify(text)
    state.section = slug.split('-').slice(0, 2).join('-')
    const page = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1
    sections.push({ title: text, slug, page, subs: [] })
    doc.addNamedDestination(slug, 'Fit')
    outlineParent = doc.outline.addItem(text)

    doc.rect(LEFT, state.y, 42, 3).fill(GOLD)
    state.y += 12
    doc.font(BOLD).fontSize(20).fillColor(EVERGREEN)
    doc.text(text, LEFT, state.y, { width: WIDTH })
    state.y = doc.y + 10
  }

  function heading3(text) {
    ensure(LINE * 5)
    state.y += 6
    doc.font(BOLD).fontSize(14).fillColor(EVERGREEN)
    doc.text(text, LEFT, state.y, { width: WIDTH })
    state.y = doc.y + 6
    if (outlineParent) outlineParent.addItem(text)
    sections.at(-1)?.subs.push(text)
  }

  /** Height a table will take, for keeping short tables on one page. */
  function tableHeight(header, rows) {
    return table(header, rows, { measureOnly: true })
  }

  function table(header, rows, { measureOnly = false } = {}) {
    const cols = header.length
    // Column widths from content: a ticked-box column is narrow; the rest
    // share the width by how much text they carry, never below their longest
    // word.
    const isBoxCol = header.map((_, c) => rows.length > 0 && rows.every((r) => (r[c] ?? '') === '☐'))
    const weights = header.map((h, c) => {
      if (isBoxCol[c]) return 0
      const cells = [h, ...rows.map((r) => unescape(r[c] ?? '').replace(/\*\*/g, ''))]
      const longest = Math.max(...cells.map((t) => width(t)))
      return Math.max(70, Math.min(longest, 230))
    })
    const minWord = header.map((h, c) => {
      const words = [h, ...rows.map((r) => unescape(r[c] ?? ''))].join(' ').replace(/\*\*/g, '').split(/\s+/)
      return Math.max(...words.map((wd) => width(wd, true))) + PAD * 2
    })
    const boxW = header.map((h, c) => (isBoxCol[c] ? Math.max(48, Math.min(width(h, true) + PAD * 2, 90)) : 0))
    const fixed = boxW.reduce((a, b) => a + b, 0)
    const total = weights.reduce((a, b) => a + b, 0)
    let widths = header.map((_, c) => (isBoxCol[c] ? boxW[c] : ((WIDTH - fixed) * weights[c]) / total))
    // Never narrower than the longest single word.
    for (let pass = 0; pass < 3; pass++) {
      const short = widths.map((w, c) => (!isBoxCol[c] && w < minWord[c] ? minWord[c] - w : 0))
      const need = short.reduce((a, b) => a + b, 0)
      if (!need) break
      const donors = widths.map((w, c) => (!isBoxCol[c] && !short[c] ? w - minWord[c] : 0))
      const spare = donors.reduce((a, b) => a + b, 0)
      widths = widths.map((w, c) => (short[c] ? minWord[c] : donors[c] ? w - (need * donors[c]) / spare : w))
    }

    const cellKind = (raw) => {
      const t = unescape(raw)
      if (t === '☐') return 'box'
      if (t === '') return 'field'
      if (t === '$') return 'money'
      return 'text'
    }

    const measure = (row, bold) =>
      Math.max(
        ...row.map((raw, c) => {
          const kind = cellKind(raw)
          if (kind !== 'text') return LINE + 9
          const tokens = tokenize(bold ? `**${raw.replace(/\*\*/g, '')}**` : raw)
          return flow(tokens, 0, widths[c] - PAD * 2, 0, { draw: false }).height + PAD * 2 - 2
        })
      )

    const drawHeader = () => {
      const h = measure(header, true)
      doc.rect(LEFT, state.y, WIDTH, h).fill(EVERGREEN)
      let x = LEFT
      header.forEach((cell, c) => {
        doc.font(BOLD).fontSize(SIZE).fillColor('#FFFFFF')
        doc.text(unescape(cell), x + PAD, state.y + PAD, { width: widths[c] - PAD * 2 })
        x += widths[c]
      })
      state.y += h
    }

    if (measureOnly) {
      return measure(header, true) + rows.reduce((sum, row) => sum + Math.max(measure(row, false), 26), 0) + 12
    }

    // A table that fits on one page is never split; a longer one starts with
    // at least its header and first row together.
    const whole = tableHeight(header, rows)
    if (whole <= BOTTOM - TOP) ensure(whole)
    else ensure(measure(header, true) + measure(rows[0] ?? header, false))
    drawHeader()

    rows.forEach((row, r) => {
      const rowH = Math.max(measure(row, false), 26)
      if (state.y + rowH > BOTTOM) {
        newPage()
        drawHeader()
      }
      const label0 = unescape(row[0] ?? '').replace(/\*\*/g, '')
      if (r % 2 === 1) doc.rect(LEFT, state.y, WIDTH, rowH).fill(CREAM)
      let x = LEFT
      row.forEach((raw, c) => {
        const kind = cellKind(raw)
        const w = widths[c]
        const label = [label0, unescape(header[c])].filter(Boolean).join(' — ')
        if (kind === 'box') {
          checkbox(x + (w - BOX) / 2, state.y + (rowH - BOX) / 2, label)
        } else if (kind === 'field') {
          textField(x + 2, state.y + 3, w - 4, rowH - 6, label)
        } else if (kind === 'money') {
          drawText('$', x + PAD, state.y + (rowH - LINE) / 2 + 1)
          const dx = width('$') + PAD + 2
          textField(x + dx, state.y + 3, w - dx - 2, rowH - 6, label)
        } else {
          flow(tokenize(raw), x + PAD, w - PAD * 2, state.y + PAD - 1, { label: label0 })
        }
        x += w
      })
      // Grid.
      doc.save().lineWidth(0.6).strokeColor(RULE)
      doc.rect(LEFT, state.y, WIDTH, rowH).stroke()
      let gx = LEFT
      widths.slice(0, -1).forEach((w) => {
        gx += w
        doc.moveTo(gx, state.y).lineTo(gx, state.y + rowH).stroke()
      })
      doc.restore()
      state.y += rowH
    })
    state.y += 12
  }

  // ── cover ────────────────────────────────────────────────────────────────

  function cover(firstLine) {
    doc.rect(0, 0, PAGE_W, 430).fill(EVERGREEN)
    doc.image(LOGO, LEFT, 56, { width: 170 })
    doc.rect(LEFT, 250, 56, 4).fill(GOLD)
    doc.font(BOLD).fontSize(30).fillColor('#FFFFFF')
    doc.text(KIT_NAME_TM, LEFT, 266, { width: WIDTH - 40, lineGap: 2 })
    doc.font(REGULAR).fontSize(16).fillColor(GOLD)
    doc.text('Fill-in Edition', LEFT, doc.y + 8)
    doc.font(REGULAR).fontSize(12).fillColor('#FFFFFF')
    doc.text(`Version ${KIT_VERSION} · ${KIT_EDITION}`, LEFT, doc.y + 6)

    // The doc's own first line (family name, start date) belongs on the cover.
    state.section = 'cover'
    state.y = 470
    doc.font(BOLD).fontSize(14).fillColor(EVERGREEN).text('This kit belongs to', LEFT, state.y)
    state.y = doc.y + 10
    flowAt(firstLine)

    state.y += 30
    doc.rect(LEFT, state.y, WIDTH, 82).fill(CREAM)
    doc.rect(LEFT, state.y, 4, 82).fill(GOLD)
    doc.font(BOLD).fontSize(SIZE).fillColor(EVERGREEN)
    doc.text('Educational use only — not legal, tax or financial advice.', LEFT + 16, state.y + 14, { width: WIDTH - 32 })
    doc.font(REGULAR).fontSize(SIZE).fillColor(INK)
    doc.text('Read the Important notices on the next page, and sign them, before you begin.', LEFT + 16, doc.y + 4, {
      width: WIDTH - 32,
    })
  }

  function flowAt(text) {
    state.y = flow(tokenize(text), LEFT, WIDTH, state.y, { pageBreaks: true }).endY
  }

  // Paragraphs and list items go through flowAt so a page break inside them
  // keeps state.y correct.
  function textBlock(text, indent = 0, marker = null) {
    ensure(LINE * 2)
    if (marker) {
      drawText(marker.text, LEFT + indent - marker.offset, state.y, { bold: true, color: EVERGREEN })
    }
    state.y = flow(tokenize(text), LEFT + indent, WIDTH - indent, state.y, { pageBreaks: true }).endY + 7
  }

  // ── render ───────────────────────────────────────────────────────────────

  let contentsPage = null
  let i = 0
  // Cover: the H1 and the line after it.
  if (blocks[0]?.type === 'h1' && blocks[1]?.type === 'para') {
    cover(blocks[1].text)
    i = 2
  }

  // A heading or a bold lead-in line stays with the table after it.
  const leadIn = (b) => b.type === 'h3' || (b.type === 'para' && /^\*\*[^*]+\*\*$/.test(b.text.trim()))
  for (; i < blocks.length; i++) {
    const b = blocks[i]
    const next = blocks[i + 1]
    if (leadIn(b) && next?.type === 'table') {
      const h = (b.type === 'h3' ? 40 : LINE + 7) + tableHeight(next.header, next.rows)
      if (h <= BOTTOM - TOP) ensure(h)
    }
    if (b.type === 'h2') {
      // The contents page goes straight after the Important notices, so the
      // notices stay on page 2.
      if (sections.length === 1 && contentsPage === null) {
        newPage()
        contentsPage = doc.bufferedPageRange().count - 1
      }
      heading2(b.text)
    } else if (b.type === 'h3') heading3(b.text)
    else if (b.type === 'table') table(b.header, b.rows)
    else if (b.type === 'bullet') textBlock(b.text, 16, { text: '•', offset: 14 })
    else if (b.type === 'number') textBlock(b.text, 22, { text: `${b.n}.`, offset: 22 })
    else if (b.type === 'para') textBlock(b.text)
    else throw new Error(`Unsupported block: ${b.type}`)
  }

  // ── contents ─────────────────────────────────────────────────────────────

  if (contentsPage !== null) {
    doc.switchToPage(contentsPage)
    let y = TOP
    doc.rect(LEFT, y, 42, 3).fill(GOLD)
    y += 12
    doc.font(BOLD).fontSize(20).fillColor(EVERGREEN).text('Contents', LEFT, y)
    y = doc.y + 18
    for (const s of sections) {
      const pageLabel = String(s.page + 1)
      doc.font(BOLD).fontSize(SIZE).fillColor(EVERGREEN)
      doc.text(s.title, LEFT, y, { width: WIDTH - 50, goTo: s.slug, lineBreak: false })
      doc.font(REGULAR).fillColor(INK)
      doc.text(pageLabel, RIGHT - 40, y, { width: 40, align: 'right', goTo: s.slug, lineBreak: false })
      doc.save().lineWidth(0.5).strokeColor('#D8D1C1').moveTo(LEFT, y + LINE + 3).lineTo(RIGHT, y + LINE + 3).stroke().restore()
      y += LINE + 10
      for (const sub of s.subs) {
        doc.font(REGULAR).fontSize(SIZE).fillColor(MUTED).text(sub, LEFT + 18, y, { lineBreak: false })
        y += LINE
      }
      if (s.subs.length) y += 4
    }
    y += 16
    doc.font(REGULAR).fontSize(SIZE).fillColor(MUTED)
    doc.text(
      'Type into the PDF and save it, or print it and write by hand. Use pencil; plans change. Review the whole kit together each October.',
      LEFT,
      y,
      { width: WIDTH }
    )
  }

  // ── footer on every page ─────────────────────────────────────────────────

  const range = doc.bufferedPageRange()
  for (let p = range.start; p < range.start + range.count; p++) {
    doc.switchToPage(p)
    const y = PAGE_H - 60
    doc.save().lineWidth(0.5).strokeColor('#D8D1C1').moveTo(LEFT, y - 8).lineTo(RIGHT, y - 8).stroke().restore()
    doc.font(REGULAR).fontSize(9).fillColor(MUTED)
    doc.text(KIT_FOOTER, LEFT, y, { width: WIDTH - 70, lineGap: 1 })
    doc.text(`Page ${p + 1} of ${range.count}`, RIGHT - 70, y, { width: 70, align: 'right', lineBreak: false })
    if (stamp) {
      doc.font(BOLD).fontSize(9).fillColor(MUTED)
      doc.text(`Licensed to: ${stamp}`, LEFT, PAGE_H - 32, { width: WIDTH, lineBreak: false })
    }
  }

  doc.flushPages()

  return new Promise((resolve, reject) => {
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}

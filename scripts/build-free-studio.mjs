#!/usr/bin/env node
/**
 * Generates the free-sample studio from the full one.
 *
 * The full studio is a single self-contained HTML file carrying the entire
 * paid product inline: 694 practice questions plus 4 advanced-format items, a
 * 200-question mock exam, 40 ITTO process cards and a 30-term glossary. It
 * used to be served from /public, which meant every one of those was readable
 * by anyone via View Source, and appending ?full=1 to its URL unlocked the
 * practice flow outright — the gate reads location.search in the visitor's own
 * browser.
 *
 * Moving the full file behind an entitlement check fixes the direct download.
 * It does not fix the free page, which still has to serve SOMETHING. So the
 * free page gets its own build: same code, same styling, same email gate — but
 * containing only a dozen questions and none of the other three products. What
 * is not in the file cannot be extracted from it.
 *
 * Deliberately a generator rather than a hand-maintained second copy. A copy
 * would drift: a fix to the studio's rendering would land in one file and not
 * the other, and the divergence would be invisible until a learner hit it.
 *
 *   node scripts/build-free-studio.mjs
 *
 * Runs automatically before `npm run build`. The output is committed too, so a
 * fresh checkout can `next dev` without a build step first.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = join(ROOT, 'content', 'studio', 'pmp-practice-studio.html')
const OUTPUT = join(ROOT, 'public', 'studio', 'pmp-practice-free.html')

/**
 * How many questions the free sample carries.
 *
 * The studio gates after FREE_LIMIT (3) answers and then asks for an email.
 * Its own startSession() aims for at least FREE_LIMIT + 9 so that unlocking
 * reveals real content rather than an immediate dead end, so 12 is the number
 * that keeps that promise honest while giving away as little as possible.
 */
const FREE_QUESTIONS = 12

/**
 * Finds a balanced JS literal following a marker and returns its bounds.
 *
 * String-aware, because the questions contain braces and brackets inside their
 * text. A naive brace count would terminate early on the first question that
 * mentions a "}" and silently truncate the file.
 */
function findLiteral(source, marker, open, close) {
  const markerAt = source.indexOf(marker)
  if (markerAt === -1) throw new Error(`could not find ${marker.trim()} in the studio`)

  let start = markerAt + marker.length
  while (source[start] !== open) start++

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < source.length; i++) {
    const char = source[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === open) depth++
    else if (char === close && --depth === 0) return { start, end: i + 1 }
  }
  throw new Error(`unbalanced literal after ${marker.trim()}`)
}

function replaceLiteral(source, marker, open, close, value) {
  const { start, end } = findLiteral(source, marker, open, close)
  return source.slice(0, start) + JSON.stringify(value) + source.slice(end)
}

function readLiteralText(source, marker, open, close) {
  const { start, end } = findLiteral(source, marker, open, close)
  return source.slice(start, end)
}

/**
 * DATA and MOCK are emitted as JSON. NEWFORMATS is hand-written JavaScript
 * with unquoted keys, so it is only ever handled as text — this parses the
 * two that can be parsed and nothing else.
 */
function readLiteral(source, marker, open, close) {
  return JSON.parse(readLiteralText(source, marker, open, close))
}

/**
 * Picks the sample: one question per topic, in file order, until full.
 *
 * Spreading across topics rather than taking the first twelve means the sample
 * shows the breadth of the bank instead of twelve variations on whatever
 * happens to sort first. Deterministic on purpose — a random pick would make
 * every build produce a different file and turn the committed artifact into
 * permanent diff noise.
 */
function pickSample(questions, count) {
  const chosen = []
  const seenTopics = new Set()

  for (const question of questions) {
    if (chosen.length >= count) break
    const topic = question.topic ?? ''
    if (seenTopics.has(topic)) continue
    seenTopics.add(topic)
    chosen.push(question)
  }
  // Only if there were fewer distinct topics than requested questions.
  for (const question of questions) {
    if (chosen.length >= count) break
    if (!chosen.includes(question)) chosen.push(question)
  }
  return chosen
}

const full = readFileSync(SOURCE, 'utf8')
const data = readLiteral(full, 'const DATA =', '{', '}')
const mock = readLiteral(full, 'const MOCK =', '[', ']')
const newFormatsText = readLiteralText(full, 'const NEWFORMATS =', '[', ']')

// NEWFORMATS holds the case-set and matching items. They belong to the mock
// exam only and are deliberately not part of the practice count, so the studio
// and the marketing pages both read 694. Not JSON, so it is counted by its
// topic labels and otherwise treated as opaque text.
const newFormatTopics = [...newFormatsText.matchAll(/topic\s*:\s*"([^"]+)"/g)].map((m) => m[1])

const sample = pickSample(data.questions, FREE_QUESTIONS)

let free = full

// topicColor and bankLabel are presentation config, not content, and the
// renderer reads them for every question — they stay whole.
free = replaceLiteral(free, 'const DATA =', '{', '}', {
  ...data,
  questions: sample,
  processes: [],   // ITTO flashcards — a paid product in their own right
  glossary: [],
})
free = replaceLiteral(free, 'const NEWFORMATS =', '[', ']', [])
free = replaceLiteral(free, 'const MOCK =', '[', ']', [])

// With those three emptied, their tabs would render as empty panels. Hiding
// them is honest: the free sample is the practice flow and nothing else.
// Done as an appended stylesheet rather than by editing the markup, so this
// generator stays independent of how the tab bar happens to be built.
const HIDE_PAID_TABS = `
<style id="free-sample-scope">
  /* Generated by scripts/build-free-studio.mjs — the free sample carries no
     mock exam, ITTO cards or glossary, so their tabs would be empty. */
  .tab[data-tab="mock"],
  .tab[data-tab="cards"],
  .tab[data-tab="gloss"],
  #p-mock, #p-cards, #p-gloss { display: none !important; }
</style>
`
if (!free.includes('</head>')) throw new Error('no </head> to append the free-sample stylesheet to')
free = free.replace('</head>', `${HIDE_PAID_TABS}</head>`)

// The end-of-sample call to action pointed at /programs — the mentor-led
// cohorts — rather than at the product the visitor has just been sampling.
const CTA_FROM = 'PROGRAMS_URL = "/programs"'
const CTA_TO = 'PROGRAMS_URL = "/access"'
if (!free.includes(CTA_FROM)) throw new Error('conversion target not found; check PROGRAMS_URL')
free = free.replace(CTA_FROM, CTA_TO)

// The whole point of this file is that the paid content is not in it.
for (const [label, count] of [
  ['mock exam', mock.length],
  ['advanced formats', newFormatTopics.length],
  ['ITTO processes', data.processes?.length ?? 0],
  ['glossary terms', data.glossary?.length ?? 0],
]) {
  if (count === 0) console.warn(`  note: the source studio has no ${label} to strip`)
}
for (const [label, needle] of [
  ['a mock-exam question', mock[0]?.q],
  ['an ITTO process', data.processes?.[0]?.name ?? data.processes?.[0]?.process],
  ['a glossary term', data.glossary?.[0]?.term],
  ['an advanced-format item', newFormatTopics[0]],
]) {
  if (needle && free.includes(needle)) {
    throw new Error(`refusing to write the free sample: ${label} survived the strip`)
  }
}
const leaked = data.questions.filter((q) => !sample.includes(q) && q.q && free.includes(q.q))
if (leaked.length) {
  throw new Error(`refusing to write the free sample: ${leaked.length} withheld question(s) still present`)
}

mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, free)

const pct = ((free.length / full.length) * 100).toFixed(0)
console.log(
  `  free studio: ${sample.length} of ${data.questions.length} questions, ` +
    `no mock exam, no ITTO cards, no glossary`
)
console.log(
  `  ${(full.length / 1024).toFixed(0)} KB -> ${(free.length / 1024).toFixed(0)} KB (${pct}%)  ${OUTPUT.replace(ROOT + '/', '')}`
)

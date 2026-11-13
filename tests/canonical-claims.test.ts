import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

// ---------------------------------------------------------------------------
// Owner ruling: "500+ Professionals Trained" is the canonical public claim.
// 694 was on the homepage stats bar and in the AI Guide's approved-facts file
// while the hero, /about and /guarantee all said 500+ — two different numbers
// for the same claim, one screen apart.
//
// The ruling is deliberately conservative: a durable, readily supportable
// figure over unnecessary precision. So this file guards in two directions.
// It must catch 694 coming back, and it must also catch 500+ drifting into a
// materially different claim -- 500+ PMP graduates, 500+ certified, 500+
// first-attempt passes. Those would each be a new assertion about outcomes
// rather than a count of people taught.
//
// 694 is NOT banned outright. It is the true size of the practice question
// bank and appears legitimately on /access, /faq, /resources, the process
// graphic and the studio. The rule is about which noun it modifies.
// ---------------------------------------------------------------------------

const ROOT = process.cwd()
const SEARCH_DIRS = ['app', 'components', 'lib', 'content']
const EXTENSIONS = ['.tsx', '.ts', '.md', '.json']

function sourceFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (EXTENSIONS.some((e) => entry.endsWith(e))) out.push(full)
    }
  }
  for (const dir of SEARCH_DIRS) walk(join(ROOT, dir))
  return out
}

/** Contents with comments stripped, so prose cannot answer for code. */
function code(path: string): string {
  const raw = readFileSync(path, 'utf8')
  return path.endsWith('.md')
    ? raw
    : raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

describe('500+ is the canonical professionals-trained claim', () => {
  const files = sourceFiles()

  it('finds a source tree to search at all', () => {
    expect(files.length).toBeGreaterThan(100)
  })

  it('every surface that makes the claim still makes it', () => {
    // Anchored on the pages a visitor sees rather than on a constant. The
    // homepage STATS array used to hold this figure and no longer renders
    // anywhere, which is exactly the shape of the bug that let a wrong
    // publication month sit unnoticed in a constant for months.
    for (const page of ['app/page.tsx', 'app/about/page.tsx', 'app/guarantee/page.tsx']) {
      const src = code(join(ROOT, page))
      expect(src, `${page} lost the professionals-trained claim`).toMatch(/500\+/)
      expect(src, `${page} lost the professionals-trained label`).toMatch(/professionals trained/i)
    }
  })

  it('no file claims 694 professionals', () => {
    // Deliberately narrow: 694 near the words that make it a headcount.
    const offenders = files.filter((f) =>
      /694[^.\n]{0,40}(professionals|people|students)\s*(trained|taught)/i.test(code(f)) ||
      /(professionals|people|students)\s*(trained|taught)[^.\n]{0,40}694/i.test(code(f)),
    )
    expect(offenders.map((f) => relative(ROOT, f))).toEqual([])
  })

  it('every professionals-trained figure on a public surface is 500+', () => {
    // Catches any third number arriving later, not just 694.
    const offenders: string[] = []
    for (const f of files) {
      for (const m of code(f).matchAll(/([\d,]{2,7}\+?)\s*(?:\*\*)?\s*(?:\w+\s){0,2}professionals\s*trained/gi)) {
        if (m[1] !== '500+') offenders.push(`${relative(ROOT, f)}: "${m[0].trim()}"`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('694 remains available for the practice question bank', () => {
    // The negative control for the rule above: banning the digits outright
    // would quietly delete a true claim that four public pages depend on.
    const bank = files.filter((f) => /694[- ]?question|694 practice questions/i.test(code(f)))
    expect(bank.length).toBeGreaterThan(0)
  })

  it('500+ is never restated as a materially different claim', () => {
    // Trained is not certified, and certified is not passed first time. The
    // first version of this assertion looked for the number and the wrong noun
    // in one sentence, and missed the real shape of the risk: on every page
    // the figure and its label are separate elements, so "500+" and "PMP
    // certified" can drift apart in the source and still render as one claim.
    //
    // So the rule is positional instead. Every literal 500+ in the shipped
    // tree must be followed, within the markup that renders beside it, by the
    // words professionals trained. Nothing else is allowed to sit next to that
    // number.
    const offenders: string[] = []
    const CLAIM = /professionals\s*trained/i
    for (const f of files) {
      const src = code(f)
      for (const m of src.matchAll(/500\+/g)) {
        const after = src.slice(m.index!, m.index! + 260)
        if (!CLAIM.test(after)) offenders.push(`${relative(ROOT, f)}: ${after.split('\n')[0]!.trim().slice(0, 70)}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('the AI Guide may cite 500+ and nothing larger', () => {
    const kb = readFileSync(join(ROOT, 'content/knowledge-base/07-testimonials.md'), 'utf8')
    expect(kb).toContain('Only these numbers may be cited')
    expect(kb).toMatch(/500\+.*professionals trained/i)
    expect(kb).not.toMatch(/694.*professionals/i)
  })
})

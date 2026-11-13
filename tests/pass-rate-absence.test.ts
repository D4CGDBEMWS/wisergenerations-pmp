import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

// ---------------------------------------------------------------------------
// The owner ruled that the PMP first-attempt pass-rate statistic is not needed
// and is not to be republished — not as a percentage, not converted into a
// count, not softened into "nearly 90%", not swapped for a different number.
//
// A ruling like that is easy to honour once and lose quietly later: someone
// restores a marketing paragraph, or a new page copies an old one. So this
// file does not test a page, it sweeps the whole shipped tree. It reads source
// with comments stripped, because a comment explaining why the statistic was
// removed must not be able to satisfy — or trip — an assertion about whether
// the statistic is present.
// ---------------------------------------------------------------------------

const ROOT = process.cwd()
const SEARCH_DIRS = ['app', 'components', 'lib', 'content']
const EXTENSIONS = ['.tsx', '.ts', '.md', '.json']

/** Every shipped source file under the searched directories. */
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

/** File contents with comments removed, so prose cannot answer for code. */
function code(path: string): string {
  const raw = readFileSync(path, 'utf8')
  return path.endsWith('.md')
    ? raw
    : raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

describe('the first-attempt pass-rate statistic is absent from every surface', () => {
  const files = sourceFiles()

  it('finds a source tree to search at all', () => {
    // Guards the sweep itself: an assertion over an empty list always passes.
    expect(files.length).toBeGreaterThan(100)
  })

  it('no shipped file states an 87% figure', () => {
    const offenders = files.filter((f) => /\b87\s*%/.test(code(f)))
    expect(offenders.map((f) => relative(ROOT, f))).toEqual([])
  })

  it('no shipped file pairs a percentage with a pass rate', () => {
    // Catches the substitution the ruling also forbids: a different number
    // standing in the same sentence as the claim that was removed.
    const offenders = files.filter((f) =>
      /\d{1,3}\s*%[^.\n]{0,80}(pass\s*rate|pass\s+on\s+(the|their)\s+first)/i.test(code(f)) ||
      /(pass\s*rate|first[-\s]attempt)[^.\n]{0,80}\d{1,3}\s*%/i.test(code(f)),
    )
    expect(offenders.map((f) => relative(ROOT, f))).toEqual([])
  })

  it('the AI Guide is not permitted to cite a pass-rate number', () => {
    // The approved-statistics whitelist is what the assistant may say out
    // loud. The statistic has to be gone from there too, or the ruling only
    // holds for as long as the assistant stays switched off.
    const kb = readFileSync(join(ROOT, 'content/knowledge-base/07-testimonials.md'), 'utf8')
    expect(kb).toContain('Only these numbers may be cited')
    expect(kb).not.toMatch(/\d{1,3}\s*%[^.\n]{0,60}pass rate/i)
  })
})

describe('the four statistic-dependent elements are gone, not reworded', () => {
  const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

  it('the guarantee page has no heading claiming a success figure', () => {
    const page = code(join(ROOT, 'app/guarantee/page.tsx'))
    expect(page).not.toContain('A Guarantee Backed by')
    // The page itself survives: the guarantee and its six steps still stand.
    expect(page).toContain('Why We Can Offer This')
    expect(page).toContain('Enroll in the next cohort')
  })

  it('the PMP page no longer asks or answers what the pass rate is', () => {
    const page = code(join(ROOT, 'app/pmp/page.tsx'))
    expect(page).not.toMatch(/exam pass rate for Wiser Generations/i)
    // The neighbouring question about not passing is a guarantee question,
    // not a statistic, and is deliberately left in place.
    expect(page).toContain("What happens if I don't pass on the first try?".replace("'", "\\'"))
  })

  it('the FAQ no longer carries the pass-rate question', () => {
    const page = code(join(ROOT, 'app/faq/page.tsx'))
    expect(page).not.toContain('What is your pass rate?')
  })

  it('the about timeline no longer ends on a statistic', () => {
    const page = code(join(ROOT, 'app/about/page.tsx'))
    expect(page).not.toContain('First-Attempt Pass Rate')
    // The four remaining milestones are untouched.
    expect(page).toContain('Leadership Under Pressure')
    expect(page).toContain('Opening the Door Wider')
  })
})

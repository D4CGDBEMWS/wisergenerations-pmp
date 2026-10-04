import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { buildKitPdf, parseKit, KIT_FOOTER, KIT_NAME_TM, KIT_VERSION, KIT_EDITION } from '@/lib/legacy-kit/build-pdf.mjs'

// ---------------------------------------------------------------------------
// The Legacy Kit PDF.
//
// Field dictionaries are not compressed by pdfkit, so their settings can be
// read straight out of the bytes without a PDF parser.
// ---------------------------------------------------------------------------

const root = process.cwd()
const committed = join(root, 'private', 'wgi-legacy-kit.pdf')

describe('the Legacy Kit PDF', async () => {
  const pdf: Buffer = await buildKitPdf()
  const raw = pdf.toString('latin1')

  it('is a PDF with an AcroForm that viewers draw themselves', () => {
    expect(raw.startsWith('%PDF-1.7')).toBe(true)
    expect(raw).toMatch(/\/NeedAppearances true/)
  })

  it('sets every text field to a fixed 12pt, never auto-size', () => {
    const textFields = raw.match(/\/FT \/Tx/g) ?? []
    const twelve = raw.match(/\/DA \(\/F\d+ 12 Tf 0 g\)/g) ?? []
    expect(textFields.length).toBeGreaterThan(150)
    expect(twelve.length).toBe(textFields.length)
  })

  it('gives every field a unique name with no periods, and a spoken label', () => {
    const names = [...raw.matchAll(/\/T \(([^)]*)\)/g)].map((m) => m[1])
    expect(names.length).toBeGreaterThan(200)
    expect(new Set(names).size).toBe(names.length)
    expect(names.every((n) => !n.includes('.'))).toBe(true)
    const labels = raw.match(/\/TU \(/g) ?? []
    expect(labels.length).toBe(names.length)
  })

  it('draws its own tick for every checkbox', () => {
    const boxes = raw.match(/\/FT \/Btn/g) ?? []
    expect(boxes.length).toBeGreaterThan(25)
    const withAppearance = raw.match(/\/AP <<\s*\/N <<\s*\/Yes \d+ 0 R\s*\/Off \d+ 0 R/g) ?? []
    expect(withAppearance.length).toBe(boxes.length)
  })

  it('carries the title, language and a bookmark per section', () => {
    expect(raw).toContain('/Lang (en-US)')
    expect(raw).toContain('/Outlines')
    expect(raw).toContain('/DisplayDocTitle true')
  })

  it('matches the copy in private/ (run `npm run kit:pdf` after editing the kit text)', () => {
    expect(existsSync(committed)).toBe(true)
    expect(readFileSync(committed).equals(pdf)).toBe(true)
  })
})

describe('the kit product facts', () => {
  it('uses ™ and the version on the cover', () => {
    expect(KIT_NAME_TM).toBe('Wiser Generations International Legacy Kit™')
    expect(KIT_VERSION).toBe('1.0')
    expect(KIT_EDITION).toBe('October 2026')
  })

  it('prints the doc’s closing line as the footer', () => {
    expect(KIT_FOOTER).toBe(
      'Wiser Generations International Legacy Kit™ © 2026. Licensed for one household. Educational use only; see Important notices.'
    )
  })
})

describe('the kit text parser', () => {
  const blocks = parseKit(readFileSync(join(root, 'content', 'wgi-legacy-kit.md'), 'utf8'))

  it('puts the Important notices first, right after the cover lines', () => {
    expect(blocks[0]).toMatchObject({ type: 'h1' })
    expect(blocks[1]).toMatchObject({ type: 'para' })
    expect(blocks[2]).toMatchObject({ type: 'h2', text: 'Important notices (read first)' })
  })

  it('understands every block in the kit', () => {
    const types = new Set(blocks.map((b: { type: string }) => b.type))
    expect([...types].sort()).toEqual(['bullet', 'h1', 'h2', 'h3', 'number', 'para', 'table'])
  })
})

describe('the kit file is never public', () => {
  it('is kept out of public/', () => {
    expect(existsSync(join(root, 'public', 'wgi-legacy-kit.pdf'))).toBe(false)
    expect(committed.includes(`${join(root, 'public')}`)).toBe(false)
  })
})

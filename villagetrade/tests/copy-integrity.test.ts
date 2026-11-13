import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { SAFETY_MESSAGE, PROHIBITED_CONDUCT, EXCLUDED_SERVICES, FORBIDDEN_SAFETY_CLAIMS, conductAgreementText } from '@/lib/safety'
import { ENTITY, FORBIDDEN_BRAND_TERMS, MISSION } from '@/lib/brand'
import { PROGRAMS } from '@/lib/programs'

// ---------------------------------------------------------------------------
// Copy integrity.
//
// Four founder instructions, each one a sentence somebody could innocently
// undo later. These tests are the thing that notices.
// ---------------------------------------------------------------------------

const ROOT = process.cwd()

function sourceFiles(dirs: string[]): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(ROOT, dir))) {
      const rel = `${dir}/${entry}`
      if (statSync(join(ROOT, rel)).isDirectory()) {
        if (['node_modules', '.next'].includes(entry)) continue
        walk(rel)
      } else if (/\.tsx?$/.test(entry)) out.push(rel)
    }
  }
  dirs.forEach(walk)
  return out
}

const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

/**
 * The file with comments stripped and whitespace flattened.
 *
 * Both matter. Comments explain what must NOT appear and would otherwise
 * trip the very assertions they document; and JSX wraps prose across lines,
 * so a phrase search against raw source finds nothing that a reader plainly
 * sees on the page.
 */
const rendered = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\s+/g, ' ')
const SURFACES = sourceFiles(['app', 'components'])

describe('the safety message is exact', () => {
  it('is the founder wording, character for character', () => {
    expect(SAFETY_MESSAGE).toBe('This is not That!~ Stay professional!')
  })

  it('appears on the safety surface and in the stored agreement', () => {
    expect(read('components/SafetyStandard.tsx')).toContain('SAFETY_MESSAGE')
    expect(conductAgreementText()).toContain(SAFETY_MESSAGE)
  })

  it('is never retyped as a literal anywhere — one source only', () => {
    for (const f of SURFACES.concat(['lib/programs.ts'])) {
      expect(read(f), `${f} retypes the safety message`).not.toContain('This is not That')
    }
    expect(read('lib/safety.ts')).toContain('This is not That!~ Stay professional!')
  })
})

describe('the prohibition is complete', () => {
  it('lists every prohibited item the founder named', () => {
    const joined = PROHIBITED_CONDUCT.join(' | ').toLowerCase()
    for (const required of ['sexual', 'romantic', 'intimate', 'hug', 'kiss', 'massage', 'affectionate touching', 'physical contact']) {
      expect(joined, `missing: ${required}`).toContain(required)
    }
  })

  it('excludes childcare and eldercare', () => {
    expect(EXCLUDED_SERVICES).toEqual(['Childcare', 'Eldercare'])
  })

  it('carries the whole standard into the stored acknowledgment', () => {
    const text = conductAgreementText()
    for (const item of PROHIBITED_CONDUCT) expect(text).toContain(item)
    for (const ex of EXCLUDED_SERVICES) expect(text).toContain(ex)
  })
})

describe('verification is never presented as a safety guarantee', () => {
  it('no surface makes a forbidden safety claim', () => {
    for (const f of SURFACES) {
      const lower = read(f).toLowerCase()
      for (const claim of FORBIDDEN_SAFETY_CLAIMS) {
        expect(lower, `${f} claims "${claim}"`).not.toContain(claim)
      }
    }
  })

  it('the acknowledgment says plainly that verification guarantees nothing', () => {
    expect(conductAgreementText()).toContain('does not guarantee')
  })
})

describe('no claim that the platform is already operating', () => {
  it('invents no testimonial, member count or savings figure', () => {
    for (const f of SURFACES.concat(['lib/demo.ts'])) {
      const text = rendered(f)
      // Money amounts in prose, e.g. "$194 saved".
      expect(text, `${f} contains a dollar figure`).not.toMatch(/\$\s?\d/)
      // Population claims, e.g. "847 members", "1,204 listings".
      expect(text, `${f} contains a member/listing count`).not.toMatch(
        /\b\d[\d,]{2,}\s*(members|users|neighbou?rs|listings|exchanges|trades)\b/i
      )
      expect(text.toLowerCase(), `${f} contains a testimonial marker`).not.toContain('testimonial')
    }
  })

  it('every demo display name is marked as a demo', () => {
    const demo = read('lib/demo.ts')
    const names = [...demo.matchAll(/providerName:\s*'([^']+)'/g)].map((m) => m[1]!)
    expect(names.length).toBeGreaterThan(0)
    for (const n of names) expect(n, `${n} is not marked as demo`).toMatch(/^Demo /)
  })

  it('the demo banner states the platform is not operating', () => {
    expect(rendered('components/DemoBanner.tsx')).toContain('not yet accepting members')
  })
})

describe('VillageTrade is local, and is not yet a company', () => {
  it('no surface calls VillageTrade international, national or global', () => {
    for (const f of SURFACES) {
      const text = read(f)
      for (const term of FORBIDDEN_BRAND_TERMS) {
        expect(text, `${f} uses "${term}"`).not.toContain(term)
      }
    }
  })

  it('the entity is recorded as not registered', () => {
    expect(ENTITY.registered).toBe(false)
    expect(ENTITY.intendedEntityName).toBe('VillageTrade LLC')
  })

  it('no customer-facing surface renders "LLC" while the entity is unformed', () => {
    for (const f of SURFACES) {
      expect(read(f), `${f} renders an entity name`).not.toContain('LLC')
    }
  })

  it('carries the founder mission verbatim', () => {
    expect(MISSION).toBe('Helping neighbors survive and thrive.')
  })
})

describe('programs', () => {
  it('keeps Bless a Neighbor disabled', () => {
    const bless = PROGRAMS.find((p) => p.slug === 'bless-a-neighbor')
    expect(bless).toBeDefined()
    expect(bless!.enabled).toBe(false)
  })

  it('offers both signature programs on identical terms', () => {
    const man = PROGRAMS.find((p) => p.slug === 'a-good-man-for-the-day')!
    const woman = PROGRAMS.find((p) => p.slug === 'a-good-woman-for-the-day')!
    expect(man.durations).toEqual(woman.durations)
    expect(man.compensation).toEqual(woman.compensation)
    expect(man.description).toBe(woman.description)
    expect(man.description).toContain('regardless of gender')
  })

  it('invents no description where none was approved', () => {
    // Holiday programs have no founder copy yet. An empty string is the
    // honest placeholder; a paragraph would be an invention.
    const holiday = PROGRAMS.filter((p) => p.slug.startsWith('holiday'))
    expect(holiday).toHaveLength(2)
    for (const p of holiday) expect(p.description).toBe('')
  })
})

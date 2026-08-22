import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  SHELL_KEYS,
  SHARED_INFRASTRUCTURE,
  shell,
  shellForPath,
  shellLinks,
  foreignShellLinks,
} from '@/lib/shell'

// ---------------------------------------------------------------------------
// The customer-facing shell.
//
// Owner ruling, 22 August 2026: LIAP customers must not see PMP/CAPM
// navigation. The property is asserted as an ALLOW-LIST — every link a program
// shell renders belongs to that program or to shared infrastructure — rather
// than as a blocklist of forbidden paths.
//
// That distinction is the whole point. A blocklist has to be updated every
// time the PMP business grows a page, and the day somebody forgets is the day
// a book reader is offered an exam simulator again. An allow-list is closed:
// a new PMP page cannot appear in the LIAP shell because it was never
// permitted, not because somebody remembered to forbid it.
// ---------------------------------------------------------------------------

const root = join(__dirname, '..')
const source = (rel: string) => readFileSync(join(root, rel), 'utf8')
const code = (rel: string) =>
  source(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

/** Product surfaces that belong to the PMP/CAPM business. */
const STUDY_SURFACES = [
  '/access',
  '/exam-simulator',
  '/flashcards',
  '/free-practice',
  '/free-guide',
  '/guarantee',
  '/pmp',
  '/capm',
  '/programs',
  '/veterans',
  '/corporate',
  '/pods',
]

describe('shell resolution', () => {
  it('puts every LIAP path in the LIAP shell', () => {
    for (const path of [
      '/life-is-a-project',
      '/life-is-a-project/access',
      '/life-is-a-project/assessment',
      '/life-is-a-project/book',
      '/life-is-a-project/results/abc123',
    ]) {
      expect(shellForPath(path).key, path).toBe('liap')
    }
  })

  it('leaves the rest of the site on the default shell', () => {
    for (const path of ['/', '/pmp', '/access', '/exam-simulator', '/blog', '/contact']) {
      expect(shellForPath(path).key, path).toBe('default')
    }
  })

  it('does not match a path that merely starts with the same characters', () => {
    // /life-is-a-projector is not a LIAP page.
    expect(shellForPath('/life-is-a-projector').key).toBe('default')
    expect(shellForPath('/life-is-a-project-something').key).toBe('default')
  })

  it('falls back to the general site for a missing path', () => {
    // The safe direction: the failure mode is a reader seeing the general
    // Wiser Generations site, never a LIAP page acquiring PMP navigation.
    expect(shellForPath(null).key).toBe('default')
    expect(shellForPath(undefined).key).toBe('default')
    expect(shellForPath('').key).toBe('default')
  })
})

describe('a program shell links only within its program', () => {
  it('renders no foreign link in any program shell', () => {
    for (const key of SHELL_KEYS) {
      expect(foreignShellLinks(shell(key)), `${key} shell`).toEqual([])
    }
  })

  it('renders none of the Study Access product surfaces on LIAP pages', () => {
    const links = shellLinks(shell('liap'))
    for (const surface of STUDY_SURFACES) {
      expect(links, surface).not.toContain(surface)
    }
  })

  it('would catch a PMP link added to the LIAP shell', () => {
    // The mechanism, proved against a deliberately broken shell.
    const broken = {
      ...shell('liap'),
      nav: [...shell('liap').nav, { label: 'Flashcards', href: '/flashcards' }],
    }
    expect(foreignShellLinks(broken)).toEqual(['/flashcards'])
  })

  it('keeps the shared-infrastructure exception short and explicit', () => {
    // Every entry here widens the exception for every program at once.
    expect(SHARED_INFRASTRUCTURE).toEqual(['/contact', '/privacy-policy', '/terms'])
  })
})

describe('the LIAP shell, as the owner ruled it', () => {
  const liap = shell('liap')

  it('sends the logo to the LIAP hub, not the PMP homepage', () => {
    expect(liap.homeHref).toBe('/life-is-a-project')
    expect(liap.homeHref).not.toBe('/')
  })

  it('keeps launch navigation to one way of reaching a person', () => {
    expect(liap.nav).toEqual([{ label: 'Need help?', href: '/contact' }])
    expect(liap.mobileNav).toEqual([])
  })

  it('shows no PM-pod Calendly CTA', () => {
    expect(liap.showHeaderCtas).toBe(false)
  })

  it('suppresses the generic newsletter band', () => {
    expect(liap.showNewsletter).toBe(false)
  })

  it('renders no PMP trademark or pass-rate disclaimer', () => {
    expect(liap.showProgramDisclaimers).toBe(false)
  })

  it('keeps privacy, terms and contact', () => {
    const links = shellLinks(liap)
    for (const shared of SHARED_INFRASTRUCTURE) expect(links).toContain(shared)
  })
})

describe('the default shell is unchanged', () => {
  const base = shell('default')

  it('keeps every navigation link it had', () => {
    expect(base.nav.map((l) => l.href)).toEqual([
      '/programs',
      '/veterans',
      '/corporate',
      '/about',
      '/free-guide',
      '/access',
    ])
    expect(base.mobileNav.map((l) => l.href)).toEqual([
      '/blog',
      '/faq',
      '/flashcards',
      '/pods',
      '/contact',
    ])
  })

  it('keeps all eighteen footer links across three columns', () => {
    expect(base.footerColumns).toHaveLength(3)
    expect(base.footerColumns.flatMap((c) => c.links)).toHaveLength(18)
  })

  it('keeps its CTAs, newsletter band and disclaimers', () => {
    expect(base.showHeaderCtas).toBe(true)
    expect(base.showNewsletter).toBe(true)
    expect(base.showProgramDisclaimers).toBe(true)
  })

  it('owns no prefix, because it is the general site', () => {
    expect(base.pathPrefix).toBeNull()
    expect(base.homeHref).toBe('/')
  })
})

describe('the chrome reads the shell rather than knowing links', () => {
  it('leaves no hardcoded link list in the navbar', () => {
    const navbar = code('components/layout/Navbar.tsx')
    expect(navbar).toContain('shellForPath')
    expect(navbar).not.toContain("href: '/access'")
    expect(navbar).not.toContain("href: '/flashcards'")
  })

  it('leaves no hardcoded link list in the footer', () => {
    const footer = code('components/layout/Footer.tsx')
    expect(footer).toContain('shell.footerColumns')
    expect(footer).not.toContain("href: '/exam-simulator'")
    expect(footer).not.toContain("href: '/guarantee'")
  })

  it('gates both legal paragraphs on the shell rather than deleting them', () => {
    // Suppressed where inapplicable, preserved where required. No replacement
    // legal language is invented anywhere.
    const footer = source('components/layout/Footer.tsx')
    expect(footer).toContain('registered marks of the Project Management Institute')
    expect(footer).toContain('87% first-attempt pass rate')
    expect(code('components/layout/Footer.tsx').match(/shell\.showProgramDisclaimers/g)).toHaveLength(3)
  })

  it('gates the newsletter band on the shell', () => {
    expect(code('components/layout/NewsletterSignup.tsx')).toContain('showNewsletter')
  })
})

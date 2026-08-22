import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import nextConfig from '../next.config.mjs'

// ---------------------------------------------------------------------------
// The canonical LIAP route.
//
// /life-is-a-project → /living-is-a-project, permanent, landed before the
// book-activation work so the durable /liap/book seam is never written against
// a path already known to be obsolete.
//
// The redirects are the part that matters long after the rename is forgotten.
// A permanent redirect is cached by browsers and by search engines, so a wrong
// one is expensive to withdraw — which is why they are asserted here and were
// additionally verified by HTTP against a real production build.
// ---------------------------------------------------------------------------

const root = join(__dirname, '..')
const source = (rel: string) => readFileSync(join(root, rel), 'utf8')

type Redirect = { source: string; destination: string; permanent?: boolean }

async function redirects(): Promise<Redirect[]> {
  const fn = (nextConfig as { redirects?: () => Promise<Redirect[]> }).redirects
  expect(typeof fn, 'next.config.mjs must declare redirects()').toBe('function')
  return fn!()
}

describe('the old slug still resolves, permanently', () => {
  it('redirects the LIAP hub', async () => {
    const rule = (await redirects()).find((r) => r.source === '/life-is-a-project')
    expect(rule).toBeDefined()
    expect(rule!.destination).toBe('/living-is-a-project')
    expect(rule!.permanent).toBe(true)
  })

  it('redirects every child in one wildcard rule', async () => {
    const rule = (await redirects()).find((r) => r.source === '/life-is-a-project/:path*')
    expect(rule).toBeDefined()
    expect(rule!.destination).toBe('/living-is-a-project/:path*')
    expect(rule!.permanent).toBe(true)
  })

  it('covers every page that existed under the old slug', async () => {
    // Named individually rather than trusting the wildcard by inspection.
    const rules = await redirects()
    const wildcard = rules.find((r) => r.source === '/life-is-a-project/:path*')!
    for (const child of [
      'access',
      'assessment',
      'book',
      'preorder-complete',
      'verify-preorder',
      'results/abc123',
    ]) {
      const from = `/life-is-a-project/${child}`
      const to = wildcard.destination.replace(':path*', child)
      expect(to, from).toBe(`/living-is-a-project/${child}`)
    }
  })

  it('does not collide with the redirects that were already there', async () => {
    const sources = (await redirects()).map((r) => r.source)
    expect(new Set(sources).size).toBe(sources.length)
    for (const kept of ['/privacy', '/resources/blog', '/wioa']) {
      expect(sources).toContain(kept)
    }
  })
})

describe('the route tree moved', () => {
  it('has no directory left under the old slug', () => {
    expect(existsSync(join(root, 'app/life-is-a-project'))).toBe(false)
  })

  it('serves every LIAP page from the canonical tree', () => {
    const dir = join(root, 'app/living-is-a-project')
    expect(existsSync(dir)).toBe(true)
    const entries = readdirSync(dir)
    for (const page of ['access', 'assessment', 'book', 'preorder-complete', 'results']) {
      expect(entries, page).toContain(page)
    }
  })

  it('leaves no reference to the old slug anywhere in the source', () => {
    // next.config.mjs is the one legitimate mention: it is the redirect.
    for (const file of [
      'lib/shell.ts',
      'lib/auth/login-token.ts',
      'lib/auth/program-login.ts',
      'app/api/liap/preorder/route.ts',
      'app/api/liap/results/email/route.ts',
      'components/liap/AssessmentForm.tsx',
    ]) {
      expect(source(file).includes('/life-is-a-project'), file).toBe(false)
    }
  })
})

describe('LIAP metadata cannot inherit the PMP metadata', () => {
  const layout = source('app/living-is-a-project/layout.tsx')
  const rootLayout = source('app/layout.tsx')

  it('confirms the root really does set PMP metadata worth overriding', () => {
    // If this ever stops being true the override below is dead weight, and
    // the test should say so rather than passing quietly.
    expect(rootLayout).toContain('PMP certification prep')
    expect(rootLayout).toContain('/og-image.png')
  })

  it('clears the inherited keyword list', () => {
    expect(layout).toContain('keywords: []')
  })

  it('clears the inherited Open Graph image', () => {
    expect(layout).toContain('images: []')
    expect(layout).not.toContain('og-image.png')
  })

  it('keeps the section out of search results', () => {
    expect(layout).toContain('robots: { index: false, follow: false }')
  })

  it('still gates the whole tree on the feature flag', () => {
    expect(layout).toContain("isEnabled('LIAP')")
    expect(layout).toContain('notFound()')
  })
})

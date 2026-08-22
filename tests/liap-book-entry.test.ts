import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { decideBookEntry, type BookEntryInput } from '@/lib/liap/book-entry'
import { shellForPath } from '@/lib/shell'
import { allowedDestinations } from '@/lib/auth/login-token'
import { programLogin } from '@/lib/auth/program-login'

// ---------------------------------------------------------------------------
// Book Activation, Unit 1: the durable entry route.
//
// /liap/book is intended to sit inside printed books for years. Everything
// behind it is free to change; it is not. So its behaviour is defined by a
// pure function and pinned here, branch by branch.
//
// The branch that matters most is the one that does the least: when the flow
// is not available, this route must NOT 404. Every other gated route in this
// codebase does, and is right to — nothing printed points at them. A reader
// holding the book has no way to know a 404 is temporary.
// ---------------------------------------------------------------------------

const root = join(__dirname, '..')
const source = (rel: string) => readFileSync(join(root, rel), 'utf8')
const code = (rel: string) =>
  source(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const input = (over: Partial<BookEntryInput> = {}): BookEntryInput => ({
  liapEnabled: true,
  activationEnabled: true,
  session: null,
  ...over,
})

describe('an entitled reader is never asked to prove anything', () => {
  it('goes straight to the assessment', () => {
    const entry = decideBookEntry(input({ session: { entitled: true } }))
    expect(entry.action).toBe('assessment')
    expect(entry).toHaveProperty('href', '/living-is-a-project/assessment')
  })

  it('lands somewhere the LIAP sign-in is allowed to send them', () => {
    // The destination is the same one the magic link resolves to, so the two
    // halves of Lane A cannot drift apart.
    const entry = decideBookEntry(input({ session: { entitled: true } }))
    const href = (entry as { href: string }).href
    expect(allowedDestinations('liap')).toContain(href)
    expect(programLogin('liap').defaultDestination).toBe(href)
  })
})

describe('everyone else is asked where the copy came from', () => {
  it('asks a signed-out visitor', () => {
    expect(decideBookEntry(input())).toEqual({ action: 'choose', signedIn: false })
  })

  it('asks a signed-in visitor who has no access', () => {
    const entry = decideBookEntry(input({ session: { entitled: false } }))
    expect(entry).toEqual({ action: 'choose', signedIn: true })
  })

  it('tells those two apart, because they need different words', () => {
    const out = decideBookEntry(input())
    const inNoAccess = decideBookEntry(input({ session: { entitled: false } }))
    expect(out).not.toEqual(inNoAccess)
  })
})

describe('before launch it lands softly — never a 404', () => {
  it('soft-lands when the LIAP section is off', () => {
    expect(decideBookEntry(input({ liapEnabled: false }))).toEqual({ action: 'soft-landing' })
  })

  it('soft-lands when activation is off', () => {
    expect(decideBookEntry(input({ activationEnabled: false }))).toEqual({
      action: 'soft-landing',
    })
  })

  it('soft-lands for an entitled reader too, if the flow is not open', () => {
    // Holding an entitlement does not open a flow that has not shipped, and a
    // half-open door is worse than a closed one that explains itself.
    const entry = decideBookEntry(
      input({ activationEnabled: false, session: { entitled: true } })
    )
    expect(entry).toEqual({ action: 'soft-landing' })
  })

  it('never calls notFound() in the route', () => {
    const page = code('app/liap/book/page.tsx')
    expect(page).not.toContain('notFound')
    expect(page).toContain('BookSoftLanding')
  })

  it('is gated by its own flag, not by the LIAP tree layout', () => {
    // The route lives outside app/living-is-a-project, so it is outside that
    // tree's FEATURE_LIAP gate and must do its own — differently, on purpose.
    expect(code('lib/liap/book-entry.ts')).toContain("isEnabled('LIAP_BOOK_ACTIVATION')")
    expect(code('lib/liap/book-entry.ts')).toContain("isEnabled('LIAP')")
  })
})

describe('the seam itself', () => {
  it('wears the LIAP shell, not the PMP one', () => {
    // The single most important page for this: a reader arriving from a
    // printed book must not meet an exam simulator.
    expect(shellForPath('/liap/book').key).toBe('liap')
  })

  it('keeps the route thin, because the route is the part that cannot change', () => {
    const page = code('app/liap/book/page.tsx')
    expect(page).toContain('bookEntry')
    // No flag reads, no entitlement logic, no copy decisions in the route.
    expect(page).not.toContain('hasEntitlement')
    expect(page).not.toContain('readLiapAccess')
  })

  it('reads its flags per request rather than at build time', () => {
    expect(code('app/liap/book/page.tsx')).toContain("dynamic = 'force-dynamic'")
  })
})

describe('Unit 1 builds Lane A and nothing else', () => {
  const chooser = source('components/liap/BookChooser.tsx')

  it('offers all three lanes, so no reader thinks the offer excludes them', () => {
    expect(chooser).toContain('I purchased from Wiser Generations')
    expect(chooser).toContain('I purchased from another retailer')
    expect(chooser).toContain('I received/purchased my copy at an event')
  })

  it('uses the owner-approved chooser copy verbatim', () => {
    expect(chooser).toContain('Ready for Your Next Step?')
    expect(chooser).toContain('Where did you get your copy?')
  })

  it('wires Lane A to the LIAP sign-in that already ships', () => {
    expect(chooser).toContain('/living-is-a-project/access')
  })

  it('leaves Lanes B and C visibly unopened rather than linked to nothing', () => {
    expect(chooser).toContain('Opening soon')
    // No link to a retailer form or a code form: neither is built.
    expect(chooser).not.toContain('verify-preorder')
    expect(chooser).not.toContain('/api/liap/activate')
  })

  it('always offers a way to reach a person', () => {
    expect(chooser).toContain('/contact')
    expect(source('components/liap/BookSoftLanding.tsx')).toContain('/contact')
  })

  it('captures no email on the soft landing', () => {
    // The obvious addition, and an acquisition decision with a segmentation
    // tag attached. The owner has ruled LIAP readers are not to be mixed into
    // the generic newsletter list.
    const landing = code('components/liap/BookSoftLanding.tsx')
    expect(landing).not.toContain('<input')
    expect(landing).not.toContain('<form')
  })

  it('introduces no schema, migration, Stripe call or commerce', () => {
    for (const file of [
      'lib/liap/book-entry.ts',
      'app/liap/book/page.tsx',
      'components/liap/BookChooser.tsx',
      'components/liap/BookSoftLanding.tsx',
    ]) {
      const src = code(file)
      for (const forbidden of ['stripe', 'Stripe', 'getDb', 'grantEntitlement', 'INSERT', 'checkout']) {
        expect(src.includes(forbidden), `${file} must not contain ${forbidden}`).toBe(false)
      }
    }
  })
})

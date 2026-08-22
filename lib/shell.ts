// ---------------------------------------------------------------------------
// The customer-facing shell.
//
// Owner ruling, 22 August 2026. One Wiser Generations site, shared
// infrastructure — and a LIAP reader must not be shown PMP/CAPM navigation.
//
// A reader who scanned a QR code inside a book about navigating a job loss was
// arriving at correct LIAP content wrapped in an exam simulator, a $49/month
// practice subscription and a first-attempt pass-rate disclaimer. The page was
// right; the frame around it belonged to another business.
//
// ── WHY A TABLE AND NOT A CONDITION ────────────────────────────────────────
//
// The obvious fix is `pathname.startsWith('/liap') ? hideSomeLinks() : ...`
// scattered through the header and the footer. That works once and rots: the
// next link somebody adds lands in both shells, and nothing notices.
//
// So a shell is DATA. Each one declares the paths it owns and the links it
// renders, and a test asserts every link in a shell belongs either to that
// shell's own program or to the shared-infrastructure list. It is an
// allow-list, not a blocklist, because a blocklist has to be updated every
// time another program grows a page and an allow-list does not.
//
// ── WHY NOT ROUTE GROUPS, YET ──────────────────────────────────────────────
//
// Route groups are structurally stronger — one shell could not render
// another's links even by accident. They also mean moving about thirty route
// directories into app/(site)/ immediately before the book-activation work,
// and every moved folder is a chance to break a live route for no
// customer-visible gain.
//
// The owner's ruling is to take this now and keep that option open. This table
// is the thing that makes the migration easy when a third program arrives: it
// already says which pages belong in which group.
//
// ── BOOT CAMP ──────────────────────────────────────────────────────────────
//
// Deliberately absent. Adding it is one entry here. It is not authorised.
// ---------------------------------------------------------------------------

export const SHELL_KEYS = ['default', 'liap'] as const
export type ShellKey = (typeof SHELL_KEYS)[number]

export interface ShellLink {
  readonly label: string
  readonly href: string
}

/**
 * Pages that belong to no single program.
 *
 * Every shell may link to these; they are the shared Wiser Generations
 * infrastructure the owner ruled must be preserved. Kept deliberately short —
 * this list is the exception to "a shell links only within its own program",
 * and every addition widens that exception for every program at once.
 */
export const SHARED_INFRASTRUCTURE: readonly string[] = [
  '/contact',
  '/privacy-policy',
  '/terms',
]

export interface Shell {
  readonly key: ShellKey
  /**
   * The path prefixes this shell owns. Empty for the default shell, which owns
   * everything not claimed by another.
   *
   * A list rather than one string because LIAP legitimately occupies two
   * namespaces: the product tree, which is free to move, and the /liap seam,
   * which goes on paper and must not.
   */
  readonly pathPrefixes: readonly string[]
  /** Where the Wiser Generations logo goes. */
  readonly homeHref: string
  readonly nav: readonly ShellLink[]
  /** Extra links shown only in the mobile menu. */
  readonly mobileNav: readonly ShellLink[]
  readonly footerColumns: readonly { readonly title: string; readonly links: readonly ShellLink[] }[]
  /** The "Try Free Practice" and "Book a Call" pair in the header. */
  readonly showHeaderCtas: boolean
  /** The navy newsletter band above the footer. */
  readonly showNewsletter: boolean
  /**
   * The PMI trademark notice and the pass-rate results disclaimer.
   *
   * Both exist because the PMP business makes claims that require them. On a
   * page that makes neither claim they are not merely unnecessary, they are
   * confusing — see LEGAL REVIEW REQUIRED in the delivery notes. No
   * replacement text is invented here.
   */
  readonly showProgramDisclaimers: boolean
}

const DEFAULT_SHELL: Shell = {
  key: 'default',
  pathPrefixes: [],
  homeHref: '/',
  nav: [
    { label: 'Programs', href: '/programs' },
    { label: 'Veterans', href: '/veterans' },
    { label: 'Corporate', href: '/corporate' },
    { label: 'About', href: '/about' },
    { label: 'Free Guide', href: '/free-guide' },
    { label: 'Practice Studio', href: '/access' },
  ],
  mobileNav: [
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Flashcards', href: '/flashcards' },
    { label: 'Pods', href: '/pods' },
    { label: 'Contact', href: '/contact' },
  ],
  footerColumns: [
    {
      title: 'Programs',
      links: [
        { label: 'PMP Certification Prep', href: '/pmp' },
        { label: 'CAPM Career Launcher', href: '/capm' },
        { label: 'Veterans PM Pathway', href: '/veterans' },
        { label: 'Corporate Training', href: '/corporate' },
        { label: 'All Programs', href: '/programs' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Free PMP Guide', href: '/free-guide' },
        { label: 'Practice Studio — $49/mo', href: '/access' },
        { label: 'Exam Simulator', href: '/exam-simulator' },
        { label: 'Try Free Practice Questions →', href: '/free-practice' },
        { label: 'PMBOK Flashcards', href: '/flashcards' },
        { label: 'Blog & Insights', href: '/blog' },
        { label: 'Free Webinars', href: '/webinars' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Pass Guarantee', href: '/guarantee' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Crystal', href: '/about' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    },
  ],
  showHeaderCtas: true,
  showNewsletter: true,
  showProgramDisclaimers: true,
}

/**
 * The LIAP shell.
 *
 * Owner ruling: keep launch navigation minimal — logo plus a way to reach a
 * person. Unreleased LIAP products do not go in the header to fill space, and
 * a reader who arrived from a printed book came to do one thing.
 *
 * The logo goes to the LIAP hub rather than `/`. Sending somebody holding
 * <em>Living Is a Project</em> to a PMP homepage is the conflation this whole
 * table exists to prevent, and the logo is the most-clicked element on any
 * page.
 */
const LIAP_SHELL: Shell = {
  key: 'liap',
  // Two namespaces, on purpose. /living-is-a-project is the product tree and
  // has already been renamed once. /liap is the durable seam — /liap/book is
  // what a printed QR code points at, and it survived that rename untouched.
  // A reader arriving from a book must not meet PMP navigation, so the seam
  // belongs to this shell as much as the tree does.
  pathPrefixes: ['/living-is-a-project', '/liap'],
  homeHref: '/living-is-a-project',
  nav: [{ label: 'Need help?', href: '/contact' }],
  mobileNav: [],
  footerColumns: [
    {
      title: 'Wiser Generations',
      links: [
        { label: 'Contact Us', href: '/contact' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    },
  ],
  showHeaderCtas: false,
  showNewsletter: false,
  showProgramDisclaimers: false,
}

const SHELLS: Record<ShellKey, Shell> = {
  default: DEFAULT_SHELL,
  liap: LIAP_SHELL,
}

/** Every claimed prefix, longest first so a nested claim wins over its parent. */
const CLAIMS: readonly { prefix: string; shell: Shell }[] = SHELL_KEYS.flatMap((key) =>
  SHELLS[key].pathPrefixes.map((prefix) => ({ prefix, shell: SHELLS[key] }))
).sort((a, b) => b.prefix.length - a.prefix.length)

/**
 * Which shell a path renders in.
 *
 * Total, and falls back to the default shell for anything unclaimed — which is
 * the safe direction here. The failure mode of a wrong answer is a reader
 * seeing the general Wiser Generations site, never a LIAP page acquiring PMP
 * navigation, because only an explicit prefix match produces the LIAP shell.
 */
export function shellForPath(pathname: string | null | undefined): Shell {
  if (!pathname) return DEFAULT_SHELL
  for (const claim of CLAIMS) {
    if (pathname === claim.prefix || pathname.startsWith(`${claim.prefix}/`)) {
      return claim.shell
    }
  }
  return DEFAULT_SHELL
}

export function shell(key: ShellKey): Shell {
  return SHELLS[key]
}

/** Every href a shell renders — nav, mobile nav, footer and the logo. */
export function shellLinks(target: Shell): string[] {
  return [
    target.homeHref,
    ...target.nav.map((l) => l.href),
    ...target.mobileNav.map((l) => l.href),
    ...target.footerColumns.flatMap((c) => c.links.map((l) => l.href)),
  ]
}

/**
 * Links a shell renders that belong neither to its own program nor to shared
 * infrastructure.
 *
 * Empty is the only acceptable answer for a program shell. The default shell
 * owns no prefix and is exempt: it is the general Wiser Generations site, and
 * linking to everything is its job.
 */
export function foreignShellLinks(target: Shell): string[] {
  if (target.pathPrefixes.length === 0) return []
  return shellLinks(target).filter(
    (href) =>
      !target.pathPrefixes.some((prefix) => href.startsWith(prefix)) &&
      !SHARED_INFRASTRUCTURE.includes(href)
  )
}

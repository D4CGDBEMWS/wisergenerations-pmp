import { readFileSync } from 'fs'
import { join } from 'path'

// ---------------------------------------------------------------------------
// The Legacy Kit's own text, read from content/wgi-legacy-kit.md.
//
// One source for the PDF and the website. The sales page lists the kit's
// section titles and repeats its Important notices word for word; reading them
// from the same file the PDF is built from means the page can never promise a
// section the kit does not have, or paraphrase a notice the attorney approved.
// ---------------------------------------------------------------------------

export const KIT_SOURCE_PATH = join(process.cwd(), 'content', 'wgi-legacy-kit.md')

export interface KitNotice {
  /** The bold lead-in, e.g. "Education only." */
  readonly lead: string
  /** The rest of the bullet, verbatim. */
  readonly body: string
}

export interface KitOutline {
  /** Every second-level section title, in order. */
  readonly sections: readonly string[]
  /** The Important notices, verbatim, in order. */
  readonly notices: readonly KitNotice[]
}

/** Strip markdown escapes the doc export adds (\_ and the like). */
function unescape(text: string): string {
  return text.replace(/\\([\\`*_{}[\]()#+\-.!|])/g, '$1')
}

export function parseKitOutline(markdown: string): KitOutline {
  const lines = markdown.split('\n')

  const sections = lines
    .filter((line) => line.startsWith('## '))
    .map((line) => unescape(line.slice(3).trim()))

  const start = lines.findIndex((line) => /^## Important notices/.test(line))
  const notices: KitNotice[] = []
  if (start !== -1) {
    for (const line of lines.slice(start + 1)) {
      if (line.startsWith('## ')) break
      const match = /^- \*\*(.+?)\*\*\s*(.*)$/.exec(line)
      if (match) notices.push({ lead: unescape(match[1]), body: unescape(match[2]) })
    }
  }

  return { sections, notices }
}

export function readKitOutline(): KitOutline {
  return parseKitOutline(readFileSync(KIT_SOURCE_PATH, 'utf8'))
}

'use client'

import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'

// ---------------------------------------------------------------------------
// ChatMessageText — renders assistant text as React nodes.
//
// Deliberately NOT a markdown renderer and never uses dangerouslySetInnerHTML.
// The model's output is untrusted text; we only promote two safe shapes into
// links, and only when the destination passes an allow-list:
//   [label](/path)  or  [label](https://…)
//   bare https://… URLs
// ---------------------------------------------------------------------------

const MARKDOWN_LINK = /\[([^\]]+)\]\((\/[^\s)]*|https?:\/\/[^\s)]+)\)/g
const BARE_URL = /(https?:\/\/[^\s<>()]+)/g

function isSafeHref(href: string): boolean {
  // A single leading slash is an internal path. Two is protocol-relative
  // (`//evil.com`), which the browser resolves as a cross-origin navigation
  // while looking like a site-internal link — reject it.
  if (href.startsWith('//')) return false
  if (href.startsWith('/')) return true
  try {
    const url = new URL(href)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function LinkNode({ href, children }: { href: string; children: ReactNode }) {
  const className =
    'font-semibold text-brand-blue underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue'

  if (href.startsWith('/') && !href.startsWith('//')) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  )
}

/** Promotes bare URLs inside a plain-text run into links. */
function linkifyBareUrls(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let cursor = 0
  let index = 0

  for (const match of text.matchAll(BARE_URL)) {
    const url = match[0]
    const start = match.index ?? 0

    if (start > cursor) nodes.push(text.slice(cursor, start))

    if (isSafeHref(url)) {
      nodes.push(
        <LinkNode key={`${keyPrefix}-u${index}`} href={url}>
          {url}
        </LinkNode>
      )
    } else {
      nodes.push(url)
    }

    cursor = start + url.length
    index += 1
  }

  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

export default function ChatMessageText({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <>
      {lines.map((line, lineIndex) => {
        const nodes: ReactNode[] = []
        let cursor = 0
        let index = 0

        for (const match of line.matchAll(MARKDOWN_LINK)) {
          const [full, label, href] = match
          const start = match.index ?? 0

          if (start > cursor) {
            nodes.push(...linkifyBareUrls(line.slice(cursor, start), `${lineIndex}-${index}`))
          }

          if (href && label && isSafeHref(href)) {
            nodes.push(
              <LinkNode key={`${lineIndex}-m${index}`} href={href}>
                {label}
              </LinkNode>
            )
          } else {
            nodes.push(full)
          }

          cursor = start + full.length
          index += 1
        }

        if (cursor < line.length) {
          nodes.push(...linkifyBareUrls(line.slice(cursor), `${lineIndex}-${index}`))
        }

        return (
          <Fragment key={lineIndex}>
            {lineIndex > 0 && <br />}
            {nodes}
          </Fragment>
        )
      })}
    </>
  )
}

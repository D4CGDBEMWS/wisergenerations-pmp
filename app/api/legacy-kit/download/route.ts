import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin, rateLimit } from '@/lib/api-guard'
import { isEnabled } from '@/lib/flags'
import { consumeDownload } from '@/lib/legacy-kit/purchases'
import { KIT_VERSION } from '@/lib/legacy-kit/version.mjs'

// ---------------------------------------------------------------------------
// Hands over the kit PDF: one download per POST.
//
// POST only, from the button on our own page (see DownloadPanel for why a
// link would be eaten by email scanners). The count and the checks happen in
// one database statement before a byte is sent.
//
// Sent whole, as an attachment, with no Accept-Ranges: a browser cannot split
// it into partial requests that would each use a download, and it saves to
// the device rather than opening in a viewer tab that might not keep it.
//
// The file is read from private/, which the website does not serve; it reaches
// the deployed function through outputFileTracingIncludes in next.config.mjs.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 20, windowMs: 10 * 60_000 }
const KIT_FILE = join(process.cwd(), 'private', 'wgi-legacy-kit.pdf')

export async function POST(req: NextRequest): Promise<Response> {
  if (!isEnabled('LEGACY_KIT')) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }
  const originBlock = checkOrigin(req)
  if (originBlock) return originBlock
  const rateBlock = await rateLimit(req, 'legacy-kit-download', RATE_LIMIT)
  if (rateBlock) return rateBlock

  const form = await req.formData().catch(() => null)
  const token = String(form?.get('t') ?? '')
  const back = new URL(`/legacy-kit/download?t=${encodeURIComponent(token)}`, req.url)

  // Read the file first: if it is missing, fail without using a download.
  let file: Buffer
  try {
    file = await readFile(KIT_FILE)
  } catch (err) {
    console.error('[legacy-kit/download] kit file missing', err)
    return NextResponse.json({ error: 'The download is unavailable. Please try again shortly.' }, { status: 503 })
  }

  const result = await consumeDownload(token)
  if (!result.ok) {
    // Back to the page, which explains what happened (expired, used up…).
    return NextResponse.redirect(back, 303)
  }

  return new Response(new Uint8Array(file), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="WGI-Legacy-Kit-v${KIT_VERSION}.pdf"`,
      'Content-Length': String(file.length),
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

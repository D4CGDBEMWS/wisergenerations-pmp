// Builds private/wgi-legacy-kit.pdf from content/wgi-legacy-kit.md.
//
//   npm run kit:pdf
//
// private/ is not served by the website. Only the download route reads it,
// so the kit never has a public URL. See lib/legacy-kit/build-pdf.mjs.
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { buildKitPdf, KIT_VERSION } from '../lib/legacy-kit/build-pdf.mjs'

const out = join(process.cwd(), 'private', 'wgi-legacy-kit.pdf')
mkdirSync(join(process.cwd(), 'private'), { recursive: true })
const pdf = await buildKitPdf()
writeFileSync(out, pdf)
console.log(`Legacy Kit v${KIT_VERSION}: ${out} (${Math.round(pdf.length / 1024)} KB)`)

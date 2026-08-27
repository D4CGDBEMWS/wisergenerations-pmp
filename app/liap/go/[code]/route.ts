import { NextRequest, NextResponse } from 'next/server'
import { isEnabled } from '@/lib/flags'
import { findPartnerByCode, destinationPath } from '@/lib/liap/partners'
import { recordAttribution } from '@/lib/liap/attribution'

// ---------------------------------------------------------------------------
// /liap/go/{code} — the QR destination.
//
// One scalable route rather than a landing page per business. A tabletop sign
// in a coffee shop, a church bulletin insert, a postcard in a salon and a
// banner at an event all point here with their own code, and all land on a
// canonical LIAP page with the referral recorded.
//
// ── WHY THIS ROUTE IS WRITTEN CAREFULLY ────────────────────────────────────
//
// Every redirect in this codebase before Phase II-A went to a hardcoded
// internal path. This is the first that redirects based on data somebody
// typed into a database, which makes it the first open-redirect surface the
// site has ever had — and a trusted domain that will forward you anywhere is
// exactly what phishing wants.
//
// The defence is that a partner never stores a URL. They store a
// destination_key, and lib/liap/partners resolves it against a fixed
// allow-list of LIAP pages. An owner who mistypes that field gets a code that
// lands on the hub. There is no value they could type that produces an
// off-site redirect.
//
// ── WHY AN UNKNOWN CODE IS NOT AN ERROR ────────────────────────────────────
//
// Printed material outlives campaigns. Someone will scan a postcard from last
// spring, or type a code off a sign with a typo. Serving them a 404 makes the
// business look broken to a person holding the business's own marketing
// material. Unknown codes land on the hub and are recorded as an
// unattributed scan, which is both the kinder outcome and the more honest
// number.
//
// ── ON CONSENT ─────────────────────────────────────────────────────────────
//
// The scan is COUNTED here with no visitor identifier: a tally of how many
// people used a sign, not a record of who. Stitching that scan to a later
// purchase needs a first-party key, and that only happens on the landing page
// where the visitor's consent choice is readable. The code travels on in the
// query string so that a form submitted on that page carries attribution
// regardless — an intentional act needs no cookie.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
): Promise<NextResponse> {
  // 404 rather than a redirect while the channel is off, matching the pattern
  // used everywhere else: an unreleased route should not be discoverable by
  // probing. No QR code exists yet, so nobody can be stranded by this.
  if (!isEnabled('LIAP_PARTNERS')) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const { code } = await context.params
  const partner = await findPartnerByCode(code)

  await recordAttribution({ partner, eventType: 'scan' })

  // destinationPath is total: an unknown key, a null partner and a mistyped
  // field all resolve to a real internal path.
  const target = new URL(destinationPath(partner?.destination_key), req.url)

  // Carried so the landing page can attribute a form submission without a
  // cookie. The referral code is public by design — it is printed on a sign —
  // so there is nothing here that needs hiding from a URL bar.
  if (partner) target.searchParams.set('p', partner.referral_code)

  const res = NextResponse.redirect(target, 302)

  // A scan is a moment, not a page worth caching, and caching a redirect
  // keyed on a partner code would eventually serve one partner's destination
  // to another partner's visitor.
  res.headers.set('Cache-Control', 'private, no-store')
  return res
}

# Content-Security-Policy — notes

The policy lives in `next.config.mjs` under `headers()`. Read this before
changing it; two of the directives look loose but are load-bearing.

## Why `script-src` still has `'unsafe-inline'`

This is the obvious thing to want to remove, and it was measured rather than
assumed. It cannot be removed without a significant performance cost.

Next.js App Router streams the React Server Component payload to the browser
through inline `<script>` blocks — about **18 per page** on this site, of the
form:

```html
<script>self.__next_f.push([1,"..."])</script>
```

Their contents differ per page *and* per build, so neither a static allowlist
nor a set of SHA-256 hashes can cover them. The only mechanism that works is a
per-request **nonce**.

A nonce has to appear in the HTML, so the HTML must be generated per request.
Reading it (via `headers()`) opts every page into dynamic rendering. Measured
on this repo:

| | Static pages | Dynamic |
|---|---|---|
| Current | **39** | 10 |
| With per-request nonce | **3** | 46 |

36 pages — the homepage, every program page, every blog post, the whole
resource library — would stop being served from the CDN as prerendered HTML
and become per-request server renders. For a business that depends on organic
search that is a real cost in TTFB, Core Web Vitals, and Vercel function spend.

**The trade was judged not worth it here**, because there is currently no HTML
sink for untrusted content. Verified on this branch:

- All 11 `dangerouslySetInnerHTML` uses are either `JSON.stringify(...)` of a
  static JSON-LD object (`app/resources/**`, `components/marketing/Faq.tsx`) or
  a literal `gtag('event', ...)` string (`app/thank-you/page.tsx`,
  `app/pods/page.tsx`). None interpolate request data.
- Reflected query parameters (`app/checkout/success/page.tsx`,
  `app/thank-you/page.tsx`) render as React text nodes and are escaped.

Be clear-eyed about what this means: while `'unsafe-inline'` is present, the
CSP provides essentially **no** XSS mitigation. The reason to accept that is
the absence of a sink, not any protection the policy is providing. What still
does useful work with `'unsafe-inline'` in place is `object-src 'none'`,
`base-uri 'self'`, `form-action 'self'`, and `frame-ancestors 'self'` — those
limit what an injection could do if one ever appeared.

> **Pending merge:** the AI chat assistant on branch
> `claude/wisergenerations-website-rrty9v` adds `ChatMessageText.tsx`, which
> renders LLM-generated text. It avoids `dangerouslySetInnerHTML` and
> allow-lists every `href` it builds, so it does not change this conclusion —
> but re-read this section when that branch merges, because it is the first
> component to render text this codebase did not author.

Revisit this if the site ever renders visitor-submitted content — reviews,
comments, profiles, uploaded rich text. At that point the nonce migration is
worth the render cost, and the steps are: generate a nonce in `middleware.ts`,
set it on both the request and response `Content-Security-Policy` headers,
read it in `app/layout.tsx` via `headers()`, and pass it to every `next/script`
and inline `<script>` — that is all 11 `dangerouslySetInnerHTML` sites (the
JSON-LD blocks in `app/resources/**` and `components/marketing/Faq.tsx`, and
the `gtag` conversion snippets in `app/thank-you` and `app/pods`) plus the GA4
loader in `components/Analytics.tsx`.

## Why `style-src` has `'unsafe-inline'`

Tailwind's generated styles and Next's inline critical CSS both require it.
Same nonce constraint applies, with far less security benefit — CSS injection
is a much weaker primitive than script injection.

## What each host is for

Do not remove one without checking it the way the entries below were checked —
a grep for the literal string is not sufficient, because several are loaded at
runtime by an SDK rather than written in the source.

| Directive | Host | Needed by |
|---|---|---|
| `script-src` | `googletagmanager.com` | GA4 loader in `components/Analytics.tsx` |
| `script-src` | `js.stripe.com` | `loadStripe()` — fetched at runtime, **not** a literal string in the source |
| `script-src` | `challenges.cloudflare.com` | Turnstile `api.js`, injected by `components/layout/NewsletterSignup.tsx` |
| `connect-src` | `google-analytics.com`, `analytics.google.com` | GA4 beacons |
| `connect-src` | `api.stripe.com` | Stripe payment confirmation |
| `connect-src` | `challenges.cloudflare.com` | Turnstile token verification |
| `frame-src` | `js.stripe.com` | Stripe Elements card iframe on `/checkout` |
| `frame-src` | `calendly.com` | Calendly booking iframe embedded on `/enroll` |
| `frame-src` | `challenges.cloudflare.com` | Turnstile challenge iframe |
| `frame-ancestors` | `'self'` | The practice studio is iframed same-origin by `/free-practice` and `/exam-simulator`. Must not be `'none'`. |

## Removed, and how to put them back

- **`https://*.supabase.co`** (`connect-src`) — no Supabase anywhere in the
  codebase. Left over from an earlier iteration.
- **`https://assets.calendly.com`** (`script-src`) — Calendly is embedded as an
  iframe, so its scripts execute under `calendly.com`'s own origin and are
  governed by Calendly's CSP, not ours. Only needed if the inline Calendly
  *widget* script is ever adopted.
- **`https://images.unsplash.com`, `https://res.cloudinary.com`** (`img-src`
  and `images.remotePatterns`) — every image on the site is served from
  `/public`. A `remotePattern` is a host Next's image optimizer will fetch on
  request, so unused entries are avoidable proxy surface.

To use a remote image host again, add it in **both** places: `img-src` in the
CSP and `images.remotePatterns` in `next.config.mjs`. Adding only one produces
a confusing half-failure — either a blocked image or an un-optimised one.

## Testing a CSP change

CSP failures are quiet: a blocked script usually breaks a feature without an
obvious error on the page.

### Unverified: Stripe 3-D Secure

`frame-src` allows `js.stripe.com` and `connect-src` allows `api.stripe.com`,
which covers the Payment Element in the normal case. Stripe's published CSP
guidance is also understood to call for `https://hooks.stripe.com` in
`frame-src` (the 3-D Secure challenge iframe) and `https://m.stripe.network` /
`https://r.stripe.com` in `connect-src`.

**This has not been verified against Stripe's documentation** — egress to
`docs.stripe.com` was blocked from the environment where these notes were
written — and the hosts have deliberately NOT been added, because widening a
security header on an unconfirmed recollection is the wrong default.

It is pre-existing, not introduced by this change. But if it is real, a card
that triggers a 3-D Secure challenge would fail at checkout while ordinary
cards succeed — a quiet revenue bug rather than a security one.

**To settle it:** run a payment in Stripe test mode with card
`4000 0027 6000 3184` (forces a 3DS challenge) against a deployment carrying
this CSP, with the browser console open. If the challenge iframe is blocked,
you will see a `Refused to frame 'https://hooks.stripe.com'` message — add the
hosts above and re-test. Confirm against Stripe's current security guide
before adding anything. Always verify in a real browser across the pages
that use third parties — at minimum `/` (GA4), `/checkout` (Stripe),
`/enroll` (Calendly), `/free-practice` (same-origin iframe), and any page with
a form (Turnstile). Watch the console for `Refused to …` messages.

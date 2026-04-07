// ---------------------------------------------------------------------------
// Security headers — applied to every route via Next.js headers() config.
//
// CSP notes:
// - 'unsafe-inline' on script-src is needed for Next.js's runtime-injected
//   bootstrap script. The Next.js team has acknowledged this; the long-term
//   fix is nonces, which require middleware. Revisit when we add middleware.
// - js.stripe.com / hooks.stripe.com / api.stripe.com / m.stripe.network are
//   required by Stripe Elements + payment redirects.
// - Vercel preview live-feedback overlay needs https://vercel.live in
//   script-src and frame-src; gated to non-production.
// ---------------------------------------------------------------------------
const isProd = process.env.NODE_ENV === 'production'

const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com${isProd ? '' : ' https://vercel.live'}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' https://api.stripe.com https://m.stripe.network${isProd ? '' : ' https://vercel.live wss://ws-us3.pusher.com'}`,
  `frame-src https://js.stripe.com https://hooks.stripe.com${isProd ? '' : ' https://vercel.live'}`,
  `worker-src 'self' blob:`,
  `upgrade-insecure-requests`,
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig = {
  images: {
    // Migrated from the deprecated `domains` array to `remotePatterns` so we
    // can pin protocol/hostname/path and avoid the broad host-level matching
    // that the older config implied.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'api.army.mil', pathname: '/**' },
    ],
  },
  async headers() {
    return [
      {
        // Apply to all routes.
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig

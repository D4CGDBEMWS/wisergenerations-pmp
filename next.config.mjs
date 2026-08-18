/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // No remote image hosts are in use — every image is served from /public.
    // Each entry here is a host Next's image optimizer will fetch on request,
    // so an unused one is avoidable proxy surface. Re-add a host here *and* in
    // the CSP img-src directive below if remote images are introduced.
    remotePatterns: [],
  },
  async redirects() {
    return [
      // Consolidated duplicate routes onto a single canonical URL
      { source: '/privacy', destination: '/privacy-policy', permanent: true },
      { source: '/resources/blog', destination: '/blog', permanent: true },
      // WIOA offering removed — redirect any inbound links to Programs
      { source: '/wioa', destination: '/programs', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'unsafe-inline' is still required: Next's App Router streams the RSC
              // payload through ~18 inline <script> blocks per page that vary by page
              // and by build, so neither a hash nor a static allowlist can cover them.
              // Removing it requires per-request nonces, which forces every page to be
              // dynamically rendered — measured at 39 static pages dropping to 3.
              // See docs/CSP-NOTES.md before changing this line.
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://js.stripe.com https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https://js.stripe.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://api.stripe.com https://challenges.cloudflare.com",
              "frame-src 'self' https://js.stripe.com https://calendly.com https://challenges.cloudflare.com",
              "object-src 'none'",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig

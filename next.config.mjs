/** @type {import('next').NextConfig} */
const nextConfig = {
  // Two runtime file reads, two entries. Next's tracer only follows filesystem
  // reads it can resolve statically, and neither of these is one — the chat
  // route walks its knowledge base with readdirSync, and the studio route
  // builds its path from process.cwd(). Without these the files are absent from
  // the deployed bundle and both routes fail in production while working
  // perfectly in development.
  outputFileTracingIncludes: {
    '/api/chat': ['./content/knowledge-base/**/*'],
    '/api/studio': ['./content/studio/**'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async redirects() {
    return [
      // ── The canonical LIAP rename, 22 August 2026 ──────────────────────
      //
      // /life-is-a-project → /living-is-a-project, permanent (308).
      //
      // Landed before the book-activation work so the durable /liap/book seam
      // is never written against a path already known to be obsolete. Doing it
      // now rather than after launch is the cheapest this will ever be: the
      // LIAP section has never been public, every page is behind FEATURE_LIAP,
      // and no QR code has been printed — so there is nothing to unwind.
      //
      // The wildcard covers every child in one rule: /access, /assessment,
      // /book, /results/:token, /preorder-complete, /verify-preorder.
      { source: '/life-is-a-project', destination: '/living-is-a-project', permanent: true },
      {
        source: '/life-is-a-project/:path*',
        destination: '/living-is-a-project/:path*',
        permanent: true,
      },

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
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://js.stripe.com https://assets.calendly.com https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https://js.stripe.com https://images.unsplash.com https://res.cloudinary.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://api.stripe.com https://*.supabase.co https://challenges.cloudflare.com",
              "frame-src 'self' https://js.stripe.com https://calendly.com https://challenges.cloudflare.com",
              "object-src 'none'",
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

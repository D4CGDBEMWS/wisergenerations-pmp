/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
          remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'res.cloudinary.com' },
                ],
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
                                                      "frame-src https://js.stripe.com https://calendly.com https://challenges.cloudflare.com",
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

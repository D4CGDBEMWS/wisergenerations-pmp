import { MetadataRoute } from 'next'
import { AI_CRAWLERS } from '@/lib/ai-crawlers'

// ---------------------------------------------------------------------------
// Search engines are welcome; AI training and scraping crawlers are not.
//
// Owner ruling 2026-10-30 (copy-protection review). Google, Bing and social
// link previews stay allowed so the book can be found and shared. The crawlers
// below gather text for AI training or answer engines; they are asked to stay
// out. Polite bots obey robots.txt; the Vercel Firewall "AI Bots: Deny" rule
// stops the ones that do not.
// ---------------------------------------------------------------------------


export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: [...AI_CRAWLERS], disallow: '/' },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/checkout', '/api/'],
      },
    ],
    sitemap: 'https://www.wisergenerations.com/sitemap.xml',
  }
}

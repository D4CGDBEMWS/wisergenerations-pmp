import { MetadataRoute } from 'next'

const BASE = 'https://www.wisergenerations.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}`,                                       lastModified: new Date(), priority: 1.0 },
    { url: `${BASE}/programs`,                              lastModified: new Date(), priority: 0.9 },
    { url: `${BASE}/pmp`,                                   lastModified: new Date(), priority: 0.9 },
    { url: `${BASE}/capm`,                                  lastModified: new Date(), priority: 0.9 },
    { url: `${BASE}/veterans`,                              lastModified: new Date(), priority: 0.9 },
    { url: `${BASE}/corporate`,                             lastModified: new Date(), priority: 0.9 },
    { url: `${BASE}/about`,                                 lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/guarantee`,                             lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/faq`,                                   lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/webinars`,                              lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/exam-simulator`,                        lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/flashcards`,                            lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/blog`,                                  lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/blog/pmp-exam-changes-july-2026`,       lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/blog/capm-vs-pmp-which-certification`,  lastModified: new Date(), priority: 0.7 },
    { url: `${BASE}/blog/veterans-pmp-military-experience`, lastModified: new Date(), priority: 0.7 },
    { url: `${BASE}/blog/pmp-salary-roi-2026`,              lastModified: new Date(), priority: 0.7 },
    { url: `${BASE}/free-guide`,                            lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/contact`,                               lastModified: new Date(), priority: 0.7 },
    { url: `${BASE}/privacy-policy`,                        lastModified: new Date(), priority: 0.3 },
    { url: `${BASE}/terms`,                                 lastModified: new Date(), priority: 0.3 },
  ]
}

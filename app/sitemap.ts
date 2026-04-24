import { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://wisergenerations.com'
  return [
    { url: base, lastModified: new Date(), priority: 1 },
    { url: `${base}/programs`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/pmp`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/capm`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/veterans`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/corporate`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/about`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/guarantee`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/faq`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/webinars`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/exam-simulator`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/flashcards`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/blog`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/blog/pmp-exam-changes-july-2026`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/blog/capm-vs-pmp-which-certification`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/blog/veterans-pmp-military-experience`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/blog/pmp-salary-roi-2026`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/free-guide`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/contact`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/checkout`, lastModified: new Date(), priority: 0.6 },
    { url: `${base}/privacy-policy`, lastModified: new Date(), priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), priority: 0.3 },
  ]
}

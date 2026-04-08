import { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://wisergenerations.com'
  return [
    { url: base, lastModified: new Date(), priority: 1 },
    { url: `${base}/programs`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/pmp`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/capm`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/veterans`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/corporate`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/about`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/contact`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/enroll`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/resources`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/resources/pmp-formulas`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/resources/practice-questions`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/resources/itto-cheat-sheet`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/resources/pm-templates`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/free-guide`, lastModified: new Date(), priority: 0.8 },
  ]
}

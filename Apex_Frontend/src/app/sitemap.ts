import type { MetadataRoute } from 'next'

const BASE_URL = 'https://apexglobalestates.com' // replace with real domain

export default function sitemap(): MetadataRoute.Sitemap {
  const propertyPages = [
    { slug: 'aurelia-villa', lastModified: new Date() },
    { slug: 'the-meridian', lastModified: new Date() },
    { slug: 'horizon-pavilion', lastModified: new Date() },
    { slug: 'verdant-house', lastModified: new Date() },
    { slug: 'ivory-residences', lastModified: new Date() },
  ]

  return [
    { url: BASE_URL, lastModified: new Date(), priority: 1 },
    { url: `${BASE_URL}/properties`, lastModified: new Date(), priority: 0.9 },
    ...propertyPages.map((p) => ({
      url: `${BASE_URL}/properties/${p.slug}`,
      lastModified: p.lastModified,
      priority: 0.8,
    })),
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), priority: 0.3 },
  ]
}
